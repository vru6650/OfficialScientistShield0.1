import {
    createComment as createCommentService,
    deleteComment as deleteCommentService,
    getComments as getCommentsService,
    getPostComments as getPostCommentsService,
    toggleCommentLike,
    updateComment as updateCommentService,
} from '../services/comment.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createComment = asyncHandler(async (req, res) => {
    const comment = await createCommentService({
        content: req.body.content,
        postId: req.body.postId,
        userId: req.user?.id,
    });
    res.status(201).json(comment);
});

export const getPostComments = asyncHandler(async (req, res) => {
    const comments = await getPostCommentsService({ postId: req.params.postId });
    res.status(200).json(comments);
});

export const likeComment = asyncHandler(async (req, res) => {
    const comment = await toggleCommentLike({
        commentId: req.params.commentId,
        userId: req.user?.id?.toString(),
    });
    res.status(200).json(comment);
});

export const editComment = asyncHandler(async (req, res) => {
    const editedComment = await updateCommentService({
        commentId: req.params.commentId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        content: req.body.content,
    });
    res.status(200).json(editedComment);
});

export const deleteComment = asyncHandler(async (req, res) => {
    await deleteCommentService({
        commentId: req.params.commentId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('Comment has been deleted');
});

export const getComments = asyncHandler(async (req, res) => {
    const data = await getCommentsService({ query: req.query });
    res.status(200).json(data);
});
