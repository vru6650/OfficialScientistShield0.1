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
            <div className='p-3 md:mx-auto'>
                <Alert color='warning'>Administrator access required.</Alert>
            </div>
        );
    }

    if (loading) {
        return (
            <div className='flex justify-center items-center min-h-screen'>
                <Spinner size='xl' />
            </div>
        );
    }

    if (error) {
        return (
            <div className='p-3 md:mx-auto'>
                <Alert color='failure'>Error: {error}</Alert>
            </div>
        );
    }

    return (
        <div className='p-3 md:mx-auto'>
            {/* Reusable Stat Cards */}
            <div className='flex-wrap flex gap-4 justify-center'>
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
            <div className='flex flex-wrap gap-4 py-3 mx-auto justify-center'>
                <RecentDataTable
                    title='Recent users'
                    linkTo='/dashboard?tab=users'
                    headers={['User image', 'Username']}
                    data={dashboardData.users}
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
