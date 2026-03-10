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

const formatDate = (value) => new Date(value).toLocaleString();

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
        <div className='p-3 md:mx-auto md:p-4'>
            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4'>
                <div className='space-y-1'>
                    <p className='text-xs uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400'>Community</p>
                    <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Submissions</h2>
                    <p className='text-sm text-gray-500 dark:text-gray-400'>Match members to circles, reviewers, and tracks.</p>
                </div>
                <div className='flex flex-wrap gap-2'>
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
                    <Button color='light' onClick={() => refetch()} disabled={isFetching}>
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
                <div className='table-auto overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800/80'>
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
                        {submissions.map((submission) => (
                            <Table.Body className='divide-y' key={submission._id}>
                                <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                    <Table.Cell className='font-medium text-gray-900 dark:text-white'>{submission.name}</Table.Cell>
                                    <Table.Cell className='text-sm'>{submission.email}</Table.Cell>
                                    <Table.Cell>{submission.role || '—'}</Table.Cell>
                                    <Table.Cell>{submission.experienceLevel || '—'}</Table.Cell>
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
                            </Table.Body>
                        ))}
                    </Table>
                    <div className='flex items-center justify-between border-t border-gray-200 bg-gray-50 px-4 py-3 text-sm dark:border-gray-700 dark:bg-gray-800/90'>
                        <div className='flex items-center gap-2 text-gray-600 dark:text-gray-300'>
                            <HiOutlineCheckCircle className='h-5 w-5 text-emerald-500' />
                            {data?.pages?.[0]?.totalCount ?? 0} total submissions
                        </div>
                        {hasNextPage && (
                            <Button size='sm' color='light' onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
                                {isFetchingNextPage ? 'Loading…' : 'Show more'}
                            </Button>
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}
