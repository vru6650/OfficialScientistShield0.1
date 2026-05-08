import { Link, useNavigate } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import {
    HiMagnifyingGlass,
    HiOutlineAcademicCap,
    HiOutlineArrowRightCircle,
    HiOutlineChartBar,
    HiOutlineCodeBracket,
    HiOutlineSparkles,
} from 'react-icons/hi2';

const ParticlesBackground = lazy(() => import('./ParticlesBackground'));

export default function Hero() {
    const [searchQuery, setSearchQuery] = useState('');
    const [showParticles, setShowParticles] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const start = () => setShowParticles(true);
        const idle = typeof window !== 'undefined' && window.requestIdleCallback;
        const handle = idle ? idle(start) : setTimeout(start, 0);

        return () => {
            if (idle && typeof window.cancelIdleCallback === 'function') {
                window.cancelIdleCallback(handle);
            } else {
                clearTimeout(handle);
            }
        };
    }, []);

    const quickFilters = useMemo(
        () => [
            { label: 'JavaScript fundamentals', value: 'JavaScript' },
            { label: 'React component patterns', value: 'React' },
            { label: 'System design notes', value: 'System design' },
            { label: 'Dynamic programming drills', value: 'Dynamic programming' },
        ],
        []
    );

    const heroStatus = useMemo(
        () => [
            { label: 'Focus', value: 'Learn -> build -> publish' },
            { label: 'Mode', value: 'Guided practice' },
            { label: 'Access', value: 'Search-first' },
        ],
        []
    );

    const workspacePulse = useMemo(
        () => [
            {
                label: 'Tutorial studio',
                value: 'Guided tracks',
                description: 'Move from fundamentals to production patterns without losing context.',
            },
            {
                label: 'Challenge desk',
                value: 'Practice loops',
                description: 'Solve problems with hints, editorials, and a cleaner workspace rhythm.',
            },
            {
                label: 'Publishing lane',
                value: 'Fresh articles',
                description: 'Read new ideas, capture notes, and turn your progress into published work.',
            },
        ],
        []
    );

    const focusFlow = useMemo(
        () => [
            'Search any topic, tutorial, post, or problem from one command bar.',
            'Move between lessons, challenges, and tools without losing your place.',
            'Keep the next meaningful step close while you study, practice, and publish.',
        ],
        []
    );

    const jumpCards = useMemo(
        () => [
            {
                kind: 'route',
                title: 'Start a sprint',
                description: 'Jump into curated tutorials and learning paths.',
                linkTo: '/tutorials',
                icon: HiOutlineAcademicCap,
            },
            {
                kind: 'route',
                title: 'Solve a challenge',
                description: 'Open the problem workspace and practice with structure.',
                linkTo: '/problems',
                icon: HiOutlineCodeBracket,
            },
            {
                kind: 'route',
                title: 'Open the lab',
                description: 'Use reading tools, visualizers, and the code playground.',
                linkTo: '/tools',
                icon: HiOutlineSparkles,
            },
            {
                kind: 'scroll',
                title: 'Read the latest',
                description: 'Scan recently published articles without leaving the home flow.',
                targetId: 'recent-articles',
                icon: HiOutlineChartBar,
            },
        ],
        []
    );

    const handleSearch = (event) => {
        event.preventDefault();
        const params = new URLSearchParams();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery !== '') {
            params.set('searchTerm', trimmedQuery);
        }
        const queryString = params.toString();
        navigate(queryString ? `/search?${queryString}` : '/search');
    };

    const scrollToSection = (targetId) => {
        if (typeof document === 'undefined') return;
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const renderJumpCard = ({ kind, title, description, linkTo, targetId, icon: Icon }) => {
        const cardContent = (
            <>
                <div className="flex items-start justify-between gap-4">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 via-cyan-400 to-teal-400 text-white shadow-[0_18px_36px_-20px_rgba(14,165,233,0.55)]">
                        <Icon className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="theme-ink-muted text-[10px] font-semibold uppercase tracking-[0.28em]">
                        Jump
                    </span>
                </div>
                <div className="mt-5 space-y-2">
                    <h3 className="theme-ink-primary text-base font-semibold">{title}</h3>
                    <p className="theme-ink-secondary text-sm leading-6">{description}</p>
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
                    className="hero-jump-card block h-full w-full cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
                >
                    {cardContent}
                </div>
            );
        }

        return (
            <Link key={title} to={linkTo} className="hero-jump-card block h-full">
                {cardContent}
            </Link>
        );
    };

    return (
        <section className="macos-hero-shell liquid-app-shell relative overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
            {showParticles ? (
                <Suspense fallback={null}>
                    <ParticlesBackground />
                </Suspense>
            ) : null}

            <div className="macos-hero-window macos-hero-window--hybrid liquid-hybrid-panel macos-window macos-window--focused relative z-10">
                <div className="macos-hero-titlebar">
                    <div className="macos-hero-lights" aria-hidden>
                        <span className="macos-hero-light macos-hero-light--red" />
                        <span className="macos-hero-light macos-hero-light--amber" />
                        <span className="macos-hero-light macos-hero-light--green" />
                    </div>
                    <div className="theme-ink-muted flex items-center gap-2 text-[10px] uppercase tracking-[0.32em]">
                        <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                        ScientistShield Workspace
                    </div>
                    <span className="macos-hero-pill">
                        <HiOutlineArrowRightCircle aria-hidden />
                        Press ⌘K for command search
                    </span>
                </div>

                <div className="hero-studio-grid">
                    <div className="flex flex-col gap-8">
                        <div className="space-y-5 text-left">
                            <div className="flex flex-wrap items-center gap-3">
                                <span className="macos-hero-ribbon">
                                    <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                                    Guided learning studio
                                </span>
                                <span className="macos-chip macos-chip--accent text-[11px]">
                                    Practice-ready workspace
                                </span>
                            </div>
                            <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.34em]">
                                ScientistShield · Calm, desktop-grade learning studio
                            </p>
                            <div className="space-y-4">
                                <h1 className="theme-ink-primary text-4xl font-black leading-[0.95] sm:text-6xl lg:text-7xl">
                                    Learn, ship, and publish from
                                    <span className="macos-hero-gradient block pt-2">one focused workspace.</span>
                                </h1>
                                <p className="theme-ink-secondary max-w-2xl text-base leading-8 sm:text-lg">
                                    Follow structured tutorials, solve coding challenges, test ideas in the lab, and publish what you
                                    learn without breaking your study flow.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSearch} className="macos-command liquid-hybrid-tile mx-auto w-full max-w-3xl lg:mx-0">
                            <HiMagnifyingGlass className="macos-command__icon" aria-hidden />
                            <input
                                type="text"
                                aria-label="Search tutorials, posts, problems, or tools"
                                className="macos-command__input"
                                placeholder="Search tutorials, posts, problems, or tools..."
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                            />
                            <button type="submit" className="btn-aqua macos-command__submit">
                                Search
                            </button>
                        </form>

                        <div className="flex flex-wrap gap-4">
                            <Button as={Link} to="/tutorials" size="lg" pill className="btn-aqua">
                                Explore tutorials
                            </Button>
                            <Button as={Link} to="/problems" size="lg" pill className="btn-glass-secondary">
                                Solve problems
                            </Button>
                            <Button as={Link} to="/tools" size="lg" pill className="btn-glass-secondary">
                                Open tools
                            </Button>
                        </div>

                        <div className="flex justify-start">
                            <div className="desktop-status liquid-hybrid-panel">
                                <div className="desktop-status__chip">
                                    <span className="desktop-status__dot" aria-hidden />
                                    Study mode
                                </div>
                                <div className="desktop-status__divider" aria-hidden />
                                {heroStatus.map(({ label, value }) => (
                                    <div key={label} className="desktop-status__pill">
                                        <span className="desktop-status__label">{label}</span>
                                        <span className="desktop-status__value">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-3">
                            <p className="theme-ink-muted text-xs font-semibold uppercase tracking-[0.32em]">
                                Popular shortcuts
                            </p>
                            <div className="macos-chip-row">
                                {quickFilters.map((filter) => (
                                    <Link
                                        key={filter.value}
                                        to={`/search?searchTerm=${encodeURIComponent(filter.value)}`}
                                        className="macos-chip macos-chip--ghost"
                                    >
                                        <span
                                            className="macos-chip__dot bg-sky-500 shadow-[0_0_0_4px_rgba(10,132,255,0.15)]"
                                            aria-hidden
                                        />
                                        {filter.label}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4">
                        <article className="hero-signal-board">
                            <div className="flex items-start justify-between gap-3">
                                <div className="space-y-2">
                                    <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">
                                        Workspace pulse
                                    </p>
                                    <h2 className="theme-ink-primary text-2xl font-bold">
                                        Pick up the right tool for the moment.
                                    </h2>
                                </div>
                                <span className="macos-chip macos-chip--ghost text-[11px]">Live now</span>
                            </div>
                            <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                                {workspacePulse.map(({ label, value, description }) => (
                                    <article key={label} className="hero-signal-tile">
                                        <p className="theme-ink-muted text-[11px] font-semibold uppercase tracking-[0.24em]">
                                            {label}
                                        </p>
                                        <h3 className="theme-ink-primary mt-2 text-lg font-semibold">{value}</h3>
                                        <p className="theme-ink-secondary mt-3 text-sm leading-6">{description}</p>
                                    </article>
                                ))}
                            </div>
                        </article>

                        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.05fr)_minmax(260px,0.95fr)]">
                            <article className="hero-brief-panel">
                                <p className="theme-ink-accent text-xs font-semibold uppercase tracking-[0.28em]">
                                    Today in the workspace
                                </p>
                                <h2 className="theme-ink-primary mt-3 text-xl font-bold">
                                    Shorten the distance between intent and action.
                                </h2>
                                <div className="mt-5 space-y-3">
                                    {focusFlow.map((entry, index) => (
                                        <div key={entry} className="hero-activity-item">
                                            <span className="hero-activity-item__index">{index + 1}</span>
                                            <p className="theme-ink-secondary text-sm leading-6">{entry}</p>
                                        </div>
                                    ))}
                                </div>
                            </article>

                            <div className="hero-jump-grid">
                                {jumpCards.map(renderJumpCard)}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
