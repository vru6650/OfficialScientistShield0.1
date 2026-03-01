import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '../utils/apiFetch';

const defaultDashboardState = Object.freeze({
    users: [],
    posts: [],
    comments: [],
    pages: [],
    tutorials: [],
    quizzes: [],
    problems: [],
    totalUsers: 0,
    totalPosts: 0,
    totalComments: 0,
    totalPages: 0,
    totalTutorials: 0,
    totalQuizzes: 0,
    totalProblems: 0,
    lastMonthUsers: 0,
    lastMonthPosts: 0,
    lastMonthComments: 0,
    lastMonthPages: 0,
    lastMonthTutorials: 0,
    lastMonthQuizzes: 0,
    lastMonthProblems: 0,
});

const fetchAdminDashboardData = async () => {
    const [userRes, postRes, commentRes, pageRes, tutorialRes, quizRes, problemRes] = await Promise.all([
        apiFetch('/api/v1/user/getusers?limit=5'),
        apiFetch('/api/v1/post/getposts?limit=5'),
        apiFetch('/api/v1/comment/getcomments?limit=5'),
        apiFetch('/api/v1/pages?limit=5'),
        apiFetch('/api/v1/tutorial/gettutorials?limit=5'),
        apiFetch('/api/v1/quizzes?limit=5'),
        apiFetch('/api/v1/problems?limit=5&includeDrafts=true'),
    ]);

    const [userData, postData, commentData, pageData, tutorialData, quizData, problemData] = await Promise.all([
        userRes.json(),
        postRes.json(),
        commentRes.json(),
        pageRes.json(),
        tutorialRes.json(),
        quizRes.json(),
        problemRes.json(),
    ]);

    if (!userRes.ok || !postRes.ok || !commentRes.ok || !pageRes.ok || !tutorialRes.ok || !quizRes.ok || !problemRes.ok) {
        const message =
            userData.message ||
            postData.message ||
            commentData.message ||
            pageData.message ||
            tutorialData.message ||
            quizData.message ||
            problemData.message ||
            'Failed to fetch admin metrics. Please try again.';
        throw new Error(message);
    }

    return {
        users: userData.users || [],
        posts: postData.posts || [],
        comments: commentData.comments || [],
        pages: pageData.pages || [],
        tutorials: tutorialData.tutorials || [],
        quizzes: quizData.quizzes || [],
        problems: problemData.problems || [],
        totalUsers: userData.totalUsers || 0,
        totalPosts: postData.totalPosts || 0,
        totalComments: commentData.totalComments || 0,
        totalPages: pageData.totalCount || 0,
        totalTutorials: tutorialData.totalTutorials || 0,
        totalQuizzes: quizData.totalQuizzes || 0,
        totalProblems: problemData.totalProblems || 0,
        lastMonthUsers: userData.lastMonthUsers || 0,
        lastMonthPosts: postData.lastMonthPosts || 0,
        lastMonthComments: commentData.lastMonthComments || 0,
        lastMonthPages: pageData.lastMonthCount || 0,
        lastMonthTutorials: tutorialData.lastMonthTutorials || 0,
        lastMonthQuizzes: quizData.lastMonthQuizzes || 0,
        lastMonthProblems: problemData.lastMonthProblems || 0,
    };
};

export default function useAdminDashboardData(isEnabled) {
    const query = useQuery({
        queryKey: ['adminDashboard'],
        queryFn: fetchAdminDashboardData,
        enabled: isEnabled,
        staleTime: 1000 * 60,
    });

    return {
        data: query.data ?? defaultDashboardState,
        loading: query.isLoading,
        error: query.error?.message ?? null,
        refetch: query.refetch,
        lastSynced: query.dataUpdatedAt ? new Date(query.dataUpdatedAt) : null,
    };
}
