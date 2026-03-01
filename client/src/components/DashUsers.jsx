import { Modal, Table, Button } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const PAGE_SIZE = 9;

const fetchUsersPage = async ({ pageParam = 0 }) => {
  const res = await apiFetch(`/api/v1/user/getusers?startIndex=${pageParam}&limit=${PAGE_SIZE}`);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Failed to fetch users');
  }
  return data;
};

export default function DashUsers() {
  const { currentUser } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [userIdToDelete, setUserIdToDelete] = useState('');

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
    queryKey: ['adminUsers', currentUser?._id],
    queryFn: fetchUsersPage,
    enabled: isAdmin,
    getNextPageParam: (lastPage, pages) =>
      lastPage?.users?.length === PAGE_SIZE ? pages.length * PAGE_SIZE : undefined,
  });

  const users = data?.pages?.flatMap((page) => page.users) ?? [];

  const deleteMutation = useMutation({
    mutationFn: async (userId) => {
      const res = await apiFetch(`/api/v1/user/delete/${userId}`, {
        method: 'DELETE',
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(payload.message || 'Failed to delete user');
      }
      return userId;
    },
    onSuccess: (deletedId) => {
      queryClient.setQueryData(['adminUsers', currentUser?._id], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map((page) => ({
            ...page,
            users: page.users.filter((user) => user._id !== deletedId),
          })),
        };
      });
      setShowModal(false);
    },
  });

  const handleShowMore = () => {
    fetchNextPage();
  };

  const handleDeleteUser = () => {
    if (!userIdToDelete) return;
    deleteMutation.mutate(userIdToDelete);
  };

  const shouldShowEmpty = !isLoading && !isError && users.length === 0;

  return (
    <div className='table-auto overflow-x-scroll md:mx-auto p-3 scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500'>
      {isAdmin && users.length > 0 ? (
        <>
          <Table hoverable className='shadow-md'>
            <Table.Head>
              <Table.HeadCell>Date created</Table.HeadCell>
              <Table.HeadCell>User image</Table.HeadCell>
              <Table.HeadCell>Username</Table.HeadCell>
              <Table.HeadCell>Email</Table.HeadCell>
              <Table.HeadCell>Admin</Table.HeadCell>
              <Table.HeadCell>Delete</Table.HeadCell>
            </Table.Head>
            {users.map((user) => (
              <Table.Body className='divide-y' key={user._id}>
                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                  <Table.Cell>
                    {new Date(user.createdAt).toLocaleDateString()}
                  </Table.Cell>
                  <Table.Cell>
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className='w-10 h-10 object-cover bg-gray-500 rounded-full'
                    />
                  </Table.Cell>
                  <Table.Cell>{user.username}</Table.Cell>
                  <Table.Cell>{user.email}</Table.Cell>
                  <Table.Cell>
                    {user.isAdmin ? (
                      <FaCheck className='text-green-500' />
                    ) : (
                      <FaTimes className='text-red-500' />
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <span
                      onClick={() => {
                        setShowModal(true);
                        setUserIdToDelete(user._id);
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
      {isAdmin && isLoading && users.length === 0 ? <p>Loading users...</p> : null}
      {isAdmin && isError ? <p>{error?.message || 'Failed to load users.'}</p> : null}
      {isAdmin && shouldShowEmpty ? <p>You have no users yet!</p> : null}
      {!isAdmin ? <p>You have no users yet!</p> : null}
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
              Are you sure you want to delete this user?
            </h3>
            <div className='flex justify-center gap-4'>
              <Button color='failure' onClick={handleDeleteUser} disabled={deleteMutation.isLoading}>
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
