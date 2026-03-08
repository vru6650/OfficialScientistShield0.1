import { errorHandler } from '../../utils/error.js';
import { generateSlug } from '../../utils/slug.js';
import { normalizePagination } from '../../utils/pagination.js';
import { indexSearchDocument, removeSearchDocument } from '../../services/search.service.js';
import {
    countPosts,
    createPostRecord,
    deletePostById,
    findPostById,
    findPosts,
    updatePostById,
} from './post.repository.js';

export const createPost = async ({ userId, isAdmin, body }) => {
    if (!isAdmin) {
        throw errorHandler(403, 'You are not allowed to create a post');
    }

    if (!body?.title || !body?.content) {
        throw errorHandler(400, 'Please provide all required fields');
    }

    const slug = generateSlug(String(body.title));

    try {
        const savedPost = await createPostRecord({
            ...body,
            slug,
            userId,
        });
        await indexSearchDocument('post', savedPost);
        return savedPost;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A post with this ${field} already exists`);
        }

        throw error;
    }
};

export const getPosts = async ({ query }) => {
    const { startIndex, limit } = normalizePagination(query, {
        defaultLimit: 9,
        maxLimit: 50,
    });

    const sortDirection = query.order === 'asc' ? 1 : -1;
    const sortBy = query.sort || 'updatedAt';
    const sortOptions = sortBy === 'claps' ? { claps: -1 } : { [sortBy]: sortDirection };

    const filters = {
        ...(query.userId && { userId: query.userId }),
        ...(query.category && { category: query.category }),
        ...(query.slug && { slug: query.slug }),
        ...(query.postId && { _id: query.postId }),
        ...(query.searchTerm && {
            $or: [
                { title: { $regex: query.searchTerm, $options: 'i' } },
                { content: { $regex: query.searchTerm, $options: 'i' } },
            ],
        }),
    };

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const [posts, totalPosts, lastMonthPosts] = await Promise.all([
        findPosts({ filters, sortOptions, startIndex, limit }),
        countPosts(filters),
        countPosts({
            ...filters,
            createdAt: { $gte: oneMonthAgo },
        }),
    ]);

    return { posts, totalPosts, lastMonthPosts };
};

export const deletePost = async ({ postId, userId, isAdmin }) => {
    const post = await findPostById(postId);

    if (!post) {
        throw errorHandler(404, 'Post not found');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && post.userId?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to delete this post');
    }

    await deletePostById(post._id);
    await removeSearchDocument('post', postId);
};

export const updatePost = async ({ postId, userId, isAdmin, body }) => {
    const post = await findPostById(postId);

    if (!post) {
        throw errorHandler(404, 'Post not found');
    }

    const requesterId = userId?.toString?.();
    const isOwner = requesterId && post.userId?.toString?.() === requesterId;
    if (!isAdmin && !isOwner) {
        throw errorHandler(403, 'You are not allowed to update this post');
    }

    const slug = body?.title !== undefined ? generateSlug(String(body.title)) : undefined;
    const updateFields = {};

    if (body?.title !== undefined) {
        updateFields.title = body.title;
    }
    if (body?.content !== undefined) {
        updateFields.content = body.content;
    }
    if (body?.category !== undefined) {
        updateFields.category = body.category;
    }
    if (slug !== undefined) {
        updateFields.slug = slug;
    }
    if (body?.mediaUrl !== undefined) {
        updateFields.mediaUrl = body.mediaUrl;
    }
    if (body?.mediaType !== undefined) {
        updateFields.mediaType = body.mediaType;
    }
    if (body?.image !== undefined) {
        updateFields.image = body.image;
    }

    try {
        const updatedPost = await updatePostById(post._id, updateFields);

        if (updatedPost) {
            await indexSearchDocument('post', updatedPost);
        }

        return updatedPost;
    } catch (error) {
        if (error?.code === 11000) {
            const field = Object.keys(error?.keyPattern || {})[0] || 'field';
            throw errorHandler(409, `A post with this ${field} already exists`);
        }

        throw error;
    }
};

export const togglePostClap = async ({ postId, userId }) => {
    const post = await findPostById(postId);

    if (!post) {
        throw errorHandler(404, 'Post not found');
    }

    if (!userId) {
        throw errorHandler(401, 'You must be signed in to clap a post');
    }

    const userIdString = userId.toString();
    const userIndex = post.clappedBy.findIndex(
        (clapperId) => clapperId.toString() === userIdString
    );

    if (userIndex === -1) {
        post.claps += 1;
        post.clappedBy.push(userId);
    } else {
        post.claps = Math.max(0, post.claps - 1);
        post.clappedBy.splice(userIndex, 1);
    }

    await post.save();
    return post;
};

export const togglePostBookmark = async ({ postId, userId }) => {
    const post = await findPostById(postId);

    if (!post) {
        throw errorHandler(404, 'Post not found');
    }

    if (!post.bookmarkedBy) {
        post.bookmarkedBy = [];
    }

    if (!userId) {
        throw errorHandler(401, 'You must be signed in to bookmark a post');
    }

    const userIdString = userId.toString();
    const userIndex = post.bookmarkedBy.findIndex(
        (bookmarkUserId) => bookmarkUserId.toString() === userIdString
    );

    let isBookmarked;

    if (userIndex === -1) {
        post.bookmarkedBy.push(userId);
        isBookmarked = true;
    } else {
        post.bookmarkedBy.splice(userIndex, 1);
        isBookmarked = false;
    }

    await post.save();
    return { isBookmarked };
};
