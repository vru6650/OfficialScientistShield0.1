import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
    HiOutlineArrowPath,
    HiOutlineMagnifyingGlass,
    HiOutlineRectangleStack,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { getQuizzes } from '../services/quizService.js';
import QuizCard from '../components/QuizCard';
import QuizCardSkeleton from '../components/QuizCardSkeleton';

const formatCategoryLabel = (value) =>
    value
        .replace(/-/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());

export default function Quizzes() {
    const location = useLocation();
    const navigate = useNavigate();

    const [sidebarSearchTerm, setSidebarSearchTerm] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [category, setCategory] = useState('uncategorized');
    const [sort, setSort] = useState('desc');

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const searchTermFromUrl = urlParams.get('searchTerm') || '';
        const categoryFromUrl = urlParams.get('category') || 'uncategorized';
        const sortFromUrl = urlParams.get('sort') || 'desc';

        setSidebarSearchTerm(searchTermFromUrl);
        setSearchTerm(searchTermFromUrl);
        setCategory(categoryFromUrl);
        setSort(sortFromUrl);
    }, [location.search]);

    const queryString = useMemo(() => {
        const params = new URLSearchParams();
        const trimmedSearch = searchTerm.trim();

        if (trimmedSearch) {
            params.set('searchTerm', trimmedSearch);
        }
        if (category && category !== 'uncategorized') {
            params.set('category', category);
        }
        if (sort) {
            params.set('sort', sort);
        }

        return params.toString();
    }, [searchTerm, category, sort]);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['quizzes', { searchTerm, category, sort }],
        queryFn: () => getQuizzes(queryString),
        staleTime: 1000 * 60 * 5,
        keepPreviousData: true,
    });

    const quizzes = data?.quizzes || [];
    const totalQuizzes = data?.totalQuizzes ?? quizzes.length;
    const lastMonthQuizzes = data?.lastMonthQuizzes ?? null;

    const handleSearchSubmit = (event) => {
        event.preventDefault();
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('searchTerm', sidebarSearchTerm);
        navigate({ search: urlParams.toString() });
    };

    const handleCategoryChange = (event) => {
        const newCategory = event.target.value;
        const urlParams = new URLSearchParams(location.search);
        if (newCategory === 'uncategorized') {
            urlParams.delete('category');
        } else {
            urlParams.set('category', newCategory);
        }
        navigate({ search: urlParams.toString() });
    };

    const handleSortChange = (event) => {
        const newSort = event.target.value;
        const urlParams = new URLSearchParams(location.search);
        urlParams.set('sort', newSort);
        navigate({ search: urlParams.toString() });
    };

    const handleResetFilters = () => {
        setSidebarSearchTerm('');
        navigate('/quizzes');
    };

    const { data: categoriesData, isLoading: categoriesLoading, isError: categoriesError } = useQuery({
        queryKey: ['quizCategories'],
        queryFn: async () => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve([
                        'JavaScript',
                        'React.js',
                        'HTML',
                        'CSS',
                        'Node.js',
                        'Databases',
                        'Algorithms',
                    ]);
                }, 300);
            });
        },
        staleTime: Infinity,
    });

    const numberFormatter = useMemo(() => new Intl.NumberFormat(), []);
    const availableCategories = categoriesData || [];
    const formattedTotal = numberFormatter.format(totalQuizzes);
    const formattedNew = lastMonthQuizzes !== null ? numberFormatter.format(lastMonthQuizzes) : '--';
    const formattedCategories = categoriesLoading
        ? '...'
        : categoriesError
            ? '--'
            : numberFormatter.format(availableCategories.length);

    const activeFilters = useMemo(() => {
        const filters = [];
        if (searchTerm.trim()) {
            filters.push({ key: 'search', label: `Search: ${searchTerm.trim()}` });
        }
        if (category !== 'uncategorized') {
            filters.push({ key: 'category', label: formatCategoryLabel(category) });
        }
        if (sort === 'asc') {
            filters.push({ key: 'sort', label: 'Oldest first' });
        }
        return filters;
    }, [searchTerm, category, sort]);

    const resultsSummary = isLoading
        ? 'Loading quizzes...'
        : `Showing ${numberFormatter.format(quizzes.length)} of ${formattedTotal} quizzes`;

    const stats = [
        {
            label: 'Total quizzes',
            value: formattedTotal,
            helper: 'Practice-ready assessments',
            icon: HiOutlineRectangleStack,
        },
        {
            label: 'New this month',
            value: formattedNew,
            helper: 'Fresh quizzes shipped weekly',
            icon: HiOutlineSparkles,
        },
        {
            label: 'Categories',
            value: formattedCategories,
            helper: 'Frontend to systems design',
            icon: HiOutlineSquares2X2,
        },
    ];

    return (
        <div className="min-h-screen">
            <section className="relative overflow-hidden px-4 pt-10 pb-12 sm:px-6 lg:px-8">
                <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-br from-emerald-100/50 via-transparent to-sky-100/60 opacity-80 dark:from-emerald-900/20 dark:to-sky-900/25"
                />
                <div className="relative mx-auto flex max-w-6xl flex-col gap-10">
                    <div className="macos-panel macos-panel--wide">
                        <div className="macos-panel__grid space-y-10 p-6 sm:p-8 lg:p-10">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                                <div className="space-y-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-500 dark:text-emerald-300">
                                        Quiz Studio
                                    </p>
                                    <h1 className="text-3xl font-extrabold text-slate-900 sm:text-4xl lg:text-5xl dark:text-white">
                                        Turn practice into a daily habit
                                    </h1>
                                    <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
                                        Short, focused quizzes help you test retention, uncover gaps, and keep your progress
                                        moving forward.
                                    </p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className="macos-chip text-[11px] font-semibold uppercase tracking-widest">
                                        Timed checks
                                    </span>
                                    <span className="macos-chip text-[11px] font-semibold uppercase tracking-widest">
                                        Instant feedback
                                    </span>
                                </div>
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {stats.map(({ label, value, helper, icon: Icon }) => (
                                    <div key={label} className="macos-tile p-5">
                                        <div className="flex items-center gap-3">
                                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-sky-500 text-white shadow-md">
                                                <Icon className="h-5 w-5" aria-hidden />
                                            </span>
                                            <div>
                                                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                                                    {label}
                                                </p>
                                                <p className="text-2xl font-semibold text-slate-900 dark:text-white">
                                                    {value}
                                                </p>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
                                            {helper}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="macos-tile p-6">
                        <form
                            onSubmit={handleSearchSubmit}
                            className="grid gap-4 lg:grid-cols-[1.3fr_0.9fr_0.7fr_auto] lg:items-end"
                        >
                            <div className="space-y-2">
                                <label
                                    htmlFor="quiz-search"
                                    className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300"
                                >
                                    Search quizzes
                                </label>
                                <div className="flex items-center gap-3 rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-200 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:focus-within:border-emerald-300 dark:focus-within:ring-emerald-900/40">
                                    <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400" aria-hidden />
                                    <input
                                        id="quiz-search"
                                        type="text"
                                        value={sidebarSearchTerm}
                                        onChange={(event) => setSidebarSearchTerm(event.target.value)}
                                        placeholder="Search by topic or skill..."
                                        className="w-full border-none bg-transparent text-sm placeholder:text-slate-400 focus:outline-none focus:ring-0 dark:placeholder:text-slate-500"
                                    />
                                    {sidebarSearchTerm && (
                                        <button
                                            type="button"
                                            onClick={() => setSidebarSearchTerm('')}
                                            className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800/70 dark:hover:text-slate-200"
                                            aria-label="Clear search"
                                        >
                                            <HiOutlineXMark className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="quiz-category"
                                    className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300"
                                >
                                    Category
                                </label>
                                <select
                                    id="quiz-category"
                                    value={category}
                                    onChange={handleCategoryChange}
                                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-300 dark:focus:ring-emerald-900/40"
                                >
                                    <option value="uncategorized">All Categories</option>
                                    {categoriesLoading ? (
                                        <option disabled>Loading categories...</option>
                                    ) : categoriesError ? (
                                        <option disabled>Unable to load categories</option>
                                    ) : (
                                        availableCategories.map((cat) => (
                                            <option key={cat} value={cat.toLowerCase().replace(/\s/g, '-')}>
                                                {cat}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label
                                    htmlFor="quiz-sort"
                                    className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300"
                                >
                                    Sort by
                                </label>
                                <select
                                    id="quiz-sort"
                                    value={sort}
                                    onChange={handleSortChange}
                                    className="w-full rounded-2xl border border-slate-200/70 bg-white/80 px-4 py-3 text-sm text-slate-700 shadow-sm focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-slate-200 dark:focus:border-emerald-300 dark:focus:ring-emerald-900/40"
                                >
                                    <option value="desc">Latest</option>
                                    <option value="asc">Oldest</option>
                                </select>
                            </div>

                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    type="submit"
                                    className="btn-aqua px-5 py-2 text-sm font-semibold"
                                >
                                    Apply filters
                                </button>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="macos-chip text-[11px] font-semibold uppercase tracking-widest"
                                >
                                    <HiOutlineArrowPath className="h-4 w-4" aria-hidden />
                                    Reset
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                                Results
                            </p>
                            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                                {resultsSummary}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeFilters.length ? (
                                activeFilters.map((filter) => (
                                    <span key={filter.key} className="macos-chip text-[11px] font-semibold uppercase tracking-widest">
                                        {filter.label}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                    No filters applied
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </section>

            <section className="px-4 pb-16 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-6xl">
                    {isLoading && (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {Array.from({ length: 6 }).map((_, index) => (
                                <QuizCardSkeleton key={index} />
                            ))}
                        </div>
                    )}

                    {isError && (
                        <div className="macos-tile border border-red-200/70 bg-red-50/80 p-6 text-red-700 dark:border-red-700/60 dark:bg-red-900/30 dark:text-red-200">
                            Unable to load quizzes. {error?.message || 'Please try again.'}
                        </div>
                    )}

                    {!isLoading && !isError && quizzes.length === 0 && (
                        <div className="macos-tile flex flex-col items-center gap-3 p-10 text-center text-slate-600 dark:text-slate-300">
                            <p className="text-lg font-semibold text-slate-900 dark:text-white">
                                No quizzes match these filters
                            </p>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                Try adjusting your search or reset the filters to explore everything.
                            </p>
                            <button
                                type="button"
                                onClick={handleResetFilters}
                                className="macos-chip text-[11px] font-semibold uppercase tracking-widest"
                            >
                                Reset filters
                            </button>
                        </div>
                    )}

                    {!isLoading && !isError && quizzes.length > 0 && (
                        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                            {quizzes.map((quizItem) => (
                                <QuizCard key={quizItem._id} quiz={quizItem} />
                            ))}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
