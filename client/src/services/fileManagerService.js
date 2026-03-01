import { apiFetch } from '../utils/apiFetch';

const handleResponse = async (res) => {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
        const message = data?.message || 'Unexpected server response';
        throw new Error(message);
    }
    return data;
};

export const getDirectory = async (parentId = null) => {
    const params = new URLSearchParams();
    if (parentId) {
        params.append('parentId', parentId);
    }
    const query = params.toString();
    const res = await apiFetch(`/api/v1/files${query ? `?${query}` : ''}`);
    return handleResponse(res);
};

export const getFolderTree = async () => {
    const res = await apiFetch('/api/v1/files/tree');
    return handleResponse(res);
};

export const createFolder = async ({ name, parentId = null }) => {
    const res = await apiFetch('/api/v1/files/folder', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, parentId }),
    });
    return handleResponse(res);
};

export const uploadFile = async ({ file, parentId = null }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (parentId) {
        formData.append('parentId', parentId);
    }
    const res = await apiFetch('/api/v1/files/upload', {
        method: 'POST',
        body: formData,
    });
    return handleResponse(res);
};

export const updateFileNode = async ({ id, payload }) => {
    const res = await apiFetch(`/api/v1/files/${id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });
    return handleResponse(res);
};

export const deleteFileNode = async (id) => {
    const res = await apiFetch(`/api/v1/files/${id}`, {
        method: 'DELETE',
    });
    return handleResponse(res);
};
