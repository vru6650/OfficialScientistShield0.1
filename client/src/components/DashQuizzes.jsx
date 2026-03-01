// client/src/components/DashQuizzes.jsx
import { Modal, Table, Button, Spinner, Alert } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { getQuizzes as getQuizzesService, deleteQuiz as deleteQuizService } from '../services/quizService'; // NEW: Import quiz services

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
        <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
            {isLoading && (
                <div className='flex justify-center items-center min-h-screen'>
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
                    <Table hoverable className='shadow-md'>
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
                                    <Table.Cell>{new Date(quiz.updatedAt).toLocaleDateString()}</Table.Cell>
                                    <Table.Cell>
                                        <Link className='font-medium text-gray-900 dark:text-white' to={`/quizzes/${quiz.slug}`}>{quiz.title}</Link>
                                    </Table.Cell>
                                    <Table.Cell>{quiz.category}</Table.Cell>
                                    <Table.Cell>{quiz.questions.length}</Table.Cell>
                                    <Table.Cell>
                                        <span
                                            onClick={() => {
                                                setShowModal(true);
                                                setQuizToDelete({ quizId: quiz._id });
                                            }}
                                            className='font-medium text-red-500 hover:underline cursor-pointer'
                                        >
                                            Delete
                                        </span>
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
                    {hasNextPage && (
                        <button
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                            className='w-full text-teal-500 self-center text-sm py-7'
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
