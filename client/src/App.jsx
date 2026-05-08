import { RouterProvider } from 'react-router-dom';
import { Suspense } from 'react';
import { Spinner } from 'flowbite-react';
import 'highlight.js/styles/atom-one-dark.css';

import { appRouter } from './router/appRouter.jsx';

// A fallback component to show while pages are loading
const LoadingFallback = () => (
    <div className="flex justify-center items-center min-h-screen">
        <Spinner size="xl" />
    </div>
);

export default function App() {
    return (
        <Suspense fallback={<LoadingFallback />}>
            <RouterProvider router={appRouter} />
        </Suspense>
    );
}
