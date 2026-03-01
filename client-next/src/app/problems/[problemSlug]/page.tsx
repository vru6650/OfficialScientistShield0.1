import { notFound } from 'next/navigation';
import { getProblemBySlug } from '@/lib/api';

export const runtime = 'edge';
export const revalidate = 300;

type Params = { problemSlug: string };

export async function generateMetadata({ params }: { params: Params }) {
    const problem = await getProblemBySlug(params.problemSlug).catch(() => null);
    if (!problem) {
        return { title: 'Problem not found' };
    }
    return {
        title: `${problem.title} | Problem`,
        description: problem.description,
    };
}

export default async function ProblemDetail({ params }: { params: Params }) {
    const problem = await getProblemBySlug(params.problemSlug).catch(() => null);
    if (!problem) {
        notFound();
    }

    return (
        <main className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 px-4 py-16 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            <article className="mx-auto flex max-w-4xl flex-col gap-10">
                <header className="space-y-4 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <div className="flex items-center gap-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
                        <span className="rounded-full bg-cyan-50 px-3 py-1 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-100">
                            {problem.difficulty}
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            Success {problem.successRate ?? '—'}%
                        </span>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-slate-600 dark:bg-slate-800 dark:text-slate-200">
                            Attempts {problem.stats?.submissions ?? 0}
                        </span>
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{problem.title}</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-300">{problem.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-300">
                        {(problem.topics || []).map((topic) => (
                            <span
                                key={topic}
                                className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                {topic}
                            </span>
                        ))}
                    </div>
                </header>

                <section className="space-y-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
                    <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Problem Statement</h2>
                    <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{problem.statement}</p>

                    {problem.inputFormat && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Input Format</h3>
                            <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200">
                                {problem.inputFormat}
                            </p>
                        </div>
                    )}

                    {problem.outputFormat && (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Output Format</h3>
                            <p className="mt-2 whitespace-pre-line text-slate-700 dark:text-slate-200">
                                {problem.outputFormat}
                            </p>
                        </div>
                    )}

                    {problem.constraints?.length ? (
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Constraints</h3>
                            <ul className="mt-2 space-y-1 text-slate-700 dark:text-slate-200">
                                {problem.constraints.map((constraint) => (
                                    <li key={constraint}>• {constraint}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {problem.samples?.length ? (
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Samples</h3>
                            {problem.samples.map((sample, index) => (
                                <div
                                    key={`${sample.input}-${index}`}
                                    className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-800 dark:bg-slate-800/60"
                                >
                                    <p className="font-semibold text-slate-800 dark:text-white">Input</p>
                                    <pre className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-200">
                                        {sample.input}
                                    </pre>
                                    <p className="mt-3 font-semibold text-slate-800 dark:text-white">Output</p>
                                    <pre className="mt-1 whitespace-pre-line text-slate-700 dark:text-slate-200">
                                        {sample.output}
                                    </pre>
                                    {sample.explanation && (
                                        <p className="mt-3 text-slate-700 dark:text-slate-200">{sample.explanation}</p>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : null}

                    {problem.hints?.length ? (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Hints</h3>
                            <ul className="list-disc space-y-1 pl-5 text-slate-700 dark:text-slate-200">
                                {problem.hints.map((hint) => (
                                    <li key={hint}>{hint}</li>
                                ))}
                            </ul>
                        </div>
                    ) : null}

                    {problem.solutionApproach && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Solution Approach</h3>
                            <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">
                                {problem.solutionApproach}
                            </p>
                        </div>
                    )}

                    {problem.editorial && (
                        <div className="space-y-2">
                            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Editorial</h3>
                            <p className="whitespace-pre-line text-slate-700 dark:text-slate-200">{problem.editorial}</p>
                        </div>
                    )}
                </section>
            </article>
        </main>
    );
}
