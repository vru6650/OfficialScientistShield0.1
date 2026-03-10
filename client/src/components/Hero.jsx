import { Link, useNavigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useMemo, useState } from 'react';

import { TypeAnimation } from 'react-type-animation';
import { HiMagnifyingGlass, HiOutlineArrowRightCircle, HiOutlineSparkles } from 'react-icons/hi2';

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
            { label: 'System design', value: 'System design' },
            { label: 'Dynamic programming', value: 'Dynamic programming' },
        ],
        []
    );

    const heroStatus = useMemo(
        () => [
            { label: 'Wallpaper', value: 'Liquid glass auroras' },
            { label: 'Chrome', value: 'Depth, caustics, blur' },
            { label: 'Flow', value: 'Windowed workspace' },
        ],
        []
    );

    const handleSearch = (e) => {
        e.preventDefault();
        const params = new URLSearchParams();
        const trimmedQuery = searchQuery.trim();
        if (trimmedQuery !== '') {
            params.set('searchTerm', trimmedQuery);
        }
        const queryString = params.toString();
        navigate(queryString ? `/search?${queryString}` : '/search');
    };

    return (
        <section className="macos-hero-shell liquid-app-shell relative overflow-hidden py-space-4xl px-4 sm:px-8 lg:px-12 min-h-[520px] flex items-center justify-center">
            {showParticles ? (
                <Suspense fallback={null}>
                    <ParticlesBackground />
                </Suspense>
            ) : null}
            <div
                aria-hidden
                className="pointer-events-none absolute -top-24 left-[-10%] h-[360px] w-[380px] rounded-full bg-sky-400/25 blur-[86px] dark:bg-sky-500/28"
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -top-16 right-[-8%] h-[320px] w-[340px] rounded-full bg-cyan-300/22 blur-[88px] dark:bg-cyan-400/22"
            />

            <div className="macos-hero-window macos-hero-window--hybrid liquid-hybrid-panel macos-window macos-window--focused relative z-10">
                <div className="macos-hero-titlebar">
                    <div className="macos-hero-lights" aria-hidden>
                        <span className="macos-hero-light macos-hero-light--red" />
                        <span className="macos-hero-light macos-hero-light--amber" />
                        <span className="macos-hero-light macos-hero-light--green" />
                    </div>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
                        <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                        macOS Liquid Glass Studio
                    </div>
                    <span className="macos-hero-pill">
                        <HiOutlineArrowRightCircle aria-hidden />
                        Press ⌘K for command search
                    </span>
                </div>

                <div className="space-y-8 text-center">
                    <div className="flex justify-center">
                        <span className="macos-hero-ribbon">
                            <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                            Liquid glass finish
                        </span>
                    </div>
                    <p className="text-xs uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300 font-semibold">
                        ScientistShield · Desktop-grade workspace
                    </p>
                    <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold leading-tight">
                        <span className="macos-hero-gradient inline-block">
                            <TypeAnimation
                                sequence={[
                                    'Build in macOS Liquid Glass mode',
                                    2000,
                                    'Glide through native, tactile UI',
                                    2000,
                                    'Ship polished projects faster',
                                    2000,
                                ]}
                                wrapper="span"
                                speed={50}
                                repeat={Infinity}
                            />
                        </span>
                    </h1>
                    <p className="text-lg sm:text-xl max-w-3xl mx-auto text-[var(--color-text-secondary)]">
                        Liquid glass wallpaper with live caustics, translucent chrome, and tactile controls mirror the latest macOS aesthetic so the workspace stays calm while you explore tutorials, posts, and tools.
                    </p>

                    <form onSubmit={handleSearch} className="macos-command liquid-hybrid-tile mx-auto max-w-3xl">
                        <HiMagnifyingGlass className="macos-command__icon" aria-hidden />
                        <input
                            type="text"
                            className="macos-command__input"
                            placeholder="Search tutorials, posts, and problems..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                        <button type="submit" className="btn-aqua macos-command__submit">
                            Start
                        </button>
                    </form>

                    <div className="flex justify-center">
                        <div className="desktop-status liquid-hybrid-panel">
                            <div className="desktop-status__chip">
                                <span className="desktop-status__dot" aria-hidden />
                                Liquid glass
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
                        <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300">
                            Popular shortcuts
                        </p>
                        <div className="macos-chip-row justify-center">
                            {quickFilters.map((filter) => (
                                <Link
                                    key={filter.value}
                                    to={`/search?searchTerm=${encodeURIComponent(filter.value)}`}
                                    className="macos-chip"
                                >
                                    <span className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_0_4px_rgba(10,132,255,0.15)]" aria-hidden />
                                    {filter.label}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
