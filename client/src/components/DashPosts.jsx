import { Modal, Table, Button, Spinner, Alert, Badge, TextInput, Select, Tooltip } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { HiOutlineExclamationCircle, HiArrowPath, HiMagnifyingGlass, HiSparkles, HiFilm, HiMusicalNote, HiPhoto } from 'react-icons/hi2';
import { getAdminPosts, deletePost } from '../services/postService';
import useDebounce from '../hooks/useDebounce';
import { getPostPreviewImage, getPrimaryPostAsset } from '../utils/postMedia.js';
import { getPostPath } from '../utils/postPath.js';

const formatDate = (date) => {
  if (!date) return 'Unknown';
  return new Date(date).toLocaleDateString();
};

export default function DashPosts() {
  const { currentUser } = useSelector((state) => state.user);
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [kind, setKind] = useState('all');
  const [sort, setSort] = useState('updatedAt');
  const [order, setOrder] = useState('desc');

  // 1. UPDATED: State now holds an object for the post to delete
  const [postToDelete, setPostToDelete] = useState(null);
  const PAGE_SIZE = 15;
  const debouncedSearch = useDebounce(searchTerm, 320);

  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['adminPosts', currentUser._id, { searchTerm: debouncedSearch.trim(), category, kind, sort, order, pageSize: PAGE_SIZE }],
    queryFn: getAdminPosts,
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage || lastPage.posts.length < PAGE_SIZE) return undefined;
      return allPages.length * PAGE_SIZE;
    },
    enabled: !!currentUser?.isAdmin,
  });

  const deleteMutation = useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['adminPosts', currentUser._id] });
    },
  });

  // 3. UPDATED: Pass the entire postToDelete object to the mutation
  const handleDeletePost = () => {
    setShowModal(false);
    if (postToDelete) {
      deleteMutation.mutate(postToDelete);
    }
  };

  const posts = data?.pages.flatMap(page => page.posts) ?? [];
  const totalPosts = data?.pages?.[0]?.totalPosts ?? posts.length;
  const communityPosts = posts.filter((p) => p.kind === 'community').length;
  const avgClaps = posts.length ? Math.round(posts.reduce((sum, p) => sum + (p.claps || 0), 0) / posts.length) : 0;

  const categories = useMemo(() => {
    const set = new Set(['all']);
    posts.forEach((p) => p.category && set.add(p.category));
    return Array.from(set);
  }, [posts]);

  const mediaIcon = (post) => {
    const type = getPrimaryPostAsset(post)?.type || post.mediaType || 'image';
    if (type === 'video') return <HiFilm className='h-4 w-4 text-indigo-500' />;
    if (type === 'audio') return <HiMusicalNote className='h-4 w-4 text-amber-500' />;
    return <HiPhoto className='h-4 w-4 text-emerald-500' />;
  };

  const renderPreview = (post) => {
    const primaryAsset = getPrimaryPostAsset(post);
    const previewImage = getPostPreviewImage(post);

    if (previewImage) {
      return (
        <img
          src={previewImage}
          alt={post.title}
          className='h-12 w-20 rounded-lg bg-gray-200 object-cover dark:bg-slate-700'
        />
      );
    }

    const label =
      primaryAsset?.type === 'video'
        ? 'Video'
        : primaryAsset?.type === 'audio'
          ? 'Audio'
          : primaryAsset?.type === 'document'
            ? 'Doc'
            : 'Media';

    return (
      <div className='flex h-12 w-20 items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
        {label}
      </div>
    );
  };

  return (
      <div className='space-y-4 md:mx-auto p-3'>
        <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
          <div className='space-y-1'>
            <p className='text-xs uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400'>Admin · Posts</p>
            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Manage articles & community posts</h2>
          </div>
          <div className='flex flex-wrap items-center gap-2'>
            <Badge color='info'>{totalPosts.toLocaleString()} total</Badge>
            <Badge color='purple'>{communityPosts} community</Badge>
            <Badge color='success'>{avgClaps} avg claps</Badge>
            <Button color='light' onClick={() => refetch()} size='sm' pill>
              <HiArrowPath className='mr-2 h-4 w-4' /> Refresh
            </Button>
            <Button as={Link} to='/create-post' gradientDuoTone='cyanToBlue' size='sm'>New post</Button>
          </div>
        </div>

        <div className='grid gap-3 sm:grid-cols-2 xl:grid-cols-5'>
          <div className='sm:col-span-2'>
            <div className='relative'>
              <HiMagnifyingGlass className='absolute left-3 top-3.5 h-5 w-5 text-slate-400' />
              <TextInput
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder='Search by title or body'
                className='pl-10'
              />
            </div>
          </div>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'all' ? 'All categories' : c}</option>
            ))}
          </Select>
          <Select value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value='all'>All kinds</option>
            <option value='article'>Articles</option>
            <option value='community'>Community</option>
          </Select>
          <Select value={`${sort}:${order}`} onChange={(e) => {
            const [s, o] = e.target.value.split(':'); setSort(s); setOrder(o);
          }}>
            <option value='updatedAt:desc'>Latest updated</option>
            <option value='updatedAt:asc'>Oldest</option>
            <option value='claps:desc'>Most claps</option>
            <option value='title:asc'>Title A→Z</option>
          </Select>
        </div>

        {isLoading && (
            <div className='flex min-h-64 items-center justify-center'>
              <Spinner size='xl' />
            </div>
        )}
        {isError && (
            <Alert color='failure' className='my-4'>
              Error fetching posts: {error.message}
            </Alert>
        )}
        {deleteMutation.isError && (
            <Alert color='failure' onDismiss={() => deleteMutation.reset()}>
              Failed to delete post: {deleteMutation.error.message}
            </Alert>
        )}

        {currentUser.isAdmin && posts.length > 0 ? (
            <>
              <div className='grid gap-3 md:hidden'>
                {posts.map((post) => {
                      const postPath = getPostPath(post);

                      return (
                        <article
                          key={post._id}
                          className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                        >
                          <div className='flex items-start gap-3'>
                            {postPath ? (
                              <Link to={postPath} className='flex-none'>
                                {renderPreview(post)}
                              </Link>
                            ) : (
                              <div className='flex-none'>{renderPreview(post)}</div>
                            )}
                            <div className='min-w-0 flex-1'>
                              <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                Updated {formatDate(post.updatedAt)}
                              </p>
                              {postPath ? (
                                <Link className='mt-1 block break-words text-base font-semibold text-slate-900 hover:text-teal-600 dark:text-white dark:hover:text-teal-300' to={postPath}>
                                  {post.title}
                                </Link>
                              ) : (
                                <span className='mt-1 block break-words text-base font-semibold text-slate-900 dark:text-white'>{post.title}</span>
                              )}
                              <div className='mt-2 flex flex-wrap items-center gap-2'>
                                <span className='inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                  {mediaIcon(post)}
                                  {post.category || 'Uncategorized'}
                                </span>
                                <Badge color={post.kind === 'community' ? 'purple' : 'info'}>{post.kind || 'article'}</Badge>
                                {post.claps > 0 && <Badge color='success'>{post.claps} claps</Badge>}
                                {Array.isArray(post.mediaAssets) && post.mediaAssets.length > 1 && (
                                  <Badge color='gray'>{post.mediaAssets.length} items</Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className='mt-4 grid grid-cols-2 gap-2'>
                            <Link
                              className='inline-flex min-h-11 items-center justify-center rounded-xl border border-teal-200 px-4 text-sm font-semibold text-teal-600 transition hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-teal-100 dark:border-teal-500/30 dark:text-teal-300 dark:hover:bg-teal-500/10 dark:focus-visible:ring-teal-900/40'
                              to={`/update-post/${post._id}`}
                            >
                              Edit
                            </Link>
                            <button
                              type='button'
                              className='inline-flex min-h-11 items-center justify-center rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-900/40'
                              onClick={() => {
                                setShowModal(true);
                                setPostToDelete({ postId: post._id, userId: post.userId });
                              }}
                              disabled={deleteMutation.isPending}
                            >
                              Delete
                            </button>
                          </div>
                        </article>
                      );
                  })}
              </div>
              <div className='hidden overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm scrollbar scrollbar-track-slate-100 scrollbar-thumb-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:scrollbar-track-slate-700 dark:scrollbar-thumb-slate-500 md:block'>
                <Table hoverable>
                  <Table.Head>
                    <Table.HeadCell>Updated</Table.HeadCell>
                    <Table.HeadCell>Media</Table.HeadCell>
                    <Table.HeadCell>Title</Table.HeadCell>
                    <Table.HeadCell>Meta</Table.HeadCell>
                    <Table.HeadCell>Actions</Table.HeadCell>
                  </Table.Head>
                  <Table.Body className='divide-y'>
                    {posts.map((post) => {
                        const postPath = getPostPath(post);

                        return (
                        <Table.Row key={post._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                          <Table.Cell>{formatDate(post.updatedAt)}</Table.Cell>
                          <Table.Cell>
                            {postPath ? (
                                <Link to={postPath}>
                                  <div className='flex items-center gap-2'>
                                    {mediaIcon(post)}
                                    {renderPreview(post)}
                                    {Array.isArray(post.mediaAssets) && post.mediaAssets.length > 1 && (
                                        <Badge color='gray'>{post.mediaAssets.length} items</Badge>
                                    )}
                                  </div>
                                </Link>
                            ) : (
                                <div className='flex items-center gap-2'>
                                  {mediaIcon(post)}
                                  {renderPreview(post)}
                                  {Array.isArray(post.mediaAssets) && post.mediaAssets.length > 1 && (
                                      <Badge color='gray'>{post.mediaAssets.length} items</Badge>
                                  )}
                                </div>
                            )}
                          </Table.Cell>
                          <Table.Cell className='max-w-sm'>
                            {postPath ? (
                                <Link className='font-medium text-gray-900 dark:text-white' to={postPath}>{post.title}</Link>
                            ) : (
                                <span className='font-medium text-gray-900 dark:text-white'>{post.title}</span>
                            )}
                          </Table.Cell>
                          <Table.Cell>
                            <div className='flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300'>
                              <span className='font-semibold text-slate-800 dark:text-white'>{post.category}</span>
                              <div className='flex flex-wrap items-center gap-2'>
                                <Badge color={post.kind === 'community' ? 'purple' : 'info'}>{post.kind || 'article'}</Badge>
                                {post.claps > 0 && <Badge color='success'>{post.claps} claps</Badge>}
                                {Array.isArray(post.bookmarkedBy) && post.bookmarkedBy.length > 0 && (
                                    <Badge color='gray'>{post.bookmarkedBy.length} saves</Badge>
                                )}
                              </div>
                            </div>
                          </Table.Cell>
                          <Table.Cell>
                            <div className='flex items-center gap-2'>
                              <Link className='text-teal-500 hover:underline' to={`/update-post/${post._id}`}>
                                Edit
                              </Link>
                              <Tooltip content='Delete post'>
                                <button
                                  type='button'
                                  className='font-medium text-red-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60'
                                  onClick={() => {
                                    setShowModal(true);
                                    setPostToDelete({ postId: post._id, userId: post.userId });
                                  }}
                                  disabled={deleteMutation.isPending}
                                >
                                  Delete
                                </button>
                              </Tooltip>
                            </div>
                          </Table.Cell>
                        </Table.Row>
                        );
                    })}
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
            !isLoading && <p className='p-4 text-sm text-slate-600 dark:text-slate-300'>No posts found for these filters.</p>
        )}

        <Modal show={showModal} onClose={() => setShowModal(false)} popup size='md'>
          <Modal.Header />
          <Modal.Body>
            <div className='text-center'>
              <HiOutlineExclamationCircle className='h-14 w-14 text-gray-400 dark:text-gray-200 mb-4 mx-auto' />
              <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>Are you sure you want to delete this post?</h3>
              <div className='flex justify-center gap-4'>
                <Button color='failure' onClick={handleDeletePost} isProcessing={deleteMutation.isPending}>
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
