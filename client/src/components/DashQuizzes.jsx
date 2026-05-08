// client/src/components/DashQuizzes.jsx
import { Modal, Table, Button, Spinner, Alert } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { getQuizzes as getQuizzesService, deleteQuiz as deleteQuizService } from '../services/quizService'; // NEW: Import quiz services

const formatDate = (date) => {
    if (!date) return 'Unknown';
    return new Date(date).toLocaleDateString();
};

export default function DashQuizzes() {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();
    const [showModal, setShowModal] = useState(false);
    const [quizToDelete, setQuizToDelete] = useState(null);

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['adminQuizzes'], // No need for userId specific here unless you filter quizzes by creator
        queryFn: ({ pageParam = 0 }) => getQuizzesService(`startIndex=${pageParam}`), // Fetch all quizzes
        initialPageParam: 0,
        getNextPageParam: (lastPage, allPages) => {
            if (lastPage.quizzes.length < 9) return undefined;
            return allPages.reduce((acc, page) => acc + page.quizzes.length, 0);
        },
        enabled: !!currentUser?.isAdmin,
    });

    const deleteMutation = useMutation({
        mutationFn: deleteQuizService,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminQuizzes'] });
        },
    });

    const handleDeleteQuiz = () => {
        setShowModal(false);
        if (quizToDelete) {
            deleteMutation.mutate(quizToDelete);
        }
    };

    const quizzes = data?.pages.flatMap(page => page.quizzes) ?? [];

    return (
        <div className='space-y-4 p-3 md:mx-auto'>
            {isLoading && (
                <div className='flex min-h-64 items-center justify-center'>
                    <Spinner size='xl' />
                </div>
            )}
            {isError && (
                <Alert color='failure' className='my-4'>
                    Error fetching quizzes: {error.message}
                </Alert>
            )}
            {deleteMutation.isError && (
                <Alert color='failure' onDismiss={() => deleteMutation.reset()}>
                    Failed to delete quiz: {deleteMutation.error.message}
                </Alert>
            )}

            {currentUser?.isAdmin && quizzes.length > 0 ? (
                <>
                    <div className='grid gap-3 md:hidden'>
                        {quizzes.map((quiz) => (
                            <article
                                key={quiz._id}
                                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                            Updated {formatDate(quiz.updatedAt)}
                                        </p>
                                        <Link
                                            className='mt-1 block break-words text-base font-semibold text-slate-900 hover:text-teal-600 dark:text-white dark:hover:text-teal-300'
                                            to={`/quizzes/${quiz.slug}`}
                                        >
                                            {quiz.title}
                                        </Link>
                                    </div>
                                    <span className='inline-flex min-h-8 flex-none items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                        {quiz.questions?.length ?? 0} questions
                                    </span>
                                </div>
                                <dl className='mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300'>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Category</dt>
                                        <dd className='mt-1 break-words'>{quiz.category}</dd>
                                    </div>
                                </dl>
                                <div className='mt-4 grid grid-cols-2 gap-2'>
                                    <Link
                                        className='inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 dark:border-teal-500/30 dark:text-teal-300 dark:hover:bg-teal-500/10 dark:focus-visible:ring-teal-900/40'
                                        to={`/update-quiz/${quiz._id}`}
                                    >
                                        Edit
                                    </Link>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setShowModal(true);
                                            setQuizToDelete({ quizId: quiz._id });
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
                                <Table.HeadCell>Quiz title</Table.HeadCell>
                                <Table.HeadCell>Category</Table.HeadCell>
                                <Table.HeadCell>Questions</Table.HeadCell>
                                <Table.HeadCell>Delete</Table.HeadCell>
                                <Table.HeadCell>
                                    <span>Edit</span>
                                </Table.HeadCell>
                            </Table.Head>
                            <Table.Body className='divide-y'>
                                {quizzes.map((quiz) => (
                                    <Table.Row key={quiz._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                        <Table.Cell>{formatDate(quiz.updatedAt)}</Table.Cell>
                                        <Table.Cell className='max-w-sm'>
                                            <Link className='font-medium text-gray-900 dark:text-white' to={`/quizzes/${quiz.slug}`}>{quiz.title}</Link>
                                        </Table.Cell>
                                        <Table.Cell>{quiz.category}</Table.Cell>
                                        <Table.Cell>{quiz.questions?.length ?? 0}</Table.Cell>
                                        <Table.Cell>
                                            <button
                                                type='button'
                                                onClick={() => {
                                                    setShowModal(true);
                                                    setQuizToDelete({ quizId: quiz._id });
                                                }}
                                                disabled={deleteMutation.isPending}
                                                className='font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60'
                                            >
                                                Delete
                                            </button>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Link className='text-teal-500 hover:underline' to={`/update-quiz/${quiz._id}`}>
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
                !isLoading && <p>You have no quizzes yet!</p>
            )}

            <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this quiz?</h3>
                        <div className='flex justify-center gap-4'>
                            <Button color='failure' onClick={handleDeleteQuiz} isProcessing={deleteMutation.isPending}>
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
