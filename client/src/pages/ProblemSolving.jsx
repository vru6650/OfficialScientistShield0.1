import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { Alert, Button } from 'flowbite-react';
import { HiSparkles, HiArrowRight, HiArrowTrendingUp } from 'react-icons/hi2';

import { getProblems } from '../services/problemService';
import ProblemFilters from '../components/problems/ProblemFilters';
import ProblemCard from '../components/problems/ProblemCard';
import ProblemSkeleton from '../components/problems/ProblemSkeleton';
import ProblemEmptyState from '../components/problems/ProblemEmptyState';

const buildQueryString = (params) => {
    const query = new URLSearchParams();
    if (params.searchTerm) query.set('searchTerm', params.searchTerm);
    if (params.difficulty && params.difficulty !== 'all') query.set('difficulty', params.difficulty);
    if (params.topic) query.set('topic', params.topic);
    if (params.sort) query.set('sort', params.sort);
    if (params.includeDrafts) query.set('includeDrafts', 'true');
    query.set('limit', '12');
    return query.toString();
};

export default function ProblemSolving() {
    const location = useLocation();
    const navigate = useNavigate();
    const { currentUser } = useSelector((state) => state.user);

    const [filters, setFilters] = useState({
        searchTerm: '',
        difficulty: 'all',
        topic: '',
        sort: 'newest',
        includeDrafts: false,
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        setFilters((prev) => ({
            ...prev,
            searchTerm: params.get('searchTerm') || '',
            difficulty: params.get('difficulty') || 'all',
            topic: params.get('topic') || '',
            sort: params.get('sort') || 'newest',
            includeDrafts: params.get('includeDrafts') === 'true',
        }));
    }, [location.search]);

    const queryString = useMemo(
        () => buildQueryString({
            searchTerm: filters.searchTerm,
            difficulty: filters.difficulty,
            topic: filters.topic,
            sort: filters.sort,
            includeDrafts: currentUser?.isAdmin ? filters.includeDrafts : false,
        }),
        [filters, currentUser]
    );

    const { data, isLoading, isError, error, isFetching } = useQuery({
        queryKey: ['problems', queryString],
        queryFn: () => getProblems(queryString),
        keepPreviousData: true,
        staleTime: 1000 * 60 * 5,
    });

    const problems = data?.problems ?? [];
    const totalProblems = data?.totalProblems ?? 0;
    const lastMonthProblems = data?.lastMonthProblems ?? 0;
    const topics = data?.meta?.topicCounts?.map((topic) => topic._id) ?? [];
    const difficulties = data?.meta?.difficultyCounts ?? [];

    const handleFilterSubmit = (event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        if (filters.searchTerm) params.set('searchTerm', filters.searchTerm);
        if (filters.difficulty && filters.difficulty !== 'all') params.set('difficulty', filters.difficulty);
        if (filters.topic) params.set('topic', filters.topic);
        if (filters.sort) params.set('sort', filters.sort);
        if (currentUser?.isAdmin && filters.includeDrafts) params.set('includeDrafts', 'true');
        navigate({ search: params.toString() });
    };

    const heroStats = useMemo(
        () => [
            {
                label: 'Curated problems',
                value: totalProblems,
                description: 'Structured by topic and difficulty to mirror interview-ready prep.',
            },
            {
                label: 'New this month',
                value: lastMonthProblems,
                description: 'Fresh challenges added in the last 30 days.',
            },
            {
                label: 'Skill levels',
                value: difficulties.length,
                description: 'Track your growth from warm-ups to advanced algorithmic puzzles.',
            },
        ],
        [totalProblems, lastMonthProblems, difficulties.length]
    );

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 pb-20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <section className="bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 py-16 text-white">
                <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-3xl space-y-6">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-white/90">
                            <HiSparkles className="h-4 w-4" />
                            Computer Problem Solving Lab
                        </span>
                        <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                            Practice, iterate, and master code challenges like it&apos;s interview day.
                        </h1>
                        <p className="text-lg text-white/80">
                            Sharpen your reasoning with curated problems, structured hints, and editorial-grade explanations inspired by platforms like GeeksforGeeks.
                        </p>
                        <button
                            type="button"
                            onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
                            className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-cyan-700 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
                        >
                            Browse challenges
                            <HiArrowRight className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {heroStats.map((stat) => (
                            <div
                                key={stat.label}
                                className="rounded-2xl bg-white/10 p-6 shadow-lg backdrop-blur hover:bg-white/15"
                            >
                                <p className="text-sm font-medium uppercase tracking-wide text-white/70">{stat.label}</p>
                                <p className="mt-2 text-3xl font-bold">{stat.value}</p>
                                <p className="mt-2 text-sm text-white/80">{stat.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="-mt-16 space-y-10">
                    <ProblemFilters
                        searchValue={filters.searchTerm}
                        onSearchChange={(value) => setFilters((prev) => ({ ...prev, searchTerm: value }))}
                        onSubmit={handleFilterSubmit}
                        selectedDifficulty={filters.difficulty}
                        onDifficultyChange={(value) => setFilters((prev) => ({ ...prev, difficulty: value }))}
                        selectedTopic={filters.topic}
                        onTopicChange={(value) => setFilters((prev) => ({ ...prev, topic: value }))}
                        sort={filters.sort}
                        onSortChange={(value) => setFilters((prev) => ({ ...prev, sort: value }))}
                        availableTopics={topics}
                        showDrafts={filters.includeDrafts}
                        onToggleDrafts={(value) => setFilters((prev) => ({ ...prev, includeDrafts: value }))}
                        isAdmin={Boolean(currentUser?.isAdmin)}
                    />

                    {isError && (
                        <Alert color="failure" className="rounded-2xl">
                            {error?.message || 'Unable to load problems. Please try again later.'}
                        </Alert>
                    )}

                    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                        <div className="space-y-6">
                            {isLoading || isFetching ? (
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {Array.from({ length: 4 }).map((_, index) => (
                                        <ProblemSkeleton key={index} />
                                    ))}
                                </div>
                            ) : problems.length ? (
                                <div className="grid gap-6 sm:grid-cols-2">
                                    {problems.map((problem) => (
                                        <ProblemCard key={problem._id} problem={problem} />
                                    ))}
                                </div>
                            ) : (
                                <ProblemEmptyState isAdmin={Boolean(currentUser?.isAdmin)} />
                            )}
                        </div>

                        <aside className="space-y-6">
                            <div className="rounded-2xl border border-cyan-200 bg-white p-6 shadow-sm dark:border-cyan-500/30 dark:bg-slate-900/70">
                                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-200">
                                    <HiArrowTrendingUp className="h-4 w-4" />
                                    Trending Topics
                                </h3>
                                <div className="mt-4 flex flex-wrap gap-2 text-xs">
                                    {(topics.length ? topics : ['Arrays', 'Dynamic Programming', 'Graphs']).map((topic) => (
                                        <button
                                            key={topic}
                                            type="button"
                                            onClick={() => {
                                                setFilters((prev) => ({ ...prev, topic }));
                                                const params = new URLSearchParams(location.search);
                                                if (topic) {
                                                    params.set('topic', topic);
                                                } else {
                                                    params.delete('topic');
                                                }
                                                navigate({ search: params.toString() });
                                            }}
                                            className={`rounded-full px-4 py-1 font-semibold transition ${
                                                filters.topic === topic
                                                    ? 'bg-cyan-600 text-white shadow-lg'
                                                    : 'bg-cyan-100 text-cyan-700 hover:bg-cyan-200 dark:bg-cyan-900/40 dark:text-cyan-200'
                                            }`}
                                        >
                                            {topic}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800/60">
                                <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-700 dark:text-gray-200">
                                    Difficulty overview
                                </h3>
                                <ul className="mt-3 space-y-2 text-sm">
                                    {difficulties.length ? (
                                        difficulties.map((entry) => (
                                            <li key={entry._id} className="flex items-center justify-between rounded-xl bg-gray-50 px-3 py-2 text-gray-700 dark:bg-gray-900/60 dark:text-gray-200">
                                                <span>{entry._id}</span>
                                                <span className="font-semibold">{entry.count}</span>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="rounded-xl bg-gray-50 px-3 py-2 text-gray-500 dark:bg-gray-900/60 dark:text-gray-400">
                                            Track how many problems you solve at each level.
                                        </li>
                                    )}
                                </ul>
                            </div>

                            <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-cyan-500 via-blue-500 to-indigo-600 p-6 text-white shadow-lg">
                                <h3 className="text-lg font-semibold">Design your own challenge</h3>
                                <p className="mt-2 text-sm text-white/90">
                                    Have a favourite interview prompt or competition puzzle? Share it with the community to help others grow.
                                </p>
                                {currentUser?.isAdmin ? (
                                    <button
                                        type="button"
                                        onClick={() => navigate('/create-problem')}
                                        className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-cyan-700 shadow-lg transition hover:-translate-y-0.5"
                                    >
                                        Create a problem
                                        <HiArrowRight className="h-4 w-4" />
                                    </button>
                                ) : (
                                    <p className="mt-4 text-xs text-white/70">
                                        Want to contribute? Reach out to the ScientistShield team to become a curator.
                                    </p>
                                )}
                            </div>
                        </aside>
                    </div>
                </div>
            </div>
        </div>
    );
}
