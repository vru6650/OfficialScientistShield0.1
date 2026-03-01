import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

// --- API Fetch Function ---
const fetchPostBySlug = async (slug) => {
    const res = await apiFetch(`/api/v1/post/getposts?slug=${slug}`);

    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch the post.');
    }

    const data = await res.json();
    if (data.posts.length === 0) {
        throw new Error('Post not found.');
    }

    return data.posts[0];
};

// --- Custom Hook ---
export function usePost(postSlug) {
    return useQuery({
        queryKey: ['post', postSlug], // A unique key for this query
        queryFn: () => fetchPostBySlug(postSlug), // The function that fetches the data
        staleTime: 1000 * 60 * 5, // Data is considered fresh for 5 minutes
    });
}
