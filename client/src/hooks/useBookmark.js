import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { apiFetch } from '../utils/apiFetch';

// API function to bookmark/unbookmark a post
const bookmarkPost = async (postId, token) => {
    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const res = await apiFetch(`/api/v1/post/${postId}/bookmark`, {
        method: 'PUT',
        headers,
    });
    if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to bookmark post.');
    }
    return res.json();
};

export const useBookmark = (initialIsBookmarked, postId) => {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();
    const [isBookmarked, setIsBookmarked] = useState(!!initialIsBookmarked);

    useEffect(() => {
        setIsBookmarked(!!initialIsBookmarked);
    }, [initialIsBookmarked]);

    const updateBookmarkInPost = (post, shouldAdd, userId) => {
        if (!post || post._id !== postId) return post;
        const bookmarkedBy = Array.isArray(post.bookmarkedBy) ? post.bookmarkedBy : [];
        const alreadyBookmarked = bookmarkedBy.includes(userId);

        if (shouldAdd) {
            if (alreadyBookmarked) return post;
            return { ...post, bookmarkedBy: [...bookmarkedBy, userId] };
        }

        if (!alreadyBookmarked) return post;
        return { ...post, bookmarkedBy: bookmarkedBy.filter(id => id !== userId) };
    };

    const updateBookmarkInCollection = (collection, shouldAdd, userId) => {
        if (!collection) return collection;

        if (Array.isArray(collection)) {
            let hasChanged = false;
            const updated = collection.map((item) => {
                const next = updateBookmarkInPost(item, shouldAdd, userId);
                if (next !== item) hasChanged = true;
                return next;
            });
            return hasChanged ? updated : collection;
        }

        if (Array.isArray(collection.posts)) {
            const updatedPosts = updateBookmarkInCollection(collection.posts, shouldAdd, userId);
            if (updatedPosts === collection.posts) return collection;
            return { ...collection, posts: updatedPosts };
        }

        if (Array.isArray(collection.pages)) {
            let hasChanged = false;
            const updatedPages = collection.pages.map((page) => {
                const updatedPosts = updateBookmarkInCollection(page.posts, shouldAdd, userId);
                if (updatedPosts !== page.posts) {
                    hasChanged = true;
                    return { ...page, posts: updatedPosts };
                }
                return page;
            });
            return hasChanged ? { ...collection, pages: updatedPages } : collection;
        }

        return updateBookmarkInPost(collection, shouldAdd, userId);
    };

    const { mutate, isPending } = useMutation({
        mutationFn: () => {
            if (!currentUser?._id) {
                return Promise.reject(new Error('You must be logged in to bookmark posts.'));
            }
            return bookmarkPost(postId, currentUser?.token);
        },
        onMutate: async () => {
            const userId = currentUser?._id;
            if (!userId) {
                return { postsQueries: [], postQueries: [] };
            }

            const shouldAdd = !isBookmarked;

            await queryClient.cancelQueries({ queryKey: ['posts'] });
            await queryClient.cancelQueries({ queryKey: ['post'] });

            const postsQueries = queryClient.getQueriesData({ queryKey: ['posts'] });
            const postQueries = queryClient.getQueriesData({ queryKey: ['post'] });

            setIsBookmarked(prev => !prev);

            postsQueries.forEach(([queryKey]) => {
                queryClient.setQueryData(queryKey, (oldData) => updateBookmarkInCollection(oldData, shouldAdd, userId));
            });

            postQueries.forEach(([queryKey]) => {
                queryClient.setQueryData(queryKey, (oldData) => updateBookmarkInCollection(oldData, shouldAdd, userId));
            });

            return { postsQueries, postQueries };
        },
        onError: (err, _variables, context) => {
            setIsBookmarked(prev => !prev);
            context?.postsQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.postQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            console.error('Bookmark failed:', err);
        },
        onSuccess: (data) => {
            if (typeof data?.isBookmarked === 'boolean') {
                setIsBookmarked(data.isBookmarked);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post'] });
        },
    });

    return { isBookmarked, isLoading: isPending, handleBookmark: mutate };
};
