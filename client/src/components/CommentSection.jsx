import { Alert, Button, Modal, Textarea } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Comment from './Comment';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { apiFetch } from '../utils/apiFetch';

const fetchPostComments = async (postId) => {
  const res = await apiFetch(`/api/v1/comment/getPostComments/${postId}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch comments');
  }
  return data;
};

export default function CommentSection({ postId }) {
  const { currentUser } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState(null);
  const navigate = useNavigate();

  const {
    data: commentsData,
    isLoading: commentsLoading,
    isError: commentsError,
    error: commentsErrorMessage,
  } = useQuery({
    queryKey: ['postComments', postId],
    queryFn: () => fetchPostComments(postId),
    enabled: Boolean(postId),
  });

  const comments = Array.isArray(commentsData) ? commentsData : [];

  const createMutation = useMutation({
    mutationFn: async ({ content, postId: targetPostId }) => {
      const res = await apiFetch('/api/v1/comment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          postId: targetPostId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create comment');
      }
      return data;
    },
    onSuccess: (newComment) => {
      queryClient.setQueryData(['postComments', postId], (old = []) => [newComment, ...old]);
      setComment('');
      setCommentError(null);
    },
    onError: (err) => {
      setCommentError(err.message);
    },
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId) => {
      const res = await apiFetch(`/api/v1/comment/likeComment/${commentId}`, {
        method: 'PUT',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to like comment');
      }
      return data;
    },
    onSuccess: (updatedComment) => {
      queryClient.setQueryData(['postComments', postId], (old = []) =>
        old.map((item) =>
          item._id === updatedComment._id
            ? {
              ...item,
              likes: updatedComment.likes,
              numberOfLikes: updatedComment.numberOfLikes,
            }
            : item
        )
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (commentId) => {
      const res = await apiFetch(`/api/v1/comment/deleteComment/${commentId}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || 'Failed to delete comment');
      }
      return commentId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['postComments', postId], (old = []) =>
        old.filter((item) => item._id !== deletedId)
      );
      setShowModal(false);
    },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (comment.length > 200) {
      return;
    }
    createMutation.mutate({ content: comment, postId });
  };

  const handleLike = async (commentId) => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    likeMutation.mutate(commentId);
  };

  const handleEdit = async (targetComment, editedContent) => {
    queryClient.setQueryData(['postComments', postId], (old = []) =>
      old.map((item) =>
        item._id === targetComment._id ? { ...item, content: editedContent } : item
      )
    );
  };

  const handleDelete = async (commentId) => {
    if (!currentUser) {
      navigate('/sign-in');
      return;
    }
    deleteMutation.mutate(commentId);
  };

  return (
      <div className='max-w-2xl mx-auto w-full p-3'>
        {currentUser ? (
            <div className='flex items-center gap-1 my-5 text-gray-500 dark:text-gray-400 text-sm'>
              <p>Signed in as:</p>
              <img
                  className='h-5 w-5 object-cover rounded-full'
                  src={currentUser.profilePicture}
                  alt=''
              />
              <Link
                  to={'/dashboard?tab=profile'}
                  className='text-xs text-cyan-600 dark:text-cyan-400 hover:underline'
              >
                @{currentUser.username}
              </Link>
            </div>
        ) : (
            <div className='text-sm text-teal-500 dark:text-teal-400 my-5 flex gap-1'>
              You must be signed in to comment.
              <Link className='text-blue-500 dark:text-blue-400 hover:underline' to={'/sign-in'}>
                Sign In
              </Link>
            </div>
        )}
        {currentUser && (
            <form
                onSubmit={handleSubmit}
                className='border border-teal-500 rounded-md p-3'
            >
              <Textarea
                  placeholder='Add a comment...'
                  rows='3'
                  maxLength='200'
                  onChange={(e) => setComment(e.target.value)}
                  value={comment}
              />
              <div className='flex justify-between items-center mt-5'>
                <p className='text-gray-500 dark:text-gray-400 text-xs'>
                  {200 - comment.length} characters remaining
                </p>
                <Button outline gradientDuoTone='purpleToBlue' type='submit' disabled={createMutation.isLoading}>
                  {createMutation.isLoading ? 'Submitting...' : 'Submit'}
                </Button>
              </div>
              {commentError && (
                  <Alert color='failure' className='mt-5'>
                    {commentError}
                  </Alert>
              )}
            </form>
        )}
        {commentsLoading ? (
            <p className='text-sm my-5 text-gray-600 dark:text-gray-300'>Loading comments...</p>
        ) : commentsError ? (
            <p className='text-sm my-5 text-gray-600 dark:text-gray-300'>
              {commentsErrorMessage?.message || 'Failed to load comments.'}
            </p>
        ) : comments.length === 0 ? (
            <p className='text-sm my-5 text-gray-600 dark:text-gray-300'>No comments yet!</p>
        ) : (
            <>
              <div className='text-sm my-5 flex items-center gap-1'>
                <p>Comments</p>
                <div className='border border-gray-400 dark:border-gray-600 py-1 px-2 rounded-sm'>
                  <p>{comments.length}</p>
                </div>
              </div>
              {comments.map((commentItem) => (
                  <Comment
                      key={commentItem._id}
                      comment={commentItem}
                      onLike={handleLike}
                      onEdit={handleEdit}
                      onDelete={(commentId) => {
                        setShowModal(true);
                        setCommentToDelete(commentId);
                      }}
                  />
              ))}
            </>
        )}
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
                <Button
                    color='failure'
                    onClick={() => handleDelete(commentToDelete)}
                    disabled={deleteMutation.isLoading}
                >
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
