import { Modal, Table, Button } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const PAGE_SIZE = 9;

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

  const shouldShowEmpty = !isLoading && !isError && comments.length === 0;

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {isAdmin && comments.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date updated</Table.HeadCell>
              <Table.HeadCell>Comment content</Table.HeadCell>
              <Table.HeadCell>Number of likes</Table.HeadCell>
              <Table.HeadCell>PostId</Table.HeadCell>
              <Table.HeadCell>UserId</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            {comments.map((comment) => (
              <Table.Body className='divide-y' key={comment._id}>
                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>
                    {new Date(comment.updatedAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>{comment.content}</Table.Cell>
                  <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                  <Table.Cell>{comment.postId}</Table.Cell>
                  <Table.Cell>{comment.userId}</Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setCommentIdToDelete(comment._id);
                      }}
                      className='font-medium text-red-500 hover:underline cursor-pointer'
                    >
                      Delete
                    </span>
                  </Table.Cell>
                </Table.Row>
              </Table.Body>
            ))}
          </Table>
          {hasNextPage && (
            <button
              onClick={handleShowMore}
              className='w-full text-teal-500 self-center text-sm py-7'
              disabled={isFetchingNextPage}
            >
              {isFetchingNextPage ? 'Loading...' : 'Show more'}
            </button>
          )}
        </>
      ) : null}
      {isAdmin && isLoading && comments.length === 0 ? <p>Loading comments...</p> : null}
      {isAdmin && isError ? <p>{error?.message || 'Failed to load comments.'}</p> : null}
      {isAdmin && shouldShowEmpty ? <p>You have no comments yet!</p> : null}
      {!isAdmin ? <p>You have no comments yet!</p> : null}
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
