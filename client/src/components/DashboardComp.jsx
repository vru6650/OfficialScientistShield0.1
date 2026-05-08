import { useSelector } from 'react-redux';
import { HiAnnotation, HiCollection, HiDocumentText, HiOutlineUserGroup, HiPuzzle } from 'react-icons/hi';
import { Alert, Badge, Spinner, Table } from 'flowbite-react';
import StatCard from './StatCard'; // Import new component
import RecentDataTable from './RecentDataTable'; // Import new component
import useAdminDashboardData from '../hooks/useAdminDashboardData';
import { getPostPreviewImage } from '../utils/postMedia.js';

export default function DashboardComp() {
    const { currentUser } = useSelector((state) => state.user);
    const { data: dashboardData, loading, error } = useAdminDashboardData(Boolean(currentUser?.isAdmin));

    if (!currentUser?.isAdmin) {
        return (
            <div className='dashboard-page-shell'>
                <Alert color='warning'>Administrator access required.</Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className='dashboard-loading-state'>
                <Spinner size='xl' />
                <span>Loading dashboard metrics</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className='dashboard-page-shell'>
                <Alert color='failure'>Error: {error}</Alert>
            </div>
        );
    }

    return (
        <div className='dashboard-page-shell'>
            <header className='dashboard-overview-hero'>
                <div>
                    <p className='dashboard-overview-hero__eyebrow'>Admin Overview</p>
                    <h1>Control center for content, users, and learning assets.</h1>
                </div>
                <div className='dashboard-overview-hero__meta'>
                    <span>{dashboardData.totalUsers?.toLocaleString?.() ?? dashboardData.totalUsers} users</span>
                    <span>{dashboardData.totalPosts?.toLocaleString?.() ?? dashboardData.totalPosts} posts</span>
                    <span>{dashboardData.totalProblems?.toLocaleString?.() ?? dashboardData.totalProblems} problems</span>
                </div>
            </header>

            {/* Reusable Stat Cards */}
            <div className='dashboard-stat-grid'>
                <StatCard
                    title='Total Users'
                    count={dashboardData.totalUsers}
                    lastMonthCount={dashboardData.lastMonthUsers}
                    icon={HiOutlineUserGroup}
                    iconBgColor='bg-teal-600'
                />
                <StatCard
                    title='Total Comments'
                    count={dashboardData.totalComments}
                    lastMonthCount={dashboardData.lastMonthComments}
                    icon={HiAnnotation}
                    iconBgColor='bg-indigo-600'
                />
                <StatCard
                    title='Total Posts'
                    count={dashboardData.totalPosts}
                    lastMonthCount={dashboardData.lastMonthPosts}
                    icon={HiDocumentText}
                    iconBgColor='bg-lime-600'
                />
                <StatCard
                    title='Total Problems'
                    count={dashboardData.totalProblems}
                    lastMonthCount={dashboardData.lastMonthProblems}
                    icon={HiPuzzle}
                    iconBgColor='bg-purple-600'
                />
                <StatCard
                    title='Total Pages'
                    count={dashboardData.totalPages}
                    lastMonthCount={dashboardData.lastMonthPages}
                    icon={HiCollection}
                    iconBgColor='bg-amber-600'
                />
            </div>

            {/* Reusable Data Tables */}
            <div className='dashboard-table-grid'>
                <RecentDataTable
                    title='Recent users'
                    linkTo='/dashboard?tab=users'
                    headers={['User image', 'Username']}
                    data={dashboardData.users}
                    renderCard={(user) => (
                        <article key={user._id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
                            <div className='flex items-center gap-3'>
                                <img src={user.profilePicture} alt={user.username} className='h-11 w-11 rounded-full bg-gray-500 object-cover'/>
                                <div className='min-w-0'>
                                    <p className='break-words text-sm font-semibold text-slate-900 dark:text-white'>{user.username}</p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Recent user</p>
                                </div>
                            </div>
                        </article>
                    )}
                    renderRow={(user) => (
                        <Table.Body key={user._id} className='divide-y'>
                            <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                <Table.Cell><img src={user.profilePicture} alt={user.username} className='w-10 h-10 rounded-full bg-gray-500 object-cover'/></Table.Cell>
                                <Table.Cell>{user.username}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                />
                <RecentDataTable
                    title='Recent comments'
                    linkTo='/dashboard?tab=comments'
                    headers={['Comment content', 'Likes']}
                    data={dashboardData.comments}
                    renderCard={(comment) => (
                        <article key={comment._id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
                            <p className='line-clamp-3 break-words text-sm leading-6 text-slate-700 dark:text-slate-200'>
                                {comment.content}
                            </p>
                            <p className='mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                                {comment.numberOfLikes} likes
                            </p>
                        </article>
                    )}
                    renderRow={(comment) => (
                        <Table.Body key={comment._id} className='divide-y'>
                            <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                <Table.Cell className='w-96'><p className='line-clamp-2'>{comment.content}</p></Table.Cell>
                                <Table.Cell>{comment.numberOfLikes}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                />
                <RecentDataTable
                    title='Recent posts'
                    linkTo='/dashboard?tab=posts'
                    headers={['Post image', 'Post Title', 'Category']}
                    data={dashboardData.posts}
                    renderCard={(post) => {
                        const previewImage = getPostPreviewImage(post);

                        return (
                            <article key={post._id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
                                <div className='flex items-start gap-3'>
                                    {previewImage ? (
                                        <img
                                            src={previewImage}
                                            alt={post.title}
                                            className='h-12 w-16 flex-none rounded-lg bg-gray-500 object-cover'
                                        />
                                    ) : (
                                        <div className='flex h-12 w-16 flex-none items-center justify-center rounded-lg bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200'>
                                            Media
                                        </div>
                                    )}
                                    <div className='min-w-0'>
                                        <p className='line-clamp-2 break-words text-sm font-semibold text-slate-900 dark:text-white'>{post.title}</p>
                                        <p className='mt-1 break-words text-xs text-slate-500 dark:text-slate-400'>{post.category}</p>
                                    </div>
                                </div>
                            </article>
                        );
                    }}
                    renderRow={(post) => (
                        <Table.Body key={post._id} className='divide-y'>
                            <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                <Table.Cell>
                                    {getPostPreviewImage(post) ? (
                                        <img
                                            src={getPostPreviewImage(post)}
                                            alt={post.title}
                                            className='h-10 w-14 rounded-md bg-gray-500 object-cover'
                                        />
                                    ) : (
                                        <div className='flex h-10 w-14 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200'>
                                            Media
                                        </div>
                                    )}
                                </Table.Cell>
                                <Table.Cell className='w-96'>{post.title}</Table.Cell>
                                <Table.Cell className='w-5'>{post.category}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                />
                <RecentDataTable
                    title='Recent problems'
                    linkTo='/dashboard?tab=problems'
                    headers={['Title', 'Difficulty']}
                    data={dashboardData.problems}
                    renderCard={(problem) => (
                        <article key={problem._id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
                            <p className='break-words text-sm font-semibold text-slate-900 dark:text-white'>{problem.title}</p>
                            <p className='mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                                {problem.difficulty}
                            </p>
                        </article>
                    )}
                    renderRow={(problem) => (
                        <Table.Body key={problem._id} className='divide-y'>
                            <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                <Table.Cell className='w-80'>{problem.title}</Table.Cell>
                                <Table.Cell>{problem.difficulty}</Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                />
                <RecentDataTable
                    title='Recent pages'
                    linkTo='/dashboard?tab=content'
                    headers={['Title', 'Status']}
                    data={dashboardData.pages}
                    renderCard={(page) => (
                        <article key={page._id} className='rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900'>
                            <div className='flex items-start justify-between gap-3'>
                                <p className='min-w-0 break-words text-sm font-semibold text-slate-900 dark:text-white'>{page.title}</p>
                                <Badge color={page.status === 'published' ? 'success' : 'warning'}>{page.status}</Badge>
                            </div>
                        </article>
                    )}
                    renderRow={(page) => (
                        <Table.Body key={page._id} className='divide-y'>
                            <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                <Table.Cell className='w-72'>{page.title}</Table.Cell>
                                <Table.Cell>
                                    <Badge color={page.status === 'published' ? 'success' : 'warning'}>{page.status}</Badge>
                                </Table.Cell>
                            </Table.Row>
                        </Table.Body>
                    )}
                />
            </div>
        </div>
    );
}
