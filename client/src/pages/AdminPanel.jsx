import { Alert, Badge, Button, Spinner, Table } from 'flowbite-react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
    HiAcademicCap,
    HiAnnotation,
    HiArrowRight,
    HiChartPie,
    HiCollection,
    HiDocumentText,
    HiOutlineUserGroup,
    HiPuzzle,
    HiRefresh,
} from 'react-icons/hi';
import StatCard from '../components/StatCard';
import RecentDataTable from '../components/RecentDataTable';
import useAdminDashboardData from '../hooks/useAdminDashboardData';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getPostPreviewImage } from '../utils/postMedia.js';

const quickActions = [
    {
        title: 'Publish a post',
        description: 'Share announcements, updates, and longer-form articles with the community.',
        to: '/create-post',
        icon: HiDocumentText,
        gradient: 'from-sky-500 via-cyan-500 to-blue-500',
    },
    {
        title: 'Launch a tutorial',
        description: 'Curate a structured learning path with interactive chapters and resources.',
        to: '/create-tutorial',
        icon: HiAcademicCap,
        gradient: 'from-emerald-500 via-teal-500 to-green-500',
    },
    {
        title: 'Build a quiz',
        description: 'Evaluate learner progress with configurable question banks and scoring.',
        to: '/create-quiz',
        icon: HiPuzzle,
        gradient: 'from-violet-500 via-indigo-500 to-purple-500',
    },
    {
        title: 'Publish a problem',
        description: 'Craft algorithmic challenges complete with hints and editorial solutions.',
        to: '/create-problem',
        icon: HiPuzzle,
        gradient: 'from-fuchsia-500 via-purple-500 to-pink-500',
    },
    {
        title: 'Design a page',
        description: 'Create marketing or documentation pages with modular content sections.',
        to: '/create-page',
        icon: HiCollection,
        gradient: 'from-amber-500 via-orange-500 to-rose-500',
    },
];

const managementShortcuts = [
    {
        title: 'Manage users',
        description: 'Review roles, promote moderators, and keep membership healthy.',
        to: '/dashboard?tab=users',
        icon: HiOutlineUserGroup,
    },
    {
        title: 'Moderate comments',
        description: 'Respond to feedback and resolve reports from the moderation queue.',
        to: '/dashboard?tab=comments',
        icon: HiAnnotation,
    },
    {
        title: 'Posts library',
        description: 'Edit existing articles, update metadata, or retire outdated posts.',
        to: '/dashboard?tab=posts',
        icon: HiDocumentText,
    },
    {
        title: 'Tutorial catalog',
        description: 'Reorder chapters, attach quizzes, and refine the learning experience.',
        to: '/dashboard?tab=tutorials',
        icon: HiAcademicCap,
    },
    {
        title: 'Quiz insights',
        description: 'Audit question pools and align assessments with tutorials.',
        to: '/dashboard?tab=quizzes',
        icon: HiPuzzle,
    },
    {
        title: 'Problem library',
        description: 'Review code challenges, update samples, and manage solution quality.',
        to: '/dashboard?tab=problems',
        icon: HiPuzzle,
    },
    {
        title: 'Content pages',
        description: 'Publish marketing, onboarding, or help center pages with confidence.',
        to: '/dashboard?tab=content',
        icon: HiCollection,
    },
];

export default function AdminPanel() {
    const { currentUser } = useSelector((state) => state.user);
    const { data, loading, error, refetch, lastSynced } = useAdminDashboardData(Boolean(currentUser?.isAdmin));

    if (!currentUser?.isAdmin) {
        return (
            <div className='min-h-screen px-4 py-10'>
                <div className='mx-auto max-w-3xl'>
                    <Alert color='warning'>Administrator access required.</Alert>
                </div>
            </div>
        );
    }

    const lastSyncedLabel = lastSynced
        ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(lastSynced)
        : 'Awaiting first sync';

    const chartData = [
        { name: 'Jan', users: data.lastMonthUsers },
        { name: 'Feb', users: data.totalUsers - data.lastMonthUsers },
        { name: 'Mar', users: data.totalUsers },
    ];

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className='min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-10'>
            <div className='mx-auto max-w-7xl space-y-12 px-4 sm:px-6 lg:px-8'>
                <header className='flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between'>
                    <div className='space-y-4'>
                        <span className='inline-flex items-center gap-2 rounded-full bg-cyan-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-200'>
                            Control Center
                        </span>
                        <div>
                            <h1 className='text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl'>
                                Welcome back, {currentUser.username}
                            </h1>
                            <p className='mt-2 max-w-2xl text-base text-gray-600 dark:text-gray-400'>
                                Monitor platform health, publish new learning material, and keep your community thriving from a single hub.
                            </p>
                        </div>
                        <div className='flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400'>
                            <span className='inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 shadow-sm ring-1 ring-gray-200 backdrop-blur dark:bg-white/5 dark:ring-white/10'>
                                <HiChartPie className='h-4 w-4 text-cyan-500' />
                                Metrics update automatically
                            </span>
                            <span>
                                Last synced:
                                <span className='ml-1 font-medium text-gray-700 dark:text-gray-200'>{lastSyncedLabel}</span>
                            </span>
                        </div>
                    </div>
                    <div className='flex flex-wrap items-center gap-3'>
                        <Link to='/dashboard?tab=dash'>
                            <Button color='light' className='w-full sm:w-auto'>
                                Open dashboard overview
                            </Button>
                        </Link>
                        <Button gradientDuoTone='purpleToBlue' onClick={refetch} disabled={loading}>
                            <HiRefresh className={`mr-2 h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
                            Refresh data
                        </Button>
                    </div>
                </header>

                {error && (
                    <Alert color='failure'>
                        <span className='font-semibold'>Heads up:</span> {error}
                    </Alert>
                )}

                <section className='space-y-4'>
                    <div className='flex items-center justify-between gap-4'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Quick actions</h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>Ship work faster with curated shortcuts.</p>
                    </div>
                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-4'>
                        {quickActions.map((action) => (
                            <Link
                                key={action.title}
                                to={action.to}
                                className='group focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900'
                            >
                                <motion.div
                                    whileHover={{ y: -5, boxShadow: '0 10px 20px rgba(0,0,0,0.1)' }}
                                    className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${action.gradient} p-6 text-white shadow-lg transition-all duration-200`}
                                >
                                    <div className='flex items-start justify-between'>
                                        <div>
                                            <p className='text-xs font-semibold uppercase tracking-wider text-white/70'>Quick action</p>
                                            <h3 className='mt-1 text-xl font-semibold'>{action.title}</h3>
                                        </div>
                                        <action.icon className='h-10 w-10 text-white/90' />
                                    </div>
                                    <p className='mt-4 text-sm text-white/80'>{action.description}</p>
                                    <span className='mt-6 inline-flex items-center text-sm font-semibold text-white/90'>
                                        Open workspace
                                        <HiArrowRight className='ml-2 h-4 w-4 transition-transform duration-200 group-hover:translate-x-1' />
                                    </span>
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </section>

                <section className='grid gap-6 lg:grid-cols-3'>
                    <div className='lg:col-span-2 space-y-4'>
                        <div className='flex items-center justify-between gap-4'>
                            <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Platform Overview</h2>
                            <p className='text-sm text-gray-500 dark:text-gray-400'>Track growth and engagement at a glance.</p>
                        </div>
                        <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                            <StatCard
                                title='Community members'
                                count={data.totalUsers}
                                lastMonthCount={data.lastMonthUsers}
                                icon={HiOutlineUserGroup}
                                iconBgColor='bg-sky-600'
                                loading={loading}
                            />
                            <StatCard
                                title='Posts published'
                                count={data.totalPosts}
                                lastMonthCount={data.lastMonthPosts}
                                icon={HiDocumentText}
                                iconBgColor='bg-indigo-600'
                                loading={loading}
                            />
                            <StatCard
                                title='Comments logged'
                                count={data.totalComments}
                                lastMonthCount={data.lastMonthComments}
                                icon={HiAnnotation}
                                iconBgColor='bg-amber-600'
                                loading={loading}
                            />
                            <StatCard
                                title='Tutorials live'
                                count={data.totalTutorials}
                                lastMonthCount={data.lastMonthTutorials}
                                icon={HiAcademicCap}
                                iconBgColor='bg-emerald-600'
                                loading={loading}
                            />
                            <StatCard
                                title='Active quizzes'
                                count={data.totalQuizzes}
                                lastMonthCount={data.lastMonthQuizzes}
                                icon={HiPuzzle}
                                iconBgColor='bg-purple-600'
                                loading={loading}
                            />
                            <StatCard
                                title='Content pages'
                                count={data.totalPages}
                                lastMonthCount={data.lastMonthPages}
                                icon={HiCollection}
                                iconBgColor='bg-rose-600'
                                loading={loading}
                            />
                        </div>
                    </div>
                    <div className='space-y-4'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>User Registrations</h2>
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg">
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Area type="monotone" dataKey="users" stroke="#8884d8" fill="#8884d8" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </section>

                <section className='space-y-4'>
                    <div className='flex items-center justify-between gap-4'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Latest activity</h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>Recent additions across your knowledge base.</p>
                    </div>
                    {loading ? (
                        <div className='flex justify-center rounded-2xl border border-dashed border-gray-300 p-10 dark:border-gray-700'>
                            <Spinner size='lg' />
                        </div>
                    ) : (
                        <div className='grid gap-6 lg:grid-cols-2'>
                            <RecentDataTable
                                title='Recent posts'
                                linkTo='/dashboard?tab=posts'
                                headers={['Post', 'Category']}
                                data={data.posts}
                                renderRow={(post) => (
                                    <Table.Body key={post._id} className='divide-y'>
                                        <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                            <Table.Cell className='w-72'>
                                                <div className='flex items-center gap-3'>
                                                    {getPostPreviewImage(post) ? (
                                                        <img
                                                            src={getPostPreviewImage(post)}
                                                            alt={post.title}
                                                            className='h-10 w-14 rounded-md object-cover'
                                                        />
                                                    ) : (
                                                        <div className='flex h-10 w-14 items-center justify-center rounded-md bg-slate-100 text-[11px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-slate-700 dark:text-slate-200'>
                                                            Media
                                                        </div>
                                                    )}
                                                    <p className='line-clamp-2 font-medium'>{post.title}</p>
                                                </div>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color='info' className='capitalize'>
                                                    {post.category || 'general'}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                )}
                            />
                            <RecentDataTable
                                title='Recent tutorials'
                                linkTo='/dashboard?tab=tutorials'
                                headers={['Tutorial', 'Category']}
                                data={data.tutorials}
                                renderRow={(tutorial) => (
                                    <Table.Body key={tutorial._id} className='divide-y'>
                                        <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                            <Table.Cell className='w-72'>
                                                <p className='font-medium'>{tutorial.title}</p>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color='purple' className='capitalize'>
                                                    {tutorial.category || 'general'}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                )}
                            />
                            <RecentDataTable
                                title='Recent quizzes'
                                linkTo='/dashboard?tab=quizzes'
                                headers={['Quiz', 'Questions']}
                                data={data.quizzes}
                                renderRow={(quiz) => (
                                    <Table.Body key={quiz._id} className='divide-y'>
                                        <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                            <Table.Cell className='w-72'>
                                                <p className='font-medium'>{quiz.title}</p>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color='success'>
                                                    {quiz.questions?.length ?? 0} items
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                )}
                            />
                            <RecentDataTable
                                title='Recent pages'
                                linkTo='/dashboard?tab=content'
                                headers={['Title', 'Status']}
                                data={data.pages}
                                renderRow={(page) => (
                                    <Table.Body key={page._id} className='divide-y'>
                                        <Table.Row className='bg-white dark:border-gray-700 dark:bg-gray-800'>
                                            <Table.Cell className='w-72'>
                                                <p className='font-medium'>{page.title}</p>
                                            </Table.Cell>
                                            <Table.Cell>
                                                <Badge color={page.status === 'published' ? 'success' : 'warning'} className='capitalize'>
                                                    {page.status}
                                                </Badge>
                                            </Table.Cell>
                                        </Table.Row>
                                    </Table.Body>
                                )}
                            />
                        </div>
                    )}
                </section>

                <section className='space-y-4 pb-6'>
                    <div className='flex items-center justify-between gap-4'>
                        <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>Operational shortcuts</h2>
                        <p className='text-sm text-gray-500 dark:text-gray-400'>Deep links into the management areas you visit most.</p>
                    </div>
                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        {managementShortcuts.map((item) => (
                            <Link
                                key={item.title}
                                to={item.to}
                                className='group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200 hover:border-cyan-500 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:border-gray-700 dark:bg-slate-900/80 dark:hover:border-cyan-400 dark:focus-visible:ring-offset-slate-900'
                            >
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    className='flex items-start justify-between gap-4'
                                >
                                    <div>
                                        <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>{item.title}</h3>
                                        <p className='mt-2 text-sm text-gray-500 dark:text-gray-400'>{item.description}</p>
                                    </div>
                                    <item.icon className='h-8 w-8 text-cyan-500 transition-colors duration-200 group-hover:text-cyan-400' />
                                </motion.div>
                            </Link>
                        ))}
                    </div>
                </section>
            </div>
        </motion.div>
    );
}
