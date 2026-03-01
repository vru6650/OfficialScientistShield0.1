import { useQuery } from '@tanstack/react-query';

const DEFAULT_DIAGNOSTICS = Object.freeze({
    stats: {
        total: 0,
        minimized: 0,
        staged: 0,
        activeAppId: null,
        activeAppTitle: null,
        activePath: '/',
        focusMode: false,
        timestamp: 0,
        sessionId: null,
        snapshotId: 0,
    },
    windows: [],
    closedTypes: [],
    focusMode: false,
    activePath: '/',
    updatedAt: 0,
});

/**
 * Subscribe to advanced desktop window diagnostics, synced in real-time.
 * Useful for status bars, analytics, or cross-window dashboards.
 */
export default function useWindowDiagnostics() {
    const query = useQuery({
        queryKey: ['desktop-windows', 'meta'],
        queryFn: async () => DEFAULT_DIAGNOSTICS,
        initialData: DEFAULT_DIAGNOSTICS,
        refetchInterval: 1000,
        refetchIntervalInBackground: true,
        staleTime: 0,
    });

    return query.data || DEFAULT_DIAGNOSTICS;
}
