import { Button, Select, Spinner, Badge } from 'flowbite-react';
import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getSearchResults } from '../services/searchService';
import { HiOutlineMicrophone, HiOutlineSearch, HiOutlineX } from 'react-icons/hi';

const TYPE_OPTIONS = [
    { value: 'post', label: 'Posts', description: 'Community updates, announcements, and deep dives.' },
    { value: 'tutorial', label: 'Tutorials', description: 'Step-by-step learning paths and guided lessons.' },
    { value: 'problem', label: 'Problems', description: 'Interview-style challenges to practice solving.' },
    { value: 'page', label: 'Pages', description: 'Published guides, landing pages, and documentation.' },
];

const ALL_TYPES = TYPE_OPTIONS.map((option) => option.value);

const SORT_OPTIONS = [
    { value: 'relevance', label: 'Best match' },
    { value: 'recent', label: 'Most recent' },
];

const TYPE_LABELS = {
    post: 'Post',
    tutorial: 'Tutorial',
    problem: 'Problem',
    page: 'Page',
};

const SUGGESTED_QUERIES = [
    'dynamic programming',
    'react hooks',
    'system design',
    'graph algorithms',
];

const parseTypesFromQuery = (param, { defaultToAll = true } = {}) => {
    if (!param) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    const normalizedValues = param
        .split(',')
        .map((value) => value.trim().toLowerCase())
        .filter(Boolean);

    if (!normalizedValues.length) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    const normalizedSet = new Set(normalizedValues);
    const filtered = ALL_TYPES.filter((type) => normalizedSet.has(type));

    if (!filtered.length) {
        return defaultToAll ? [...ALL_TYPES] : [];
    }

    return filtered;
};

const buildResultPath = (result) => {
    switch (result.type) {
        case 'post':
            return `/post/${result.slug}`;
        case 'tutorial':
            return `/tutorials/${result.slug}`;
        case 'problem':
            return `/problems/${result.slug}`;
        case 'page':
            return `/content/${result.slug}`;
        default:
            return '#';
    }
};

const formatDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date.toLocaleDateString();
};

export default function Search() {
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarData, setSidebarData] = useState({
        searchTerm: '',
        sort: 'relevance',
        contentTypes: [...ALL_TYPES],
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const searchTermFromUrl = params.get('searchTerm') || '';
        const sortFromUrl = params.get('sort') || 'relevance';
        const typeParam = params.get('types');
        const parsedTypes = parseTypesFromQuery(typeParam);
        const orderedTypes = parsedTypes.length ? parsedTypes : [...ALL_TYPES];

        setSidebarData({
            searchTerm: searchTermFromUrl,
            sort: SORT_OPTIONS.some((option) => option.value === sortFromUrl) ? sortFromUrl : 'relevance',
            contentTypes: orderedTypes.length ? orderedTypes : [...ALL_TYPES],
        });
    }, [location.search]);

    const queryInput = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const searchTerm = params.get('searchTerm') || '';
        const sortFromUrl = params.get('sort') || 'relevance';
        const sort = SORT_OPTIONS.some((option) => option.value === sortFromUrl) ? sortFromUrl : 'relevance';
        const typeParam = params.get('types');
        const parsedTypes = parseTypesFromQuery(typeParam, { defaultToAll: false });

        const query = {
            searchTerm,
            sort,
            limit: 25,
        };

        if (parsedTypes.length) {
            query.types = parsedTypes;
        }

        return query;
    }, [location.search]);

    const searchEnabled = Boolean(queryInput.searchTerm?.trim());

    const { data: searchData, isLoading, isError, error } = useQuery({
        queryKey: ['search', queryInput],
        queryFn: ({ signal }) => getSearchResults(queryInput, { signal }),
        enabled: searchEnabled,
        keepPreviousData: true,
        staleTime: 1000 * 30,
    });

    const results = searchEnabled && Array.isArray(searchData?.results) ? searchData.results : [];
    const loading = searchEnabled ? isLoading : false;
    const errorMessage = searchEnabled && isError
        ? error?.message || 'Unable to fetch search results.'
        : null;
    const metadata = searchEnabled
        ? {
            total: searchData?.total ?? 0,
            took: searchData?.took ?? null,
            fallbackUsed: Boolean(searchData?.fallbackUsed),
            message: searchData?.message || null,
        }
        : { total: 0, took: null, fallbackUsed: false, message: null };

    const handleSearchInputChange = (event) => {
        const { value } = event.target;
        setSidebarData((prev) => ({ ...prev, searchTerm: value }));
    };

    const handleSortChange = (event) => {
        const { value } = event.target;
        setSidebarData((prev) => ({ ...prev, sort: value }));
    };

    const toggleContentType = (type) => {
        setSidebarData((prev) => {
            const isSelected = prev.contentTypes.includes(type);
            if (isSelected) {
                if (prev.contentTypes.length === 1) {
                    return prev;
                }
                return {
                    ...prev,
                    contentTypes: prev.contentTypes.filter((item) => item !== type),
                };
            }

            const nextTypes = [...prev.contentTypes, type];
            const orderedTypes = ALL_TYPES.filter((item) => nextTypes.includes(item));
            return {
                ...prev,
                contentTypes: orderedTypes,
            };
        });
    };

    const handleSelectAllTypes = () => {
        setSidebarData((prev) => ({ ...prev, contentTypes: [...ALL_TYPES] }));
    };

    const buildSearchParams = (data) => {
        const params = new URLSearchParams();

        if (data.searchTerm.trim()) {
            params.set('searchTerm', data.searchTerm.trim());
        }

        if (data.sort !== 'relevance') {
            params.set('sort', data.sort);
        }

        if (data.contentTypes.length && data.contentTypes.length < ALL_TYPES.length) {
            params.set('types', data.contentTypes.join(','));
        }

        return params;
    };

    const commitSearchToUrl = (data) => {
        const params = buildSearchParams(data);
        navigate({ pathname: '/search', search: params.toString() });
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        commitSearchToUrl(sidebarData);
    };

    const handleSuggestionClick = (query) => {
        const nextData = { ...sidebarData, searchTerm: query };
        setSidebarData(nextData);
        commitSearchToUrl(nextData);
    };

    const handleInputClear = () => {
        const nextData = { ...sidebarData, searchTerm: '' };
        setSidebarData(nextData);
        if (sidebarData.contentTypes.length === ALL_TYPES.length && sidebarData.sort === 'relevance') {
            navigate('/search');
        } else {
            commitSearchToUrl(nextData);
        }
    };

    const handleClear = () => {
        const defaults = { searchTerm: '', sort: 'relevance', contentTypes: [...ALL_TYPES] };
        setSidebarData(defaults);
        navigate('/search');
    };

    const headerMeta = useMemo(() => {
        if (!sidebarData.searchTerm.trim()) {
            return 'Start typing to search across posts, tutorials, coding problems, and knowledge pages.';
        }

        if (loading) {
            return 'Searching across the knowledge base…';
        }

        if (errorMessage) {
            return errorMessage;
        }

        const pieces = [];
        const formattedTotal = new Intl.NumberFormat().format(metadata.total ?? 0);

        if (metadata.took != null) {
            const seconds = metadata.took / 1000;
            const formattedTime = seconds < 0.1
                ? `${metadata.took} ms`
                : `${seconds.toFixed(seconds < 1 ? 2 : 1)} seconds`;
            pieces.push(`About ${formattedTotal} result${metadata.total === 1 ? '' : 's'} (${formattedTime})`);
        } else {
            pieces.push(`About ${formattedTotal} result${metadata.total === 1 ? '' : 's'}`);
        }

        if (metadata.fallbackUsed) {
            pieces.push('Showing results via our intelligent fallback');
        }

        if (sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length) {
            const labels = sidebarData.contentTypes
                .map((type) => TYPE_OPTIONS.find((option) => option.value === type)?.label)
                .filter(Boolean);
            if (labels.length) {
                pieces.push(`Filtered to ${labels.join(', ')}`);
            }
        }
        return pieces.join(' · ');
    }, [sidebarData.searchTerm, loading, errorMessage, metadata, sidebarData.contentTypes]);

    const hasCustomTypes = sidebarData.contentTypes.length && sidebarData.contentTypes.length < ALL_TYPES.length;

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-gray-950'>
            <div className='border-b border-gray-200 dark:border-gray-800 bg-gradient-to-b from-white to-gray-100 dark:from-gray-950 dark:to-gray-900'>
                <div className='mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8'>
                    <div className='flex flex-wrap items-center justify-between gap-3 text-sm text-gray-500 dark:text-gray-400'>
                        <Link to='/' className='font-semibold tracking-tight text-gray-900 dark:text-gray-100'>
                            ScientistShield
                        </Link>
                        <div className='flex items-center gap-2'>
                            <span className='hidden text-xs uppercase tracking-wide text-gray-400 sm:block'>Jump back</span>
                            <Button as={Link} to='/' color='light' size='xs'>
                                Home
                            </Button>
                        </div>
                    </div>
                    <div className='text-center'>
                        <h1 className='text-3xl font-semibold text-gray-900 dark:text-gray-100 sm:text-4xl'>
                            Search the ScientistShield library
                        </h1>
                        <p className='mt-2 text-base text-gray-500 dark:text-gray-400'>
                            Instantly surface posts, tutorials, coding problems, and documentation pages with a Google-inspired experience.
                        </p>
                    </div>
                    <form onSubmit={handleSubmit} className='mx-auto flex w-full max-w-3xl flex-col gap-4'>
                        <div className='flex items-center gap-3 rounded-full border border-gray-200 bg-white px-4 py-2 shadow-sm transition focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-200 dark:border-gray-700 dark:bg-gray-900 dark:focus-within:border-purple-300'>
                            <HiOutlineSearch className='h-5 w-5 text-gray-400' />
                            <input
                                id='searchTerm'
                                type='search'
                                value={sidebarData.searchTerm}
                                onChange={handleSearchInputChange}
                                placeholder='Ask anything...'
                                className='flex-1 border-none bg-transparent text-base text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0 dark:text-gray-100'
                            />
                            {sidebarData.searchTerm && (
                                <button
                                    type='button'
                                    onClick={handleInputClear}
                                    className='rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800'
                                    aria-label='Clear search input'
                                >
                                    <HiOutlineX className='h-5 w-5' />
                                </button>
                            )}
                            <HiOutlineMicrophone className='hidden h-5 w-5 text-purple-500 sm:block' />
                            <Button type='submit' color='light' size='sm' className='hidden sm:inline-flex rounded-full border border-gray-200 bg-gray-100 px-4 font-semibold text-gray-700 shadow-none hover:border-purple-300 hover:bg-purple-50 hover:text-purple-600 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200'>
                                Search
                            </Button>
                        </div>
                        <div className='flex flex-wrap items-center justify-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                            <span className='text-xs uppercase tracking-wide text-gray-400'>Popular now:</span>
                            {SUGGESTED_QUERIES.map((query) => (
                                <button
                                    key={query}
                                    type='button'
                                    onClick={() => handleSuggestionClick(query)}
                                    className='rounded-full border border-transparent bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 transition hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                >
                                    {query}
                                </button>
                            ))}
                        </div>
                    </form>
                    <div className='flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 pt-6 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400'>
                        <div className='flex flex-wrap items-center gap-2'>
                            <button
                                type='button'
                                onClick={handleSelectAllTypes}
                                className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                    hasCustomTypes
                                        ? 'border border-transparent bg-gray-100 text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                        : 'border border-purple-500 bg-purple-50 text-purple-600 dark:border-purple-400 dark:bg-purple-500/10 dark:text-purple-200'
                                }`}
                            >
                                All
                            </button>
                            {TYPE_OPTIONS.map((option) => {
                                const isActive = sidebarData.contentTypes.includes(option.value);
                                return (
                                    <button
                                        key={option.value}
                                        type='button'
                                        onClick={() => toggleContentType(option.value)}
                                        className={`rounded-full px-3 py-1 text-sm font-medium transition ${
                                            isActive
                                                ? 'border border-purple-500 bg-purple-50 text-purple-600 shadow-sm dark:border-purple-400 dark:bg-purple-500/10 dark:text-purple-200'
                                                : 'border border-transparent bg-gray-100 text-gray-600 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:border-purple-400 dark:hover:bg-purple-400/10 dark:hover:text-purple-300'
                                        }`}
                                    >
                                        {option.label}
                                    </button>
                                );
                            })}
                        </div>
                        <div className='flex items-center gap-2'>
                            <span className='text-xs uppercase tracking-wide text-gray-400'>Sort by</span>
                            <Select id='sort' value={sidebarData.sort} onChange={handleSortChange} size='sm'>
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                            <Button type='button' color='light' size='xs' onClick={handleClear}>
                                Reset all
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            <main className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8'>
                <div className='flex flex-col gap-2'>
                    <p className='text-xs uppercase tracking-wide text-gray-400'>Search insights</p>
                    <p className='text-sm text-gray-600 dark:text-gray-300'>{headerMeta}</p>
                    {metadata.message && (
                        <Badge color='warning' size='sm' className='w-fit'>
                            {metadata.message}
                        </Badge>
                    )}
                </div>

                {loading && (
                    <div className='flex items-center justify-center py-16'>
                        <Spinner size='xl' />
                    </div>
                )}

                {!loading && !errorMessage && results.length === 0 && sidebarData.searchTerm.trim() && (
                    <div className='rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-lg text-gray-500 shadow-sm dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400'>
                        No matching content yet. Try a different keyword or expand the content filter.
                    </div>
                )}

                {!loading && !sidebarData.searchTerm.trim() && (
                    <div className='rounded-2xl border border-transparent bg-white p-10 text-center text-lg text-gray-500 shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400'>
                        Start typing above to explore the latest knowledge from our community.
                    </div>
                )}

                {!loading && !errorMessage && results.length > 0 && (
                    <div className='flex flex-col gap-8'>
                        {results.map((result) => {
                            const path = buildResultPath(result);
                            const snippet = result.highlight?.[0] || result.summary;
                            const updated = formatDate(result.updatedAt || result.createdAt);

                            return (
                                <article key={`${result.type}-${result.id}`} className='group flex flex-col gap-2'>
                                    <div className='text-xs text-gray-500 dark:text-gray-400'>
                                        <span className='font-medium text-gray-600 dark:text-gray-300'>
                                            {TYPE_LABELS[result.type] || 'Content'}
                                        </span>
                                        {result.category && (
                                            <>
                                                <span className='px-2 text-gray-300 dark:text-gray-600'>•</span>
                                                <span>{result.category}</span>
                                            </>
                                        )}
                                        {updated && (
                                            <>
                                                <span className='px-2 text-gray-300 dark:text-gray-600'>•</span>
                                                <span>Updated {updated}</span>
                                            </>
                                        )}
                                    </div>
                                    <Link
                                        to={path}
                                        className='text-xl font-semibold text-blue-700 transition hover:text-purple-600 dark:text-blue-300 dark:hover:text-purple-300'
                                    >
                                        {result.title}
                                    </Link>
                                    {snippet && (
                                        <p
                                            className='text-sm leading-relaxed text-gray-600 dark:text-gray-300'
                                            dangerouslySetInnerHTML={{ __html: snippet }}
                                        />
                                    )}
                                    <div className='flex flex-wrap gap-2 pt-1 text-xs text-gray-500 dark:text-gray-400'>
                                        {result.difficulty && (
                                            <span className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                Difficulty: {result.difficulty}
                                            </span>
                                        )}
                                        {result.topics?.slice(0, 3).map((topic) => (
                                            <span key={topic} className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                {topic}
                                            </span>
                                        ))}
                                        {result.tags?.slice(0, 3).map((tag) => (
                                            <span key={tag} className='rounded-full bg-gray-100 px-2 py-1 dark:bg-gray-800'>
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                )}

                {!loading && errorMessage && (
                    <div className='rounded-2xl border border-red-200 bg-red-50 p-6 text-red-600 dark:border-red-700 dark:bg-red-900/40 dark:text-red-300'>
                        {errorMessage}
                    </div>
                )}
            </main>
        </div>
    );
}
