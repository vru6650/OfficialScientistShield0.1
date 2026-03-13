import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { Alert, Badge, Button, Tooltip } from 'flowbite-react';
import {
    HiArrowPath,
    HiOutlineAdjustmentsHorizontal,
    HiOutlineFire,
    HiOutlineListBullet,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiMagnifyingGlass,
} from 'react-icons/hi2';
import PostCard from '../components/PostCard';
import PostCardSkeleton from '../components/skeletons/PostCardSkeleton';
import { ARTICLE_POST_CATEGORY_OPTIONS } from '../constants/postCategories.js';
import useDebounce from '../hooks/useDebounce';
import { getPosts } from '../services/postService';
import { formatRelativeTimeFromNow } from '../utils/date';
import { getPostPreviewImage, getPrimaryPostAsset } from '../utils/postMedia.js';

const categoryChips = [
    { value: 'all', label: 'All' },
    { value: 'community', label: 'Community' },
    { value: 'show-and-tell', label: 'Show & Tell' },
    { value: 'help', label: 'Help' },
    { value: 'tips', label: 'Tips' },
    ...ARTICLE_POST_CATEGORY_OPTIONS.filter((option) => option.value !== 'uncategorized'),
    { value: 'html', label: 'HTML' },
    { value: 'css', label: 'CSS' },
    { value: 'node.js', label: 'Node.js' },
];

const sortOptions = [
    { id: 'latest', label: 'Latest', sort: 'updatedAt', order: 'desc', description: 'Newest first' },
    { id: 'trending', label: 'Trending', sort: 'claps', order: 'desc', description: 'Most applause' },
    { id: 'oldest', label: 'Archive', sort: 'updatedAt', order: 'asc', description: 'Oldest first' },
];

const kindChips = [
    { value: 'all', label: 'Everything' },
    { value: 'community', label: 'Community only' },
];

const communityCategories = new Set(['community', 'show-and-tell', 'help', 'tips']);

const resolveSortKey = (sort, order) =>
    sortOptions.find((option) => option.sort === sort && option.order === order)?.id || 'latest';

const parseFiltersFromSearch = (search) => {
    const params = new URLSearchParams(search);
    const categoryParam = params.get('category');
    const hasCategory = categoryChips.some((chip) => chip.value === categoryParam);

    return {
        searchTerm: params.get('searchTerm') || '',
        category: hasCategory ? categoryParam : 'all',
        sortKey: resolveSortKey(params.get('sort'), params.get('order')),
        kindFilter: params.get('kind') === 'community' ? 'community' : 'all',
    };
};

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ');

const buildPreview = (content = '', title = '') => {
    const base = stripHtml(content).trim() || title || '';
    if (!base) return 'No summary available yet.';
    if (base.length <= 180) return base;
    return `${base.slice(0, 180).replace(/[.,;:\s]+$/, '')}…`;
};

const computeReadMinutes = (content = '') => {
    const words = stripHtml(content).trim().split(/\s+/).filter(Boolean);
    if (!words.length) return 0;
    return Math.max(1, Math.ceil(words.length / 200));
};

export default function PostListPage() {
    const location = useLocation();
    const { currentUser } = useSelector((state) => state.user);
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('all');
    const [sortKey, setSortKey] = useState('latest');
    const [kindFilter, setKindFilter] = useState('all');
    const [layout, setLayout] = useState('grid');

    useEffect(() => {
        const parsed = parseFiltersFromSearch(location.search);
        setSearchTerm(parsed.searchTerm);
        setCategory(parsed.category);
        setSortKey(parsed.sortKey);
        setKindFilter(parsed.kindFilter);
    }, [location.search]);

    const debouncedSearch = useDebounce(searchTerm, 420);
    const selectedSort = useMemo(
        () => sortOptions.find((option) => option.id === sortKey) || sortOptions[0],
        [sortKey]
    );
    const visibleCategoryChips = useMemo(
        () =>
            kindFilter === 'community'
                ? categoryChips.filter(
                    (chip) => chip.value === 'all' || communityCategories.has(chip.value)
                )
                : categoryChips,
        [kindFilter]
    );

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        params.set('limit', layout === 'list' ? '9' : '12');
        params.set('sort', selectedSort.sort);
        params.set('order', selectedSort.order);
        if (category !== 'all') {
            params.set('category', category);
        }
        if (debouncedSearch.trim()) {
            params.set('searchTerm', debouncedSearch.trim());
        }
        if (kindFilter === 'community' || communityCategories.has(category)) {
            params.set('kind', 'community');
        }
        return params.toString();
    }, [category, debouncedSearch, kindFilter, layout, selectedSort.order, selectedSort.sort]);

    const {
        data,
        isLoading,
        isFetching,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['posts', queryString],
        queryFn: () => getPosts(queryString),
        placeholderData: (previousData) => previousData,
    });

    const posts = data?.posts ?? [];
    const totalPosts = data?.totalPosts ?? 0;
    const freshPosts = data?.lastMonthPosts ?? 0;
    const featured = posts[0];
    const remaining = posts.slice(1);
    const nothingFound = !isLoading && posts.length === 0;

    const resetFilters = () => {
        setCategory('all');
        setSearchTerm('');
        setSortKey('latest');
        setKindFilter('all');
    };

    const featuredReadingTime = featured ? computeReadMinutes(featured.content) : 0;
    const featuredStamp = featured?.createdAt ? formatRelativeTimeFromNow(featured.createdAt) : 'Just now';
    const featuredPreviewImage = useMemo(() => getPostPreviewImage(featured), [featured]);
    const featuredPrimaryAsset = useMemo(() => getPrimaryPostAsset(featured), [featured]);

    return (
        <div className='relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.12),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_28%)]' aria-hidden />

            <div className='relative mx-auto max-w-6xl px-4 py-10 lg:px-6'>
                <section className='relative overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-6 py-8 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.9)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85'>
                    <div className='absolute -left-24 top-10 h-48 w-48 rounded-full bg-gradient-to-br from-sky-400/30 via-cyan-300/25 to-emerald-300/25 blur-3xl' aria-hidden />
                    <div className='absolute -right-16 -bottom-10 h-64 w-64 rounded-full bg-gradient-to-br from-indigo-500/25 via-fuchsia-400/25 to-amber-300/25 blur-3xl' aria-hidden />
                    <div className='relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between'>
                        <div className='max-w-3xl space-y-3'>
                            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300'>Post library</p>
                            <h1 className='text-balance text-3xl font-semibold leading-tight text-slate-900 dark:text-white sm:text-4xl'>
                                Explore stories, engineering notes, and product updates
                            </h1>
                            <p className='text-sm text-slate-600 dark:text-slate-300 sm:text-base'>
                                Search, filter, and surface the best pieces without endless scrolling. Freshly tuned cards, featured stories, and richer previews make the post experience feel intentional.
                            </p>
                            <div className='flex flex-wrap items-center gap-3'>
                                <Badge color='info' className='bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/50 dark:text-sky-100'>
                                    {totalPosts.toLocaleString()} posts live
                                </Badge>
                                <Badge color='success' className='bg-emerald-100 text-emerald-800 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-100'>
                                    {freshPosts.toLocaleString()} shipped in the last 30 days
                                </Badge>
                                {isFetching && (
                                    <Badge color='gray' className='bg-white/70 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800/60 dark:text-slate-200'>
                                        Syncing latest…
                                    </Badge>
                                )}
                            </div>
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                            {currentUser?.isAdmin ? (
                                <Link to='/create-post'>
                                    <Button className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'>
                                        Start a new post
                                    </Button>
                                </Link>
                            ) : null}
                            {currentUser ? (
                                <Link to='/community/create'>
                                    <Button color='light' className='border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'>
                                        Share with community
                                    </Button>
                                </Link>
                            ) : null}
                            <Button color='light' onClick={() => refetch()} className='border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'>
                                <div className='flex items-center gap-2'>
                                    <HiArrowPath className='h-5 w-5' />
                                    Refresh
                                </div>
                            </Button>
                        </div>
                    </div>
                </section>

                <section className='mt-6 space-y-4'>
                    <div className='rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 sm:p-5'>
                        <div className='flex flex-col gap-4'>
                            <div className='flex flex-col gap-3 md:flex-row md:items-center md:justify-between'>
                                <div className='relative w-full md:max-w-xl'>
                                    <HiMagnifyingGlass className='absolute left-3 top-3.5 h-5 w-5 text-slate-400' />
                                    <input
                                        type='search'
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder='Search posts by title or body'
                                        className='w-full rounded-2xl border border-slate-200 bg-white px-10 py-3 text-sm font-medium text-slate-700 shadow-inner placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus:border-sky-500'
                                    />
                                    <p className='mt-1 text-xs text-slate-500 dark:text-slate-400'>Press Enter to commit your query or keep typing to live-filter.</p>
                                </div>
                                <div className='flex items-center gap-2 self-start rounded-full border border-slate-200/80 bg-slate-50/80 px-2 py-1 text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'>
                                    <Tooltip content='Grid view'>
                                        <button
                                            type='button'
                                            onClick={() => setLayout('grid')}
                                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition hover:text-sky-600 dark:hover:text-sky-300 ${layout === 'grid' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200 dark:bg-slate-800 dark:text-sky-200 dark:ring-sky-500/70' : ''}`}
                                        >
                                            <HiOutlineSquares2X2 className='h-5 w-5' />
                                            Grid
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='List view'>
                                        <button
                                            type='button'
                                            onClick={() => setLayout('list')}
                                            className={`flex items-center gap-1 rounded-full px-3 py-1 text-sm font-semibold transition hover:text-sky-600 dark:hover:text-sky-300 ${layout === 'list' ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200 dark:bg-slate-800 dark:text-sky-200 dark:ring-sky-500/70' : ''}`}
                                        >
                                            <HiOutlineListBullet className='h-5 w-5' />
                                            List
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>

                            <div className='flex flex-wrap items-center gap-2'>
                                {kindChips.map((chip) => {
                                    const isActive = chip.value === kindFilter;
                                    return (
                                        <button
                                            key={chip.value}
                                            type='button'
                                            onClick={() => {
                                                setKindFilter(chip.value);
                                                if (
                                                    chip.value === 'community' &&
                                                    category !== 'all' &&
                                                    !communityCategories.has(category)
                                                ) {
                                                    setCategory('all');
                                                }
                                            }}
                                            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-indigo-300 bg-gradient-to-r from-indigo-500 via-sky-500 to-cyan-400 text-white shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500'
                                            }`}
                                        >
                                            {chip.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className='flex flex-wrap items-center gap-2'>
                                {visibleCategoryChips.map((chip) => {
                                    const isActive = chip.value === category;
                                    return (
                                        <button
                                            key={chip.value}
                                            type='button'
                                            onClick={() => setCategory(chip.value)}
                                            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-sm'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500'
                                            }`}
                                        >
                                            {chip.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className='flex flex-wrap items-center gap-2'>
                                <div className='inline-flex flex-wrap items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-sm font-semibold text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
                                    {sortOptions.map((option) => {
                                        const isActive = option.id === sortKey;
                                        return (
                                            <button
                                                key={option.id}
                                                type='button'
                                                onClick={() => setSortKey(option.id)}
                                                className={`flex items-center gap-2 rounded-full px-3 py-1 transition ${
                                                    isActive
                                                        ? 'bg-white text-sky-700 shadow-sm ring-1 ring-sky-200 dark:bg-slate-800 dark:text-sky-200 dark:ring-sky-500/70'
                                                        : 'hover:text-sky-700 dark:hover:text-sky-300'
                                                }`}
                                            >
                                                {option.id === 'trending' ? <HiOutlineFire className='h-4 w-4 text-amber-500' /> : <HiOutlineAdjustmentsHorizontal className='h-4 w-4 text-slate-400' />}
                                                {option.label}
                                            </button>
                                        );
                                    })}
                                </div>

                                {(category !== 'all' || debouncedSearch || sortKey !== 'latest' || kindFilter !== 'all') && (
                                    <Button
                                        size='xs'
                                        color='light'
                                        onClick={resetFilters}
                                        className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                    >
                                        Clear filters
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>

                    {isError && (
                        <Alert color='failure'>
                            {error?.message || 'Unable to load posts right now.'}
                        </Alert>
                    )}

                    {nothingFound && (
                        <div className='rounded-2xl border border-dashed border-slate-300 bg-white/80 p-8 text-center text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300'>
                            <HiOutlineSparkles className='mx-auto mb-3 h-10 w-10 text-sky-500' />
                            <p className='text-lg font-semibold text-slate-800 dark:text-slate-100'>No posts match these filters</p>
                            <p className='mt-1 text-sm text-slate-500 dark:text-slate-400'>Try a different keyword, switch categories, or clear filters.</p>
                            <div className='mt-4 flex justify-center gap-2'>
                                <Button color='light' onClick={resetFilters} className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'>
                                    Reset filters
                                </Button>
                                <Button color='light' onClick={() => refetch()} className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'>
                                    Reload
                                </Button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className='grid gap-5 sm:grid-cols-2 xl:grid-cols-3'>
                            {Array.from({ length: 6 }).map((_, index) => (
                                <PostCardSkeleton key={index} />
                            ))}
                        </div>
                    ) : (
                        <div className='space-y-5'>
                            {featured && (
                                <div className='overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/70 ring-1 ring-slate-200/60 transition hover:-translate-y-1 hover:shadow-2xl dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                                    <div className='grid gap-0 lg:grid-cols-[1.1fr,0.9fr]'>
                                        <div className='relative h-full'>
                                            <div className='absolute inset-0 bg-gradient-to-br from-slate-900/80 via-slate-900/40 to-slate-900/70' aria-hidden />
                                            {featuredPreviewImage ? (
                                                <img
                                                    src={featuredPreviewImage}
                                                    alt={featured.title}
                                                    className='h-full w-full object-cover'
                                                    loading='lazy'
                                                />
                                            ) : (
                                                <div className='flex h-full min-h-[320px] items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 px-6 text-center text-sm font-semibold uppercase tracking-[0.24em] text-slate-200'>
                                                    {featuredPrimaryAsset?.type === 'video'
                                                        ? 'Video feature'
                                                        : featuredPrimaryAsset?.type === 'audio'
                                                            ? 'Audio feature'
                                                            : featuredPrimaryAsset?.type === 'document'
                                                                ? 'Document feature'
                                                                : 'Featured post'}
                                                </div>
                                            )}
                                            <div className='absolute inset-0 flex items-end p-6 sm:p-8'>
                                                <div className='space-y-3 text-white'>
                                                    <div className='flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-200'>
                                                        <span className='rounded-full bg-white/15 px-3 py-1 backdrop-blur'>{featured.category || 'Uncategorized'}</span>
                                                        <span className='rounded-full bg-white/15 px-3 py-1 backdrop-blur'>{featuredStamp}</span>
                                                        {featuredReadingTime > 0 && (
                                                            <span className='rounded-full bg-white/15 px-3 py-1 backdrop-blur'>{featuredReadingTime} min read</span>
                                                        )}
                                                    </div>
                                                    <h2 className='text-2xl font-semibold leading-tight sm:text-3xl'>{featured.title}</h2>
                                                    <p className='max-w-2xl text-sm text-slate-100/90 sm:text-base'>{buildPreview(featured.content, featured.title)}</p>
                                                    <div className='flex flex-wrap items-center gap-3'>
                                                        <Link to={`/post/${featured.slug}`}>
                                                            <Button className='bg-white text-slate-900 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:ring-2 focus:ring-sky-300'>
                                                                Read featured
                                                            </Button>
                                                        </Link>
                                                        <Button color='light' onClick={() => refetch()} className='border border-white/40 bg-white/10 text-white hover:bg-white/20 focus:ring-2 focus:ring-white/40'>
                                                            Refresh picks
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className='p-4 sm:p-5 lg:p-6'>
                                            <div className='flex items-center justify-between text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                                <span>Curated spotlight</span>
                                                <span className='inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                                                    <HiOutlineSparkles className='h-4 w-4' />
                                                    Featured
                                                </span>
                                            </div>
                                            <div className='mt-4 grid gap-4 sm:grid-cols-2'>
                                                <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Momentum</p>
                                                    <p className='mt-1 text-lg font-semibold text-slate-900 dark:text-white'>
                                                        {featured.claps ? `${featured.claps.toLocaleString()} claps` : 'Be the first to clap'}
                                                    </p>
                                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Readers are bookmarking what resonates; this pick updates as interactions roll in.</p>
                                                </div>
                                                <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>At a glance</p>
                                                    <p className='mt-1 text-lg font-semibold text-slate-900 dark:text-white'>
                                                        {featuredReadingTime > 0 ? `${featuredReadingTime} minute read` : 'Skim-friendly'}
                                                    </p>
                                                    <p className='text-xs text-slate-500 dark:text-slate-400'>We balance length, claps, and freshness to keep this slot helpful.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={layout === 'grid' ? 'grid gap-5 sm:grid-cols-2 xl:grid-cols-3' : 'space-y-5'}>
                                {(featured ? remaining : posts).map((post) => (
                                    <PostCard key={post._id || post.slug} post={post} />
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}
