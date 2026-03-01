import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../utils/verifyUser.js';
import {
    create,
    deletepost,
    getposts,
    updatepost,
    clapPost,
    bookmarkPost,
} from '../controllers/post.controller.js';
import { requireAdmin } from '../utils/authorize.js';
import { validateRequest } from '../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema } from '../validators/common.js';

const router = express.Router();

const createPostBody = z
    .object({
        title: nonEmptyStringSchema,
        content: nonEmptyStringSchema,
        category: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.string().optional(),
        image: z.string().optional(),
    })
    .passthrough();

const updatePostBody = z
    .object({
        title: z.string().trim().optional(),
        content: z.string().trim().optional(),
        category: z.string().optional(),
        mediaUrl: z.string().optional(),
        mediaType: z.string().optional(),
        image: z.string().optional(),
    })
    .passthrough();

const postParams = z.object({
    postId: objectIdSchema,
    userId: objectIdSchema,
});

const postIdParams = z.object({
    postId: objectIdSchema,
});

const getPostsQuery = paginationQuerySchema.extend({
    order: z.enum(['asc', 'desc']).optional(),
    sort: z.string().optional(),
    userId: objectIdSchema.optional(),
    category: z.string().optional(),
    slug: z.string().optional(),
    postId: objectIdSchema.optional(),
    searchTerm: z.string().optional(),
}).partial();

router.post(
    '/create',
    verifyToken,
    requireAdmin('You are not allowed to create a post'),
    validateRequest({ body: createPostBody }),
    create
);
router.get('/getposts', validateRequest({ query: getPostsQuery }), getposts);
router.delete(
    '/deletepost/:postId/:userId',
    verifyToken,
    validateRequest({ params: postParams }),
    deletepost
);
router.put(
    '/updatepost/:postId/:userId',
    verifyToken,
    validateRequest({ params: postParams, body: updatePostBody }),
    updatepost
);
router.put(
    '/clap/:postId',
    verifyToken,
    validateRequest({ params: postIdParams }),
    clapPost
);
router.put(
    '/:postId/bookmark',
    verifyToken,
    validateRequest({ params: postIdParams }),
    bookmarkPost
);

export default router;
