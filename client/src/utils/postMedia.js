const allowedPostMediaTypes = new Set(['image', 'video', 'audio', 'document']);
const MAX_POST_ILLUSTRATIONS = 12;

export const normalizeEditablePostMediaAssets = (mediaAssets) => {
    if (!Array.isArray(mediaAssets)) {
        return [];
    }

    return mediaAssets
        .map((asset, index) => {
            const url = asset?.url?.toString?.().trim?.();
            if (!url) {
                return null;
            }

            const type = allowedPostMediaTypes.has(asset?.type) ? asset.type : 'image';
            const caption = asset?.caption?.toString?.().trim?.() || '';
            const order = Number.isFinite(Number(asset?.order)) ? Number(asset.order) : index;

            return {
                url,
                type,
                caption,
                order,
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, 8)
        .map((asset, index) => ({
            ...asset,
            order: index,
        }));
};

export const normalizePostCoverAssetIndex = ({ mediaAssets, requestedIndex }) => {
    const maxIndex = Math.max((mediaAssets?.length || 0) - 1, 0);
    const safeRequestedIndex = Number.isInteger(requestedIndex) ? requestedIndex : 0;
    return Math.min(Math.max(safeRequestedIndex, 0), maxIndex);
};

export const getSortedPostMediaAssets = (post) => {
    if (!Array.isArray(post?.mediaAssets)) {
        return [];
    }

    return [...post.mediaAssets].sort((a, b) => (a.order || 0) - (b.order || 0));
};

export const getPrimaryPostAsset = (post) => {
    const sortedAssets = getSortedPostMediaAssets(post);
    const maxIndex = Math.max(sortedAssets.length - 1, 0);
    const requestedIndex = Number.isInteger(post?.coverAssetIndex) ? post.coverAssetIndex : 0;
    const safeIndex = Math.min(Math.max(requestedIndex, 0), maxIndex);
    const galleryAsset = sortedAssets[safeIndex] || sortedAssets[0] || null;

    if (post?.mediaUrl) {
        return {
            url: post.mediaUrl,
            type: post.mediaType || galleryAsset?.type || 'image',
            caption: galleryAsset?.caption || '',
            order: safeIndex,
        };
    }

    if (galleryAsset) {
        return galleryAsset;
    }

    if (post?.image) {
        return {
            url: post.image,
            type: 'image',
            caption: '',
            order: 0,
        };
    }

    return null;
};

export const getPostPreviewImage = (post) => {
    const primaryAsset = getPrimaryPostAsset(post);

    if (primaryAsset?.type === 'image') {
        return primaryAsset.url;
    }

    return post?.image || null;
};

export const buildPostMediaFormState = ({
    mediaAssets = [],
    coverAssetIndex = 0,
    fallbackImage = null,
}) => {
    const normalizedAssets = normalizeEditablePostMediaAssets(mediaAssets);
    const safeCoverAssetIndex = normalizePostCoverAssetIndex({
        mediaAssets: normalizedAssets,
        requestedIndex: coverAssetIndex,
    });

    const primaryAsset = normalizedAssets[safeCoverAssetIndex] || normalizedAssets[0] || null;
    const imageAsset =
        primaryAsset?.type === 'image'
            ? primaryAsset
            : normalizedAssets.find((asset) => asset.type === 'image') || null;

    return {
        mediaAssets: normalizedAssets,
        coverAssetIndex: safeCoverAssetIndex,
        mediaUrl: primaryAsset?.url ?? null,
        mediaType: primaryAsset?.type ?? null,
        image:
            normalizedAssets.length > 0
                ? imageAsset?.url ?? fallbackImage ?? null
                : null,
    };
};

export const coercePostMediaState = (post = {}) => {
    const sourceAssets =
        Array.isArray(post?.mediaAssets) && post.mediaAssets.length > 0
            ? post.mediaAssets
            : post?.mediaUrl
                ? [
                    {
                        url: post.mediaUrl,
                        type: post.mediaType || 'image',
                        caption: '',
                        order: 0,
                    },
                ]
                : [];

    return buildPostMediaFormState({
        mediaAssets: sourceAssets,
        coverAssetIndex: post?.coverAssetIndex,
        fallbackImage: post?.image || null,
    });
};

export const inferPostMediaTypeFromMime = (mimeType = '') => {
    if (mimeType.startsWith('image/')) {
        return 'image';
    }

    if (mimeType.startsWith('video/')) {
        return 'video';
    }

    if (mimeType.startsWith('audio/')) {
        return 'audio';
    }

    return 'document';
};

export const normalizePostIllustrations = (illustrations) => {
    if (!Array.isArray(illustrations)) {
        return [];
    }

    return illustrations
        .map((illustration, index) => {
            const url = illustration?.url?.toString?.().trim?.();
            if (!url) {
                return null;
            }

            const alt = illustration?.alt?.toString?.().trim?.() || '';
            const caption = illustration?.caption?.toString?.().trim?.() || '';
            const credit = illustration?.credit?.toString?.().trim?.() || '';
            const order = Number.isFinite(Number(illustration?.order))
                ? Number(illustration.order)
                : index;

            return {
                url,
                alt,
                caption,
                credit,
                order,
            };
        })
        .filter(Boolean)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
        .slice(0, MAX_POST_ILLUSTRATIONS)
        .map((illustration, index) => ({
            ...illustration,
            order: index,
        }));
};

export const buildPostIllustrationFormState = ({ illustrations = [] }) => ({
    illustrations: normalizePostIllustrations(illustrations),
});

export const coercePostIllustrationState = (post = {}) =>
    buildPostIllustrationFormState({
        illustrations: post?.illustrations,
    });

export const getSortedPostIllustrations = (post) =>
    normalizePostIllustrations(post?.illustrations);

export const getPostIllustrationGalleryItems = (post) =>
    getSortedPostIllustrations(post).map((illustration) => ({
        ...illustration,
        type: 'image',
    }));
