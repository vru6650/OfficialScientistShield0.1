import Comment from '../models/comment.model.js';
import { errorHandler } from '../utils/error.js';
import { normalizePagination } from '../utils/pagination.js';

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

    const newComment = new Comment({
        content: content.trim(),
        postId: postId.trim(),
        userId,
    });
    await newComment.save();
    return newComment;
};

export const getPostComments = async ({ postId }) => {
    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
    return comments;
};

export const toggleCommentLike = async ({ commentId, userId }) => {
    const comment = await Comment.findById(commentId);
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
    const comment = await Comment.findById(commentId);
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

    const editedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
    );

    return editedComment;
};

export const deleteComment = async ({ commentId, userId, isAdmin }) => {
    const comment = await Comment.findById(commentId);
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

    await Comment.findByIdAndDelete(commentId);
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

    const commentsQuery = Comment.find()
        .sort({ createdAt: sortDirection })
        .skip(startIndex)
        .limit(limit)
        .lean();

    const [comments, totalComments, lastMonthComments] = await Promise.all([
        commentsQuery,
        Comment.countDocuments(),
        Comment.countDocuments({
            createdAt: { $gte: oneMonthAgo },
        }),
    ]);

    return { comments, totalComments, lastMonthComments };
};
