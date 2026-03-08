import { errorHandler } from '../../utils/error.js';
import { normalizePagination } from '../../utils/pagination.js';
import {
    countComments,
    createCommentRecord,
    deleteCommentById,
    findCommentById,
    findComments,
    findCommentsByPostId,
    updateCommentById,
} from './comment.repository.js';

export const createComment = async ({ content, postId, userId }) => {
    if (typeof content !== 'string' || content.trim() === '') {
        throw errorHandler(400, 'Comment content is required');
    }

    if (typeof postId !== 'string' || postId.trim() === '') {
        throw errorHandler(400, 'A valid postId is required');
    }

    if (!userId) {
        throw errorHandler(401, 'You must be signed in to comment');
    }

    return createCommentRecord({
        content: content.trim(),
        postId: postId.trim(),
        userId,
    });
};

export const getPostComments = async ({ postId }) => {
    return findCommentsByPostId(postId);
};

export const toggleCommentLike = async ({ commentId, userId }) => {
    const comment = await findCommentById(commentId);

    if (!comment) {
        throw errorHandler(404, 'Comment not found');
    }

    if (!userId) {
        throw errorHandler(401, 'You must be signed in to like a comment');
    }

    const normalizedLikes = comment.likes
        .map((likeUserId) => likeUserId?.toString?.())
        .filter(Boolean);

    const existingIndex = normalizedLikes.findIndex((likeUserId) => likeUserId === userId);

    if (existingIndex === -1) {
        normalizedLikes.push(userId);
    } else {
        normalizedLikes.splice(existingIndex, 1);
    }

    comment.likes = normalizedLikes;
    comment.numberOfLikes = normalizedLikes.length;

    await comment.save();
    return comment;
};

export const updateComment = async ({ commentId, userId, isAdmin, content }) => {
    const comment = await findCommentById(commentId);

    if (!comment) {
        throw errorHandler(404, 'Comment not found');
    }

    const ownerId = comment.userId?.toString?.() ?? comment.userId;

    if (!userId) {
        throw errorHandler(401, 'You must be signed in to edit this comment');
    }

    if (ownerId !== userId && !isAdmin) {
        throw errorHandler(403, 'You are not allowed to edit this comment');
    }

    return updateCommentById(commentId, { content });
};

export const deleteComment = async ({ commentId, userId, isAdmin }) => {
    const comment = await findCommentById(commentId);

    if (!comment) {
        throw errorHandler(404, 'Comment not found');
    }

    const ownerId = comment.userId?.toString?.() ?? comment.userId;

    if (!userId) {
        throw errorHandler(401, 'You are not allowed to delete this comment');
    }

    if (ownerId !== userId && !isAdmin) {
        throw errorHandler(403, 'You are not allowed to delete this comment');
    }

    await deleteCommentById(commentId);
};

export const getComments = async ({ query }) => {
    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 9,
        maxLimit: 50,
    });
    const sortDirection = query.sort === 'desc' ? -1 : 1;

    const now = new Date();
    const oneMonthAgo = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        now.getDate()
    );

    const [comments, totalComments, lastMonthComments] = await Promise.all([
        findComments({ sortDirection, startIndex, limit }),
        countComments(),
        countComments({ createdAt: { $gte: oneMonthAgo } }),
    ]);

    return { comments, totalComments, lastMonthComments };
};
