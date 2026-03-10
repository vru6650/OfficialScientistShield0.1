import { Suspense, lazy, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Alert, Breadcrumb, Spinner } from 'flowbite-react';
import {
    HiHome,
    HiArrowLeft,
    HiOutlineSparkles,
    HiOutlineClock,
    HiOutlineAcademicCap,
    HiOutlinePresentationChartLine,
} from 'react-icons/hi2';

import { getProblemBySlug } from '../services/problemService';
import ProblemStatsBar from '../components/problems/ProblemStatsBar';
import ProblemResourceLinks from '../components/problems/ProblemResourceLinks';
import ProblemMetaSummary from '../components/problems/ProblemMetaSummary';
import ProblemWorkspace from '../components/problems/ProblemWorkspace';
import ProblemDifficultyBadge from '../components/problems/ProblemDifficultyBadge';

const CodeEditor = lazy(() => import('../components/CodeEditor'));

const normalizeStarterLanguage = (language) => {
    if (!language) {
        return null;
    }

    const normalized = language.toLowerCase().trim();

    if (!normalized) {
        return null;
    }

    if (normalized.includes('javascript') || normalized.includes('node')) {
        return 'javascript';
    }

    if (normalized.includes('python')) {
        return 'python';
    }

    if (normalized.includes('c++') || normalized.includes('cpp')) {
        return 'cpp';
    }

    if (normalized === 'html' || normalized.includes('markup')) {
        return 'html';
    }

    if (normalized === 'css') {
        return 'css';
    }

    if (normalized.includes('java') && !normalized.includes('javascript')) {
        return 'java';
    }

    if (normalized.includes('c#') || normalized.includes('csharp') || normalized.includes('dotnet')) {
        return 'csharp';
    }

    return null;
};

export default function SingleProblemPage() {
    const { problemSlug } = useParams();

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ['problem', problemSlug],
        queryFn: () => getProblemBySlug(problemSlug),
        enabled: Boolean(problemSlug),
    });

    const topTopics = useMemo(() => (data?.topics ?? []).slice(0, 3), [data?.topics]);
    const highlightedTags = useMemo(() => (data?.tags ?? []).slice(0, 4), [data?.tags]);
    const { starterInitialCode, starterDefaultLanguage } = useMemo(() => {
        if (!data?.starterCodes?.length) {
            return { starterInitialCode: undefined, starterDefaultLanguage: undefined };
        }

        const collectedCodes = {};
        let firstLanguage = null;

        data.starterCodes.forEach((template) => {
            if (!template?.code) {
                return;
            }

            const normalizedLanguage = normalizeStarterLanguage(template.language);

            if (!normalizedLanguage) {
                return;
            }

            collectedCodes[normalizedLanguage] = template.code;

            if (!firstLanguage) {
                firstLanguage = normalizedLanguage;
            }
        });

        const preferredLanguageOrder = ['javascript', 'python', 'cpp', 'java', 'csharp', 'html', 'css'];
        const prioritizedLanguage = preferredLanguageOrder.find((lang) => collectedCodes[lang]);

        return {
            starterInitialCode: Object.keys(collectedCodes).length ? collectedCodes : undefined,
            starterDefaultLanguage: prioritizedLanguage ?? firstLanguage ?? undefined,
        };
    }, [data?.starterCodes]);

    if (isLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Spinner size="xl" />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center px-4">
                <Alert color="failure" className="w-full rounded-2xl">
                    {error?.message || 'We could not find that problem. Try exploring the catalogue for more challenges.'}
                </Alert>
            </div>
        );
    }

    return (
        <div className="relative min-h-screen bg-slate-50 pb-24 dark:bg-slate-950">
            <div className="absolute inset-x-0 top-0 -z-10 flex justify-center overflow-hidden">
                <div className="pointer-events-none h-[420px] w-full max-w-5xl -translate-y-24 rounded-full bg-gradient-to-b from-cyan-200/60 via-transparent to-transparent blur-3xl dark:from-cyan-500/20" />
            </div>

            <header className="border-b border-slate-200/60 bg-white/80 shadow-sm backdrop-blur-lg dark:border-slate-800/60 dark:bg-slate-900/80">
                <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Breadcrumb aria-label="Problem breadcrumb" className="text-sm text-slate-500 dark:text-slate-400">
                            <Breadcrumb.Item href="/" icon={HiHome}>
                                Home
                            </Breadcrumb.Item>
                            <Breadcrumb.Item href="/problems">Problem Solving</Breadcrumb.Item>
                            <Breadcrumb.Item>{data.title}</Breadcrumb.Item>
                        </Breadcrumb>
                        <div className="flex items-center gap-2 rounded-full bg-cyan-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 shadow-sm ring-1 ring-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200 dark:ring-cyan-800/40">
                            <HiOutlineSparkles className="h-4 w-4" />
                            Interview ready
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex flex-wrap items-center gap-3">
                            <ProblemDifficultyBadge difficulty={data.difficulty} />
                            {data.companies?.length ? (
                                <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-200 dark:ring-emerald-500/40">
                                    <HiOutlinePresentationChartLine className="h-4 w-4" />
                                    Asked at {data.companies.slice(0, 2).join(', ')}
                                    {data.companies.length > 2 ? ' +' + (data.companies.length - 2) : ''}
                                </div>
                            ) : null}
                        </div>
                        <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">{data.title}</h1>
                        <p className="max-w-3xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">{data.description}</p>

                        <div className="grid gap-4 rounded-3xl border border-slate-200 bg-white/70 p-6 shadow-xl shadow-cyan-100/50 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none dark:ring-slate-800">
                            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Success rate</p>
                                    <p className="text-2xl font-semibold text-slate-900 dark:text-white">{data.successRate ? `${data.successRate}%` : '—'}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Estimated effort</p>
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <HiOutlineClock className="h-4 w-4 text-cyan-500" />
                                        {data.estimatedTime ? `${data.estimatedTime} mins` : 'Plan your own pace'}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Core topics</p>
                                    <div className="flex flex-wrap gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        {topTopics.length
                                            ? topTopics.map((topic) => (
                                                <span key={topic} className="inline-flex items-center rounded-full bg-cyan-100/70 px-2.5 py-1 text-xs font-semibold text-cyan-800 dark:bg-cyan-500/10 dark:text-cyan-200">
                                                      {topic}
                                                  </span>
                                            ))
                                            : 'General problem solving'}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Session goal</p>
                                    <p className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <HiOutlineAcademicCap className="h-4 w-4 text-violet-500" />
                                        Strengthen pattern recognition
                                    </p>
                                </div>
                            </div>
                            <ProblemStatsBar stats={data.stats} successRate={data.successRate} estimatedTime={data.estimatedTime} />
                        </div>

                        {highlightedTags.length ? (
                            <div className="flex flex-wrap gap-2 text-sm text-slate-500 dark:text-slate-400">
                                {highlightedTags.map((tag) => (
                                    <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800/70 dark:text-slate-200 dark:ring-slate-700">
                                        #{tag}
                                    </span>
                                ))}
                            </div>
                        ) : null}

                        <div className="flex flex-wrap gap-3">
                            <a
                                href="#interactive-editor"
                                className="inline-flex items-center justify-center gap-2 rounded-full bg-cyan-600 px-6 py-2 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition hover:bg-cyan-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                            >
                                Start coding now
                            </a>
                            <Link
                                to="/problems"
                                className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:text-cyan-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                            >
                                <HiArrowLeft className="h-4 w-4" />
                                Back to catalogue
                            </Link>
                        </div>
                    </div>
                </div>
            </header>

            <main className="mx-auto mt-12 max-w-6xl px-4 sm:px-6 lg:px-8">
                <div className="grid gap-10 lg:grid-cols-[1.12fr,0.88fr] xl:gap-12">
                    <div className="space-y-10">
                        <section className="rounded-3xl border border-slate-200 bg-white/70 p-8 shadow-lg shadow-slate-200/60 ring-1 ring-slate-100 dark:border-slate-800 dark:bg-slate-900/70 dark:shadow-none dark:ring-slate-800">
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                                <div className="space-y-3">
                                    <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Learning focus</h2>
                                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                        Build momentum with a structured plan. Skim the statement, attempt the solution solo, and only then explore hints and editorial guidance.
                                    </p>
                                </div>
                                <div className="flex items-start gap-4 rounded-2xl bg-cyan-50/60 p-4 text-sm text-cyan-800 ring-1 ring-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-200 dark:ring-cyan-800/40">
                                    <HiOutlineSparkles className="mt-0.5 h-5 w-5" />
                                    <p>Time-box your attempt to stay interview-ready and track insights in the notebook of your choice.</p>
                                </div>
                            </div>

                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Prep steps</h3>
                                    <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        <li>1. Understand the narrative and constraints.</li>
                                        <li>2. Identify patterns from similar challenges.</li>
                                        <li>3. Outline brute-force and optimized strategies.</li>
                                    </ol>
                                </div>
                                <div className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-inner dark:border-slate-700 dark:bg-slate-900/70">
                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">Reflection prompts</h3>
                                    <ol className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                        <li>• What invariants or data structures unlock the problem?</li>
                                        <li>• How does space-time complexity evolve across iterations?</li>
                                        <li>• Can you communicate the reasoning succinctly?</li>
                                    </ol>
                                </div>
                            </div>
                        </section>

                        <ProblemWorkspace problem={data} />
                        <ProblemResourceLinks resources={data.resources} />
                    </div>

                    <aside className="space-y-8 lg:sticky lg:top-28">
                        <section
                            id="interactive-editor"
                            className="overflow-hidden rounded-3xl border border-slate-200 bg-white/80 shadow-xl shadow-slate-200/80 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none"
                        >
                            <div className="space-y-1 border-b border-slate-200 px-6 py-5 dark:border-slate-700">
                                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Interactive editor</h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Write, run, and visualize your solution without leaving the problem page.
                                </p>
                            </div>
                            <div className="h-[720px] bg-slate-50/80 dark:bg-slate-900/70">
                                <Suspense
                                    fallback={
                                        <div className="flex h-full items-center justify-center text-sm text-slate-500 dark:text-slate-300">
                                            Loading code workspace...
                                        </div>
                                    }
                                >
                                    <CodeEditor
                                        language={starterDefaultLanguage ?? 'javascript'}
                                        initialCode={starterInitialCode}
                                        workspaceId={`problem-${data?._id || data?.slug || 'default'}`}
                                    />
                                </Suspense>
                            </div>
                        </section>

                        <ProblemMetaSummary problem={data} />

                        <section className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/80 ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none dark:ring-slate-800">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Practice sprint</h3>
                            <ul className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
                                <li>
                                    <p className="font-semibold text-slate-900 dark:text-white">Focus block (20 mins)</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Solve without hints and log any edge cases you identify.</p>
                                </li>
                                <li>
                                    <p className="font-semibold text-slate-900 dark:text-white">Debrief (10 mins)</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Review your solution quality versus the editorial walkthrough.</p>
                                </li>
                                <li>
                                    <p className="font-semibold text-slate-900 dark:text-white">Upskill (5 mins)</p>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Capture key learnings and share insights with your study circle.</p>
                                </li>
                            </ul>
                        </section>

                        <div className="rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-lg shadow-slate-200/80 ring-1 ring-slate-100 dark:border-slate-700 dark:bg-slate-900/70 dark:shadow-none dark:ring-slate-800">
                            <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">Share your solution</h3>
                            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                                Publish a write-up in the ScientistShield community forum and help fellow learners master this challenge.
                            </p>
                            <a
                                href="mailto:team@scientistshield.dev?subject=Solution%20write-up%20for%20"
                                className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-300"
                            >
                                Start a discussion
                            </a>
                        </div>
                    </aside>
                </div>
            </main>
        </div>
    );
}
