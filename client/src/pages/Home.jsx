import { Link } from 'react-router-dom';
import { Button, Alert } from 'flowbite-react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    HiOutlineAcademicCap,
    HiOutlineChartBar,
    HiOutlineCodeBracket,
    HiOutlineGlobeAmericas,
    HiOutlineLightBulb,
    HiOutlineRocketLaunch,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineUsers,
} from 'react-icons/hi2';
import { getPosts } from '../services/postService';

// Lazy-load heavy UI chunks for faster first paint
const Hero = lazy(() => import('../components/Hero'));
const CategoryCard = lazy(() => import('../components/CategoryCard'));
const CodeEditor = lazy(() => import('../components/CodeEditor'));
const PostCard = lazy(() => import('../components/PostCard'));

// Simple skeletons (no extra deps)
function CategoryCardSkeleton() {
    return (
        <div className="liquid-hybrid-tile rounded-2xl p-6 animate-pulse">
            <div className="h-8 w-1/2 rounded bg-slate-200/85 dark:bg-slate-700/80 mb-3" />
            <div className="h-4 w-2/3 rounded bg-slate-200/85 dark:bg-slate-700/80 mb-1.5" />
            <div className="h-4 w-1/3 rounded bg-slate-200/85 dark:bg-slate-700/80" />
        </div>
    );
}

function PostCardSkeleton() {
    return (
        <div className="liquid-hybrid-tile rounded-2xl overflow-hidden animate-pulse">
            <div className="h-40 bg-slate-200/85 dark:bg-slate-700/80" />
            <div className="p-4">
                <div className="h-6 w-3/4 rounded bg-slate-200/85 dark:bg-slate-700/80 mb-3" />
                <div className="h-4 w-full rounded bg-slate-200/85 dark:bg-slate-700/80 mb-2" />
                <div className="h-4 w-5/6 rounded bg-slate-200/85 dark:bg-slate-700/80" />
            </div>
        </div>
    );
}

function EditorSkeleton() {
    return (
        <div className="liquid-hybrid-tile rounded-2xl p-4 animate-pulse">
            <div className="h-8 w-1/3 rounded bg-slate-200/85 dark:bg-slate-700/80 mb-4" />
            <div className="h-64 rounded bg-slate-200/85 dark:bg-slate-700/80" />
        </div>
    );
}

export default function Home() {
    const { currentUser } = useSelector((state) => state.user);
    const [latestPosts, setLatestPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const stats = useMemo(
        () => [
            {
                icon: HiOutlineUsers,
                label: 'Learners worldwide',
                value: '52K+',
                description: 'Developers building skills together every month.',
            },
            {
                icon: HiOutlineAcademicCap,
                label: 'Learning paths',
                value: '120+',
                description: 'Curated tutorials and roadmaps for every skill level.',
            },
            {
                icon: HiOutlineCodeBracket,
                label: 'Interactive projects',
                value: '340+',
                description: 'Hands-on challenges to help you ship production-ready code.',
            },
            {
                icon: HiOutlineGlobeAmericas,
                label: 'Countries represented',
                value: '90+',
                description: 'A truly global community of curious problem solvers.',
            },
        ],
        []
    );

    const highlights = useMemo(
        () => [
            {
                icon: HiOutlineSparkles,
                title: 'Guided learning experiences',
                description: 'Follow expert-designed tracks that blend theory, practice, and reflection.',
            },
            {
                icon: HiOutlineChartBar,
                title: 'Progress you can measure',
                description: 'Smart progress dashboards celebrate milestones and suggest what to learn next.',
            },
            {
                icon: HiOutlineShieldCheck,
                title: 'Quality you can trust',
                description: 'Every tutorial is peer reviewed to ensure clarity, accuracy, and accessibility.',
            },
            {
                icon: HiOutlineRocketLaunch,
                title: 'Launch-ready portfolio',
                description: 'Ship polished projects with real-world briefs and share them with employers.',
            },
        ],
        []
    );

    const learningPath = useMemo(
        () => [
            {
                step: 'Discover',
                title: 'Find what inspires you',
                description:
                    'Browse curated categories, trending topics, and tailored recommendations aligned with your goals.',
                icon: HiOutlineLightBulb,
            },
            {
                step: 'Practice',
                title: 'Build with confidence',
                description:
                    'Tackle guided projects and quizzes that apply concepts immediately in a supportive environment.',
                icon: HiOutlineCodeBracket,
            },
            {
                step: 'Collaborate',
                title: 'Learn alongside others',
                description:
                    'Join study circles, request feedback, and pair-program with a global network of builders.',
                icon: HiOutlineUsers,
            },
            {
                step: 'Showcase',
                title: 'Share your progress',
                description:
                    'Publish articles, host demos, and let your portfolio tell a story that recruiters remember.',
                icon: HiOutlineChartBar,
            },
        ],
        []
    );

    // Centralize category config
    const categories = useMemo(
        () => [
            {
                title: 'HTML',
                description: 'The language for building web pages',
                linkTo: '/tutorials?category=html',
                gradient: 'bg-gradient-to-br from-orange-400 to-rose-500',
                delay: '0.1s',
            },
            {
                title: 'CSS',
                description: 'The language for styling web pages',
                linkTo: '/tutorials?category=css',
                gradient: 'bg-gradient-to-br from-sky-500 to-indigo-600',
                delay: '0.2s',
            },
            {
                title: 'JavaScript',
                description: 'The language for programming web pages',
                linkTo: '/tutorials?category=javascript',
                gradient: 'bg-gradient-to-br from-yellow-400 to-amber-600',
                delay: '0.3s',
            },
            {
                title: 'React.js',
                description: 'A library for building user interfaces',
                linkTo: '/tutorials?category=reactjs',
                gradient: 'bg-gradient-to-br from-cyan-500 to-blue-600',
                delay: '0.4s',
            },
            {
                title: 'Node.js',
                description: "JS runtime built on Chrome's V8 engine",
                linkTo: '/tutorials?category=node.js',
                gradient: 'bg-gradient-to-br from-lime-500 to-emerald-600',
                delay: '0.5s',
            },
            {
                title: 'C',
                description: 'A powerful general-purpose language',
                linkTo: '/tutorials?category=c',
                gradient: 'bg-gradient-to-br from-slate-500 to-gray-700',
                delay: '0.6s',
            },
        ],
        []
    );

    // Fetch posts with an unmount guard
    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const postsData = await getPosts('limit=6'); // grab a few more
                if (!active) return;
                setLatestPosts(postsData?.posts ?? []);
            } catch (err) {
                console.error('Failed to fetch data:', err);
                if (!active) return;
                setError('Failed to load content. Please try again.');
            } finally {
                if (active) {
                    setLoading(false);
                }
            }
        })();
        return () => {
            active = false;
        };
    }, []);

    const retry = async () => {
        setError(null);
        setLoading(true);
        try {
            const postsData = await getPosts('limit=6');
            setLatestPosts(postsData?.posts ?? []);
        } catch (err) {
            console.error('Retry failed:', err);
            setError('Still having trouble. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="liquid-app-shell relative min-h-screen">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 -top-32 -z-10 blur-3xl opacity-40 dark:opacity-25"
            >
                <div className="mx-auto h-64 w-3/4 rounded-full bg-gradient-to-tr from-sky-400 via-cyan-400 to-teal-400" />
            </div>
            <div aria-hidden className="pointer-events-none absolute -left-20 top-28 -z-10 h-80 w-80 rounded-full bg-cyan-300/25 blur-[90px] dark:bg-cyan-500/25" />
            <div aria-hidden className="pointer-events-none absolute -right-16 top-[34rem] -z-10 h-72 w-72 rounded-full bg-sky-300/18 blur-[92px] dark:bg-indigo-500/22" />

            {/* Error banner (non-blocking) */}
            {error && (
                <div className="px-4 pt-4 max-w-7xl mx-auto">
                    <Alert color="failure" onDismiss={() => setError(null)}>
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                            <span>{error}</span>
                            <Button size="sm" className="btn-aqua" onClick={retry}>
                                Retry
                            </Button>
                        </div>
                    </Alert>
                </div>
            )}

            {/* Hero */}
            <Suspense fallback={<div className="h-72 sm:h-80 lg:h-96" />}>
                <Hero />
            </Suspense>

            <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-20">
                {/* Stats */}
                <section className="relative" aria-labelledby="community-impact">
                    <div className="macos-panel macos-panel--wide liquid-hybrid-panel">
                        <div className="macos-panel__grid p-6 sm:p-8 lg:p-10 space-y-8">
                            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                                <div>
                                    <p className="text-sm uppercase tracking-widest text-sky-500 dark:text-sky-400 font-semibold">
                                        Community Impact
                                    </p>
                                    <h2
                                        id="community-impact"
                                        className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white"
                                    >
                                        Built for learners who never stop exploring
                                    </h2>
                                </div>
                                <p className="text-base sm:text-lg max-w-xl text-gray-600 dark:text-gray-300">
                                    From your first line of code to launching your startup, ScientistShield grows with you by blending
                                    curated learning, interactive practice, and a vibrant community.
                                </p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                                {stats.map(({ icon: Icon, label, value, description }) => (
                                    <div
                                        key={label}
                                        className="macos-tile liquid-hybrid-tile group p-6"
                                    >
                                        <div className="flex items-center gap-4">
                                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white text-2xl shadow-md">
                                                <Icon aria-hidden />
                                            </span>
                                            <div>
                                                <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                                                    {label}
                                                </p>
                                                <p className="text-3xl font-black text-slate-900 dark:text-white">{value}</p>
                                            </div>
                                        </div>
                                        <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">{description}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                {/* Highlights */}
                <section className="space-y-10" aria-labelledby="why-scientistshield">
                    <div className="text-center max-w-3xl mx-auto space-y-3">
                        <p className="text-sm uppercase tracking-[0.4em] text-sky-500 dark:text-sky-400 font-semibold">
                            Why ScientistShield
                        </p>
                        <h2
                            id="why-scientistshield"
                            className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white"
                        >
                            Everything you need to learn, build, and stand out
                        </h2>
                        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                            Purpose-built experiences combine human guidance with hands-on challenges, so your next breakthrough is
                            always within reach.
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
                        {highlights.map(({ icon: Icon, title, description }) => (
                            <article
                                key={title}
                                className="macos-tile liquid-hybrid-tile group relative overflow-hidden p-8"
                            >
                                <div className="absolute inset-0 bg-gradient-to-br from-sky-200/0 via-sky-200/0 to-sky-200/20 dark:from-sky-500/0 dark:via-sky-500/0 dark:to-sky-500/15 transition-opacity duration-300 group-hover:opacity-100" />
                                <div className="relative flex items-start gap-5">
                                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xl shadow">
                                        <Icon aria-hidden />
                                    </span>
                                    <div>
                                        <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
                                        <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                            {description}
                                        </p>
                                    </div>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                {/* Categories */}
                <section
                    aria-labelledby="learn-tech"
                    className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden rounded-3xl p-8 sm:p-10"
                >
                    <h2
                        id="learn-tech"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Learn Technology for Free
                    </h2>
                    <p className="max-w-3xl mx-auto text-center text-gray-600 dark:text-gray-300 mb-12 text-base sm:text-lg">
                        Dive into bite-sized lessons and deep-dive guides created by industry veterans. Pick a topic to begin your
                        personalized learning sprint.
                    </p>

                    <Suspense
                        fallback={
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {Array.from({ length: 6 }).map((_, i) => (
                                    <CategoryCardSkeleton key={i} />
                                ))}
                            </div>
                        }
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {categories.map((c, idx) => (
                                <div
                                    key={c.title}
                                    className="animate-card-fade-in"
                                    style={{ animationDelay: c.delay || `${0.1 + idx * 0.1}s` }}
                                >
                                    <CategoryCard
                                        title={c.title}
                                        description={c.description}
                                        linkTo={c.linkTo}
                                        gradient={c.gradient}
                                        className="hover:scale-[1.02] transition-transform duration-300"
                                    />
                                </div>
                            ))}
                        </div>
                    </Suspense>

                    <div className="flex justify-center mt-10">
                        <Link to="/tutorials">
                            <Button pill className="btn-aqua">
                                Explore All Categories
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* Problem Solving Feature */}
                <section className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden p-10" aria-labelledby="problem-solving">
                    <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
                        <div className="space-y-4">
                            <p className="inline-flex items-center gap-2 rounded-full bg-cyan-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                                Inspired by GeeksforGeeks
                            </p>
                            <h2 id="problem-solving" className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white">
                                Master computer science problem solving
                            </h2>
                            <p className="text-base sm:text-lg text-gray-600 dark:text-gray-300">
                                Tackle curated algorithmic challenges with structured hints, detailed editorials, and reference implementations. Practice in a focused environment that mirrors real interviews and competitions.
                            </p>
                            <ul className="grid gap-3 sm:grid-cols-2 text-sm text-gray-700 dark:text-gray-200">
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                    Progressive difficulty levels from warm-up to advanced puzzles.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                    Rich sample cases, constraints, and interactive hints to guide your approach.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                    Editorial write-ups and solution snippets in multiple languages.
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="mt-1 inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
                                    Track trending topics and focus on the skills hiring managers expect.
                                </li>
                            </ul>
                            <div className="flex flex-wrap gap-4 pt-4">
                                <Link to="/problems">
                                    <Button size="lg" className="btn-aqua">
                                        Start solving problems
                                    </Button>
                                </Link>
                                {currentUser?.isAdmin && (
                                    <Link to="/create-problem">
                                        <Button size="lg" className="btn-glass-secondary">
                                            Contribute a challenge
                                        </Button>
                                    </Link>
                                )}
                            </div>
                        </div>
                        <div className="liquid-hybrid-tile relative overflow-hidden rounded-3xl p-6">
                            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-transparent to-indigo-500/10" />
                            <div className="relative space-y-4">
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Daily challenge preview</h3>
                                <div className="liquid-hybrid-tile rounded-2xl p-4">
                                    <p className="text-sm font-semibold text-cyan-600 dark:text-cyan-300">Dynamic Programming · Medium</p>
                                    <p className="mt-2 font-bold text-gray-900 dark:text-white">Optimize workshop scheduling</p>
                                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                                        Given N workshops with start/end times and profit, compute the maximum profit without overlapping sessions.
                                    </p>
                                    <div className="mt-4 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                                        <span className="rounded-full bg-cyan-100 px-3 py-1 font-semibold text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">Success rate 42%</span>
                                        <span className="rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700 dark:bg-gray-800/70 dark:text-gray-200">1.2k submissions</span>
                                    </div>
                                </div>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Solve it now and compare approaches with the community&apos;s editorial breakdown.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Code Playground */}
                <section
                    aria-labelledby="playground"
                    className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden rounded-3xl p-8 sm:p-10"
                >
                    <h2
                        id="playground"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Interactive Code Playground
                    </h2>
                    <Suspense fallback={<EditorSkeleton />}>
                        <CodeEditor workspaceId='home-playground' />
                    </Suspense>
                </section>

                {/* Learning Path */}
                <section aria-labelledby="learning-journey" className="relative">
                    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-indigo-100/60 via-transparent to-sky-100/60 dark:from-indigo-900/40 dark:via-transparent dark:to-sky-900/40 rounded-3xl" />
                    <div className="liquid-hybrid-panel rounded-3xl p-8 sm:p-10 space-y-10">
                        <div className="text-center space-y-4">
                            <p className="text-sm uppercase tracking-[0.4em] text-indigo-500 dark:text-indigo-400 font-semibold">
                                Your Journey
                            </p>
                            <h2
                                id="learning-journey"
                                className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white"
                            >
                                Chart a clear path from curiosity to mastery
                            </h2>
                            <p className="max-w-3xl mx-auto text-base sm:text-lg text-gray-600 dark:text-gray-300">
                                Each stage is designed to keep you motivated with achievable wins, meaningful collaboration, and
                                visible progress.
                            </p>
                        </div>
                        <ol className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                            {learningPath.map(({ step, title, description, icon: Icon }) => (
                                <li
                                    key={step}
                                    className="liquid-hybrid-tile relative rounded-3xl border border-transparent p-6 shadow-lg"
                                >
                                    <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-widest">
                                        <Icon aria-hidden className="text-base" />
                                        {step}
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">{title}</h3>
                                    <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                                        {description}
                                    </p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                {/* Recent Posts */}
                <section
                    aria-labelledby="recent-articles"
                    className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden rounded-3xl p-8 sm:p-10"
                >
                    <h2
                        id="recent-articles"
                        className="text-3xl sm:text-4xl font-bold text-center mb-12 text-gray-800 dark:text-gray-200"
                    >
                        Recently Published Articles
                    </h2>

                    {loading ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <PostCardSkeleton key={i} />
                            ))}
                        </div>
                    ) : latestPosts.length > 0 ? (
                        <Suspense
                            fallback={
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {Array.from({ length: 6 }).map((_, i) => (
                                        <PostCardSkeleton key={i} />
                                    ))}
                                </div>
                            }
                        >
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                                {latestPosts.map((post, index) => (
                                    <div
                                        key={post._id || index}
                                        className="animate-card-fade-in"
                                        style={{ animationDelay: `${0.2 + index * 0.1}s` }}
                                    >
                                        <PostCard post={post} />
                                    </div>
                                ))}
                            </div>
                        </Suspense>
                    ) : (
                        <div className="text-center text-gray-500 dark:text-gray-400">
                            No articles found yet. Check back soon!
                        </div>
                    )}

                    <div className="flex justify-center mt-10">
                        <Link to="/search">
                            <Button pill className="btn-glass-secondary">
                                View All Articles
                            </Button>
                        </Link>
                    </div>
                </section>

                {/* CTA */}
                <section
                    aria-labelledby="join-community"
                    className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden rounded-3xl"
                >
                    <div className="absolute inset-0 -z-10 hidden dark:block bg-gradient-to-r from-sky-500 via-indigo-500 to-purple-600" />
                    <div className="relative px-6 py-12 sm:px-12 sm:py-16 flex flex-col lg:flex-row items-center lg:items-end lg:justify-between gap-8 text-slate-900 dark:text-white">
                        <div className="space-y-4 max-w-2xl">
                            <p className="text-sm uppercase tracking-[0.4em] text-indigo-600 dark:text-white/80 font-semibold">
                                Join the community
                            </p>
                            <h2 id="join-community" className="text-3xl sm:text-4xl font-extrabold">
                                Ready to craft the next chapter of your developer story?
                            </h2>
                            <p className="text-base sm:text-lg text-slate-600 dark:text-white/90">
                                Create a free account, unlock personalized learning spaces, and start collaborating with mentors and peers today.
                            </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-4">
                            <Link to="/sign-up">
                                <Button
                                    pill
                                    size="lg"
                                    className="btn-aqua"
                                >
                                    Create free account
                                </Button>
                            </Link>
                            <Link to="/about">
                                <Button
                                    pill
                                    size="lg"
                                    className="btn-glass-secondary"
                                >
                                    Learn more
                                </Button>
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
