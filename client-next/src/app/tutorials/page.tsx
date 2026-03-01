import Link from 'next/link';
import { getTutorials, Tutorial } from '@/lib/api';

export const runtime = 'edge';
export const revalidate = 300;

export const metadata = {
    title: 'Tutorials | ScientistShield',
    description: 'Server-rendered tutorials listing powered by Next.js App Router.',
};

const formatDate = (iso: string) =>
    new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        new Date(iso)
    );

const TutorialCard = ({ tutorial }: { tutorial: Tutorial }) => (
    <Link
        href={`/tutorials/${tutorial.slug}`}
        className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl dark:border-slate-800 dark:bg-slate-900/80"
    >
        <div
            className="h-40 bg-gradient-to-br from-slate-200 via-slate-100 to-white transition group-hover:scale-[1.02] dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"
            style={
                tutorial.thumbnail
                    ? {
                          backgroundImage: `linear-gradient(180deg, rgba(15,23,42,0.2), rgba(15,23,42,0.6)), url(${tutorial.thumbnail})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                      }
                    : undefined
            }
        />
        <div className="flex flex-1 flex-col gap-3 p-5">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
                <span>{tutorial.category || 'General'}</span>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    Updated {formatDate(tutorial.updatedAt)}
                </span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 transition group-hover:text-cyan-700 dark:text-white">
                {tutorial.title}
            </h3>
            <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">{tutorial.description}</p>
            <div className="mt-auto flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full bg-cyan-50 px-2 py-1 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200">
                    {tutorial.chapters?.length ?? 0} chapters
                </span>
                <span className="rounded-full bg-slate-50 px-2 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                    {tutorial.category || 'Tutorial'}
                </span>
            </div>
        </div>
    </Link>
);

export default async function TutorialsPage() {
    const data = await getTutorials();
    const tutorials = data.tutorials || [];

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <section className="mx-auto flex max-w-6xl flex-col gap-6">
                <div className="space-y-3">
                    <span className="inline-flex w-fit items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-100">
                        Server-rendered • SEO-ready
                    </span>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Tutorials</h1>
                    <p className="max-w-3xl text-lg text-slate-600 dark:text-slate-300">
                        Fetched on the server with React Server Components so readers get instant, crawlable content
                        and zero client-side JavaScript for this view.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-3">
                    <StatCard label="Total tutorials" value={data.totalTutorials} />
                    <StatCard label="Added last 30 days" value={data.lastMonthTutorials} />
                    <StatCard label="Avg chapters" value={averageChapters(tutorials)} />
                </div>

                {tutorials.length ? (
                    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {tutorials.map((tutorial) => (
                            <TutorialCard key={tutorial._id} tutorial={tutorial} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                        No tutorials found. Create one in the admin panel to see it here.
                    </div>
                )}
            </section>
        </main>
    );
}

const StatCard = ({ label, value }: { label: string; value: number | string }) => (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
        <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
    </div>
);

const averageChapters = (tutorials: Tutorial[]) => {
    if (!tutorials.length) return 0;
    const total = tutorials.reduce((sum, t) => sum + (t.chapters?.length ?? 0), 0);
    return Math.round(total / tutorials.length);
};
