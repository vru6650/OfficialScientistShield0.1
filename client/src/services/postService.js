// client/src/services/postService.js
import { apiFetch } from '../utils/apiFetch';
/**
 * A service file for post-related API calls.
 */

// This function remains correct for general-purpose fetching.
export const getPosts = async (searchQuery) => {
    const res = await apiFetch(`/api/v1/post/getposts?${searchQuery}`);
    if (!res.ok) {
        throw new Error('Failed to fetch posts');
    }
    const data = await res.json();
    return data;
};

/**
 * Fetches posts for a specific admin user for use with useInfiniteQuery.
 * @param {object} params - The object provided by React Query.
 * @param {Array} params.queryKey - The query key, where queryKey[1] is the userId.
 * @param {number} params.pageParam - The starting index for the next page.
 * @returns {Promise<object>} The data containing the posts array.
 */
export const getAdminPosts = async ({ queryKey, pageParam = 0 }) => {
    const [, userId, filters = {}] = queryKey;
    if (!userId) throw new Error('User id is required to fetch admin posts.');

    const params = new URLSearchParams();
    params.set('userId', userId);
    params.set('startIndex', pageParam);
    params.set('limit', filters.pageSize ?? 15);
    if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
    if (filters.category && filters.category !== 'all') params.set('category', filters.category);
    if (filters.kind && filters.kind !== 'all') params.set('kind', filters.kind);
    if (filters.sort) params.set('sort', filters.sort);
    if (filters.order) params.set('order', filters.order);

    const res = await apiFetch(`/api/v1/post/getposts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch admin posts');
    return res.json();
};

export const createPost = async (payload) => {
    const res = await apiFetch('/api/v1/post/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Failed to create post.');
    }

    return data;
};

/**
 * Deletes a post.
 * @param {object} params - An object containing the identifiers.
 * @param {string} params.postId - The ID of the post to delete.
 * @param {string} params.userId - The ID of the user who owns the post.
 * @returns {Promise<object>} The server's confirmation message.
 */
export const deletePost = async ({ postId, userId }) => {
    // UPDATED: The function now accepts an object and sends both IDs to the backend.
    const res = await apiFetch(`/api/v1/post/deletepost/${postId}/${userId}`, {
        method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete post');
    return res.json();
};

// This function is correct.
export const getPost = async (postId) => {
    const res = await apiFetch(`/api/v1/post/getposts?postId=${postId}`);
    if (!res.ok) throw new Error('Failed to fetch post data.');
    const data = await res.json();
    // The getposts route returns an array, so we take the first element.
    return data.posts[0];
};

// This function is correct.
export const updatePost = async ({ postId, userId, formData }) => {
    const res = await apiFetch(`/api/v1/post/updatepost/${postId}/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });
    if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to update post.');
    }
    return res.json();
};

// This function is correct.
export const getRecentPosts = async () => {
    const res = await apiFetch('/api/v1/post/getposts?limit=9');
    if (!res.ok) {
        throw new Error('Failed to fetch recent posts');
    }
    const data = await res.json();
    return data.posts;
};

export const togglePostClap = async (postId) => {
    if (!postId) {
        throw new Error('Post identifier is required to update claps.');
    }

    const response = await apiFetch(`/api/v1/post/clap/${postId}`, {
        method: 'PUT',
    });

    const payload = await response
        .json()
        .catch(() => ({ message: 'Failed to parse server response.' }));

    if (!response.ok) {
        throw new Error(payload?.message || 'Failed to update clap status.');
    }

    return payload;
};
