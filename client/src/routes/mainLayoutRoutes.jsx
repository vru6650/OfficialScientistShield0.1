import { lazy } from 'react';
import { Route } from 'react-router-dom';
import PrivateRoute from '../components/PrivateRoute.jsx';
import OnlyAdminPrivateRoute from '../components/OnlyAdminPrivateRoute.jsx';

const Home = lazy(() => import('../pages/Home'));
const About = lazy(() => import('../pages/About'));
const SignIn = lazy(() => import('../pages/SignIn'));
const SignUp = lazy(() => import('../pages/SignUp'));
const Dashboard = lazy(() => import('../pages/Dashboard'));
const Projects = lazy(() => import('../pages/Projects'));
const PostListPage = lazy(() => import('../pages/PostListPage'));
const CreatePost = lazy(() => import('../pages/CreatePost'));
const UpdatePost = lazy(() => import('../pages/UpdatePost'));
const PostPage = lazy(() => import('../pages/PostPage'));
const Search = lazy(() => import('../pages/Search'));
const Tools = lazy(() => import('../pages/Tools'));
const NotFound = lazy(() => import('../pages/NotFound'));
const Tutorials = lazy(() => import('../pages/Tutorials'));
const SingleTutorialPage = lazy(() => import('../pages/SingleTutorialPage'));
const CreateTutorial = lazy(() => import('../pages/CreateTutorial'));
const UpdateTutorial = lazy(() => import('../pages/UpdateTutorial'));
const CreateQuiz = lazy(() => import('../pages/CreateQuiz'));
const SingleQuizPage = lazy(() => import('../pages/SingleQuizPage'));
const Quizzes = lazy(() => import('../pages/Quizzes'));
const UpdateQuiz = lazy(() => import('../pages/UpdateQuiz'));
const TryItPage = lazy(() => import('../pages/TryItPage'));
const CreatePage = lazy(() => import('../pages/CreatePage'));
const UpdatePage = lazy(() => import('../pages/UpdatePage'));
const ContentPage = lazy(() => import('../pages/ContentPage'));
const AdminPanel = lazy(() => import('../pages/AdminPanel'));
const ProblemSolving = lazy(() => import('../pages/ProblemSolving'));
const SingleProblemPage = lazy(() => import('../pages/SingleProblemPage'));
const CreateProblem = lazy(() => import('../pages/CreateProblem'));
const UpdateProblem = lazy(() => import('../pages/UpdateProblem'));
const Community = lazy(() => import('../pages/Community'));
const CreateCommunityPost = lazy(() => import('../pages/CreateCommunityPost'));
const AlgorithmVisualizer = lazy(() => import('../pages/AlgorithmVisualizer'));
const CodeVisualizer = lazy(() => import('../pages/CodeVisualizer'));
const FileManager = lazy(() => import('../pages/FileManager'));

export const authRoutes = Object.freeze([
    { path: '/sign-in', element: <SignIn /> },
    { path: '/sign-up', element: <SignUp /> },
]);

export const mainLayoutRoutes = Object.freeze([
    { index: true, element: <Home /> },
    { path: 'about', element: <About /> },
    { path: 'search', element: <Search /> },
    { path: 'projects', element: <Projects /> },
    { path: 'posts', element: <PostListPage /> },
    { path: 'tools', element: <Tools /> },
    { path: 'tools/*', element: <Tools /> },
    { path: 'post/:postSlug', element: <PostPage /> },
    { path: 'tutorials', element: <Tutorials /> },
    { path: 'tutorials/:tutorialSlug', element: <SingleTutorialPage /> },
    { path: 'tutorials/:tutorialSlug/:chapterSlug', element: <SingleTutorialPage /> },
    { path: 'quizzes', element: <Quizzes /> },
    { path: 'quizzes/:quizSlug', element: <SingleQuizPage /> },
    { path: 'problems', element: <ProblemSolving /> },
    { path: 'problems/:problemSlug', element: <SingleProblemPage /> },
    { path: 'community', element: <Community /> },
    { path: 'tryit', element: <TryItPage /> },
    { path: 'algorithm-visualizer', element: <AlgorithmVisualizer /> },
    { path: 'code-visualizer', element: <CodeVisualizer /> },
    { path: 'content/:slug', element: <ContentPage /> },
    {
        element: <PrivateRoute />,
        children: [
            { path: 'dashboard', element: <Dashboard /> },
            { path: 'community/create', element: <CreateCommunityPost /> },
        ],
    },
    {
        element: <OnlyAdminPrivateRoute />,
        children: [
            { path: 'admin', element: <AdminPanel /> },
            { path: 'create-post', element: <CreatePost /> },
            { path: 'update-post/:postId', element: <UpdatePost /> },
            { path: 'create-tutorial', element: <CreateTutorial /> },
            { path: 'update-tutorial/:tutorialId', element: <UpdateTutorial /> },
            { path: 'create-quiz', element: <CreateQuiz /> },
            { path: 'update-quiz/:quizId', element: <UpdateQuiz /> },
            { path: 'create-page', element: <CreatePage /> },
            { path: 'update-page/:pageId', element: <UpdatePage /> },
            { path: 'create-problem', element: <CreateProblem /> },
            { path: 'update-problem/:problemId', element: <UpdateProblem /> },
            { path: 'file-manager', element: <FileManager /> },
        ],
    },
    { path: '*', element: <NotFound /> },
]);

export function buildRouteElements(routes, parentKey = 'route') {
    return routes.map((route, index) => {
        const keyBase = route.path || (route.index ? 'index' : `branch-${index}`);
        const key = `${parentKey}-${keyBase}-${index}`;
        const children = Array.isArray(route.children)
            ? buildRouteElements(route.children, key)
            : null;

        if (route.index) {
            return (
                <Route
                    key={key}
                    index
                    element={route.element}
                >
                    {children}
                </Route>
            );
        }

        return (
            <Route
                key={key}
                path={route.path}
                element={route.element}
            >
                {children}
            </Route>
        );
    });
}
