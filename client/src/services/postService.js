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
    // UPDATED: Get the userId from the queryKey passed by React Query.
    const userId = queryKey[1];
    const res = await apiFetch(`/api/v1/post/getposts?userId=${userId}&startIndex=${pageParam}`);
    if (!res.ok) throw new Error('Failed to fetch admin posts');
    return res.json();
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
