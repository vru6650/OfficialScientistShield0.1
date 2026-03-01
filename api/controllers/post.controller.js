import {
    createPost,
    deletePost,
    getPosts,
    togglePostBookmark,
    togglePostClap,
    updatePost,
} from '../services/post.service.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const create = asyncHandler(async (req, res) => {
    const savedPost = await createPost({
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(201).json(savedPost);
});

export const getposts = asyncHandler(async (req, res) => {
    const data = await getPosts({ query: req.query });
    res.status(200).json(data);
});

export const deletepost = asyncHandler(async (req, res) => {
    await deletePost({
        postId: req.params.postId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
    });
    res.status(200).json('The post has been deleted');
});

export const updatepost = asyncHandler(async (req, res) => {
    const updatedPost = await updatePost({
        postId: req.params.postId,
        userId: req.user?.id,
        isAdmin: Boolean(req.user?.isAdmin),
        body: req.body,
    });
    res.status(200).json(updatedPost);
});

export const clapPost = asyncHandler(async (req, res) => {
    const post = await togglePostClap({
        postId: req.params.postId,
        userId: req.user?.id,
    });
    res.status(200).json(post);
});

export const bookmarkPost = asyncHandler(async (req, res) => {
    const data = await togglePostBookmark({
        postId: req.params.postId,
        userId: req.user?.id,
    });
    res.status(200).json(data);
});
