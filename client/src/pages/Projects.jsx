import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import {
    HiOutlineBeaker,
    HiOutlineBolt,
    HiOutlineCommandLine,
    HiOutlineDevicePhoneMobile,
    HiOutlineArrowUpRight,
    HiOutlineSparkles,
    HiOutlineTrophy,
} from 'react-icons/hi2';
import CallToAction from '../components/CallToAction';
import PageView from '../components/PageView.jsx';

const tracks = [
    {
        label: 'Launchpad labs',
        title: 'Ship a micro SaaS landing in a weekend',
        detail: 'Pair responsive layout, translucent chrome, and animation cues to match the macOS aesthetic.',
        icon: HiOutlineDevicePhoneMobile,
    },
    {
        label: 'Systems thinking',
        title: 'Build a data viz console with live filters',
        detail: 'Wire API mocks, skeleton loading, and empty states so the experience feels production ready.',
        icon: HiOutlineCommandLine,
    },
    {
        label: 'Interaction polish',
        title: 'Design tactile controls and motion',
        detail: 'Microinteractions, focus states, and accessible keyboard flows that reward every click.',
        icon: HiOutlineBolt,
    },
];

const rituals = [
    { label: 'Start', title: 'Clone the starter', detail: 'We give you glassy shells, cards, and CTA frames so you can focus on logic.' },
    { label: 'Iterate', title: 'Instrument feedback', detail: 'Share your sandbox link for quick reviews and a/b UX suggestions.' },
    { label: 'Ship', title: 'Publish the story', detail: 'Attach screenshots, accessibility notes, and a short retro for your portfolio.' },
];

const highlightCards = [
    {
        title: 'Curated briefs',
        copy: 'Concise specs, realistic constraints, and success criteria that mirror what hiring managers expect.',
        icon: HiOutlineBeaker,
    },
    {
        title: 'Ready-to-style UI',
        copy: 'Prebuilt macOS-inspired surfaces, gradients, and buttons keep you in flow instead of wrangling CSS.',
        icon: HiOutlineSparkles,
    },
    {
        title: 'Win conditions',
        copy: 'Clear checklists plus stretch goals like motion, accessibility, and performance budgets.',
        icon: HiOutlineTrophy,
    },
];

const ProjectsFallback = () => (
    <main className="relative min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_10%_8%,rgba(14,116,244,0.12),transparent_28%),radial-gradient(circle_at_86%_10%,rgba(52,211,153,0.12),transparent_26%),radial-gradient(circle_at_50%_18%,rgba(99,102,241,0.1),transparent_30%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-16 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-2xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/75">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 opacity-80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950" />
                <div className="relative grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] dark:bg-white dark:text-slate-900">
                            <HiOutlineArrowUpRight className="h-4 w-4" aria-hidden />
                            Projects studio
                        </div>
                        <div className="space-y-3">
                            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                                Build portfolio-ready projects with production-grade UX
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-200">
                                Each brief ships with vibrant surfaces, live playgrounds, and review loops. Focus on the decisions that matter:
                                structure, accessibility, performance, and storytelling.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/sign-up">
                                <Button size="lg" className="btn-aqua px-6 py-3">
                                    Start a new brief
                                </Button>
                            </Link>
                            <Link to="/search">
                                <Button size="lg" color="light" className="border border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800">
                                    View inspiration
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Projects</p>
                                <p className="text-2xl font-semibold">340+</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Realistic briefs with reviews.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Time-boxed</p>
                                <p className="text-2xl font-semibold">35–90m</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Stay in flow with focused prompts.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Stack ready</p>
                                <p className="text-2xl font-semibold">React · Node</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Use the same toolkit as our lessons.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/80 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Peer review</p>
                                <p className="text-2xl font-semibold">Fast loops</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Request feedback right inside the brief.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-slate-200/60 bg-white/80 p-6 shadow-lg backdrop-blur dark:border-slate-800/60 dark:bg-slate-900/80">
                        {tracks.map(({ label, title, detail, icon: Icon }) => (
                            <div
                                key={label}
                                className="flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/80"
                            >
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                                    <Icon className="h-6 w-6" aria-hidden />
                                </span>
                                <div className="space-y-1">
                                    <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
                                        {label}
                                    </div>
                                    <p className="text-lg font-semibold">{title}</p>
                                    <p className="text-sm text-slate-600 dark:text-slate-300">{detail}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <section className="grid gap-10 rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/75">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Build loop</p>
                        <h2 className="text-3xl font-extrabold">Three ritual steps to finish every brief</h2>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                            We keep the loop tight: start with a styled shell, share progress for feedback, then publish a story-worthy release.
                        </p>
                    </div>
                    <Link to="/quizzes" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 underline decoration-sky-400 decoration-2 underline-offset-4 dark:text-sky-200">
                        Assess your knowledge
                        <HiOutlineArrowUpRight className="h-5 w-5" aria-hidden />
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {rituals.map((item) => (
                        <div
                            key={item.label}
                            className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/80"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-transparent to-indigo-100/40 dark:from-sky-900/20 dark:to-indigo-900/30" aria-hidden />
                            <div className="relative space-y-2">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{item.label}</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{item.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <section className="grid gap-6 rounded-3xl border border-slate-200/70 bg-white/85 p-8 shadow-xl backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/75">
                <div className="space-y-3 text-center">
                    <p className="text-xs uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Why these projects</p>
                    <h3 className="text-3xl font-extrabold">Polish baked in, from the first commit</h3>
                    <p className="mx-auto max-w-3xl text-base text-slate-600 dark:text-slate-300">
                        Use our glassy shells, Tailwind tokens, and UX guardrails to build faster. Your portfolio should feel intentional, not improvised.
                    </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {highlightCards.map(({ title, copy, icon: Icon }) => (
                        <div
                            key={title}
                            className="flex h-full flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/90 p-5 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/70 dark:bg-slate-900/80"
                        >
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white shadow-md">
                                <Icon className="h-5 w-5" aria-hidden />
                            </span>
                            <p className="text-lg font-semibold">{title}</p>
                            <p className="text-sm text-slate-600 dark:text-slate-300">{copy}</p>
                        </div>
                    ))}
                </div>
            </section>

            <CallToAction />
        </div>
    </main>
);

export default function Projects() {
    return <PageView slug="projects" fallback={<ProjectsFallback />} />;
}
