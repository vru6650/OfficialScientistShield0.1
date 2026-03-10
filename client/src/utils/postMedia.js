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
