import { useCallback, useEffect, useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { togglePostClap } from '../services/postService';

const normalizeIds = (values) => {
    if (!Array.isArray(values)) {
        return [];
    }
    return values.map((value) => value?.toString()).filter(Boolean);
};

const toSafeCount = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
};

export const useLike = ({ postId, initialClaps = 0, initialClappedBy = [] }) => {
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const { currentUser } = useSelector((state) => state.user);
    const currentUserId = currentUser?._id ?? null;

    const normalizedClappedBy = useMemo(
        () => normalizeIds(initialClappedBy),
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

            await queryClient.cancelQueries({ queryKey: ['post', targetPostId] });
            const previousPost = queryClient.getQueryData(['post', targetPostId]);

            const previousLikeCount = likeCount;
            const previousIsLiked = isLiked;
            const optimisticIsLiked = !previousIsLiked;

            const optimisticLikeCount = Math.max(
                0,
                previousLikeCount + (optimisticIsLiked ? 1 : -1),
            );

            setIsLiked(optimisticIsLiked);
            setLikeCount(optimisticLikeCount);

            queryClient.setQueryData(['post', targetPostId], (oldData) => {
                if (!oldData) {
                    return oldData;
                }

                const existing = normalizeIds(oldData.clappedBy);

                const updatedClappedBy = optimisticIsLiked
                    ? Array.from(new Set([...existing, currentUserId]))
                    : existing.filter((id) => id !== currentUserId);

                return {
                    ...oldData,
                    claps: optimisticLikeCount,
                    clappedBy: updatedClappedBy,
                };
            });

            return {
                targetPostId,
                previousPost,
                previousLikeCount,
                previousIsLiked,
            };
        },
        onError: (error, _variables, context) => {
            if (context?.targetPostId) {
                queryClient.setQueryData(['post', context.targetPostId], context.previousPost);
            }
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
                setIsLiked(normalizeIds(data.clappedBy).includes(currentUserId));
            } else {
                setIsLiked(false);
            }
        },
        onSettled: (_data, _error, targetPostId) => {
            if (!targetPostId) {
                return;
            }
            queryClient.invalidateQueries({ queryKey: ['posts'] });
            queryClient.invalidateQueries({ queryKey: ['post', targetPostId] });
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
