import {
    countSubmissions,
    createSubmissionRecord,
    findSubmissions,
    updateSubmissionStatus,
} from './community.repository.js';
import { errorHandler } from '../../utils/error.js';
import { normalizePagination } from '../../utils/pagination.js';

const escapeRegex = (value = '') => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const normalizeInterests = (interests) => {
    if (!interests) {
        return [];
    }

    if (Array.isArray(interests)) {
        return interests
            .map((item) => item?.toString().trim())
            .filter(Boolean)
            .slice(0, 12);
    }

    if (typeof interests === 'string') {
        return interests
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean)
            .slice(0, 12);
    }

    return [];
};

export const createCommunitySubmission = async ({ body, userId }) => {
    const interests = normalizeInterests(body.interests);

    const submission = await createSubmissionRecord({
        name: body.name.trim(),
        email: body.email.trim().toLowerCase(),
        role: body.role?.trim() || '',
        experienceLevel: body.experienceLevel?.trim() || '',
        goals: body.goals?.trim() || '',
        interests,
        message: body.message?.trim() || '',
        consentToContact: Boolean(body.consentToContact),
        source: body.source || 'community-form',
        user: userId,
    });

    return submission.toObject();
};

export const buildCommunitySubmissionFilters = (query = {}) => {
    const filters = {};

    if (query.status && query.status !== 'all') {
        filters.status = query.status;
    }

    if (query.email) {
        filters.email = {
            $regex: escapeRegex(query.email.trim()),
            $options: 'i',
        };
    }

    return filters;
};

export const getCommunitySubmissions = async ({ query }) => {
    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 10,
        maxLimit: 50,
    });
    const filters = buildCommunitySubmissionFilters(query);

    const [submissions, totalCount] = await Promise.all([
        findSubmissions({ filters, startIndex, limit }),
        countSubmissions(filters),
    ]);

    return {
        submissions,
        totalCount,
        limit,
        nextIndex: startIndex + submissions.length,
        hasMore: startIndex + submissions.length < totalCount,
    };
};

export const updateCommunitySubmissionStatus = async ({ submissionId, status }) => {
    const updated = await updateSubmissionStatus(submissionId, status);
    if (!updated) {
        throw errorHandler(404, 'Submission not found.');
    }
    return updated;
};
