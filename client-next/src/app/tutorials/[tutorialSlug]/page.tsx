import { notFound } from 'next/navigation';
import { getTutorialBySlug } from '@/lib/api';

export const runtime = 'edge';
export const revalidate = 300;

type Params = { tutorialSlug: string };

export async function generateMetadata({ params }: { params: Params }) {
    const tutorial = await getTutorialBySlug(params.tutorialSlug).catch(() => null);
    if (!tutorial) {
        return {
            title: 'Tutorial not found',
        };
    }
    return {
        title: `${tutorial.title} | Tutorial`,
        description: tutorial.description,
    };
}

export default async function TutorialDetail({ params }: { params: Params }) {
    const tutorial = await getTutorialBySlug(params.tutorialSlug).catch(() => null);

    if (!tutorial) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <article className="mx-auto flex max-w-4xl flex-col gap-10">
                <header className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-100">
                            {tutorial.category || 'Tutorial'}
                        </span>
                        <span>{tutorial.chapters?.length ?? 0} chapters</span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{tutorial.title}</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">{tutorial.description}</p>
                </header>

                <div className="space-y-4">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Chapters</h2>
                    <div className="space-y-3">
                        {tutorial.chapters?.length ? (
                            tutorial.chapters
                                .sort((a, b) => a.order - b.order)
                                .map((chapter) => (
                                    <div
                                        key={chapter.chapterSlug}
                                        className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900/80"
                                    >
                                        <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                                            <span className="rounded-full bg-slate-100 px-2 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-100">
                                                {chapter.contentType || 'text'}
                                            </span>
                                            <span>Order {chapter.order}</span>
                                        </div>
                                        <h3 className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                                            {chapter.chapterTitle}
                                        </h3>
                                        {chapter.content && (
                                            <p className="mt-2 line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                                                {chapter.content}
                                            </p>
                                        )}
                                    </div>
                                ))
                        ) : (
                            <div className="rounded-2xl border border-slate-200 bg-white p-6 text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                No chapters yet. Add one from the admin console.
                            </div>
                        )}
                    </div>
                </div>
            </article>
        </main>
    );
}
