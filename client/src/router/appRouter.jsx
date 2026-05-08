import { createBrowserRouter } from 'react-router-dom';

import MainLayout from '../components/MainLayout.jsx';
import { authRoutes, buildRouteObjects, mainLayoutRoutes } from '../routes/mainLayoutRoutes.jsx';

const appRouteObjects = [
    {
        path: '/',
        element: <MainLayout />,
        children: buildRouteObjects(mainLayoutRoutes),
    },
    ...buildRouteObjects(authRoutes),
];

export const appRouter = createBrowserRouter(appRouteObjects);

