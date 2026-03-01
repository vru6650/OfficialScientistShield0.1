import { Link } from 'react-router-dom';
import { Button } from 'flowbite-react';
import { HiOutlineAcademicCap, HiOutlineArrowRightCircle, HiOutlineRocketLaunch, HiOutlineSparkles, HiOutlineUserGroup } from 'react-icons/hi2';
import CallToAction from '../components/CallToAction';
import PageView from '../components/PageView.jsx';

const pillars = [
    {
        title: 'Guided, tactile learning',
        description: 'Every track mixes tutorials, live playgrounds, and checkpoints so you never get stuck staring at theory.',
        accent: 'Hands-on labs',
        icon: HiOutlineSparkles,
    },
    {
        title: 'Community-first ethos',
        description: 'Pair with mentors, request reviews, and co-build with a global crew of builders who care about craft.',
        accent: 'Coaching & feedback',
        icon: HiOutlineUserGroup,
    },
    {
        title: 'Research-backed practices',
        description: 'We blend accessibility, performance, and UX heuristics into every example so you ship with confidence.',
        accent: 'Quality guardrails',
        icon: HiOutlineAcademicCap,
    },
];

const milestones = [
    { year: 'Day 0', label: 'Join the space', detail: 'Pick a track and personalize your workspace.' },
    { year: 'Week 1', label: 'Ship a mini-lab', detail: 'Build your first project with guided reviews.' },
    { year: 'Month 1', label: 'Publish & teach', detail: 'Share a tutorial, quiz, or problem you are proud of.' },
    { year: 'Month 3', label: 'Portfolio ready', detail: 'Curate your work, polish UX, and aim for production quality.' },
];

const AboutFallback = () => (
    <main className="relative min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(14,116,244,0.12),transparent_32%),radial-gradient(circle_at_88%_8%,rgba(52,211,153,0.12),transparent_30%),radial-gradient(circle_at_50%_24%,rgba(99,102,241,0.1),transparent_28%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-16 sm:px-6 lg:px-8">
            <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="absolute inset-0 bg-gradient-to-br from-sky-50 via-white to-indigo-50 opacity-80 dark:from-slate-900 dark:via-slate-900 dark:to-indigo-950" />
                <div className="relative grid gap-10 lg:grid-cols-[1.1fr,0.9fr] lg:items-center">
                    <div className="space-y-6">
                        <div className="inline-flex items-center gap-3 rounded-full bg-slate-900 text-white px-5 py-2 text-xs font-semibold uppercase tracking-[0.22em] dark:bg-white dark:text-slate-900">
                            <HiOutlineRocketLaunch className="h-4 w-4" aria-hidden />
                            Built for curious builders
                        </div>
                        <div className="space-y-4">
                            <h1 className="text-4xl sm:text-5xl font-extrabold leading-tight">
                                ScientistShield is a studio for learning, building, and shipping in public
                            </h1>
                            <p className="text-lg text-slate-600 dark:text-slate-200">
                                We design immersive learning spaces that mirror production workflows. Tutorials, quizzes, and
                                problem sets are paired with polished UI shells so you can focus on the craft instead of scaffolding.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <Link to="/sign-up">
                                <Button size="lg" className="btn-aqua px-6 py-3">
                                    Join the workspace
                                </Button>
                            </Link>
                            <Link to="/projects">
                                <Button size="lg" color="light" className="border border-slate-300 text-slate-900 hover:bg-slate-100 dark:border-slate-600 dark:text-white dark:hover:bg-slate-800">
                                    Browse projects
                                </Button>
                            </Link>
                        </div>
                        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Learners</p>
                                <p className="text-2xl font-semibold">52K</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Active across 90+ countries.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Tracks</p>
                                <p className="text-2xl font-semibold">120+</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Curated paths with assessments.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Projects</p>
                                <p className="text-2xl font-semibold">340+</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Interactive briefs to ship weekly.</p>
                            </div>
                            <div className="rounded-2xl border border-slate-200/80 bg-white/70 px-4 py-3 text-left shadow-sm dark:border-slate-800/80 dark:bg-slate-900/80">
                                <p className="text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">Quality</p>
                                <p className="text-2xl font-semibold">Peer reviewed</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">Editorial standards on every post.</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid gap-4 rounded-2xl border border-slate-200/70 bg-white/80 p-5 shadow-lg backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/80">
                        {pillars.map(({ title, description, accent, icon: Icon }) => (
                            <div
                                key={title}
                                className="flex items-start gap-4 rounded-xl border border-slate-200/60 bg-white/80 px-4 py-3 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800/60 dark:bg-slate-900/80"
                            >
                                <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-md">
                                    <Icon className="h-6 w-6" aria-hidden />
                                </span>
                                <div className="space-y-1">
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

            <section className="grid gap-8 rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl dark:border-slate-800/70 dark:bg-slate-900/70">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
                    <div className="space-y-2">
                        <p className="text-xs uppercase tracking-[0.24em] text-sky-600 dark:text-sky-300">Path to mastery</p>
                        <h2 className="text-3xl font-extrabold">How we guide you from curiosity to confidence</h2>
                        <p className="text-base text-slate-600 dark:text-slate-300">
                            Milestones are deliberately tight. Each one ships something visible so you feel progress and can ask for feedback early.
                        </p>
                    </div>
                    <Link to="/search" className="inline-flex items-center gap-2 text-sm font-semibold text-sky-600 underline decoration-sky-400 decoration-2 underline-offset-4 dark:text-sky-200">
                        Explore recent posts
                        <HiOutlineArrowRightCircle className="h-5 w-5" aria-hidden />
                    </Link>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {milestones.map((milestone) => (
                        <div
                            key={milestone.label}
                            className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white/90 px-4 py-5 shadow-sm dark:border-slate-800/70 dark:bg-slate-900/80"
                        >
                            <div className="absolute inset-0 bg-gradient-to-br from-sky-100/40 via-transparent to-indigo-100/40 dark:from-sky-900/20 dark:to-indigo-900/30" aria-hidden />
                            <div className="relative space-y-2">
                                <p className="text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">{milestone.year}</p>
                                <p className="text-lg font-semibold text-slate-900 dark:text-white">{milestone.label}</p>
                                <p className="text-sm text-slate-600 dark:text-slate-300">{milestone.detail}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            <CallToAction />
        </div>
    </main>
);

export default function About() {
    return <PageView slug="about" fallback={<AboutFallback />} />;
}
