import { useState } from 'react';
import { FaThumbsUp, FaEdit, FaTrashAlt } from 'react-icons/fa';
import { useSelector } from 'react-redux';
import { Button, Textarea } from 'flowbite-react';
import { motion } from 'framer-motion';
import useUser from '../hooks/useUser'; // Import our new hook
import DeleteConfirmationModal from './DeleteConfirmationModal'; // Import our new modal
import { formatRelativeTimeFromNow } from '../utils/date.js';
import { apiFetch } from '../utils/apiFetch';

export default function Comment({ comment, onLike, onEdit, onDelete }) {
  const { currentUser } = useSelector((state) => state.user);

  // Use our custom hook to get user data, loading, and error states
  const { user, isLoading: isUserLoading } = useUser(comment.userId);

  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.content);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const handleEdit = () => {
    setIsEditing(true);
    // No need to set editedContent here, it's already initialized with comment.content
  };

  const handleSave = async () => {
    try {
      const res = await apiFetch(`/api/v1/comment/editComment/${comment._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editedContent,
        }),
      });
      if (res.ok) {
        setIsEditing(false);
        onEdit(comment, editedContent);
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(false); // Close the modal
    onDelete(comment._id); // Call the parent delete function
  };

  // A simple skeleton loader for when user data is being fetched
  if (isUserLoading) {
    return (
        <div className='flex p-4 border-b dark:border-gray-600 text-sm animate-pulse'>
          <div className='flex-shrink-0 mr-3'>
            <div className='w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600'></div>
          </div>
          <div className='flex-1'>
            <div className='h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4 mb-2'></div>
            <div className='h-8 bg-gray-300 dark:bg-gray-600 rounded w-full'></div>
          </div>
        </div>
    );
  }

  return (
      <>
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className='flex p-4 border-b dark:border-gray-600 text-sm'
        >
          <div className='flex-shrink-0 mr-3'>
            <img
                className='w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 object-cover'
                src={user?.profilePicture}
                alt={user?.username}
            />
          </div>
          <div className='flex-1'>
            <div className='flex items-center mb-1'>
            <span className='font-bold mr-1 text-xs truncate'>
              {user ? `@${user.username}` : 'anonymous user'}
            </span>
              <span className='text-gray-500 dark:text-gray-400 text-xs'>
              {formatRelativeTimeFromNow(comment.createdAt)}
            </span>
            </div>
            {isEditing ? (
                <>
                  <Textarea
                      className='mb-2'
                      value={editedContent}
                      onChange={(e) => setEditedContent(e.target.value)}
                      rows={3}
                  />
                  <div className='flex justify-end gap-2 text-xs'>
                    <Button
                        type='button'
                        size='sm'
                        gradientDuoTone='purpleToBlue'
                        onClick={handleSave}
                    >
                      Save
                    </Button>
                    <Button
                        type='button'
                        size='sm'
                        gradientDuoTone='purpleToBlue'
                        outline
                        onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </>
            ) : (
                <>
                  <p className='text-gray-500 dark:text-gray-300 pb-2 break-words'>{comment.content}</p>
                  <div className='flex items-center pt-2 text-xs border-t dark:border-gray-700 max-w-fit gap-4'>
                    <button
                        type='button'
                        onClick={() => onLike(comment._id)}
                        className={`text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 flex items-center gap-1 ${
                            currentUser &&
                            comment.likes.includes(currentUser._id) &&
                            'text-blue-500 dark:text-blue-400'
                        }`}
                    >
                      <FaThumbsUp className='text-sm' />
                      <span className='text-gray-400 dark:text-gray-500'>
                    {comment.numberOfLikes > 0 &&
                        comment.numberOfLikes}
                  </span>
                    </button>

                    {currentUser &&
                        (currentUser._id === comment.userId || currentUser.isAdmin) && (
                            <div className='flex gap-4'>
                              <button
                                  type='button'
                                  onClick={handleEdit}
                                  className='text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400'
                              >
                                <FaEdit />
                              </button>
                              <button
                                  type='button'
                                  onClick={() => setShowDeleteModal(true)}
                                  className='text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400'
                              >
                                <FaTrashAlt />
                              </button>
                            </div>
                        )}
                  </div>
                </>
            )}
          </div>
        </motion.div>

        <DeleteConfirmationModal
            isOpen={showDeleteModal}
            onClose={() => setShowDeleteModal(false)}
            onConfirm={handleDelete}
        />
      </>
  );
}
