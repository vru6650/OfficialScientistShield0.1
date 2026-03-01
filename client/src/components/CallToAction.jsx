import { Button } from 'flowbite-react';
import { HiOutlineArrowRightCircle, HiOutlineSparkles, HiOutlineSquares2X2 } from 'react-icons/hi2';

const highlightStats = [
    { label: 'Shipping cadence', value: 'Weekly drops', detail: 'Fresh mini-projects and playgrounds.' },
    { label: 'Build time', value: '~35 mins', detail: 'Average time to ship a guided lab.' },
    { label: 'Confidence', value: 'Pro-ready', detail: 'Polished UI patterns and accessibility baked in.' },
];

const craftNotes = [
    { title: 'Hands-on labs', description: 'Tactile sandboxes, ready-to-run snippets, and guided refactors.' },
    { title: 'Designer polish', description: 'Glassmorphism, motion cues, and purposeful typography out of the box.' },
    { title: 'Battle-tested', description: 'The same layouts we lean on for tutorials, quizzes, and projects.' },
];

export default function CallToAction() {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-white/30 bg-gradient-to-br from-indigo-600 via-sky-600 to-teal-500 px-6 py-10 text-white shadow-2xl dark:border-slate-700/60 dark:from-slate-900 dark:via-indigo-900 dark:to-sky-900">
            <div className="pointer-events-none absolute inset-0">
                <div className="absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
                <div className="absolute -right-12 bottom-0 h-56 w-56 rounded-full bg-cyan-300/20 blur-3xl" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(14,116,244,0.28),transparent_30%)]" />
            </div>

            <div className="relative grid gap-10 lg:grid-cols-[1.05fr,0.95fr] lg:items-center">
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2">
                            <HiOutlineSparkles className="h-4 w-4" aria-hidden />
                            Creator mode
                        </span>
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2">
                            <HiOutlineSquares2X2 className="h-4 w-4" aria-hidden />
                            Projects · Tutorials · Quizzes
                        </span>
                    </div>

                    <div className="space-y-4">
                        <h2 className="text-3xl sm:text-4xl font-extrabold leading-tight">
                            Ship practice projects with the same polish as the lessons you follow
                        </h2>
                        <p className="text-base sm:text-lg text-white/85">
                            Build alongside us with curated prompts, glassy UI shells, and real UX heuristics. Every lab is scoped
                            so you feel momentum—not fatigue—while learning.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <a
                            href="https://www.100jsprojects.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" className="btn-aqua px-6 py-3">
                                Launch the 100 JS project lab
                            </Button>
                        </a>
                        <a
                            href="https://www.100jsprojects.com/"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            <Button size="lg" color="light" className="border border-white/50 text-white hover:bg-white/10">
                                View the full library
                                <HiOutlineArrowRightCircle className="ml-2 h-5 w-5" aria-hidden />
                            </Button>
                        </a>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                        {highlightStats.map((item) => (
                            <div
                                key={item.label}
                                className="rounded-2xl border border-white/25 bg-white/10 px-4 py-3 shadow-lg backdrop-blur"
                            >
                                <p className="text-xs uppercase tracking-[0.22em] text-white/70">{item.label}</p>
                                <p className="text-xl font-semibold">{item.value}</p>
                                <p className="text-sm text-white/75">{item.detail}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="relative">
                    <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-white/0 to-white/5" aria-hidden />
                        <div className="relative space-y-4">
                            <div className="flex items-center justify-between rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold">
                                <span className="inline-flex items-center gap-2">
                                    <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_6px_rgba(52,211,153,0.35)]" aria-hidden />
                                    Live coding pod
                                </span>
                                <span className="rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.2em]">Glass</span>
                            </div>

                            <div className="space-y-3 rounded-xl border border-white/20 bg-slate-900/60 p-4 text-left shadow-inner dark:bg-slate-950/70">
                                {craftNotes.map((note) => (
                                    <div key={note.title} className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                                        <p className="text-sm font-semibold text-white">{note.title}</p>
                                        <p className="text-sm text-white/75">{note.description}</p>
                                    </div>
                                ))}
                            </div>

                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Progress</p>
                                    <p className="text-lg font-semibold">71% done</p>
                                    <div className="mt-2 h-2 rounded-full bg-white/15">
                                        <div className="h-2 w-[71%] rounded-full bg-gradient-to-r from-emerald-300 via-sky-200 to-white" />
                                    </div>
                                </div>
                                <div className="rounded-xl border border-white/25 bg-white/10 px-4 py-3">
                                    <p className="text-xs uppercase tracking-[0.2em] text-white/70">Next checkpoint</p>
                                    <p className="text-lg font-semibold">Accessibility polish</p>
                                    <p className="text-white/75">Add focus rings, aria labels, and color contrast checks.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
