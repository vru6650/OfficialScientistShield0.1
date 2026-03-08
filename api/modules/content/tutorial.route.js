import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../../utils/verifyUser.js';
import {
    createTutorial,
    getTutorials,
    updateTutorial,
    deleteTutorial,
    addChapter,
    updateChapter,
    deleteChapter,
    markChapterAsComplete,
} from './tutorial.controller.js';
import { requireAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema, slugSchema } from '../../validators/common.js';

const router = express.Router();

const createTutorialBody = z
    .object({
        title: nonEmptyStringSchema,
        description: nonEmptyStringSchema,
        category: nonEmptyStringSchema,
        thumbnail: z.string().optional(),
        chapters: z.array(z.any()).optional(),
    })
    .passthrough();

const updateTutorialBody = z
    .object({
        title: z.string().trim().optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        thumbnail: z.string().optional(),
    })
    .passthrough();

const addChapterBody = z
    .object({
        chapterTitle: nonEmptyStringSchema,
        order: z.coerce.number().int(),
        contentType: z.string().optional(),
        content: z.string().optional(),
        initialCode: z.string().optional(),
        expectedOutput: z.string().optional(),
        quizId: z.string().optional(),
    })
    .passthrough();

const updateChapterBody = z
    .object({
        chapterTitle: z.string().trim().optional(),
        content: z.string().optional(),
        order: z.coerce.number().int().optional(),
    })
    .passthrough();

const tutorialIdParams = z.object({
    tutorialId: objectIdSchema,
    userId: objectIdSchema,
});

const chapterParams = z.object({
    tutorialId: objectIdSchema,
    chapterId: objectIdSchema,
    userId: objectIdSchema,
});

const completeParams = z.object({
    tutorialId: objectIdSchema,
    chapterId: objectIdSchema,
});

const tutorialSlugParams = z.object({
    tutorialSlug: slugSchema,
});

const getTutorialsQuery = paginationQuerySchema.extend({
    order: z.enum(['asc', 'desc']).optional(),
    authorId: objectIdSchema.optional(),
    category: z.string().optional(),
    tutorialId: objectIdSchema.optional(),
    slug: z.string().optional(),
    searchTerm: z.string().optional(),
}).partial();

router.post(
    '/create',
    verifyToken,
    requireAdmin('You are not allowed to create a tutorial'),
    validateRequest({ body: createTutorialBody }),
    createTutorial
);
router.get('/gettutorials', validateRequest({ query: getTutorialsQuery }), getTutorials);
router.get(
    '/getsingletutorial/:tutorialSlug',
    validateRequest({ params: tutorialSlugParams }),
    (req, res, next) => {
        req.query.slug = req.params.tutorialSlug;
        getTutorials(req, res, next);
    }
);
router.put(
    '/update/:tutorialId/:userId',
    verifyToken,
    validateRequest({ params: tutorialIdParams, body: updateTutorialBody }),
    updateTutorial
);
router.delete(
    '/delete/:tutorialId/:userId',
    verifyToken,
    validateRequest({ params: tutorialIdParams }),
    deleteTutorial
);

router.post(
    '/addchapter/:tutorialId/:userId',
    verifyToken,
    validateRequest({ params: tutorialIdParams, body: addChapterBody }),
    addChapter
);
router.put(
    '/updatechapter/:tutorialId/:chapterId/:userId',
    verifyToken,
    validateRequest({ params: chapterParams, body: updateChapterBody }),
    updateChapter
);
router.delete(
    '/deletechapter/:tutorialId/:chapterId/:userId',
    verifyToken,
    validateRequest({ params: chapterParams }),
    deleteChapter
);

router.post(
    '/complete/:tutorialId/:chapterId',
    verifyToken,
    validateRequest({ params: completeParams }),
    markChapterAsComplete
);

export default router;
