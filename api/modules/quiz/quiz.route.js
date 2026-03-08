import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../../utils/verifyUser.js';
import {
    createQuiz,
    getQuizzes,
    getSingleQuizById,
    getSingleQuizBySlug,
    updateQuiz,
    deleteQuiz,
    submitQuiz,
} from './quiz.controller.js';
import { requireAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema, slugSchema } from '../../validators/common.js';

const router = express.Router();

const createQuizBody = z
    .object({
        title: nonEmptyStringSchema,
        questions: z.array(z.any()).min(1, 'At least one question is required'),
        description: z.string().optional(),
        category: z.string().optional(),
        relatedTutorials: z.array(z.any()).optional(),
    })
    .passthrough();

const updateQuizBody = z
    .object({
        title: z.string().trim().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        questions: z.array(z.any()).optional(),
        relatedTutorials: z.array(z.any()).optional(),
    })
    .passthrough();

const submitQuizBody = z.object({
    answers: z.array(z.any()),
});

const quizIdParams = z.object({
    quizId: objectIdSchema,
});

const quizSlugParams = z.object({
    quizSlug: slugSchema,
});

const getQuizzesQuery = paginationQuerySchema.extend({
    sort: z.enum(['asc', 'desc']).optional(),
    quizId: objectIdSchema.optional(),
    relatedTutorialId: objectIdSchema.optional(),
    slug: z.string().optional(),
    category: z.string().optional(),
    searchTerm: z.string().optional(),
}).partial();

router.post(
    '/quizzes',
    verifyToken,
    requireAdmin('You are not allowed to create a quiz'),
    validateRequest({ body: createQuizBody }),
    createQuiz
);

router.get('/quizzes', validateRequest({ query: getQuizzesQuery }), getQuizzes);

router.get(
    '/quizzes/slug/:quizSlug',
    validateRequest({ params: quizSlugParams }),
    getSingleQuizBySlug
);

router.get(
    '/quizzes/:quizId([a-fA-F0-9]{24})',
    validateRequest({ params: quizIdParams }),
    getSingleQuizById
);

router.put(
    '/quizzes/:quizId',
    verifyToken,
    validateRequest({ params: quizIdParams, body: updateQuizBody }),
    updateQuiz
);

router.delete(
    '/quizzes/:quizId',
    verifyToken,
    validateRequest({ params: quizIdParams }),
    deleteQuiz
);

router.post(
    '/quizzes/submit/:quizId',
    verifyToken,
    validateRequest({ params: quizIdParams, body: submitQuizBody }),
    submitQuiz
);

export default router;
