import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../utils/verifyUser.js';
import {
    createProblem,
    getProblems,
    getProblemBySlug,
    getProblemById,
    updateProblem,
    deleteProblem,
} from '../controllers/problem.controller.js';
import { requireAdmin } from '../utils/authorize.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema, slugSchema } from '../validators/common.js';

const router = express.Router();

const createProblemBody = z
    .object({
        title: nonEmptyStringSchema,
        description: nonEmptyStringSchema,
        statement: nonEmptyStringSchema,
    })
    .passthrough();

const updateProblemBody = z.object({}).passthrough();

const problemIdParams = z.object({
    problemId: objectIdSchema,
});

const problemSlugParams = z.object({
    problemSlug: slugSchema,
});

const getProblemsQuery = paginationQuerySchema.extend({
    sort: z.string().optional(),
    includeDrafts: z.enum(['true', 'false']).optional(),
    difficulty: z.string().optional(),
    topic: z.string().optional(),
    tag: z.string().optional(),
    company: z.string().optional(),
    searchTerm: z.string().optional(),
}).partial();

router.post(
    '/problems',
    verifyToken,
    requireAdmin('You are not allowed to create a problem.'),
    validateRequest({ body: createProblemBody }),
    createProblem
);
router.get('/problems', validateRequest({ query: getProblemsQuery }), getProblems);
router.get(
    '/problems/slug/:problemSlug',
    validateRequest({ params: problemSlugParams }),
    getProblemBySlug
);
router.get(
    '/problems/:problemId([a-fA-F0-9]{24})',
    verifyToken,
    requireAdmin('You are not allowed to view this problem.'),
    validateRequest({ params: problemIdParams }),
    getProblemById
);
router.put(
    '/problems/:problemId([a-fA-F0-9]{24})',
    verifyToken,
    validateRequest({ params: problemIdParams, body: updateProblemBody }),
    updateProblem
);
router.delete(
    '/problems/:problemId([a-fA-F0-9]{24})',
    verifyToken,
    validateRequest({ params: problemIdParams }),
    deleteProblem
);

export default router;
