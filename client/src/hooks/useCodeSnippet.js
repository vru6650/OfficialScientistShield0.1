// client/src/hooks/useCodeSnippet.js
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const fetchSnippet = async (snippetId) => {
    const res = await apiFetch(`/api/v1/code-snippet/${snippetId}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch code snippet');
    }
    return data;
};

export default function useCodeSnippet(snippetId) {
    const query = useQuery({
        queryKey: ['codeSnippet', snippetId],
        queryFn: () => fetchSnippet(snippetId),
        enabled: Boolean(snippetId),
        staleTime: 1000 * 60 * 10,
    });

    return {
        snippet: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error?.message ?? null,
    };
}
