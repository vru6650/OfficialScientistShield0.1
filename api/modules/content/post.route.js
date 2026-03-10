import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../../utils/verifyUser.js';
import {
    create,
    createCommunityPost,
    deletepost,
    getposts,
    getCommunityPosts,
    updatepost,
    clapPost,
    bookmarkPost,
} from './post.controller.js';
import { requireAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema } from '../../validators/common.js';

const router = express.Router();
const nullableOptionalString = z.preprocess(
    (value) => (value === null || value === '' ? undefined : value),
    z.string().trim().optional()
);

const createPostBody = z
    .object({
        title: nonEmptyStringSchema,
        content: nonEmptyStringSchema,
        slug: nullableOptionalString,
        category: z.string().optional(),
        mediaUrl: nullableOptionalString,
        mediaType: nullableOptionalString,
        image: nullableOptionalString,
        mediaAssets: z
            .array(
                z.object({
                    url: z.string().trim().url(),
                    type: z.enum(['image', 'video', 'audio', 'document']).optional(),
                    caption: z.string().trim().max(280).optional(),
                    order: z.coerce.number().int().min(0).optional(),
                })
            )
            .max(8)
            .optional(),
        coverAssetIndex: z.coerce.number().int().min(0).optional(),
    })
    .passthrough();

const updatePostBody = z
    .object({
        title: z.string().trim().optional(),
        content: z.string().trim().optional(),
        slug: nullableOptionalString,
        category: z.string().optional(),
        mediaUrl: nullableOptionalString,
        mediaType: nullableOptionalString,
        image: nullableOptionalString,
        mediaAssets: z
            .array(
                z.object({
                    url: z.string().trim().url(),
                    type: z.enum(['image', 'video', 'audio', 'document']).optional(),
                    caption: z.string().trim().max(280).optional(),
                    order: z.coerce.number().int().min(0).optional(),
                })
            )
            .max(8)
            .optional(),
        coverAssetIndex: z.coerce.number().int().min(0).optional(),
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
    kind: z.enum(['article', 'community']).optional(),
}).partial();

const getCommunityPostsQuery = getPostsQuery.omit({ kind: true });

router.post(
    '/create',
    verifyToken,
    requireAdmin('You are not allowed to create a post'),
    validateRequest({ body: createPostBody }),
    create
);
router.post(
    '/community',
    verifyToken,
    validateRequest({ body: createPostBody }),
    createCommunityPost
);
router.get('/getposts', validateRequest({ query: getPostsQuery }), getposts);
router.get(
    '/community',
    validateRequest({ query: getCommunityPostsQuery }),
    getCommunityPosts
);
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
