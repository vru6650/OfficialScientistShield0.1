import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { togglePostClap } from '../services/postService';
import { idsMatch, normalizeId, normalizeIdList } from '../utils/id.js';

const toSafeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

const arraysShallowEqual = (left, right) => {
    if (left === right) {
        return true;
    }

    if (left.length !== right.length) {
        return false;
    }

    return left.every((value, index) => value === right[index]);
};

const updateLikeInPost = (
    post,
    { targetPostId, userId, optimisticIsLiked, optimisticLikeCount },
) => {
    if (!post || !idsMatch(post._id, targetPostId)) {
        return post;
    }

    const existing = normalizeIdList(post.clappedBy);
    const updatedClappedBy = optimisticIsLiked
        ? Array.from(new Set([...existing, userId]))
        : existing.filter((id) => id !== userId);
    const nextLikeCount = toSafeCount(optimisticLikeCount);

    if (
        toSafeCount(post.claps) === nextLikeCount
        && arraysShallowEqual(existing, updatedClappedBy)
    ) {
        return post;
    }

    return {
        ...post,
        claps: nextLikeCount,
        clappedBy: updatedClappedBy,
    };
};

const updateLikeInCollection = (collection, payload) => {
    if (!collection) {
        return collection;
    }

    if (Array.isArray(collection)) {
        let hasChanged = false;
        const updated = collection.map((item) => {
            const next = updateLikeInPost(item, payload);
            if (next !== item) {
                hasChanged = true;
            }
            return next;
        });

        return hasChanged ? updated : collection;
    }

    if (Array.isArray(collection.posts)) {
        const updatedPosts = updateLikeInCollection(collection.posts, payload);
        if (updatedPosts === collection.posts) {
            return collection;
        }

        return {
            ...collection,
            posts: updatedPosts,
        };
    }

    if (Array.isArray(collection.pages)) {
        let hasChanged = false;
        const updatedPages = collection.pages.map((page) => {
            const updatedPosts = updateLikeInCollection(page.posts, payload);
            if (updatedPosts !== page.posts) {
                hasChanged = true;
                return {
                    ...page,
                    posts: updatedPosts,
                };
            }

            return page;
        });

        return hasChanged
            ? {
                ...collection,
                pages: updatedPages,
            }
            : collection;
    }

    return updateLikeInPost(collection, payload);
};

export const useLike = ({ postId, initialClaps = 0, initialClappedBy = [] }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useSelector((state) => state.user);
    const currentUserId = normalizeId(currentUser?._id) || null;

    const normalizedClappedBy = useMemo(
        () => normalizeIdList(initialClappedBy),
        [initialClappedBy],
    );

    const [likeCount, setLikeCount] = useState(toSafeCount(initialClaps));
    const [isLiked, setIsLiked] = useState(
        currentUserId ? normalizedClappedBy.includes(currentUserId) : false,
    );

    useEffect(() => {
        setLikeCount(toSafeCount(initialClaps));
    }, [initialClaps]);

    useEffect(() => {
        if (!postId || !currentUserId) {
            setIsLiked(false);
            return;
        }
        setIsLiked(normalizedClappedBy.includes(currentUserId));
    }, [normalizedClappedBy, currentUserId, postId]);

    const {
        mutate,
        isPending,
    } = useMutation({
        mutationFn: togglePostClap,
        onMutate: async (targetPostId) => {
            if (!targetPostId || !currentUserId) {
                return undefined;
            }

            await queryClient.cancelQueries({ queryKey: ['posts'] });
            await queryClient.cancelQueries({ queryKey: ['post'] });

            const postsQueries = queryClient.getQueriesData({ queryKey: ['posts'] });
            const postQueries = queryClient.getQueriesData({ queryKey: ['post'] });

            const previousLikeCount = likeCount;
            const previousIsLiked = isLiked;
            const optimisticIsLiked = !previousIsLiked;
            const optimisticLikeCount = Math.max(
                0,
                previousLikeCount + (optimisticIsLiked ? 1 : -1),
            );
            const optimisticPayload = {
                targetPostId,
                userId: currentUserId,
                optimisticIsLiked,
                optimisticLikeCount,
            };

            setIsLiked(optimisticIsLiked);
            setLikeCount(optimisticLikeCount);

            postsQueries.forEach(([queryKey]) => {
                queryClient.setQueryData(queryKey, (oldData) =>
                    updateLikeInCollection(oldData, optimisticPayload),
                );
            });

            postQueries.forEach(([queryKey]) => {
                queryClient.setQueryData(queryKey, (oldData) =>
                    updateLikeInCollection(oldData, optimisticPayload),
                );
            });

            return {
                targetPostId,
                postsQueries,
                postQueries,
                previousLikeCount,
                previousIsLiked,
            };
        },
        onError: (error, _variables, context) => {
            context?.postsQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            context?.postQueries?.forEach(([queryKey, data]) => {
                queryClient.setQueryData(queryKey, data);
            });
            if (typeof context?.previousLikeCount === 'number') {
                setLikeCount(context.previousLikeCount);
            }
            setIsLiked(Boolean(context?.previousIsLiked));
            console.error(error);
        },
        onSuccess: (data) => {
            if (!data) {
                return;
            }
            setLikeCount(toSafeCount(data.claps));

            if (currentUserId) {
                setIsLiked(normalizeIdList(data.clappedBy).includes(currentUserId));
            } else {
                setIsLiked(false);
            }
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post'] });
        },
    });

    const handleLike = useCallback(() => {
        if (!postId) {
            console.warn('Cannot toggle claps without a post identifier.');
            return;
        }

        if (!currentUser) {
            navigate('/sign-in');
            return;
        }

        mutate(postId);
    }, [postId, currentUser, navigate, mutate]);

    return {
        likeCount,
        isLiked,
        isLoading: isPending,
        handleLike,
    };
};
