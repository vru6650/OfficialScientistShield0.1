import { apiFetch } from '../utils/apiFetch';

export const createCommunityPost = async (payload) => {
    const res = await apiFetch('/api/v1/post/community', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        throw new Error(data.message || 'Unable to publish your community post.');
    }

    return data;
};

export const getCommunityPosts = async (queryString = '') => {
    const res = await apiFetch(`/api/v1/post/community${queryString ? `?${queryString}` : ''}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to load community posts.');
    }
    return data;
};
