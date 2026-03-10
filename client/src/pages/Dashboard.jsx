// client/src/pages/Dashboard.jsx
import { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation } from 'react-router-dom';
import { Spinner } from 'flowbite-react';
import DashSidebar from '../components/DashSidebar';
import { useSelector } from 'react-redux';

// Dynamically import components using React.lazy
const DashProfile = lazy(() => import('../components/DashProfile'));
const DashPosts = lazy(() => import('../components/DashPosts'));
const DashUsers = lazy(() => import('../components/DashUsers'));
const DashComments = lazy(() => import('../components/DashComments'));
const DashboardComp = lazy(() => import('../components/DashboardComp'));
const DashTutorials = lazy(() => import('../components/DashTutorials'));
const DashQuizzes = lazy(() => import('../components/DashQuizzes')); // NEW: Import DashQuizzes component
const DashPages = lazy(() => import('../components/DashPages'));
const DashProblems = lazy(() => import('../components/DashProblems'));
const DashCommunitySubmissions = lazy(() => import('../components/DashCommunitySubmissions'));

// Create a map to associate tab names with their components.
const componentMap = {
    profile: DashProfile,
    posts: DashPosts,
    users: DashUsers,
    comments: DashComments,
    dash: DashboardComp,
    tutorials: DashTutorials,
    quizzes: DashQuizzes, // NEW: Add DashQuizzes to the map
    content: DashPages,
    problems: DashProblems,
    community: DashCommunitySubmissions,
};

const resolveDashboardTab = (currentUser, requestedTab) => {
    const defaultTab = currentUser?.isAdmin ? 'dash' : 'profile';

    if (!requestedTab) {
        return defaultTab;
    }

    if (requestedTab === 'profile') {
        return 'profile';
    }

    if (currentUser?.isAdmin && componentMap[requestedTab]) {
        return requestedTab;
    }

    return defaultTab;
};

export default function Dashboard() {
    const location = useLocation();
    const [tab, setTab] = useState('');
    const { currentUser } = useSelector((state) => state.user);

    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const tabFromUrl = urlParams.get('tab');
        setTab(resolveDashboardTab(currentUser, tabFromUrl));
    }, [location.search, currentUser]);

    const ActiveComponent = componentMap[tab];

    return (
        <div className='min-h-screen flex flex-col md:flex-row'>
            <div className='md:w-56'>
                <DashSidebar />
            </div>

            <main className='w-full'>
                <Suspense
                    fallback={
                        <div className='flex justify-center items-center min-h-screen w-full'>
                            <Spinner size='xl' />
                        </div>
                    }
                >
                    {ActiveComponent && <ActiveComponent />}
                </Suspense>
            </main>
        </div>
    );
}
