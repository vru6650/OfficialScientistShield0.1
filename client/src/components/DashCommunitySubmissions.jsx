import { useState } from 'react';
import { Alert, Badge, Button, Select, Spinner, Table, TextInput } from 'flowbite-react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSelector } from 'react-redux';
import { HiOutlineCheckCircle, HiOutlineRefresh, HiOutlineStatusOnline } from 'react-icons/hi';
import { listCommunitySubmissions, updateCommunitySubmissionStatus } from '../services/communityService.js';

const PAGE_SIZE = 10;

const statusOptions = [
    { value: 'all', label: 'All statuses' },
    { value: 'new', label: 'New' },
    { value: 'reviewing', label: 'Reviewing' },
    { value: 'contacted', label: 'Contacted' },
    { value: 'closed', label: 'Closed' },
];

const statusColor = {
    new: 'info',
    reviewing: 'warning',
    contacted: 'success',
    closed: 'gray',
};

const formatDate = (value) => {
    if (!value) return 'Unknown';
    return new Date(value).toLocaleString();
};

const fetchPage = async ({ pageParam = 0, queryKey }) => {
    const [, status, email] = queryKey;
    return listCommunitySubmissions({
        startIndex: pageParam,
        limit: PAGE_SIZE,
        status,
        email,
    });
};

export default function DashCommunitySubmissions() {
    const queryClient = useQueryClient();
    const { currentUser } = useSelector((state) => state.user);
    const isAdmin = Boolean(currentUser?.isAdmin);
    const [status, setStatus] = useState('all');
    const [emailFilter, setEmailFilter] = useState('');

    const {
        data,
        isLoading,
        isError,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        refetch,
        isFetching,
    } = useInfiniteQuery({
        queryKey: ['communitySubmissions', status, emailFilter.trim() || undefined],
        queryFn: fetchPage,
        initialPageParam: 0,
        getNextPageParam: (lastPage) => (lastPage?.hasMore ? lastPage.nextIndex : undefined),
        refetchOnWindowFocus: false,
        enabled: isAdmin,
    });

    const submissions = data?.pages?.flatMap((page) => page.submissions) ?? [];

    const updateStatus = useMutation({
        mutationFn: ({ submissionId, nextStatus }) =>
            updateCommunitySubmissionStatus({ submissionId, status: nextStatus }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['communitySubmissions'] });
        },
    });

    const handleStatusChange = (submissionId, nextStatus) => {
        updateStatus.mutate({ submissionId, nextStatus });
    };

    const shouldShowEmpty = !isLoading && !isError && submissions.length === 0;

    if (!isAdmin) {
        return (
            <div className='p-4'>
                <Alert color='warning'>Administrator access required.</Alert>
            </div>
        );
    }

    return (
        <div className='space-y-4 p-3 md:mx-auto md:p-4'>
            <div className='mb-4 flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center lg:justify-between'>
                <div className='min-w-0 space-y-1'>
                    <p className='text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>Community</p>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Submissions</h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>Match members to circles, reviewers, and tracks.</p>
                </div>
                <div className='grid min-w-0 gap-2 sm:grid-cols-3 lg:max-w-2xl'>
                    <Select value={status} onChange={(e) => setStatus(e.target.value)}>
                        {statusOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </Select>
                    <TextInput
                        placeholder='Filter by email'
                        value={emailFilter}
                        onChange={(e) => setEmailFilter(e.target.value)}
                    />
                    <Button color='light' onClick={() => refetch()} disabled={isFetching} className='min-h-11 w-full'>
                        <HiOutlineRefresh className={isFetching ? 'mr-2 h-5 w-5 animate-spin' : 'mr-2 h-5 w-5'} />
                        Refresh
                    </Button>
                </div>
            </div>

            {isError && (
                <Alert color='failure' className='mb-4'>
                    {error?.message || 'Unable to load submissions.'}
                </Alert>
            )}

            {isLoading ? (
                <div className='flex min-h-[40vh] items-center justify-center'>
                    <Spinner size='xl' />
                </div>
            ) : null}

            {shouldShowEmpty ? (
                <div className='rounded-2xl border border-dashed border-gray-300 bg-white p-8 text-center shadow-sm dark:border-gray-700 dark:bg-gray-800/60'>
                    <HiOutlineStatusOnline className='mx-auto mb-3 h-8 w-8 text-cyan-500' />
                    <p className='text-lg font-semibold text-gray-900 dark:text-white'>No submissions yet</p>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>
                        Share the community form link to start collecting interest.
                    </p>
                </div>
            ) : null}

            {submissions.length > 0 ? (
                <div className='space-y-3'>
                    <div className='grid gap-3 md:hidden'>
                        {submissions.map((submission) => (
                            <article
                                key={submission._id}
                                className='rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                            >
                                <div className='flex items-start justify-between gap-3'>
                                    <div className='min-w-0'>
                                        <h3 className='break-words text-base font-semibold text-slate-900 dark:text-white'>{submission.name}</h3>
                                        <p className='mt-1 break-all text-sm text-slate-600 dark:text-slate-300'>{submission.email}</p>
                                    </div>
                                    <Badge color={statusColor[submission.status] || 'gray'}>{submission.status}</Badge>
                                </div>
                                <dl className='mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-300'>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Role</dt>
                                        <dd className='mt-1 break-words'>{submission.role || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Experience</dt>
                                        <dd className='mt-1'>{submission.experienceLevel || '-'}</dd>
                                    </div>
                                    <div>
                                        <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Submitted</dt>
                                        <dd className='mt-1'>{formatDate(submission.createdAt)}</dd>
                                    </div>
                                    {submission.interests?.length ? (
                                        <div>
                                            <dt className='text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>Interests</dt>
                                            <dd className='mt-2 flex flex-wrap gap-1'>
                                                {submission.interests.map((interest) => (
                                                    <Badge key={interest} color='indigo' className='text-xs'>
                                                        {interest}
                                                    </Badge>
                                                ))}
                                            </dd>
                                        </div>
                                    ) : null}
                                </dl>
                                <div className='mt-4'>
                                    <label className='mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400'>
                                        Update status
                                    </label>
                                    <Select
                                        value={submission.status}
                                        disabled={updateStatus.isPending}
                                        onChange={(e) => handleStatusChange(submission._id, e.target.value)}
                                        className='min-h-11'
                                    >
                                        {statusOptions
                                            .filter((option) => option.value !== 'all')
                                            .map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                    </Select>
                                </div>
                            </article>
                        ))}
                    </div>
                    <div className='hidden overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/80 md:block'>
                        <Table hoverable>
                            <Table.Head>
                                <Table.HeadCell>Name</Table.HeadCell>
                                <Table.HeadCell>Email</Table.HeadCell>
                                <Table.HeadCell>Role</Table.HeadCell>
                                <Table.HeadCell>Experience</Table.HeadCell>
                                <Table.HeadCell>Interests</Table.HeadCell>
                                <Table.HeadCell>Status</Table.HeadCell>
                                <Table.HeadCell>Submitted</Table.HeadCell>
                            </Table.Head>
                            <Table.Body className='divide-y'>
                                {submissions.map((submission) => (
                                    <Table.Row key={submission._id} className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                        <Table.Cell className='font-medium text-gray-900 dark:text-white'>{submission.name}</Table.Cell>
                                        <Table.Cell className='max-w-[16rem] truncate text-sm'>{submission.email}</Table.Cell>
                                        <Table.Cell>{submission.role || '-'}</Table.Cell>
                                        <Table.Cell>{submission.experienceLevel || '-'}</Table.Cell>
                                        <Table.Cell>
                                            <div className='flex flex-wrap gap-1'>
                                                {(submission.interests ?? []).map((interest) => (
                                                    <Badge key={interest} color='indigo' className='text-xs'>
                                                        {interest}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className='flex items-center gap-2'>
                                                <Badge color={statusColor[submission.status] || 'gray'}>{submission.status}</Badge>
                                                <Select
                                                    sizing='sm'
                                                    value={submission.status}
                                                    disabled={updateStatus.isPending}
                                                    onChange={(e) => handleStatusChange(submission._id, e.target.value)}
                                                >
                                                    {statusOptions
                                                        .filter((option) => option.value !== 'all')
                                                        .map((option) => (
                                                            <option key={option.value} value={option.value}>
                                                                {option.label}
                                                            </option>
                                                        ))}
                                                </Select>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell className='text-sm text-gray-500 dark:text-gray-400'>
                                            {formatDate(submission.createdAt)}
                                        </Table.Cell>
                                    </Table.Row>
                                ))}
                            </Table.Body>
                        </Table>
                    </div>
                    <div className='flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800/90 sm:flex-row sm:items-center sm:justify-between'>
                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <HiOutlineCheckCircle className='h-5 w-5 text-emerald-500' />
                            {data?.pages?.[0]?.totalCount ?? 0} total submissions
                        </div>
                        {hasNextPage && (
                            <Button size='sm' color='light' onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className='min-h-11 w-full sm:w-auto'>
                                {isFetchingNextPage ? 'Loading…' : 'Show more'}
                            </Button>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
