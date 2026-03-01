import { apiFetch } from '../utils/apiFetch';

/**
 * Handles the sign-in API request.
 * @param {object} formData - The user's email and password.
 * @returns {Promise<object>} - The response data from the server.
 * @throws {Error} - Throws an error if the network response is not ok.
 */
export const signInUser = async (formData) => {
    const res = await apiFetch('/api/v1/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
        // Throw an error with the message from the server API
        throw new Error(data.message || 'Something went wrong');
    }

    return data;
};

// You can add other auth-related API calls here in the future,
// like signUpUser, signOutUser, etc.

/**
 * Handles the sign-up API request.
 * @param {object} formData - The user's username, email, and password.
 * @returns {Promise<object>} - The response data from the server.
 * @throws {Error} - Throws an error if the network response is not ok.
 */
export const signUpUser = async (formData) => {
    const res = await apiFetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
    });

    const data = await res.json();

    if (!res.ok) {
        throw new Error(data.message || 'Failed to sign up.');
    }

    return data;
};



export const getPost = async (postId) => {
    const res = await apiFetch(`/api/v1/post/getposts?postId=${postId}`);
    if (!res.ok) throw new Error('Failed to fetch post data.');
    const data = await res.json();
    return data.posts[0];
};

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
