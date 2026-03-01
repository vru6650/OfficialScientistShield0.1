import { Buffer } from 'node:buffer';
import { errorHandler } from '../utils/error.js';

const {
    ELASTICSEARCH_NODE,
    ELASTICSEARCH_USERNAME,
    ELASTICSEARCH_PASSWORD,
    ELASTICSEARCH_API_KEY,
    ELASTICSEARCH_DISABLED,
    ELASTICSEARCH_INDEX_PREFIX = 'scientistshield',
} = process.env;

const DEFAULT_ELASTICSEARCH_NODE = 'http://127.0.0.1:9200';

const normalizeNode = (value) => {
    if (!value) return null;
    return value.endsWith('/') ? value : `${value}/`;
};

const shouldDisableElasticsearch = () => {
    const disabledFlag = String(ELASTICSEARCH_DISABLED || '').toLowerCase();
    if (['1', 'true', 'yes', 'on'].includes(disabledFlag)) {
        return true;
    }

    const nodeValue = (ELASTICSEARCH_NODE || '').trim().toLowerCase();
    return ['disable', 'disabled', 'false', '0', 'off'].includes(nodeValue);
};

const resolveBaseUrl = () => {
    if (shouldDisableElasticsearch()) {
        return null;
    }

    const configuredNode = (ELASTICSEARCH_NODE || '').trim();
    const node = configuredNode || DEFAULT_ELASTICSEARCH_NODE;
    return normalizeNode(node);
};

const BASE_URL = resolveBaseUrl();

const SUPPORTED_TYPES = ['post', 'tutorial', 'problem', 'page'];

const buildHeaders = (customHeaders = {}) => {
    const headers = { ...customHeaders };

    if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    if (ELASTICSEARCH_API_KEY) {
        headers.Authorization = `ApiKey ${ELASTICSEARCH_API_KEY}`;
    } else if (ELASTICSEARCH_USERNAME && ELASTICSEARCH_PASSWORD) {
        const token = Buffer.from(
            `${ELASTICSEARCH_USERNAME}:${ELASTICSEARCH_PASSWORD}`
        ).toString('base64');
        headers.Authorization = `Basic ${token}`;
    }

    return headers;
};

const request = async (path, { method = 'GET', headers = {}, body, signal } = {}) => {
    if (!BASE_URL) {
        throw errorHandler(503, 'Elasticsearch is not configured');
    }

    const url = new URL(path.startsWith('/') ? path.slice(1) : path, BASE_URL);
    let response;

    try {
        response = await fetch(url, {
            method,
            headers: buildHeaders(headers),
            body,
            signal,
        });
    } catch (error) {
        const networkError = errorHandler(
            503,
            `Unable to reach Elasticsearch at ${BASE_URL}: ${error.message}`
        );
        networkError.code = 'ELASTICSEARCH_NETWORK_ERROR';
        networkError.cause = error;
        throw networkError;
    }

    if (!response.ok) {
        const errorPayload = await response.text();
        throw errorHandler(
            502,
            `Elasticsearch request failed: ${response.status} ${response.statusText} - ${errorPayload}`
        );
    }

    if (response.status === 204) {
        return null;
    }

    const contentType = response.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
};

export const isSearchEnabled = () => Boolean(BASE_URL);
export const isElasticsearchDisabled = () => shouldDisableElasticsearch();

const stripHtml = (value = '') =>
    value
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&[a-z]+;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();

const createSummary = (text = '', maxLength = 280) => {
    const sanitized = stripHtml(text);
    if (sanitized.length <= maxLength) {
        return sanitized;
    }
    const truncated = sanitized.slice(0, maxLength);
    return `${truncated.replace(/[.,;:\s]+$/, '')}…`;
};

const toArrayOfStrings = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
        return value
            .map((item) => (item == null ? null : String(item)))
            .filter(Boolean);
    }
    return [String(value)];
};

const extractPageSectionText = (sections = []) => {
    if (!Array.isArray(sections)) {
        return [];
    }

    return sections.flatMap((section) => {
        if (!section || typeof section !== 'object') {
            return [];
        }

        const pieces = [section.title, section.subtitle, section.body];

        if (Array.isArray(section.items)) {
            for (const item of section.items) {
                pieces.push(item?.title, item?.body);
            }
        }

        if (section.cta) {
            pieces.push(section.cta.label, section.cta.url);
        }

        return pieces.filter(Boolean);
    });
};

const normalizeDocument = (type, document) => {
    if (!SUPPORTED_TYPES.includes(type) || !document) {
        return null;
    }

    const plain =
        typeof document.toObject === 'function'
            ? document.toObject({ depopulate: true })
            : document;

    const id = plain?._id?.toString();
    if (!id) {
        return null;
    }

    const base = {
        id,
        type,
        title: plain.title || '',
        slug: plain.slug || '',
        category: plain.category || '',
        createdAt: plain.createdAt ? new Date(plain.createdAt).toISOString() : null,
        updatedAt: plain.updatedAt ? new Date(plain.updatedAt).toISOString() : null,
    };

    if (type === 'post') {
        const content = stripHtml(plain.content || '');
        return {
            ...base,
            summary: createSummary(plain.content || plain.title || ''),
            content,
            authorId: plain.userId ? String(plain.userId) : null,
            tags: [],
            topics: [],
            companies: [],
        };
    }

    if (type === 'tutorial') {
        const chapterContent = (plain.chapters || [])
            .flatMap((chapter) => {
                const chapterPieces = [chapter.chapterTitle, chapter.content];
                const nested = (chapter.subChapters || []).map((sub) => `${sub.chapterTitle} ${sub.content}`);
                return [...chapterPieces, ...nested];
            })
            .filter(Boolean)
            .join(' ');

        const combinedContent = [plain.description, chapterContent].filter(Boolean).join(' ');

        return {
            ...base,
            summary: createSummary(plain.description || combinedContent || plain.title || ''),
            content: stripHtml(combinedContent),
            tags: [],
            topics: [],
            companies: [],
            difficulty: plain.difficulty || null,
        };
    }

    if (type === 'problem') {
        const combinedContent = [
            plain.description,
            plain.statement,
            plain.solutionApproach,
            plain.editorial,
            ...(plain.constraints || []),
            ...(plain.hints || []),
        ]
            .filter(Boolean)
            .join(' ');

        return {
            ...base,
            summary: createSummary(plain.description || plain.statement || plain.title || ''),
            content: stripHtml(combinedContent),
            tags: toArrayOfStrings(plain.tags),
            topics: toArrayOfStrings(plain.topics),
            companies: toArrayOfStrings(plain.companies),
            difficulty: plain.difficulty || null,
        };
    }

    if (type === 'page') {
        if (plain.status && plain.status !== 'published') {
            return null;
        }

        const sectionPieces = extractPageSectionText(plain.sections || []);
        const seoPieces = [plain.seo?.metaTitle, plain.seo?.metaDescription, ...toArrayOfStrings(plain.seo?.keywords)];
        const combinedContent = [plain.description, ...sectionPieces, ...seoPieces]
            .filter(Boolean)
            .join(' ');

        return {
            ...base,
            category: 'Knowledge page',
            summary: createSummary(plain.description || combinedContent || plain.title || ''),
            content: stripHtml(combinedContent),
            tags: toArrayOfStrings(plain.seo?.keywords),
            topics: [],
            companies: [],
        };
    }

    return null;
};

const buildIndexName = (type) => `${ELASTICSEARCH_INDEX_PREFIX}-${type}`;

const serializeDocument = (type, document) => {
    const normalized = normalizeDocument(type, document);
    if (!normalized) {
        return null;
    }
    const { id, ...body } = normalized;
    return {
        index: buildIndexName(type),
        id,
        body,
    };
};

export const toSearchResult = (type, document) => {
    const normalized = normalizeDocument(type, document);
    if (!normalized) {
        return null;
    }
    const { content, ...rest } = normalized;
    return rest;
};

export const indexSearchDocument = async (type, document) => {
    if (!isSearchEnabled()) {
        return false;
    }
    const payload = serializeDocument(type, document);
    if (!payload) {
        return false;
    }

    try {
        await request(`/${payload.index}/_doc/${payload.id}`, {
            method: 'PUT',
            body: JSON.stringify(payload.body),
        });
        return true;
    } catch (error) {
        console.warn(`Failed to index ${type} ${payload.id}:`, error.message);
        return false;
    }
};

export const removeSearchDocument = async (type, id) => {
    if (!isSearchEnabled() || !SUPPORTED_TYPES.includes(type) || !id) {
        return false;
    }

    try {
        await request(`/${buildIndexName(type)}/_doc/${id}`, { method: 'DELETE' });
        return true;
    } catch (error) {
        if (!/404/.test(error.message)) {
            console.warn(`Failed to remove ${type} ${id} from search index:`, error.message);
        }
        return false;
    }
};

const mapSearchHit = (hit) => {
    const source = hit?._source || {};
    const highlight = hit?.highlight
        ? Object.values(hit.highlight).flat().map((snippet) => String(snippet))
        : [];

    return {
        id: hit?._id,
        type: source.type || null,
        title: source.title || '',
        slug: source.slug || '',
        summary: source.summary || '',
        category: source.category || '',
        tags: source.tags || [],
        topics: source.topics || [],
        companies: source.companies || [],
        difficulty: source.difficulty || null,
        createdAt: source.createdAt || null,
        updatedAt: source.updatedAt || null,
        score: hit?._score ?? null,
        highlight,
    };
};

export const searchDocuments = async ({ term, limit = 20, sort = 'relevance', types = [] }) => {
    if (!isSearchEnabled()) {
        throw errorHandler(503, 'Elasticsearch is not configured');
    }

    const queryTypes = types.length
        ? types.filter((type) => SUPPORTED_TYPES.includes(type))
        : SUPPORTED_TYPES;

    const indexPattern = queryTypes.map((type) => buildIndexName(type)).join(',');

    const payload = {
        size: Math.min(Math.max(limit, 1), 100),
        query: {
            bool: {
                must: [
                    {
                        multi_match: {
                            query: term,
                            fields: [
                                'title^3',
                                'summary^2',
                                'content',
                                'tags',
                                'topics',
                                'companies',
                            ],
                            type: 'best_fields',
                            operator: 'and',
                        },
                    },
                ],
            },
        },
        highlight: {
            pre_tags: ['<mark>'],
            post_tags: ['</mark>'],
            fields: {
                content: {},
                summary: {},
                title: {},
            },
        },
    };

    if (sort === 'recent') {
        payload.sort = [{ updatedAt: { order: 'desc' } }];
    } else {
        payload.sort = [{ _score: { order: 'desc' } }];
    }

    const response = await request(`/${indexPattern}/_search`, {
        method: 'POST',
        body: JSON.stringify(payload),
    });

    const hits = response?.hits?.hits || [];
    const totalValue = typeof response?.hits?.total?.value === 'number'
        ? response.hits.total.value
        : hits.length;

    return {
        query: term,
        total: totalValue,
        took: response?.took ?? null,
        results: hits.map(mapSearchHit),
    };
};

export const bulkReplaceDocuments = async (type, documents = []) => {
    if (!isSearchEnabled() || !SUPPORTED_TYPES.includes(type)) {
        return { indexed: 0, skipped: documents.length };
    }

    const indexName = buildIndexName(type);

    try {
        await request(`/${indexName}`, { method: 'DELETE' });
    } catch (error) {
        if (!/404/.test(error.message)) {
            console.warn(`Failed to reset index ${indexName}:`, error.message);
        }
    }

    const operations = documents
        .map((document) => serializeDocument(type, document))
        .filter(Boolean)
        .flatMap((payload) => [
            JSON.stringify({ index: { _index: payload.index, _id: payload.id } }),
            JSON.stringify(payload.body),
        ]);

    if (operations.length === 0) {
        return { indexed: 0, skipped: documents.length };
    }

    await request('/_bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-ndjson' },
        body: `${operations.join('\n')}\n`,
    });

    return {
        indexed: operations.length / 2,
        skipped: documents.length - operations.length / 2,
    };
};

export const SUPPORTED_SEARCH_TYPES = [...SUPPORTED_TYPES];
