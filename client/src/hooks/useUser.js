import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const fetchUser = async (userId) => {
    const res = await apiFetch(`/api/v1/user/${userId}`);
    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to fetch user');
    }
    return data;
};

export default function useUser(userId) {
    const query = useQuery({
        queryKey: ['user', userId],
        queryFn: () => fetchUser(userId),
        enabled: Boolean(userId),
        staleTime: 1000 * 60 * 5,
    });

    return {
        user: query.data ?? null,
        isLoading: query.isLoading,
        error: query.error?.message ?? null,
    };
}
