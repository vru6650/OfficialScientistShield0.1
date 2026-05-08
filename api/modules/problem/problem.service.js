import jwt from 'jsonwebtoken';
import { errorHandler } from '../../utils/error.js';
import { generateSlug } from '../../utils/slug.js';
import { normalizePagination } from '../../utils/pagination.js';
import {
    indexSearchDocument,
    removeSearchDocument,
} from '../../services/search.service.js';
import {
    aggregateProblemDifficultyCounts,
    aggregateProblemTopicCounts,
    countProblems,
    createProblemRecord,
    deleteProblemById,
    findProblemById,
    findProblemBySlug,
    findProblems,
} from './problem.repository.js';

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildProblemQuery = (query, allowDrafts) => {
    const filters = {};

    if (!allowDrafts) {
        filters.isPublished = true;
    }

    if (query.difficulty && query.difficulty !== 'all') {
        filters.difficulty = query.difficulty;
    }

    if (query.topic) {
        filters.topics = { $regex: escapeRegex(query.topic), $options: 'i' };
    }

    if (query.tag) {
        filters.tags = { $regex: escapeRegex(query.tag), $options: 'i' };
    }

    if (query.company) {
        filters.companies = { $regex: escapeRegex(query.company), $options: 'i' };
    }

    if (query.searchTerm) {
        const searchTerm = escapeRegex(query.searchTerm);
        filters.$or = [
            { title: { $regex: searchTerm, $options: 'i' } },
            { description: { $regex: searchTerm, $options: 'i' } },
            { statement: { $regex: searchTerm, $options: 'i' } },
        ];
    }

    return Object.fromEntries(
        Object.entries(filters).filter(([, value]) => value !== undefined)
    );
};

const canPreviewDrafts = (accessToken) => {
    if (!accessToken) {
        return false;
    }

    try {
        const payload = jwt.verify(accessToken, process.env.JWT_SECRET);
        return Boolean(payload?.isAdmin);
    } catch (error) {
        return false;
    }
};

export const mapProblemSummary = (problem) => {
    const { stats } = problem;
    const submissionCount = stats?.submissions ?? 0;
    const acceptedCount = stats?.accepted ?? 0;
    const successRate = submissionCount > 0
        ? Math.round((acceptedCount / submissionCount) * 100)
        : null;

    return {
        _id: problem._id,
        title: problem.title,
        slug: problem.slug,
        description: problem.description,
        difficulty: problem.difficulty,
        topics: problem.topics,
        tags: problem.tags,
        companies: problem.companies,
        estimatedTime: problem.estimatedTime,
        stats: {
            submissions: problem.stats?.submissions ?? 0,
            accepted: problem.stats?.accepted ?? 0,
            likes: problem.stats?.likes ?? 0,
        },
        successRate,
        updatedAt: problem.updatedAt,
        createdAt: problem.createdAt,
        isPublished: problem.isPublished,
    };
};

export const resolveProblemSort = (sort) => {
    const sortOptions = {
        newest: { updatedAt: -1 },
        oldest: { updatedAt: 1 },
        popular: { 'stats.submissions': -1 },
        challenging: { difficulty: -1, 'stats.accepted': 1 },
    };

    return sortOptions[sort] || sortOptions.newest;
};

export const createProblem = async ({ userId, isAdmin, body }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to create a problem.');
    }

    const {
        title,
        description,
        statement,
        difficulty = 'Easy',
        topics = [],
        tags = [],
        companies = [],
        inputFormat = '',
        outputFormat = '',
        constraints = [],
        samples = [],
        hints = [],
        solutionApproach = '',
        editorial = '',
        solutionSnippets = [],
        starterCodes = [],
        resources = [],
        estimatedTime = 0,
        isPublished = true,
        stats = {},
    } = body;

    if (!title || !statement || !description) {
        throw errorHandler(400, 'Title, description, and problem statement are required.');
    }

    const slug = generateSlug(String(title));

    try {
        const savedProblem = await createProblemRecord({
            title,
            description,
            statement,
            difficulty,
            topics,
            tags,
            companies,
            inputFormat,
            outputFormat,
            constraints,
            samples,
            hints,
            solutionApproach,
            editorial,
            solutionSnippets,
            starterCodes,
            resources,
            estimatedTime,
            isPublished,
            createdBy: userId,
            slug,
            stats,
        });

        await indexSearchDocument('problem', savedProblem);
        return savedProblem;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A problem with this ${field} already exists.`);
        }
        throw error;
    }
};

export const getProblems = async ({ query, accessToken }) => {
    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 12,
        maxLimit: 50,
    });
    const sort = query.sort || 'newest';
    const allowDrafts = query.includeDrafts === 'true' && canPreviewDrafts(accessToken);
    const filters = buildProblemQuery(query, allowDrafts);

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [problems, totalProblems, lastMonthProblems, topicCounts, difficultyCounts] =
        await Promise.all([
            findProblems({
                filters,
                sort: resolveProblemSort(sort),
                startIndex,
                limit,
            }),
            countProblems(filters),
            countProblems({
                ...filters,
                createdAt: { $gte: oneMonthAgo },
            }),
            aggregateProblemTopicCounts(filters),
            aggregateProblemDifficultyCounts(filters),
        ]);

    return {
        problems: problems.map(mapProblemSummary),
        totalProblems,
        lastMonthProblems,
        meta: {
            topicCounts,
            difficultyCounts,
        },
    };
};

export const getProblemBySlug = async ({ problemSlug, accessToken }) => {
    const problem = await findProblemBySlug(problemSlug);
    const allowDraft = canPreviewDrafts(accessToken);

    if (!problem || (!problem.isPublished && !allowDraft)) {
        throw errorHandler(404, 'Problem not found.');
    }

    const submissionCount = problem.stats?.submissions ?? 0;
    const acceptedCount = problem.stats?.accepted ?? 0;
    const successRate = submissionCount > 0
        ? Math.round((acceptedCount / submissionCount) * 100)
        : null;

    return {
        ...problem.toObject(),
        successRate,
    };
};

export const getProblemById = async ({ problemId, isAdmin }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to view this problem.');
    }

    const problem = await findProblemById(problemId, { withCreatedBy: true });

    if (!problem) {
        throw errorHandler(404, 'Problem not found.');
    }

    return problem;
};

export const updateProblem = async ({ problemId, userId, isAdmin, body }) => {
    const updatePayload = { ...body };

    if (updatePayload.title) {
        updatePayload.slug = generateSlug(String(updatePayload.title));
    }

    try {
        const problem = await findProblemById(problemId);
        if (!problem) {
            throw errorHandler(404, 'Problem not found.');
        }

        const requesterId = userId?.toString?.();
        const isOwner = requesterId && problem.createdBy?.toString?.() === requesterId;
        if (!isAdmin && !isOwner) {
            throw errorHandler(403, 'You are not allowed to update this problem.');
        }

        Object.assign(problem, updatePayload);
        const updatedProblem = await problem.save();

        await indexSearchDocument('problem', updatedProblem);
        return updatedProblem;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A problem with this ${field} already exists.`);
        }
        throw error;
    }
};

export const deleteProblem = async ({ problemId, userId, isAdmin }) => {
    const problem = await findProblemById(problemId);
    if (!problem) {
        throw errorHandler(404, 'Problem not found.');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && problem.createdBy?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to delete this problem.');
    }

    await deleteProblemById(problem._id);
    await removeSearchDocument('problem', problem._id.toString());
};
