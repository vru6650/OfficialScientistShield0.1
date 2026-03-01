import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getPosts } from '../services/postService';

const PAGE_SIZE = 9;

const buildQueryString = (search, startIndex) => {
    const urlParams = new URLSearchParams(search);
    urlParams.set('startIndex', startIndex);
    if (!urlParams.get('limit')) {
        urlParams.set('limit', String(PAGE_SIZE));
    }
    return urlParams.toString();
};

export const usePostSearch = () => {
    const location = useLocation();

    const queryKey = useMemo(() => ['postSearch', location.search], [location.search]);

    const query = useInfiniteQuery({
        queryKey,
        queryFn: ({ pageParam = 0 }) => getPosts(buildQueryString(location.search, pageParam)),
        getNextPageParam: (lastPage, pages) =>
            lastPage?.posts?.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
    });

    const posts = query.data?.pages?.flatMap((page) => page.posts) ?? [];

    return {
        posts,
        loading: query.isLoading,
        showMore: query.hasNextPage,
        error: query.error?.message ?? null,
        fetchMorePosts: () => query.fetchNextPage(),
    };
};
