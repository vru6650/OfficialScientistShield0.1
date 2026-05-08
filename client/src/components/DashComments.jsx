import { Modal, Table, Button } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const PAGE_SIZE = 9;

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString();
};

const fetchCommentsPage = async ({ pageParam = 0 }) => {
  const res = await apiFetch(`/api/v1/comment/getcomments?startIndex=${pageParam}&limit=${PAGE_SIZE}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch comments');
  }
  return data;
};

export default function DashComments() {
  const { currentUser } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [commentIdToDelete, setCommentIdToDelete] = useState('');

  const isAdmin = Boolean(currentUser?.isAdmin);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['adminComments', currentUser?._id],
    queryFn: fetchCommentsPage,
    enabled: isAdmin,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.comments?.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });

  const comments = data?.pages?.flatMap((page) => page.comments) ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      const res = await apiFetch(`/api/v1/comment/deleteComment/${commentId}`, {
        method: 'DELETE',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || 'Failed to delete comment');
      }
      return commentId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['adminComments', currentUser?._id], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            comments: page.comments.filter((comment) => comment._id !== deletedId),
          })),
        };
      });
      setShowModal(false);
    },
  });

  const handleShowMore = () => {
    fetchNextPage();
  };

  const handleDeleteComment = () => {
    if (!commentIdToDelete) return;
    deleteMutation.mutate(commentIdToDelete);
  };

  const openDeleteModal = (commentId) => {
    setShowModal(true);
    setCommentIdToDelete(commentId);
  };

  const shouldShowEmpty = !isLoading && !isError && comments.length === 0;

  return (
    <div className='space-y-4 p-3 md:mx-auto'>
      {isAdmin && comments.length > 0 ? (
        <>
          <div className='grid gap-3 md:hidden'>
            {comments.map((comment) => (
              <article
                key={comment._id}
                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
              >
                <div className='flex items-start justify-between gap-3'>
                  <div className='min-w-0'>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                      Updated
                    </p>
                    <p className='mt-1 text-sm font-semibold text-slate-900 dark:text-white'>
                      {formatDate(comment.updatedAt)}
                    </p>
                  </div>
                  <span className='inline-flex min-h-8 flex-none items-center rounded-full bg-slate-100 px-3 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                    {comment.numberOfLikes} likes
                  </span>
                </div>
                <p className='mt-3 break-words text-sm leading-6 text-slate-700 dark:text-slate-200'>
                  {comment.content}
                </p>
                <dl className='mt-4 grid gap-2 text-xs text-slate-500 dark:text-slate-400'>
                  <div>
                    <dt className='font-semibold uppercase tracking-wide'>Post ID</dt>
                    <dd className='mt-1 break-all font-mono'>{comment.postId}</dd>
                  </div>
                  <div>
                    <dt className='font-semibold uppercase tracking-wide'>User ID</dt>
                    <dd className='mt-1 break-all font-mono'>{comment.userId}</dd>
                  </div>
                </dl>
                <button
                  type='button'
                  onClick={() => openDeleteModal(comment._id)}
                  disabled={deleteMutation.isPending}
                  className='mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-900/40'
                >
                  Delete
                </button>
              </article>
            ))}
          </div>
          <div className='hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-md scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:border-slate-700 dark:bg-slate-900 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500 md:block'>
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell>Date updated</Table.HeadCell>
                <Table.HeadCell>Comment content</Table.HeadCell>
                <Table.HeadCell>Number of likes</Table.HeadCell>
                <Table.HeadCell>PostId</Table.HeadCell>
                <Table.HeadCell>UserId</Table.HeadCell>
                <Table.HeadCell>Delete</Table.HeadCell>
              </Table.Head>
              <Table.Body className='divide-y'>
                {comments.map((comment) => (
                  <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800' key={comment._id}>
                    <Table.Cell>
                      {formatDate(comment.updatedAt)}
                    </Table.Cell>
                    <Table.Cell className='max-w-sm'>
                      <p className='line-clamp-2 break-words'>{comment.content}</p>
                    </Table.Cell>
                    <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                    <Table.Cell className='max-w-[14rem] truncate font-mono text-xs'>{comment.postId}</Table.Cell>
                    <Table.Cell className='max-w-[14rem] truncate font-mono text-xs'>{comment.userId}</Table.Cell>
                    <Table.Cell>
                      <button
                        type='button'
                        onClick={() => openDeleteModal(comment._id)}
                        disabled={deleteMutation.isPending}
                        className='font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60'
                      >
                        Delete
                      </button>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          {hasNextPage && (
            <button
              onClick={handleShowMore}
              className='min-h-11 w-full self-center py-3 text-sm font-semibold text-teal-500'
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Show more'}
            </button>
          )}
        </>
      ) : null}
      {isAdmin && isLoading && comments.length === 0 ? <p className='text-sm text-slate-600 dark:text-slate-300'>Loading comments...</p> : null}
      {isAdmin && isError ? <p className='text-sm text-red-600 dark:text-red-300'>{error?.message || 'Failed to load comments.'}</p> : null}
      {isAdmin && shouldShowEmpty ? <p className='text-sm text-slate-600 dark:text-slate-300'>You have no comments yet!</p> : null}
      {!isAdmin ? <p className='text-sm text-slate-600 dark:text-slate-300'>You have no comments yet!</p> : null}
      <Modal
        show={showModal}
        onClose={() => setShowModal(false)}
        popup
        size='md'
      >
        <Modal.Header />
        <Modal.Body>
          <div className='text-center'>
            <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
            <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
              Are you sure you want to delete this comment?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={handleDeleteComment} disabled={deleteMutation.isPending}>
                Yes, I'm sure
              </Button>
              <Button color='gray' onClick={() => setShowModal(false)}>
                No, cancel
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
