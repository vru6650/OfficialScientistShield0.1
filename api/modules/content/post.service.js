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

const allowedMediaTypes = new Set(['image', 'video', 'audio', 'document']);
export const sanitizeMediaAssets = (mediaAssets) => {
    if (!Array.isArray(mediaAssets)) {
        return [];
    }

    return mediaAssets
        .map((asset, index) => {
            const url = asset?.url?.toString().trim();
            if (!url) {
                return null;
            }

            const type = allowedMediaTypes.has(asset.type) ? asset.type : 'image';
            const caption = asset?.caption?.toString().trim() || '';
            const order = Number.isFinite(Number(asset?.order)) ? Number(asset.order) : index;

            return { url, type, caption, order };
        })
        .filter(Boolean)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 8)
        .map((asset, idx) => ({ ...asset, order: idx }));
};

export const sanitizeIllustrations = (illustrations) => {
    if (!Array.isArray(illustrations)) {
        return [];
    }

    return illustrations
        .map((illustration, index) => {
            const url = illustration?.url?.toString().trim();
            if (!url) {
                return null;
            }

            const alt = illustration?.alt?.toString().trim() || '';
            const caption = illustration?.caption?.toString().trim() || '';
            const credit = illustration?.credit?.toString().trim() || '';
            const order = Number.isFinite(Number(illustration?.order))
                ? Number(illustration.order)
                : index;

            return { url, alt, caption, credit, order };
        })
        .filter(Boolean)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 12)
        .map((illustration, index) => ({
            ...illustration,
            order: index,
        }));
};

export const normalizeCoverAssetIndex = ({ mediaAssets, requestedCoverAssetIndex }) => {
    const maxIndex = Math.max((mediaAssets?.length || 0) - 1, 0);
    const requestedIndex = Number.isInteger(requestedCoverAssetIndex)
        ? requestedCoverAssetIndex
        : 0;

    return Math.min(Math.max(requestedIndex, 0), maxIndex);
};

export const derivePostMediaFields = ({
    mediaAssets = [],
    coverAssetIndex,
    mediaUrl,
    mediaType,
    image,
    emptyImageValue = null,
}) => {
    const primaryAsset = mediaAssets[coverAssetIndex] || mediaAssets[0] || null;
    const imageAsset =
        primaryAsset?.type === 'image'
            ? primaryAsset
            : mediaAssets.find((asset) => asset.type === 'image') || null;

    return {
        coverAssetIndex,
        mediaUrl: mediaUrl !== undefined ? mediaUrl : primaryAsset?.url ?? null,
        mediaType: mediaType !== undefined ? mediaType : primaryAsset?.type || 'image',
        image: image !== undefined ? image : imageAsset?.url ?? emptyImageValue,
    };
};

export const resolvePostSlug = ({ requestedSlug, fallbackTitle }) => {
    const preferredSlug = generateSlug(String(requestedSlug ?? ''));
    if (preferredSlug) {
        return preferredSlug;
    }

    return generateSlug(String(fallbackTitle ?? ''));
};

export const createPost = async ({ userId, isAdmin, body }) => {
    const kind = body?.kind === 'community' ? 'community' : 'article';

    if (!isAdmin && kind !== 'community') {
        throw errorHandler(403, 'You are not allowed to create a post');
    }

    if (!body?.title || !body?.content) {
        throw errorHandler(400, 'Please provide all required fields');
    }

    const slug = resolvePostSlug({
        requestedSlug: body?.slug,
        fallbackTitle: body?.title,
    });
    const mediaAssets = sanitizeMediaAssets(body.mediaAssets);
    const illustrations = sanitizeIllustrations(body.illustrations);
    const derivedMedia = derivePostMediaFields({
        mediaAssets,
        coverAssetIndex: normalizeCoverAssetIndex({
            mediaAssets,
            requestedCoverAssetIndex: body?.coverAssetIndex,
        }),
        mediaUrl: body?.mediaUrl,
        mediaType: body?.mediaType,
        image: body?.image,
        emptyImageValue: undefined,
    });

    try {
        const savedPost = await createPostRecord({
            ...body,
            slug,
            userId,
            kind,
            category: body?.category || (kind === 'community' ? 'community' : 'uncategorized'),
            mediaAssets,
            illustrations,
            ...derivedMedia,
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
        ...(query.kind && { kind: query.kind }),
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
    if (body?.mediaUrl !== undefined) {
        updateFields.mediaUrl = body.mediaUrl;
    }
    if (body?.mediaType !== undefined) {
        updateFields.mediaType = body.mediaType;
    }
    if (body?.image !== undefined) {
        updateFields.image = body.image;
    }
    if (body?.slug !== undefined) {
        updateFields.slug = resolvePostSlug({
            requestedSlug: body.slug,
            fallbackTitle: body?.title !== undefined ? body.title : post.title,
        });
    } else if (body?.title !== undefined) {
        updateFields.slug = resolvePostSlug({ fallbackTitle: body.title });
    }

    if (body?.mediaAssets !== undefined) {
        const sanitizedAssets = sanitizeMediaAssets(body.mediaAssets);
        Object.assign(updateFields, {
            mediaAssets: sanitizedAssets,
            ...derivePostMediaFields({
                mediaAssets: sanitizedAssets,
                coverAssetIndex: normalizeCoverAssetIndex({
                    mediaAssets: sanitizedAssets,
                    requestedCoverAssetIndex: Number.isInteger(body?.coverAssetIndex)
                        ? body.coverAssetIndex
                        : post.coverAssetIndex,
                }),
                mediaUrl: updateFields.mediaUrl,
                mediaType: updateFields.mediaType,
                image: updateFields.image,
            }),
        });
    } else if (body?.coverAssetIndex !== undefined) {
        const existingAssets = Array.isArray(post.mediaAssets) ? post.mediaAssets : [];

        Object.assign(updateFields, derivePostMediaFields({
            mediaAssets: existingAssets,
            coverAssetIndex: normalizeCoverAssetIndex({
                mediaAssets: existingAssets,
                requestedCoverAssetIndex: Number(body.coverAssetIndex) || 0,
            }),
            mediaUrl: updateFields.mediaUrl,
            mediaType: updateFields.mediaType,
            image: updateFields.image,
        }));
    }

    if (body?.illustrations !== undefined) {
        updateFields.illustrations = sanitizeIllustrations(body.illustrations);
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
