import Link from 'next/link';
import { getProblems, ProblemSummary } from '@/lib/api';

export const runtime = 'edge';
export const revalidate = 300;

export const metadata = {
    title: 'Problems | ScientistShield',
    description: 'Server-rendered coding problems list with zero client JavaScript.',
};

const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(iso)
    );

const difficultyTone: Record<string, string> = {
    Easy: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200',
    Medium: 'bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200',
    Hard: 'bg-rose-50 text-rose-700 dark:bg-rose-900/40 dark:text-rose-200',
};

const ProblemCard = ({ problem }: { problem: ProblemSummary }) => (
    <Link
        href={`/problems/${problem.slug}`}
        className="group flex flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
    >
        <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span
                    className={`rounded-full px-3 py-1 ${difficultyTone[problem.difficulty] || 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'}`}
                >
                    {problem.difficulty}
                </span>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    Updated {formatDate(problem.updatedAt)}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-cyan-700 dark:text-white">
                {problem.title}
            </h3>
            <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{problem.description}</p>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-300">
            {(problem.topics || []).slice(0, 4).map((topic) => (
                <span
                    key={topic}
                    className="rounded-full bg-cyan-50 px-2 py-1 font-semibold text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-100"
                >
                    {topic}
                </span>
            ))}
            {problem.successRate != null && (
                <span className="ml-auto rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                    {problem.successRate}% success
                </span>
            )}
        </div>
    </Link>
);

export default async function ProblemsPage() {
    const data = await getProblems();
    const problems = data.problems || [];

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <section className="mx-auto flex max-w-6xl flex-col gap-6">
                <div className="space-y-3">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-100">
                        Server-rendered • Edge runtime
                    </span>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Coding Problems</h1>
                    <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-300">
                        Delivered via React Server Components to minimize client JavaScript and maximize SEO for your
                        practice sets.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <Stat label="Total problems" value={data.totalProblems} />
                    <Stat label="New this month" value={data.lastMonthProblems} />
                    <Stat label="Tracked topics" value={data.meta?.topicCounts?.length ?? 0} />
                </div>

                {problems.length ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {problems.map((problem) => (
                            <ProblemCard key={problem._id} problem={problem} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        No problems found. Publish a problem to see it here.
                    </div>
                )}
            </section>
        </main>
    );
}

const Stat = ({ label, value }: { label: string; value: number | string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
);
