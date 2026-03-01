import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            /**
             * Treat all queries as “live”: refetch when a window is activated,
             * when the tab regains focus, and after reconnect. MacWindowManager
             * will invalidate queries whose meta.refreshOnActivate is true.
             */
            meta: { refreshOnActivate: true },
            refetchOnWindowFocus: 'always',
            refetchOnReconnect: 'always',
            // Keep cache fresh and avoid stale snapshots in the “windows”
            staleTime: 0,
        },
    },
});
