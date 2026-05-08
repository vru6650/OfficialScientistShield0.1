import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    Alert,
    Badge,
    Button,
    Card,
    Label,
    Modal,
    Select,
    Spinner,
    Table,
    TextInput,
} from 'flowbite-react';
import {
    HiOutlineExclamationCircle,
    HiOutlineExternalLink,
    HiOutlinePlus,
    HiOutlineSearch,
    HiPencilAlt,
    HiTrash,
} from 'react-icons/hi';
import { deletePage, getPages } from '../services/pageService.js';

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    try {
        return new Date(value).toLocaleDateString();
    } catch (error) {
        return value;
    }
};

const statusColor = (status) => (status === 'published' ? 'success' : 'warning');

const DashPages = () => {
    const { currentUser } = useSelector((state) => state.user);
    const queryClient = useQueryClient();

    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [showModal, setShowModal] = useState(false);
    const [pageToDelete, setPageToDelete] = useState(null);

    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearch(searchTerm.trim());
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchTerm]);

    const filters = useMemo(
        () => ({
            status: statusFilter,
            search: debouncedSearch,
            limit: 8,
        }),
        [statusFilter, debouncedSearch]
    );

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ['adminPages', filters],
        queryFn: ({ pageParam = 0, queryKey }) => getPages({ pageParam, queryKey }),
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextIndex : undefined),
        enabled: Boolean(currentUser?.isAdmin),
    });

    const deleteMutation = useMutation({
        mutationFn: deletePage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPages'] });
        },
    });

    const pages = data?.pages.flatMap((page) => page.pages ?? []) ?? [];
    const totalCount = data?.pages?.[0]?.totalCount ?? 0;
    const lastMonthCount = data?.pages?.[0]?.lastMonthCount ?? 0;

    const handleConfirmDelete = () => {
        if (!pageToDelete) {
            return;
        }

        deleteMutation.mutate(pageToDelete, {
            onSuccess: () => {
                setShowModal(false);
                setPageToDelete(null);
            },
        });
    };

    if (!currentUser?.isAdmin) {
        return (
            <Card className='mx-auto mt-10 max-w-2xl text-center'>
                <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Administrator access required</h2>
                <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                    You need administrator permissions to manage custom pages.
                </p>
            </Card>
        );
    }

    return (
        <div className='space-y-5 p-3 md:mx-auto'>
            <div className='mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                <div className='min-w-0'>
                    <h1 className='text-2xl font-semibold text-gray-900 dark:text-white'>Content management</h1>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Build bespoke landing pages, curriculum outlines, and resource hubs without deploying code.
                    </p>
                </div>
                <Button gradientDuoTone='purpleToBlue' as={Link} to='/create-page' className='w-full sm:w-auto'>
                    <HiOutlinePlus className='mr-2 h-5 w-5' /> New page
                </Button>
            </div>

            <Card className='mb-5'>
                <div className='flex min-w-0 flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='grid min-w-0 w-full gap-3 sm:grid-cols-2 lg:max-w-3xl'>
                        <div className='flex min-w-0 flex-col gap-2'>
                            <Label htmlFor='page-search'>Search</Label>
                            <TextInput
                                id='page-search'
                                icon={HiOutlineSearch}
                                placeholder='Search by title or slug'
                                value={searchTerm}
                                onChange={(event) => setSearchTerm(event.target.value)}
                            />
                        </div>
                        <div className='flex min-w-0 flex-col gap-2'>
                            <Label htmlFor='status-filter'>Status</Label>
                            <Select
                                id='status-filter'
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                            >
                                <option value='all'>All pages</option>
                                <option value='published'>Published</option>
                                <option value='draft'>Draft</option>
                            </Select>
                        </div>
                    </div>
                    <div className='flex flex-none flex-col gap-1 text-sm text-gray-500 dark:text-gray-400'>
                        <span>Total pages: {totalCount}</span>
                        <span>Created in last 30 days: {lastMonthCount}</span>
                    </div>
                </div>
            </Card>

            {deleteMutation.isError && (
                <Alert color='failure' onDismiss={() => deleteMutation.reset()} className='mb-5'>
                    {deleteMutation.error?.response?.data?.message ||
                        deleteMutation.error?.message ||
                        'Failed to delete the selected page.'}
                </Alert>
            )}

            {isLoading ? (
                <div className='flex min-h-[40vh] items-center justify-center'>
                    <Spinner size='xl' />
                </div>
            ) : isError ? (
                <Alert color='failure'>
                    {error?.response?.data?.message || error?.message || 'Failed to load content pages.'}
                </Alert>
            ) : pages.length === 0 ? (
                <Card className='border border-dashed border-gray-200 p-10 text-center dark:border-gray-700'>
                    <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>No pages found</h2>
                    <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>
                        Start by creating a page to power a new learning journey or marketing campaign.
                    </p>
                    <Button className='mt-4' gradientDuoTone='purpleToBlue' as={Link} to='/create-page'>
                        <HiOutlinePlus className='mr-2 h-5 w-5' /> Create your first page
                    </Button>
                </Card>
            ) : (
                <div className='space-y-4'>
                    <div className='grid gap-3 md:hidden'>
                        {pages.map((page) => (
                            <article
                                key={page._id}
                                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                            Updated {formatDate(page.updatedAt)}
                                        </p>
                                        <h2 className='mt-1 break-words text-base font-semibold text-slate-900 dark:text-white'>
                                            {page.title}
                                        </h2>
                                    </div>
                                    <Badge color={statusColor(page.status)}>{page.status}</Badge>
                                </div>
                                {page.description ? (
                                    <p className='mt-3 line-clamp-3 break-words text-sm leading-6 text-slate-600 dark:text-slate-300'>
                                        {page.description}
                                    </p>
                                ) : null}
                                <dl className='mt-4 grid gap-2 text-sm text-slate-600 dark:text-slate-300'>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Slug</dt>
                                        <dd className='mt-1 break-all font-mono text-xs'>/{page.slug}</dd>
                                    </div>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Sections</dt>
                                        <dd className='mt-1'>{page.sections?.length ?? 0}</dd>
                                    </div>
                                </dl>
                                <div className='mt-4 grid gap-2 sm:grid-cols-3'>
                                    <Link
                                        to={`/update-page/${page._id}`}
                                        className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-900/40'
                                    >
                                        <HiPencilAlt className='h-4 w-4' />
                                        Edit
                                    </Link>
                                    <Link
                                        to={`/content/${page.slug}`}
                                        className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sky-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 dark:focus-visible:ring-sky-900/40'
                                    >
                                        <HiOutlineExternalLink className='h-4 w-4' />
                                        View
                                    </Link>
                                    <button
                                        type='button'
                                        onClick={() => {
                                            setPageToDelete(page._id);
                                            setShowModal(true);
                                        }}
                                        disabled={deleteMutation.isPending}
                                        className='inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-red-200 px-4 text-sm font-semibold text-red-600 transition hover:bg-red-50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-red-100 disabled:cursor-not-allowed disabled:opacity-60 dark:border-red-500/30 dark:text-red-300 dark:hover:bg-red-500/10 dark:focus-visible:ring-red-900/40'
                                    >
                                        <HiTrash className='h-4 w-4' />
                                        Delete
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='hidden overflow-x-auto rounded-2xl border border-gray-100 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/80 md:block'>
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Updated</Table.HeadCell>
                                <Table.HeadCell>Title</Table.HeadCell>
                                <Table.HeadCell>Slug</Table.HeadCell>
                                <Table.HeadCell>Status</Table.HeadCell>
                                <Table.HeadCell>Sections</Table.HeadCell>
                                <Table.HeadCell className='w-36'>Actions</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className='divide-y'>
                                {pages.map((page) => (
                                    <Table.Row key={page._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                        <Table.Cell>{formatDate(page.updatedAt)}</Table.Cell>
                                        <Table.Cell className='max-w-xs'>
                                            <div className='flex flex-col gap-1'>
                                                <span className='font-medium text-gray-900 dark:text-white'>{page.title}</span>
                                                {page.description && (
                                                    <span className='text-xs text-gray-500 dark:text-gray-400 line-clamp-2'>
                                                        {page.description}
                                                    </span>
                                                )}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <code className='text-xs text-gray-500 dark:text-gray-400'>/{page.slug}</code>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <Badge color={statusColor(page.status)}>{page.status}</Badge>
                                        </Table.Cell>
                                        <Table.Cell>{page.sections?.length ?? 0}</Table.Cell>
                                        <Table.Cell>
                                            <div className='flex items-center gap-2'>
                                                <Button
                                                    color='light'
                                                    size='xs'
                                                    pill
                                                    as={Link}
                                                    to={`/update-page/${page._id}`}
                                                >
                                                    <HiPencilAlt className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    color='light'
                                                    size='xs'
                                                    pill
                                                    as={Link}
                                                    to={`/content/${page.slug}`}
                                                >
                                                    <HiOutlineExternalLink className='h-4 w-4' />
                                                </Button>
                                                <Button
                                                    color='failure'
                                                    size='xs'
                                                    pill
                                                    type='button'
                                                    onClick={() => {
                                                        setPageToDelete(page._id);
                                                        setShowModal(true);
                                                    }}
                                                >
                                                    <HiTrash className='h-4 w-4' />
                                                </Button>
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                    {hasNextPage && (
                        <div className='flex justify-center'>
                            <Button
                                color='light'
                                onClick={() => fetchNextPage()}
                                disabled={isFetchingNextPage}
                                className='min-h-11 w-full sm:w-auto'
                            >
                                {isFetchingNextPage ? 'Loading…' : 'Load more'}
                            </Button>
                        </div>
                    )}
                </div>
            )}

            <Modal show={showModal} size='md' popup onClose={() => setShowModal(false)}>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200' />
                        <h3 className='mb-5 text-lg text-gray-500 dark:text-gray-400'>
                            Are you sure you want to delete this page?
                        </h3>
                        <div className='flex justify-center gap-4'>
                            <Button color='failure' onClick={handleConfirmDelete} isProcessing={deleteMutation.isPending}>
                                Yes, delete it
                            </Button>
                            <Button color='gray' onClick={() => setShowModal(false)} disabled={deleteMutation.isPending}>
                                Cancel
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default DashPages;
