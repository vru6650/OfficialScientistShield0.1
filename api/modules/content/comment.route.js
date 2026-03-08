import express from 'express';
import { z } from 'zod';
import { verifyToken } from '../../utils/verifyUser.js';
import {
    createComment,
    deleteComment,
    editComment,
    getPostComments,
    getComments,
    likeComment,
} from './comment.controller.js';
import { requireAdmin } from '../../utils/authorize.js';
import { validateRequest } from '../../utils/validate.js';
import { nonEmptyStringSchema, objectIdSchema, paginationQuerySchema } from '../../validators/common.js';

const router = express.Router();

const postIdParams = z.object({
    postId: objectIdSchema,
});

const commentIdParams = z.object({
    commentId: objectIdSchema,
});

const createCommentBody = z.object({
    content: nonEmptyStringSchema,
    postId: objectIdSchema,
});

const editCommentBody = z.object({
    content: nonEmptyStringSchema,
});

const getCommentsQuery = paginationQuerySchema
    .extend({
        sort: z.enum(['asc', 'desc']).optional(),
    })
    .partial();

router.post(
    '/create',
    verifyToken,
    validateRequest({ body: createCommentBody }),
    createComment
);
router.get(
    '/getPostComments/:postId',
    validateRequest({ params: postIdParams }),
    getPostComments
);
router.put(
    '/likeComment/:commentId',
    verifyToken,
    validateRequest({ params: commentIdParams }),
    likeComment
);
router.put(
    '/editComment/:commentId',
    verifyToken,
    validateRequest({ params: commentIdParams, body: editCommentBody }),
    editComment
);
router.delete(
    '/deleteComment/:commentId',
    verifyToken,
    validateRequest({ params: commentIdParams }),
    deleteComment
);
router.get(
    '/getcomments',
    verifyToken,
    requireAdmin('You are not allowed to get all comments'),
    validateRequest({ query: getCommentsQuery }),
    getComments
);

export default router;
