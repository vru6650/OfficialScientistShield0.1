import { apiFetch } from '../utils/apiFetch';

export const getSearchResults = async (params = {}, options = {}) => {
    const searchParams = new URLSearchParams();

    if (params.searchTerm) {
        searchParams.set('searchTerm', params.searchTerm);
    }

    if (params.types) {
        if (Array.isArray(params.types)) {
            const filteredTypes = params.types.map((type) => type.trim()).filter(Boolean);
            if (filteredTypes.length) {
                searchParams.set('types', filteredTypes.join(','));
            }
        } else if (typeof params.types === 'string' && params.types.trim()) {
            searchParams.set('types', params.types.trim());
        }
    }

    if (params.limit) {
        searchParams.set('limit', String(params.limit));
    }

    if (params.sort) {
        searchParams.set('sort', params.sort);
    }

    const queryString = searchParams.toString();
    const url = queryString ? `/api/v1/search?${queryString}` : '/api/v1/search';

    const res = await apiFetch(url, { signal: options.signal });
    if (!res.ok) {
        const { message } = await res.json().catch(() => ({ message: 'Failed to fetch search results' }));
        throw new Error(message || 'Failed to fetch search results');
    }

    return res.json();
};
