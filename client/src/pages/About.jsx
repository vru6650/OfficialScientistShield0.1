import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import {
    HiOutlineAcademicCap,
    HiOutlineArrowRightCircle,
    HiOutlineClipboardDocumentCheck,
    HiOutlineCpuChip,
    HiOutlineDevicePhoneMobile,
    HiOutlineGlobeAlt,
    HiOutlineLightBulb,
    HiOutlineLockClosed,
    HiOutlineRocketLaunch,
    HiOutlineSparkles,
    HiOutlineUserGroup,
} from 'react-icons/hi2';
import CallToAction from '../components/CallToAction';
import PageView from '../components/PageView.jsx';

const pillars = [
    {
        title: 'Guided, tactile learning',
        description: 'Tracks pair tutorials with runnable labs, checkpoints, and visualizers so you build—not just read.',
        accent: 'Hands-on labs',
        icon: HiOutlineSparkles,
    },
    {
        title: 'Community-first ethos',
        description: 'Mentors and peers review your work, pair program, and surface patterns that keep you unblocked.',
        accent: 'Coaching & feedback',
        icon: HiOutlineUserGroup,
    },
    {
        title: 'Research-backed practices',
        description: 'Accessibility, performance, and UX heuristics are baked into every pattern we ship.',
        accent: 'Quality guardrails',
        icon: HiOutlineAcademicCap,
    },
];

const milestones = [
    { year: 'Day 0', label: 'Join the space', detail: 'Pick a track, sync your dock, and pin the tools you need.' },
    { year: 'Week 1', label: 'Ship a mini-lab', detail: 'Complete your first build with reviewer feedback.' },
    { year: 'Month 1', label: 'Publish & teach', detail: 'Ship a tutorial, quiz, or problem and get it peer reviewed.' },
    { year: 'Month 3', label: 'Portfolio ready', detail: 'Polish UX, performance, and accessibility for production.' },
];

const signals = [
    { label: 'Learners', value: '52K', helper: 'Active across 90+ countries' },
    { label: 'Tracks', value: '120+', helper: 'Curated & reviewed pathways' },
    { label: 'Projects shipped', value: '18.4K', helper: 'Completed builds this year' },
    { label: 'Review SLA', value: '<18h', helper: 'Median mentor turnaround' },
];

const experiences = [
    {
        title: 'Desktop workspace',
        description: 'macOS-inspired dock, Mission Control, and Quick Look keep every tool one gesture away.',
        icon: HiOutlineDevicePhoneMobile,
        chips: ['Auto-hide dock', 'Window presets', 'Hot corners'],
    },
    {
        title: 'Run & debug',
        description: 'Inline code runners for JS, Python, C++, Java, and C# with safe timeouts and traces.',
        icon: HiOutlineCpuChip,
        chips: ['Step-through debugger', 'Resource limits', 'Docker isolation'],
    },
    {
        title: 'Assessment loops',
        description: 'Checkpoints, quizzes, and reviewer notes keep progress visible and actionable.',
        icon: HiOutlineClipboardDocumentCheck,
        chips: ['Targeted rubrics', 'Auto feedback', 'Peer review'],
    },
    {
        title: 'Global-ready',
        description: 'Responsive layouts, offline-friendly docs, and theme controls for long study sessions.',
        icon: HiOutlineGlobeAlt,
        chips: ['Dark/light/system', 'Low motion mode', 'Touch-friendly'],
    },
];

const AboutFallback = () => (
    <main className="relative min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_12%,rgba(56,189,248,0.16),transparent_36%),radial-gradient(circle_at_82%_10%,rgba(167,139,250,0.18),transparent_34%),radial-gradient(circle_at_46%_48%,rgba(16,185,129,0.12),transparent_42%)]" />
        <div className="relative mx-auto flex max-w-6xl flex-col gap-14 px-4 py-16 sm:px-6 lg:px-8">
            {/* Hero */}
            <section className="relative overflow-hidden rounded-[32px] border border-white/40 bg-white/80 shadow-[0_30px_120px_-80px_rgba(14,116,244,0.55)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/80">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-100/40 via-white/70 to-indigo-50/40 dark:from-slate-900/40 dark:via-slate-900/70 dark:to-indigo-900/30" />
                <div className="relative grid gap-10 p-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
                    <div className="space-y-7">
                        <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 text-white px-5 py-2 text-[11px] font-semibold uppercase tracking-[0.22em] shadow-md shadow-cyan-500/15 dark:bg-white dark:text-slate-900">
                            <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />
                            Built for curious builders
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl font-extrabold leading-tight sm:text-5xl">
                                The about page that doubles as a product tour
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-200">
                                ScientistShield blends a macOS-inspired desktop with guided tracks, live code runners, and reviewer loops.
                                Everything stays visible: dock, windows, shortcuts, and feedback in one canvas.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3">
                            <Link to="/sign-up">
                                <Button size="lg" className="btn-aqua px-6 py-3">
                                    Start building
                                </Button>
                            </Link>
                            <Link to="/projects">
                                <Button
                                    size="lg"
                                    color="light"
                                    className="border border-slate-300 px-5 py-3 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800"
                                >
                                    View roadmap
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {signals.map(({ label, value, helper }) => (
                                <div
                                    key={label}
                                    className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/80 dark:bg-slate-900/85"
                                >
                                    <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{label}</p>
                                    <p className="text-2xl font-semibold leading-tight">{value}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{helper}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-3xl border border-white/50 bg-white/80 p-5 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/85">
                        {pillars.map(({ title, description, accent, icon: Icon }) => (
                            <div
                                key={title}
                                className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/85"
                            >
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-indigo-600 text-white shadow-md">
                                    <Icon className="h-6 w-6" aria-hidden />
                                </span>
                                <div className="space-y-1.5">
                                    <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] dark:bg-white dark:text-slate-900">
                                        {accent}
                                    </div>
                                    <p className="text-lg font-semibold">{title}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Experience grid */}
            <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.24em] text-cyan-600 dark:text-cyan-300">Workspace DNA</p>
                        <h2 className="text-3xl font-extrabold leading-tight">A desktop that teaches while you build</h2>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                            The dock, window manager, and runners are tuned for long sessions—fast, legible, and focused.
                        </p>
                    </div>
                    <Link
                        to="/tools"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700 underline decoration-cyan-400 decoration-2 underline-offset-4 dark:text-cyan-200"
                    >
                        Explore tools
                        <HiOutlineArrowRightCircle className="h-5 w-5" aria-hidden />
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    {experiences.map(({ title, description, icon: Icon, chips }) => (
                        <div
                            key={title}
                            className="relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/85"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/30 to-cyan-50/60 dark:from-white/0 dark:via-white/5 dark:to-cyan-900/10" aria-hidden />
                            <div className="relative flex items-center gap-3">
                                <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/90 text-white shadow-md">
                                    <Icon className="h-6 w-6" aria-hidden />
                                </span>
                                <p className="text-lg font-semibold">{title}</p>
                            </div>
                            <p className="relative text-sm text-slate-600 dark:text-slate-300">{description}</p>
                            <div className="relative flex flex-wrap gap-2">
                                {chips.map((chip) => (
                                    <span
                                        key={chip}
                                        className="rounded-full border border-slate-200/80 bg-white/70 px-3 py-1 text-[11px] font-semibold text-slate-700 shadow-sm dark:border-slate-700/80 dark:bg-slate-800/80 dark:text-slate-200"
                                    >
                                        {chip}
                                    </span>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Milestones */}
            <section className="grid gap-8 rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.24em] text-indigo-600 dark:text-indigo-300">Path to mastery</p>
                        <h2 className="text-3xl font-extrabold leading-tight">A cadence that favors visible progress</h2>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                            Each milestone ships something reviewable, keeping motivation high and feedback frequent.
                        </p>
                    </div>
                    <Link
                        to="/search"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 underline decoration-indigo-400 decoration-2 underline-offset-4 dark:text-indigo-200"
                    >
                        Explore recent posts
                        <HiOutlineArrowRightCircle className="h-5 w-5" aria-hidden />
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {milestones.map((milestone) => (
                        <div
                            key={milestone.label}
                            className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/95 px-4 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/85"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-100/40 via-transparent to-cyan-100/35 dark:from-indigo-900/20 dark:to-cyan-900/25" aria-hidden />
                            <div className="relative space-y-2">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{milestone.year}</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{milestone.label}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{milestone.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Quality & trust */}
            <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white/90 p-8 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
                <div className="flex flex-col gap-2">
                    <p className="text-xs uppercase tracking-[0.24em] text-emerald-600 dark:text-emerald-300">Quality guardrails</p>
                    <h2 className="text-3xl font-extrabold leading-tight">Shipping standards that mirror production</h2>
                    <p className="text-base text-slate-600 dark:text-slate-300">
                        Security, accessibility, and performance checks are woven into every template and review checklist.
                    </p>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/90 text-white shadow">
                                <HiOutlineLockClosed className="h-5 w-5" aria-hidden />
                            </span>
                            <p className="text-lg font-semibold">Security</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Secrets live in `.env`, runners use network sandboxing by default, and Docker limits cap memory/CPU.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-500/90 text-white shadow">
                                <HiOutlineLightBulb className="h-5 w-5" aria-hidden />
                            </span>
                            <p className="text-lg font-semibold">Accessibility</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Keyboard reach, reduced motion toggles, and high-contrast themes ship with every page shell.
                        </p>
                    </div>
                    <div className="rounded-2xl border border-slate-200/70 bg-white/95 p-4 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/85">
                        <div className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-sky-500/90 text-white shadow">
                                <HiOutlineClipboardDocumentCheck className="h-5 w-5" aria-hidden />
                            </span>
                            <p className="text-lg font-semibold">Review loops</p>
                        </div>
                        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                            Rubrics cover validation, authz, error states, and loading paths so regressions stay rare.
                        </p>
                    </div>
                </div>
            </section>

            <CallToAction />
        </div>
    </main>
);

export default function About() {
    return <PageView slug="about" fallback={<AboutFallback />} />;
}
