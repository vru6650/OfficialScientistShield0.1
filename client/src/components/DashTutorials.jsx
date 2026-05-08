import { Modal, Table, Button, Spinner, Alert } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { getTutorials as getTutorialsService, deleteTutorial as deleteTutorialService } from '../services/tutorialService';

const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
};

export default function DashTutorials() {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [tutorialToDelete, setTutorialToDelete] = useState(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        // The queryKey is fine as is
        queryKey: ['adminTutorials', currentUser._id],
        queryFn: ({ pageParam = 0 }) => getTutorialsService(`authorId=${currentUser._id}&startIndex=${pageParam}`),
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.tutorials.length < 9) return undefined;
            return allPages.reduce((acc, page) => acc + page.tutorials.length, 0);
        },
        enabled: !!currentUser?.isAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteTutorialService,
        onSuccess: () => {
            // Invalidate the cache to refetch the list of tutorials
            queryClient.invalidateQueries({ queryKey: ['adminTutorials', currentUser._id] });
        },
    });

    const handleDeleteTutorial = () => {
        setShowModal(false);
        // =================================================================
        // FIX: Pass the correct object structure to the mutation
        // =================================================================
        if (tutorialToDelete) {
            deleteMutation.mutate({
                tutorialId: tutorialToDelete.tutorialId,
                userId: currentUser._id // Use the current user's ID for consistency
            });
        }
    };

    const tutorials = data?.pages.flatMap(page => page.tutorials) ?? [];

    return (
        <div className='space-y-4 p-3 md:mx-auto'>
            {isLoading && (
                <div className='flex min-h-64 items-center justify-center'>
                    <Spinner size='xl' />
                </div>
            )}
            {isError && (
                <Alert color='failure' className='my-4'>
                    Error fetching tutorials: {error.message}
                </Alert>
            )}
            {deleteMutation.isError && (
                <Alert color='failure' onDismiss={() => deleteMutation.reset()}>
                    Failed to delete tutorial: {deleteMutation.error.message}
                </Alert>
            )}

            {currentUser.isAdmin && tutorials.length > 0 ? (
                <>
                    <div className='grid gap-3 md:hidden'>
                        {tutorials.map((tutorial) => (
                            <article
                                key={tutorial._id}
                                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                            >
                                <div className='flex items-start gap-3'>
                                    <Link to={`/tutorials/${tutorial.slug}`} className='flex-none'>
                                        {tutorial.thumbnail ? (
                                            <img
                                                src={tutorial.thumbnail}
                                                alt={tutorial.title}
                                                className='h-14 w-20 rounded-lg bg-gray-500 object-cover'
                                            />
                                        ) : (
                                            <div className='flex h-14 w-20 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
                                                Tutorial
                                            </div>
                                        )}
                                    </Link>
                                    <div className='min-w-0 flex-1'>
                                        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                            Updated {formatDate(tutorial.updatedAt)}
                                        </p>
                                        <Link
                                            className='mt-1 block break-words text-base font-semibold text-slate-900 hover:text-teal-600 dark:text-white dark:hover:text-teal-300'
                                            to={`/tutorials/${tutorial.slug}`}
                                        >
                                            {tutorial.title}
                                        </Link>
                                        <div className='mt-2 flex flex-wrap items-center gap-2'>
                                            <span className='inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                                {tutorial.category || 'Uncategorized'}
                                            </span>
                                            <span className='inline-flex min-h-8 items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                                {tutorial.chapters?.length ?? 0} chapters
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className='mt-4 grid grid-cols-2 gap-2'>
                                    <Link
                                        className='inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 dark:border-teal-500/30 dark:text-teal-300 dark:hover:bg-teal-500/10 dark:focus-visible:ring-teal-900/40'
                                        to={`/update-tutorial/${tutorial._id}`}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowModal(true);
                                            setTutorialToDelete({ tutorialId: tutorial._id });
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className='inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-900/40'
                                    >
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500 md:block'>
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Date updated</Table.HeadCell>
                                <Table.HeadCell>Thumbnail</Table.HeadCell>
                                <Table.HeadCell>Tutorial title</Table.HeadCell>
                                <Table.HeadCell>Category</Table.HeadCell>
                                <Table.HeadCell>Chapters</Table.HeadCell>
                                <Table.HeadCell>Delete</Table.HeadCell>
                                <Table.HeadCell>
                                    <span>Edit</span>
                                </Table.HeadCell>
                            </Table.Head>
                            <Table.Body className='divide-y'>
                                {tutorials.map((tutorial) => (
                                    <Table.Row key={tutorial._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                        <Table.Cell>{formatDate(tutorial.updatedAt)}</Table.Cell>
                                        <Table.Cell>
                                            <Link to={`/tutorials/${tutorial.slug}`}>
                                                {tutorial.thumbnail ? (
                                                    <img src={tutorial.thumbnail} alt={tutorial.title} className='h-10 w-20 rounded-md bg-gray-500 object-cover' />
                                                ) : (
                                                    <div className='flex h-10 w-20 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
                                                        Tutorial
                                                    </div>
                                                )}
                                            </Link>
                                        </Table.Cell>
                                        <Table.Cell className='max-w-sm'>
                                            <Link className='font-medium text-gray-900 dark:text-white' to={`/tutorials/${tutorial.slug}`}>{tutorial.title}</Link>
                                        </Table.Cell>
                                        <Table.Cell>{tutorial.category}</Table.Cell>
                                        <Table.Cell>{tutorial.chapters?.length ?? 0}</Table.Cell>
                                        <Table.Cell>
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setShowModal(true);
                                                    setTutorialToDelete({ tutorialId: tutorial._id });
                                                }}
                                                disabled={deleteMutation.isPending}
                                                className='font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60'
                                            >
                                                Delete
                                            </button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Link className='text-teal-500 hover:underline' to={`/update-tutorial/${tutorial._id}`}>
                                                <span>Edit</span>
                                            </Link>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                    {hasNextPage && (
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className='min-h-11 w-full self-center py-3 text-sm font-semibold text-teal-500'
                        >
                            {isFetchingNextPage ? 'Loading...' : 'Show more'}
                        </button>
                    )}
                </>
            ) : (
                !isLoading && <p>You have no tutorials yet!</p>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this tutorial?</h3>
                        <div className='flex justify-center gap-4'>
                            <Button color='failure' onClick={handleDeleteTutorial} isProcessing={deleteMutation.isPending}>
                                Yes, I'm sure
                            </Button>
                            <Button color='gray' onClick={() => setShowModal(false)} disabled={deleteMutation.isPending}>
                                No, cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
