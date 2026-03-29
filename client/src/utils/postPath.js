const normalizeRouteSegment = (value) => {
    if (value === null || value === undefined) {
        return '';
    }

    const normalized = String(value).trim();
    return normalized || '';
};

export const resolvePostRouteId = (post) =>
    normalizeRouteSegment(post?.slug)
    || normalizeRouteSegment(post?._id)
    || normalizeRouteSegment(post?.id);

export const getPostPath = (post) => {
    const routeId = resolvePostRouteId(post);
    return routeId ? `/post/${routeId}` : '';
};

export const getAbsolutePostUrl = (post) => {
    const path = getPostPath(post);
    if (!path || typeof window === 'undefined') {
        return '';
    }

    return `${window.location.origin}${path}`;
};
