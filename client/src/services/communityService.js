import { apiFetch } from '../utils/apiFetch';

export const submitCommunityForm = async (payload) => {
    const res = await apiFetch('/api/v1/community-submissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Unable to submit the form right now.');
    }

    return data;
};

export const listCommunitySubmissions = async ({ startIndex = 0, limit = 10, status = 'all', email } = {}) => {
    const params = new URLSearchParams();
    params.set('startIndex', startIndex);
    params.set('limit', limit);
    if (status) params.set('status', status);
    if (email) params.set('email', email);

    const res = await apiFetch(`/api/v1/community-submissions?${params.toString()}`);
    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Failed to load submissions.');
    }

    return data;
};

export const updateCommunitySubmissionStatus = async ({ submissionId, status }) => {
    const res = await apiFetch(`/api/v1/community-submissions/${submissionId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.message || 'Unable to update status.');
    }

    return data;
};
