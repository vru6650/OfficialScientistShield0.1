import Post from '../models/post.model.js';
import Tutorial from '../models/tutorial.model.js';
import Problem from '../models/problem.model.js';
import Page from '../models/page.model.js';
import { errorHandler } from '../utils/error.js';
import {
    SUPPORTED_SEARCH_TYPES,
    bulkReplaceDocuments,
    isElasticsearchDisabled,
    isSearchEnabled,
    searchDocuments,
    toSearchResult,
} from './search.service.js';

const stripHtml = (value = '') => String(value).replace(/<[^>]*>/g, ' ');

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const tokenizeSearchTerm = (term) => {
    return Array.from(
        new Set(
            term
                .split(/\s+/)
                .map((token) => token.trim().toLowerCase())
                .filter(Boolean)
        )
    );
};

const computeFieldScore = (text, { term, tokens, exactWeight, tokenWeight, prefixWeight }) => {
    if (!text) return 0;

    const normalized = stripHtml(text).toLowerCase();
    if (!normalized) return 0;

    let score = 0;

    if (term && normalized.includes(term)) {
        score += exactWeight;
        if (normalized.startsWith(term)) {
            score += exactWeight * 0.4;
        }
    }

    for (const token of tokens) {
        if (!token) continue;
        if (normalized.includes(token)) {
            score += tokenWeight;
        }

        const prefixRegex = new RegExp(`\\b${escapeRegExp(token)}`, 'i');
        if (prefixRegex.test(normalized)) {
            score += prefixWeight;
        }
    }

    return score;
};

const computeRecencyBoost = (doc) => {
    const rawDate = doc?.updatedAt || doc?.createdAt;
    if (!rawDate) return 0;

    const timestamp = new Date(rawDate).getTime();
    if (Number.isNaN(timestamp)) return 0;

    const ageInDays = (Date.now() - timestamp) / (1000 * 60 * 60 * 24);

    if (ageInDays <= 1) return 1.5;
    if (ageInDays <= 7) return 1.1;
    if (ageInDays <= 30) return 0.8;
    if (ageInDays <= 180) return 0.4;

    return 0;
};

const createSnippetFromText = (text, { term, tokens, snippetLength = 160 }) => {
    if (!text) return null;

    const cleaned = stripHtml(text).replace(/\s+/g, ' ').trim();
    if (!cleaned) return null;

    const lower = cleaned.toLowerCase();
    const candidates = [term, ...tokens].filter(Boolean);

    let matchIndex = -1;
    let matchLength = 0;

    for (const candidate of candidates) {
        if (!candidate) continue;
        const index = lower.indexOf(candidate);
        if (index !== -1) {
            matchIndex = index;
            matchLength = candidate.length;
            break;
        }
    }

    if (matchIndex === -1) {
        const snippet = cleaned.slice(0, snippetLength).trim();
        return snippet.length === cleaned.length ? snippet : `${snippet}...`;
    }

    const halfWindow = Math.max(0, Math.floor((snippetLength - matchLength) / 2));
    const start = Math.max(0, matchIndex - halfWindow);
    const end = Math.min(cleaned.length, start + snippetLength);
    const snippet = cleaned.slice(start, end).trim();

    const uniqueTokens = Array.from(new Set(candidates)).sort((a, b) => b.length - a.length);
    const highlighted = uniqueTokens.reduce((acc, token) => {
        if (!token) return acc;
        const regex = new RegExp(`(${escapeRegExp(token)})`, 'gi');
        return acc.replace(regex, '<mark>$1</mark>');
    }, snippet);

    const prefix = start > 0 ? '...' : '';
    const suffix = end < cleaned.length ? '...' : '';

    return `${prefix}${highlighted}${suffix}`;
};

const createHighlightSnippet = (fields, context) => {
    for (const field of fields) {
        const snippet = createSnippetFromText(field, context);
        if (snippet && /<mark>/.test(snippet)) {
            return snippet;
        }
    }

    for (const field of fields) {
        const snippet = createSnippetFromText(field, context);
        if (snippet) {
            return snippet;
        }
    }

    return null;
};

const collectPageSectionText = (sections = []) => {
    if (!Array.isArray(sections)) {
        return [];
    }

    return sections.flatMap((section) => {
        if (!section || typeof section !== 'object') {
            return [];
        }

        const entries = [section.title, section.subtitle, section.body];

        if (Array.isArray(section.items)) {
            for (const item of section.items) {
                entries.push(item?.title, item?.body);
            }
        }

        if (section.cta) {
            entries.push(section.cta.label, section.cta.url);
        }

        return entries.filter(Boolean);
    });
};

const buildFallbackResult = (type, doc, context, overrides = {}) => {
    const baseResult = toSearchResult(type, doc);
    if (!baseResult) {
        return null;
    }

    const { score: scoreOverride, highlight: highlightOverride } = overrides;
    const { term, tokens } = context;

    const fieldConfigs = [];
    const highlightFields = [];

    if (type === 'post') {
        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.excerpt || doc.summary, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: doc.content, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.tags) ? doc.tags.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 }
        );
        highlightFields.push(doc.content, doc.summary, doc.excerpt, baseResult.summary, doc.title);
    } else if (type === 'tutorial') {
        const chapterContent = Array.isArray(doc.chapters) ? doc.chapters.map((chapter) => chapter?.content || '') : [];
        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: chapterContent.join(' '), exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.topics) ? doc.topics.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 }
        );
        highlightFields.push(doc.description, chapterContent.join(' '), baseResult.summary, doc.title);
    } else if (type === 'problem') {
        const combinedContent = [
            doc.description,
            doc.statement,
            doc.solutionApproach,
            doc.editorial,
            Array.isArray(doc.hints) ? doc.hints.join(' ') : '',
            Array.isArray(doc.constraints) ? doc.constraints.join(' ') : '',
        ].join(' ');

        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: combinedContent, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: Array.isArray(doc.topics) ? doc.topics.join(' ') : '', exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 }
        );
        highlightFields.push(doc.statement, doc.description, combinedContent, baseResult.summary, doc.title);
    } else if (type === 'page') {
        const sectionText = collectPageSectionText(doc.sections);
        const combinedContent = [
            doc.description,
            ...sectionText,
            doc.seo?.metaTitle,
            doc.seo?.metaDescription,
        ]
            .filter(Boolean)
            .join(' ');
        const keywordText = Array.isArray(doc.seo?.keywords) ? doc.seo.keywords.join(' ') : '';
        const metaDescription = doc.seo?.metaDescription || '';

        fieldConfigs.push(
            { text: doc.title, exactWeight: 12, tokenWeight: 4, prefixWeight: 2 },
            { text: doc.description, exactWeight: 8, tokenWeight: 3, prefixWeight: 1.5 },
            { text: combinedContent, exactWeight: 5, tokenWeight: 2, prefixWeight: 1 },
            { text: keywordText, exactWeight: 2, tokenWeight: 1, prefixWeight: 0.8 },
            { text: metaDescription, exactWeight: 3, tokenWeight: 1.5, prefixWeight: 0.8 }
        );
        highlightFields.push(
            combinedContent,
            doc.description,
            metaDescription,
            keywordText,
            baseResult.summary,
            doc.title
        );
    }

    const score = scoreOverride ?? (fieldConfigs.reduce(
        (total, config) =>
            total +
            computeFieldScore(config.text, {
                term,
                tokens,
                exactWeight: config.exactWeight,
                tokenWeight: config.tokenWeight,
                prefixWeight: config.prefixWeight,
            }),
        0
    ) + computeRecencyBoost(doc));

    const highlight = highlightOverride ?? createHighlightSnippet(highlightFields, context);
    const highlightList = Array.isArray(highlight)
        ? highlight
        : highlight
            ? [highlight]
            : baseResult.highlight || [];

    return {
        ...baseResult,
        score,
        highlight: highlightList,
    };
};

const buildAtlasHighlightSnippet = (highlights = []) => {
    if (!Array.isArray(highlights)) {
        return null;
    }

    for (const highlight of highlights) {
        const texts = highlight?.texts;
        if (!Array.isArray(texts)) {
            continue;
        }

        const snippet = texts
            .map((part) => {
                if (!part || typeof part.value !== 'string') {
                    return '';
                }
                if (part.type === 'hit') {
                    return `<mark>${part.value}</mark>`;
                }
                return part.value;
            })
            .join('');

        if (snippet.trim()) {
            return snippet;
        }
    }

    return null;
};

const ATLAS_SEARCH_CONFIG = {
    post: {
        model: Post,
        paths: [
            { path: 'title', boost: 8 },
            { path: 'content', boost: 4 },
            { path: 'category', boost: 2 },
            { path: 'slug', boost: 2 },
        ],
    },
    tutorial: {
        model: Tutorial,
        paths: [
            { path: 'title', boost: 8 },
            { path: 'description', boost: 4 },
            { path: 'chapters.chapterTitle', boost: 2 },
            { path: 'chapters.content', boost: 3 },
            { path: 'chapters.subChapters.chapterTitle', boost: 2 },
            { path: 'chapters.subChapters.content', boost: 2 },
            { path: 'category', boost: 1.5 },
        ],
    },
    problem: {
        model: Problem,
        paths: [
            { path: 'title', boost: 8 },
            { path: 'description', boost: 4 },
            { path: 'statement', boost: 3 },
            { path: 'solutionApproach', boost: 2 },
            { path: 'editorial', boost: 2 },
            { path: 'constraints', boost: 1.5 },
            { path: 'hints.body', boost: 1.5 },
            { path: 'topics', boost: 1.5 },
            { path: 'tags', boost: 1.2 },
            { path: 'companies', boost: 1.2 },
        ],
    },
    page: {
        model: Page,
        filter: { status: 'published' },
        paths: [
            { path: 'title', boost: 8 },
            { path: 'description', boost: 4 },
            { path: 'slug', boost: 3 },
            { path: 'seo.metaTitle', boost: 3 },
            { path: 'seo.metaDescription', boost: 2.5 },
            { path: 'seo.keywords', boost: 2 },
            { path: 'sections.title', boost: 2 },
            { path: 'sections.subtitle', boost: 1.5 },
            { path: 'sections.body', boost: 1.5 },
            { path: 'sections.items.title', boost: 1.2 },
            { path: 'sections.items.body', boost: 1.2 },
        ],
    },
};

const buildAtlasSearchStage = (term, config) => {
    const should = config.paths.map(({ path, boost }) => {
        const text = {
            query: term,
            path,
        };
        if (boost) {
            text.score = { boost: { value: boost } };
        }
        return { text };
    });

    const stage = {
        $search: {
            compound: {
                should,
                minimumShouldMatch: 1,
            },
        },
    };

    if (config.index) {
        stage.$search.index = config.index;
    }

    return stage;
};

const runAtlasSearch = async ({ model, term, sort, limit, config }) => {
    const pipeline = [buildAtlasSearchStage(term, config)];

    if (config.filter) {
        pipeline.push({ $match: config.filter });
    }

    pipeline.push({
        $addFields: {
            score: { $meta: 'searchScore' },
            highlights: { $meta: 'searchHighlights' },
        },
    });

    if (sort === 'recent') {
        pipeline.push({ $sort: { updatedAt: -1, createdAt: -1 } });
    } else {
        pipeline.push({ $sort: { score: -1 } });
    }

    pipeline.push({ $limit: limit });

    return model.aggregate(pipeline);
};

const isMongoSearchUnsupported = (error) => {
    const message = String(error?.message || '').toLowerCase();
    return (
        message.includes('$search') ||
        message.includes('atlas search') ||
        message.includes('search index') ||
        message.includes('unrecognized pipeline stage') ||
        message.includes('unknown top level operator')
    );
};

const parseTypes = (typesParam) => {
    if (!typesParam) return [];
    return typesParam
        .split(',')
        .map((type) => type.trim().toLowerCase())
        .filter((type) => SUPPORTED_SEARCH_TYPES.includes(type));
};

const fallbackSearch = async ({ term, limit, sort, types, reason }) => {
    const startedAt = Date.now();
    const regex = new RegExp(escapeRegExp(term), 'i');
    const searchTypes = types.length ? types : SUPPORTED_SEARCH_TYPES;
    const perTypeLimit = Math.max(3, Math.ceil(limit / searchTypes.length));
    const resultBuckets = [];
    const searchContext = { term: term.toLowerCase(), tokens: tokenizeSearchTerm(term) };

    for (const type of searchTypes) {
        if (type === 'post') {
            const docs = await Post.find({
                $or: [
                    { title: { $regex: regex } },
                    { content: { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(
                ...docs
                    .map((doc) => buildFallbackResult('post', doc, searchContext))
                    .filter(Boolean)
            );
        } else if (type === 'tutorial') {
            const docs = await Tutorial.find({
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { 'chapters.content': { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(
                ...docs
                    .map((doc) => buildFallbackResult('tutorial', doc, searchContext))
                    .filter(Boolean)
            );
        } else if (type === 'problem') {
            const docs = await Problem.find({
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { statement: { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(
                ...docs
                    .map((doc) => buildFallbackResult('problem', doc, searchContext))
                    .filter(Boolean)
            );
        } else if (type === 'page') {
            const docs = await Page.find({
                status: 'published',
                $or: [
                    { title: { $regex: regex } },
                    { description: { $regex: regex } },
                    { 'seo.metaDescription': { $regex: regex } },
                    { 'seo.metaTitle': { $regex: regex } },
                    { 'seo.keywords': { $regex: regex } },
                    { 'sections.title': { $regex: regex } },
                    { 'sections.subtitle': { $regex: regex } },
                    { 'sections.body': { $regex: regex } },
                    { 'sections.items.title': { $regex: regex } },
                    { 'sections.items.body': { $regex: regex } },
                ],
            })
                .sort(sort === 'recent' ? { updatedAt: -1 } : { createdAt: -1 })
                .limit(perTypeLimit)
                .lean();
            resultBuckets.push(
                ...docs
                    .map((doc) => buildFallbackResult('page', doc, searchContext))
                    .filter(Boolean)
            );
        }
    }

    const sortedResults = sort === 'recent'
        ? resultBuckets.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        )
        : resultBuckets.sort((a, b) => {
            if (a.score === b.score) {
                return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            }
            return (b.score ?? 0) - (a.score ?? 0);
        });

    return {
        query: term,
        total: sortedResults.length,
        took: Date.now() - startedAt,
        results: sortedResults.slice(0, limit),
        fallbackUsed: true,
        message:
            reason ||
            'Results are provided via a MongoDB fallback search.',
    };
};

const mongoSearch = async ({ term, limit, sort, types, reason }) => {
    const startedAt = Date.now();
    const searchTypes = types.length ? types : SUPPORTED_SEARCH_TYPES;
    const perTypeLimit = Math.max(3, Math.ceil(limit / searchTypes.length));
    const resultBuckets = [];
    const searchContext = { term: term.toLowerCase(), tokens: tokenizeSearchTerm(term) };

    try {
        for (const type of searchTypes) {
            const config = ATLAS_SEARCH_CONFIG[type];
            if (!config) {
                continue;
            }

            const docs = await runAtlasSearch({
                model: config.model,
                term,
                sort,
                limit: perTypeLimit,
                config,
            });

            for (const doc of docs) {
                const highlight = buildAtlasHighlightSnippet(doc.highlights);
                const score = typeof doc.score === 'number' ? doc.score : null;
                const result = buildFallbackResult(type, doc, searchContext, {
                    score: score ?? undefined,
                    highlight,
                });
                if (result) {
                    resultBuckets.push(result);
                }
            }
        }
    } catch (error) {
        if (isMongoSearchUnsupported(error)) {
            const fallbackReason = reason
                ? `${reason} MongoDB $search is unavailable. Results are provided via a MongoDB fallback search.`
                : 'MongoDB $search is unavailable. Results are provided via a MongoDB fallback search.';
            return fallbackSearch({
                term,
                limit,
                sort,
                types,
                reason: fallbackReason,
            });
        }
        throw error;
    }

    const sortedResults = sort === 'recent'
        ? resultBuckets.sort(
            (a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0)
        )
        : resultBuckets.sort((a, b) => {
            if (a.score === b.score) {
                return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
            }
            return (b.score ?? 0) - (a.score ?? 0);
        });

    return {
        query: term,
        total: sortedResults.length,
        took: Date.now() - startedAt,
        results: sortedResults.slice(0, limit),
        fallbackUsed: true,
        message:
            reason ||
            'Elasticsearch is disabled. Results are provided via MongoDB search.',
    };
};

const resolveFallbackReason = (error) => {
    if (!error) {
        return 'Elasticsearch query failed. Results are provided via a MongoDB fallback search.';
    }

    if (error.code === 'ELASTICSEARCH_NETWORK_ERROR') {
        return 'Unable to reach Elasticsearch. Results are provided via a MongoDB fallback search.';
    }

    const message = String(error.message || '').toLowerCase();

    if (message.includes('index_not_found_exception') || message.includes('no such index')) {
        return 'The search index has not been created yet. Results are provided via a MongoDB fallback search.';
    }

    return 'Elasticsearch query failed. Results are provided via a MongoDB fallback search.';
};

const mongoRepository = {
    kind: 'mongodb',
    async search({ term, limit, sort, types, reason }) {
        return mongoSearch({
            term,
            limit,
            sort,
            types,
            reason: reason || 'Elasticsearch is disabled. Results are provided via MongoDB search.',
        });
    },
};

const elasticRepository = {
    kind: 'elasticsearch',
    async search({ term, limit, sort, types }) {
        if (!isSearchEnabled()) {
            return mongoRepository.search({
                term,
                limit,
                sort,
                types,
                reason: 'Elasticsearch is not configured. Results are provided via MongoDB search.',
            });
        }

        try {
            const data = await searchDocuments({ term, limit, sort, types });
            return {
                ...data,
                fallbackUsed: false,
            };
        } catch (error) {
            console.warn('Elasticsearch query failed. Falling back to MongoDB search:', error.message);
            return mongoRepository.search({
                term,
                limit,
                sort,
                types,
                reason: resolveFallbackReason(error),
            });
        }
    },
};

const getSearchRepository = () => (isElasticsearchDisabled() ? mongoRepository : elasticRepository);

export const globalSearch = async ({ query }) => {
    const searchTerm = (query.q || query.searchTerm || '').toString().trim();
    const limit = Math.min(Math.max(parseInt(query.limit, 10) || 20, 1), 100);
    const sort = query.sort === 'recent' ? 'recent' : 'relevance';
    const types = parseTypes(query.types);

    if (!searchTerm) {
        const fallbackUsed = isElasticsearchDisabled() || !isSearchEnabled();
        return {
            query: '',
            total: 0,
            took: null,
            results: [],
            fallbackUsed,
        };
    }

    const repository = getSearchRepository();
    const data = await repository.search({
        term: searchTerm,
        limit,
        sort,
        types,
    });

    return {
        ...data,
        sort,
        types: types.length ? types : SUPPORTED_SEARCH_TYPES,
    };
};

export const reindexSearchContent = async ({ isAdmin }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'Only administrators can reindex search content.');
    }

    if (isElasticsearchDisabled()) {
        throw errorHandler(503, 'Elasticsearch is disabled.');
    }

    if (!isSearchEnabled()) {
        throw errorHandler(503, 'Elasticsearch is not configured.');
    }

    const [posts, tutorials, problems, pages] = await Promise.all([
        Post.find({}).lean(),
        Tutorial.find({}).lean(),
        Problem.find({}).lean(),
        Page.find({ status: 'published' }).lean(),
    ]);

    const [postResult, tutorialResult, problemResult, pageResult] = await Promise.all([
        bulkReplaceDocuments('post', posts),
        bulkReplaceDocuments('tutorial', tutorials),
        bulkReplaceDocuments('problem', problems),
        bulkReplaceDocuments('page', pages),
    ]);

    return {
        success: true,
        indexed: {
            posts: postResult.indexed,
            tutorials: tutorialResult.indexed,
            problems: problemResult.indexed,
            pages: pageResult.indexed,
        },
    };
};
