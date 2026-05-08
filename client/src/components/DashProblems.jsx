import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Modal, Spinner, Table, Badge } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

import { getProblems as fetchProblems, deleteProblem as deleteProblemService } from '../services/problemService';

const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
};

export default function DashProblems() {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();
    const [pendingDelete, setPendingDelete] = useState(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['adminProblems'],
        queryFn: ({ pageParam = 0 }) => fetchProblems(`startIndex=${pageParam}&includeDrafts=true&limit=10`),
        getNextPageParam: (lastPage, allPages) => {
            const loaded = allPages.reduce((total, page) => total + page.problems.length, 0);
            return loaded < lastPage.totalProblems ? loaded : undefined;
        },
        enabled: Boolean(currentUser?.isAdmin),
    });

    const deleteMutation = useMutation({
        mutationFn: deleteProblemService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminProblems'] });
        },
    });

    const problems = data?.pages.flatMap((page) => page.problems) ?? [];

    const handleConfirmDelete = () => {
        if (!pendingDelete) return;
        deleteMutation.mutate(pendingDelete);
        setPendingDelete(null);
    };

    if (!currentUser?.isAdmin) {
        return (
            <div className="p-4">
                <Alert color="warning">Administrator access required.</Alert>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="flex min-h-64 items-center justify-center">
                <Spinner size="xl" />
            </div>
        );
    }

    if (isError) {
        return (
            <div className="p-4">
                <Alert color="failure">{error?.message || 'Unable to load problems.'}</Alert>
            </div>
        );
    }

    return (
        <div className="space-y-4 p-3 md:mx-auto">
            {deleteMutation.isError && (
                <Alert color="failure" onDismiss={() => deleteMutation.reset()}>
                    {deleteMutation.error?.message || 'Failed to delete problem.'}
                </Alert>
            )}

            {problems.length ? (
                <>
                    <div className="grid gap-3 md:hidden">
                        {problems.map((problem) => (
                            <article
                                key={problem._id}
                                className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                                            Updated {formatDate(problem.updatedAt)}
                                        </p>
                                        <Link
                                            to={`/problems/${problem.slug}`}
                                            className="mt-1 block break-words text-base font-semibold text-slate-900 hover:text-cyan-600 dark:text-white dark:hover:text-cyan-300"
                                        >
                                            {problem.title}
                                        </Link>
                                    </div>
                                    <Badge color={problem.isPublished ? 'success' : 'warning'}>
                                        {problem.isPublished ? 'Published' : 'Draft'}
                                    </Badge>
                                </div>
                                <dl className="mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300">
                                    <div>
                                        <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Difficulty</dt>
                                        <dd className="mt-1">{problem.difficulty}</dd>
                                    </div>
                                    {problem.topics?.length ? (
                                        <div>
                                            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Topics</dt>
                                            <dd className="mt-2 flex flex-wrap gap-1">
                                                {problem.topics.slice(0, 3).map((topic) => (
                                                    <Badge key={topic} color="info">{topic}</Badge>
                                                ))}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>
                                <div className="mt-4 grid grid-cols-2 gap-2">
                                    <Link
                                        to={`/update-problem/${problem._id}`}
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-200 px-4 text-sm font-semibold text-cyan-600 transition hover:bg-cyan-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-100 dark:border-cyan-500/30 dark:text-cyan-300 dark:hover:bg-cyan-500/10 dark:focus-visible:ring-cyan-900/40"
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type="button"
                                        className="inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-900/40"
                                        onClick={() => setPendingDelete({ problemId: problem._id })}
                                        disabled={deleteMutation.isPending}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500 md:block">
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Updated</Table.HeadCell>
                                <Table.HeadCell>Title</Table.HeadCell>
                                <Table.HeadCell>Difficulty</Table.HeadCell>
                                <Table.HeadCell>Topics</Table.HeadCell>
                                <Table.HeadCell>Status</Table.HeadCell>
                                <Table.HeadCell>Actions</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className="divide-y">
                                {problems.map((problem) => (
                                    <Table.Row key={problem._id} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                                        <Table.Cell>{formatDate(problem.updatedAt)}</Table.Cell>
                                        <Table.Cell className="max-w-sm">
                                            <Link to={`/problems/${problem.slug}`} className="font-medium text-cyan-600 hover:underline dark:text-cyan-400">
                                                {problem.title}
                                            </Link>
                                        </Table.Cell>
                                        <Table.Cell>{problem.difficulty}</Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-wrap gap-1 text-xs">
                                                {problem.topics?.slice(0, 3).map((topic) => (
                                                    <Badge key={topic} color="info">{topic}</Badge>
                                                ))}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={problem.isPublished ? 'success' : 'warning'}>
                                                {problem.isPublished ? 'Published' : 'Draft'}
                                            </Badge>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-3">
                                                <Link to={`/update-problem/${problem._id}`} className="text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
                                                    Edit
                                                </Link>
                                                <button
                                                    type="button"
                                                    className="text-sm font-semibold text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                                                    onClick={() => setPendingDelete({ problemId: problem._id })}
                                                    disabled={deleteMutation.isPending}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>

                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button
                                color="light"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="min-h-11 w-full sm:w-auto"
                            >
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
                            </Button>
                        </div>
                    )}
                </>
            ) : (
                <Alert color="info">No problems available yet.</Alert>
            )}

            <Modal show={Boolean(pendingDelete)} size="md" popup onClose={() => setPendingDelete(null)}>
                <Modal.Header />
                <Modal.Body>
                    <div className="text-center">
                        <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
                        <h3 className="mb-5 text-lg text-gray-500 dark:text-gray-400">Delete this problem?</h3>
                        <div className="flex justify-center gap-4">
                            <Button color="failure" onClick={handleConfirmDelete} isProcessing={deleteMutation.isPending}>
                                Yes, delete
                            </Button>
                            <Button color="gray" onClick={() => setPendingDelete(null)} disabled={deleteMutation.isPending}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
