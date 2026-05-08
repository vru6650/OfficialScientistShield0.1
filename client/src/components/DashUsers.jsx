import { Modal, Table, Button } from 'flowbite-react';
import { useState } from 'react';
import { useSelector } from 'react-redux';
import { HiOutlineExclamationCircle } from 'react-icons/hi';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const PAGE_SIZE = 9;

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString();
};

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

  const openDeleteModal = (userId) => {
    setShowModal(true);
    setUserIdToDelete(userId);
  };

  const shouldShowEmpty = !isLoading && !isError && users.length === 0;

  return (
    <div className='space-y-4 p-3 md:mx-auto'>
      {isAdmin && users.length > 0 ? (
        <>
          <div className='grid gap-3 md:hidden'>
            {users.map((user) => (
              <article
                key={user._id}
                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
              >
                <div className='flex items-start gap-3'>
                  <img
                    src={user.profilePicture}
                    alt={user.username}
                    className='h-12 w-12 flex-none rounded-full bg-gray-500 object-cover'
                  />
                  <div className='min-w-0 flex-1'>
                    <div className='flex items-start justify-between gap-3'>
                      <div className='min-w-0'>
                        <h3 className='break-words text-base font-semibold text-slate-900 dark:text-white'>
                          {user.username}
                        </h3>
                        <p className='mt-1 break-all text-sm text-slate-600 dark:text-slate-300'>
                          {user.email}
                        </p>
                      </div>
                      <span className={`inline-flex min-h-8 flex-none items-center rounded-full px-3 text-xs font-semibold ${
                        user.isAdmin
                          ? 'bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                      }`}>
                        {user.isAdmin ? 'Admin' : 'Member'}
                      </span>
                    </div>
                    <p className='mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                      Created {formatDate(user.createdAt)}
                    </p>
                  </div>
                </div>
                <button
                  type='button'
                  onClick={() => openDeleteModal(user._id)}
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
                <Table.HeadCell>Date created</Table.HeadCell>
                <Table.HeadCell>User image</Table.HeadCell>
                <Table.HeadCell>Username</Table.HeadCell>
                <Table.HeadCell>Email</Table.HeadCell>
                <Table.HeadCell>Admin</Table.HeadCell>
                <Table.HeadCell>Delete</Table.HeadCell>
              </Table.Head>
              <Table.Body className='divide-y'>
                {users.map((user) => (
                  <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800' key={user._id}>
                    <Table.Cell>
                      {formatDate(user.createdAt)}
                    </Table.Cell>
                    <Table.Cell>
                    <img
                      src={user.profilePicture}
                      alt={user.username}
                      className='w-10 h-10 object-cover bg-gray-500 rounded-full'
                    />
                    </Table.Cell>
                    <Table.Cell>{user.username}</Table.Cell>
                    <Table.Cell className='max-w-xs truncate'>{user.email}</Table.Cell>
                    <Table.Cell>
                      {user.isAdmin ? (
                        <FaCheck className='text-green-500' />
                      ) : (
                        <FaTimes className='text-red-500' />
                      )}
                    </Table.Cell>
                    <Table.Cell>
                      <button
                        type='button'
                        onClick={() => openDeleteModal(user._id)}
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
      {isAdmin && isLoading && users.length === 0 ? <p className='text-sm text-slate-600 dark:text-slate-300'>Loading users...</p> : null}
      {isAdmin && isError ? <p className='text-sm text-red-600 dark:text-red-300'>{error?.message || 'Failed to load users.'}</p> : null}
      {isAdmin && shouldShowEmpty ? <p className='text-sm text-slate-600 dark:text-slate-300'>You have no users yet!</p> : null}
      {!isAdmin ? <p className='text-sm text-slate-600 dark:text-slate-300'>You have no users yet!</p> : null}
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
              <Button color='failure' onClick={handleDeleteUser} disabled={deleteMutation.isPending}>
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
