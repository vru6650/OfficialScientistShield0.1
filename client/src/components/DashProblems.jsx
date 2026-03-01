import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Modal, Spinner, Table, Badge } from 'flowbite-react';
import { HiOutlineExclamationCircle } from 'react-icons/hi';

import { getProblems as fetchProblems, deleteProblem as deleteProblemService } from '../services/problemService';

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
            <div className="flex min-h-screen items-center justify-center">
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
        <div className="table-auto overflow-x-auto p-3 md:mx-auto">
            {deleteMutation.isError && (
                <Alert color="failure" onDismiss={() => deleteMutation.reset()}>
                    {deleteMutation.error?.message || 'Failed to delete problem.'}
                </Alert>
            )}

            {problems.length ? (
                <>
                    <Table hoverable className="shadow-md">
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
                                    <Table.Cell>{new Date(problem.updatedAt).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>
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
                                    <Table.Cell className="space-x-3">
                                        <Link to={`/update-problem/${problem._id}`} className="text-sm font-semibold text-cyan-600 hover:underline dark:text-cyan-400">
                                            Edit
                                        </Link>
                                        <button
                                            type="button"
                                            className="text-sm font-semibold text-red-500 hover:underline"
                                            onClick={() => setPendingDelete({ problemId: problem._id })}
                                        >
                                            Delete
                                        </button>
                                    </Table.Cell>
                                </Table.Row>
                            ))}
                        </Table.Body>
                    </Table>

                    {hasNextPage && (
                        <div className="flex justify-center">
                            <Button
                                color="light"
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className="mt-4"
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
