import { Link } from 'react-router-dom';
import { Alert, Button } from 'flowbite-react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import {
    HiOutlineAcademicCap,
    HiOutlineArrowRightCircle,
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

const Hero = lazy(() => import('../components/Hero'));
const CategoryCard = lazy(() => import('../components/CategoryCard'));
const CodeEditor = lazy(() => import('../components/CodeEditor'));
const PostCard = lazy(() => import('../components/PostCard'));

function SectionHeader({ eyebrow, title, description, id, align = 'left', action = null }) {
    const alignmentClass = align === 'center' ? 'mx-auto max-w-3xl text-center' : 'max-w-3xl';
    const actionClass = align === 'center' ? 'flex justify-center pt-1' : 'pt-1';

    return (
        <div className={`${alignmentClass} space-y-4`}>
            <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.34em]">{eyebrow}</p>
            <div className="space-y-3">
                <h2 id={id} className="theme-ink-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                    {title}
                </h2>
                <p className="theme-ink-secondary text-base leading-7 sm:text-lg">{description}</p>
            </div>
            {action ? <div className={actionClass}>{action}</div> : null}
        </div>
    );
}

function CategoryCardSkeleton() {
    return (
        <div className="liquid-hybrid-tile rounded-2xl p-6 animate-pulse">
            <div className="mb-3 h-8 w-1/2 rounded bg-slate-200/85 dark:bg-slate-700/80" />
            <div className="mb-1.5 h-4 w-2/3 rounded bg-slate-200/85 dark:bg-slate-700/80" />
            <div className="h-4 w-1/3 rounded bg-slate-200/85 dark:bg-slate-700/80" />
        </div>
    );
}

function PostCardSkeleton() {
    return (
        <div className="liquid-hybrid-tile overflow-hidden rounded-2xl animate-pulse">
            <div className="h-40 bg-slate-200/85 dark:bg-slate-700/80" />
            <div className="p-4">
                <div className="mb-3 h-6 w-3/4 rounded bg-slate-200/85 dark:bg-slate-700/80" />
                <div className="mb-2 h-4 w-full rounded bg-slate-200/85 dark:bg-slate-700/80" />
                <div className="h-4 w-5/6 rounded bg-slate-200/85 dark:bg-slate-700/80" />
            </div>
        </div>
    );
}

function EditorSkeleton() {
    return (
        <div className="liquid-hybrid-tile rounded-2xl p-4 animate-pulse">
            <div className="mb-4 h-8 w-1/3 rounded bg-slate-200/85 dark:bg-slate-700/80" />
            <div className="h-64 rounded bg-slate-200/85 dark:bg-slate-700/80" />
        </div>
    );
}

export default function Home() {
    const { currentUser } = useSelector((state) => state.user);
    const [latestPosts, setLatestPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const missionControl = useMemo(
        () => [
            {
                icon: HiOutlineAcademicCap,
                eyebrow: 'Tutorials',
                title: 'Start a focused learning sprint',
                description: 'Open structured lessons and roadmaps built to move you from basics to production patterns.',
                metric: '120+ guided paths',
                kind: 'route',
                linkTo: '/tutorials',
            },
            {
                icon: HiOutlineCodeBracket,
                eyebrow: 'Practice',
                title: 'Solve real coding challenges',
                description: 'Work through curated problems with hints, editorials, and cleaner challenge surfaces.',
                metric: '340+ exercises',
                kind: 'route',
                linkTo: '/problems',
            },
            {
                icon: HiOutlineSparkles,
                eyebrow: 'Tools',
                title: 'Open the lab instantly',
                description: 'Jump into the reader, playground, and visualizers whenever an idea needs a quick test.',
                metric: 'Studio utilities',
                kind: 'route',
                linkTo: '/tools',
            },
            {
                icon: HiOutlineChartBar,
                eyebrow: 'Articles',
                title: 'Catch the latest signal',
                description: 'Move straight to fresh posts and community thinking when you want ideas instead of drills.',
                metric: 'Recent publishing',
                kind: 'scroll',
                targetId: 'recent-articles',
            },
        ],
        []
    );

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
                description: 'A global network of curious builders and practical learners.',
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
                description: 'Clearer feedback loops help you see momentum and choose the next skill on purpose.',
            },
            {
                icon: HiOutlineShieldCheck,
                title: 'Quality you can trust',
                description: 'Every tutorial is reviewed for clarity, accuracy, and accessibility before it reaches the feed.',
            },
            {
                icon: HiOutlineRocketLaunch,
                title: 'Portfolio-ready output',
                description: 'Turn practice into publishable work with projects, articles, and challenge write-ups.',
            },
        ],
        []
    );

    const workspacePrinciples = useMemo(
        () => [
            {
                title: 'Focused sessions',
                description: 'Keep lessons, drills, and reading in a predictable rhythm for longer study blocks.',
            },
            {
                title: 'Direct action',
                description: 'Start a lesson, solve a problem, open a tool, or read new ideas from a single hub.',
            },
            {
                title: 'Connected progress',
                description: 'Move from discovery to practice to publishing while keeping context intact.',
            },
        ],
        []
    );

    const learningPath = useMemo(
        () => [
            {
                step: 'Discover',
                title: 'Find what inspires you',
                description: 'Browse curated categories, trending topics, and tailored recommendations aligned with your goals.',
                icon: HiOutlineLightBulb,
            },
            {
                step: 'Practice',
                title: 'Build with confidence',
                description: 'Tackle guided projects and quizzes that apply concepts immediately in a supportive environment.',
                icon: HiOutlineCodeBracket,
            },
            {
                step: 'Collaborate',
                title: 'Learn alongside others',
                description: 'Join study circles, request feedback, and pair-program with a global network of builders.',
                icon: HiOutlineUsers,
            },
            {
                step: 'Showcase',
                title: 'Share your progress',
                description: 'Publish articles, host demos, and let your portfolio tell a story recruiters remember.',
                icon: HiOutlineChartBar,
            },
        ],
        []
    );

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

    const challengeTracks = useMemo(
        () => [
            {
                label: 'Warm-up',
                title: 'Core patterns',
                description: 'Start with arrays, strings, and greedy moves before stepping into heavier material.',
            },
            {
                label: 'Mid sprint',
                title: 'Hints on demand',
                description: 'Stay moving with progressive nudges instead of getting dropped into full solutions too early.',
            },
            {
                label: 'Mock mode',
                title: 'Timed review',
                description: 'Practice under pressure, then compare your approach against structured editorial notes.',
            },
        ],
        []
    );

    const primaryCta = useMemo(
        () =>
            currentUser
                ? {
                      to: '/dashboard',
                      label: 'Open dashboard',
                      description: 'Pick up where you left off and continue your latest sprint.',
                  }
                : {
                      to: '/sign-up',
                      label: 'Create free account',
                      description: 'Save progress, keep preferences, and make the workspace yours.',
                  },
        [currentUser]
    );

    useEffect(() => {
        let active = true;

        (async () => {
            setLoading(true);
            setError(null);
            try {
                const postsData = await getPosts('limit=6');
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

    const scrollToSection = (targetId) => {
        if (typeof document === 'undefined') return;
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderMissionCard = ({ icon: Icon, eyebrow, title, description, metric, kind, linkTo, targetId }) => {
        const content = (
            <>
                <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-teal-400 text-white shadow-[0_18px_40px_-22px_rgba(14,165,233,0.55)]">
                        <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="theme-ink-muted text-[11px] font-semibold uppercase tracking-[0.28em]">
                        {metric}
                    </span>
                </div>
                <div className="mt-6 space-y-3">
                    <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">{eyebrow}</p>
                    <h3 className="theme-ink-primary text-xl font-semibold">{title}</h3>
                    <p className="theme-ink-secondary text-sm leading-7">{description}</p>
                </div>
                <div className="theme-ink-accent mt-6 inline-flex items-center gap-2 text-sm font-semibold">
                    Open space
                    <HiOutlineArrowRightCircle className="h-4 w-4" aria-hidden />
                </div>
            </>
        );

        if (kind === 'scroll') {
            return (
                <div
                    key={title}
                    role="button"
                    tabIndex={0}
                    onClick={() => scrollToSection(targetId)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            scrollToSection(targetId);
                        }
                    }}
                    className="home-launch-card block h-full w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                    {content}
                </div>
            );
        }

        return (
            <Link key={title} to={linkTo} className="home-launch-card block h-full">
                {content}
            </Link>
        );
    };

    return (
        <main className="workspace-page liquid-app-shell relative min-h-screen pb-16">
            {error ? (
                <div className="workspace-page__content workspace-page__content--xl px-4 pt-4 sm:px-6 lg:px-8">
                    <Alert color="failure" onDismiss={() => setError(null)}>
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <span>{error}</span>
                            <button
                                type="button"
                                className="inline-flex min-h-10 items-center justify-center rounded-full border border-sky-400/70 bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_16px_34px_-20px_rgba(14,116,244,0.7)] transition hover:bg-sky-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/80"
                                style={{ background: 'linear-gradient(135deg, #0284c7, #0ea5e9)' }}
                                onClick={retry}
                            >
                                Retry
                            </button>
                        </div>
                    </Alert>
                </div>
            ) : null}

            <Suspense fallback={<div className="h-72 sm:h-80 lg:h-96" />}>
                <Hero />
            </Suspense>

            <div className="workspace-page__content workspace-page__content--xl space-y-20 px-4 pt-4 sm:px-6 lg:px-8">
                <section aria-labelledby="mission-control" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel liquid-hybrid-band rounded-[2rem] p-8 sm:p-10">
                        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
                            <SectionHeader
                                eyebrow="Mission Control"
                                id="mission-control"
                                title="Pick the next action without hunting for it."
                                description="Start a lesson, solve a problem, open a tool, or scan new writing from one focused place."
                            />
                                <div className="flex flex-wrap gap-3">
                                    <span className="macos-chip macos-chip--accent">
                                        <span className="macos-chip__dot bg-sky-500" aria-hidden />
                                    Fast starts
                                    </span>
                                    <span className="macos-chip macos-chip--ghost">
                                        <span className="macos-chip__dot bg-emerald-500" aria-hidden />
                                    Focused sessions
                                    </span>
                                </div>
                        </div>
                        <div className="home-launch-grid mt-10">
                            {missionControl.map(renderMissionCard)}
                        </div>
                    </div>
                </section>

                <section aria-labelledby="community-impact" className="scroll-mt-24">
                    <div className="macos-panel macos-panel--wide liquid-hybrid-panel overflow-hidden">
                        <div className="home-metrics-stage">
                            <div className="space-y-6">
                                <SectionHeader
                                    eyebrow="Community Impact"
                                    id="community-impact"
                                    title="Built for learners who want momentum, not clutter."
                                    description="ScientistShield blends guided learning, practice loops, and publishing surfaces so progress feels continuous across every session."
                                />
                                <div className="flex flex-wrap gap-3">
                                    <span className="macos-chip macos-chip--accent">Desktop-grade navigation</span>
                                    <span className="macos-chip macos-chip--ghost">Readable, calmer surfaces</span>
                                    <span className="macos-chip macos-chip--ghost">Direct next-step cues</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                                {stats.map(({ icon: Icon, label, value, description }) => (
                                    <article key={label} className="home-metric-card macos-tile liquid-hybrid-tile group p-6">
                                        <div className="flex items-center gap-4">
                                            <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-indigo-500 text-2xl text-white shadow-[0_18px_40px_-22px_rgba(14,165,233,0.6)]">
                                                <Icon aria-hidden />
                                            </span>
                                            <div>
                                                <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.28em]">
                                                    {label}
                                                </p>
                                                <p className="theme-ink-primary text-3xl font-black">{value}</p>
                                            </div>
                                        </div>
                                        <p className="theme-ink-secondary mt-4 text-sm leading-7">{description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>

                <section aria-labelledby="why-scientistshield" className="scroll-mt-24">
                    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
                        <div className="liquid-hybrid-panel liquid-hybrid-band rounded-[2rem] p-8 sm:p-10">
                            <SectionHeader
                                eyebrow="Why ScientistShield"
                                id="why-scientistshield"
                                title="Build a learning loop that keeps moving."
                                description="ScientistShield combines lessons, challenges, tools, articles, and community feedback so each session can end with a useful next step."
                            />
                            <div className="mt-8 grid gap-4 md:grid-cols-2">
                                {highlights.map(({ icon: Icon, title, description }) => (
                                    <article key={title} className="home-feature-card macos-tile liquid-hybrid-tile p-6">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-xl text-white shadow-[0_18px_36px_-22px_rgba(59,130,246,0.55)]">
                                            <Icon aria-hidden />
                                        </span>
                                        <h3 className="theme-ink-primary mt-5 text-xl font-semibold">{title}</h3>
                                        <p className="theme-ink-secondary mt-3 text-sm leading-7">{description}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <aside className="home-focus-panel">
                            <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.32em]">
                                Experience System
                            </p>
                            <h3 className="theme-ink-primary text-2xl font-bold">
                                Long study sessions should feel calmer, not denser.
                            </h3>
                            <div className="space-y-3">
                                {workspacePrinciples.map(({ title, description }) => (
                                    <article key={title} className="home-focus-item">
                                        <h4 className="theme-ink-primary text-base font-semibold">{title}</h4>
                                        <p className="theme-ink-secondary mt-2 text-sm leading-6">{description}</p>
                                    </article>
                                ))}
                            </div>
                            <div className="flex flex-wrap gap-4 pt-2">
                                <Button as={Link} to="/tools" pill className="btn-aqua">
                                    Open tools
                                </Button>
                                <Button as={Link} to="/about" pill className="btn-glass-secondary">
                                    Learn more
                                </Button>
                            </div>
                        </aside>
                    </div>
                </section>

                <section id="learn-tech" aria-labelledby="learn-tech-heading" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel liquid-hybrid-band rounded-[2rem] p-8 sm:p-10">
                        <SectionHeader
                            align="center"
                            eyebrow="Learning Library"
                            id="learn-tech-heading"
                            title="Choose a technology lane and get moving."
                            description="Start with small wins or dive deep into a stack. Each path points you toward focused lessons and practice."
                        />

                        <Suspense
                            fallback={
                                <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <CategoryCardSkeleton key={index} />
                                    ))}
                                </div>
                            }
                        >
                            <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                                {categories.map((category, index) => (
                                    <div
                                        key={category.title}
                                        className="animate-card-fade-in"
                                        style={{ animationDelay: category.delay || `${0.1 + index * 0.1}s` }}
                                    >
                                        <CategoryCard
                                            title={category.title}
                                            description={category.description}
                                            linkTo={category.linkTo}
                                            gradient={category.gradient}
                                            className="hover:scale-[1.02] transition-transform duration-300"
                                        />
                                    </div>
                                ))}
                            </div>
                        </Suspense>

                        <div className="mt-10 flex justify-center">
                            <Button as={Link} to="/tutorials" pill className="btn-aqua">
                                Explore all categories
                            </Button>
                        </div>
                    </div>
                </section>

                <section id="problem-solving" aria-labelledby="problem-solving-heading" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel liquid-hybrid-band relative overflow-hidden rounded-[2rem] p-8 sm:p-10">
                        <div
                            aria-hidden
                            className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.18),transparent_58%)]"
                        />
                        <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1.02fr)_minmax(320px,0.98fr)]">
                            <div className="space-y-6">
                                <SectionHeader
                                    eyebrow="Challenge Studio"
                                    id="problem-solving-heading"
                                    title="Practice computer science with clearer progression."
                                    description="Work through progressive challenges with structured help, sample tests, and editorials when you need them."
                                />
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="liquid-hybrid-tile rounded-3xl p-5">
                                        <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">
                                            Progressive difficulty
                                        </p>
                                        <p className="theme-ink-secondary mt-3 text-sm leading-7">
                                            Move from warm-up prompts to interview-style problems without losing the sense of progression.
                                        </p>
                                    </div>
                                    <div className="liquid-hybrid-tile rounded-3xl p-5">
                                        <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">
                                            Editorial support
                                        </p>
                                        <p className="theme-ink-secondary mt-3 text-sm leading-7">
                                            Use hints, samples, and write-ups at the right moment instead of all at once.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <Button as={Link} to="/problems" size="lg" className="btn-aqua">
                                        Start solving problems
                                    </Button>
                                    {currentUser?.isAdmin ? (
                                        <Button as={Link} to="/create-problem" size="lg" className="btn-glass-secondary">
                                            Contribute a challenge
                                        </Button>
                                    ) : null}
                                </div>
                            </div>

                            <div className="home-problem-board">
                                <div className="liquid-hybrid-tile rounded-[1.75rem] p-5">
                                    <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">
                                        Daily challenge preview
                                    </p>
                                    <h3 className="theme-ink-primary mt-3 text-2xl font-bold">
                                        Optimize workshop scheduling
                                    </h3>
                                    <p className="theme-ink-secondary mt-3 text-sm leading-7">
                                        Given N workshops with start and end times plus a profit value, compute the maximum profit
                                        without overlapping sessions.
                                    </p>
                                    <div className="mt-5 flex flex-wrap gap-3 text-xs font-semibold">
                                        <span className="rounded-full bg-cyan-100 px-3 py-1 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                                            Dynamic programming
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                                            Medium difficulty
                                        </span>
                                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800/70 dark:text-slate-200">
                                            1.2k submissions
                                        </span>
                                    </div>
                                </div>

                                <div className="home-problem-grid mt-4">
                                    {challengeTracks.map(({ label, title, description }) => (
                                        <article key={title} className="liquid-hybrid-tile rounded-[1.5rem] p-5">
                                            <p className="theme-ink-muted text-[11px] font-semibold uppercase tracking-[0.24em]">
                                                {label}
                                            </p>
                                            <h4 className="theme-ink-primary mt-3 text-lg font-semibold">{title}</h4>
                                            <p className="theme-ink-secondary mt-3 text-sm leading-6">{description}</p>
                                        </article>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="playground" aria-labelledby="playground-heading" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel liquid-hybrid-band rounded-[2rem] p-8 sm:p-10">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <SectionHeader
                                eyebrow="Playground"
                                id="playground-heading"
                                title="Experiment while the idea is still fresh."
                                description="Try snippets quickly while you read, compare approaches, or sketch the next idea."
                            />
                            <div className="flex flex-wrap gap-3">
                                <span className="macos-chip macos-chip--ghost">Instant feedback</span>
                                <span className="macos-chip macos-chip--accent">In-browser coding</span>
                            </div>
                        </div>
                        <div className="mt-8">
                            <Suspense fallback={<EditorSkeleton />}>
                                <CodeEditor workspaceId="home-playground" />
                            </Suspense>
                        </div>
                    </div>
                </section>

                <section id="learning-journey" aria-labelledby="learning-journey-heading" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel rounded-[2rem] p-8 sm:p-10">
                        <SectionHeader
                            align="center"
                            eyebrow="Journey"
                            id="learning-journey-heading"
                            title="Move from curiosity to a repeatable learning system."
                            description="Discover the topic, practice the idea, collaborate for feedback, then publish proof of what you built."
                        />
                        <ol className="mt-10 grid grid-cols-1 gap-4 lg:grid-cols-4">
                            {learningPath.map(({ step, title, description, icon: Icon }) => (
                                <li key={step} className="home-journey-card">
                                    <div className="flex items-center gap-3">
                                        <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-900 to-slate-700 text-white shadow-[0_18px_36px_-22px_rgba(15,23,42,0.5)] dark:from-white dark:to-slate-200 dark:text-slate-900">
                                            <Icon aria-hidden className="text-xl" />
                                        </span>
                                        <span className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white dark:bg-white dark:text-slate-900">
                                            {step}
                                        </span>
                                    </div>
                                    <h3 className="theme-ink-primary mt-6 text-xl font-semibold">{title}</h3>
                                    <p className="theme-ink-secondary mt-3 text-sm leading-7">{description}</p>
                                </li>
                            ))}
                        </ol>
                    </div>
                </section>

                <section id="recent-articles" aria-labelledby="recent-articles-heading" className="scroll-mt-24">
                    <div className="liquid-hybrid-panel liquid-hybrid-band rounded-[2rem] p-8 sm:p-10">
                        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                            <SectionHeader
                                eyebrow="Recent Articles"
                                id="recent-articles-heading"
                                title="Fresh writing for your next study sprint."
                                description="Read practical notes, platform updates, and community posts when you want context before the next lesson or challenge."
                            />
                            <Button as={Link} to="/search" pill className="btn-glass-secondary">
                                View all articles
                            </Button>
                        </div>

                        <div className="mt-10">
                            {loading ? (
                                <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                    {Array.from({ length: 6 }).map((_, index) => (
                                        <PostCardSkeleton key={index} />
                                    ))}
                                </div>
                            ) : latestPosts.length > 0 ? (
                                <Suspense
                                    fallback={
                                        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                                            {Array.from({ length: 6 }).map((_, index) => (
                                                <PostCardSkeleton key={index} />
                                            ))}
                                        </div>
                                    }
                                >
                                    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
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
                                <div className="theme-ink-muted rounded-3xl border border-dashed border-slate-300/70 px-6 py-12 text-center dark:border-slate-700">
                                    No articles found yet. Check back soon.
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                <section id="join-community" aria-labelledby="join-community-heading" className="scroll-mt-24">
                    <div className="home-cta-panel">
                        <div className="space-y-5">
                            <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.34em]">
                                Next Step
                            </p>
                            <h2 id="join-community-heading" className="theme-ink-primary text-3xl font-extrabold tracking-tight sm:text-4xl">
                                Turn the workspace into your operating system for learning.
                            </h2>
                            <p className="theme-ink-secondary max-w-2xl text-base leading-8 sm:text-lg">
                                {primaryCta.description} Keep tutorials, problems, tools, articles, and community feedback close to
                                the work you are already doing.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Button as={Link} to={primaryCta.to} pill size="lg" className="btn-aqua">
                                    {primaryCta.label}
                                </Button>
                                <Button as={Link} to="/community" pill size="lg" className="btn-glass-secondary">
                                    Visit community
                                </Button>
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="liquid-hybrid-tile rounded-[1.5rem] p-5">
                                <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.28em]">
                                    Surfaces
                                </p>
                                <p className="theme-ink-primary mt-3 text-2xl font-black">Connected</p>
                                <p className="theme-ink-secondary mt-2 text-sm leading-6">
                                    Tutorials, articles, challenges, and tools stay close to the same learning path.
                                </p>
                            </div>
                            <div className="liquid-hybrid-tile rounded-[1.5rem] p-5">
                                <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.28em]">
                                    Navigation
                                </p>
                                <p className="theme-ink-primary mt-3 text-2xl font-black">Direct</p>
                                <p className="theme-ink-secondary mt-2 text-sm leading-6">
                                    Mission control cards help you jump to the next useful action quickly.
                                </p>
                            </div>
                            <div className="liquid-hybrid-tile rounded-[1.5rem] p-5">
                                <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.28em]">
                                    Reading pace
                                </p>
                                <p className="theme-ink-primary mt-3 text-2xl font-black">Calmer</p>
                                <p className="theme-ink-secondary mt-2 text-sm leading-6">
                                    Focused reading, compact actions, and steady pacing support longer sessions.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
