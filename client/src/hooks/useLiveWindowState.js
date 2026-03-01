import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';

const DEFAULT_STATE = Object.freeze({
    windows: [],
    closedTypes: [],
    focusMode: false,
    activePath: '/',
    updatedAt: 0,
});

/**
 * Subscribe to live desktop window state keyed by the current URL.
 * Leverages the MacWindowManager broadcast + query cache, so updates
 * arrive instantly when the window layout changes anywhere in the app.
 */
export default function useLiveWindowState() {
    const queryClient = useQueryClient();
    const location = useLocation();
    const activePath = location.pathname || '/';

    const readSnapshot = () =>
        queryClient.getQueryData(['desktop-windows', activePath]) ??
        queryClient.getQueryData(['desktop-windows']) ??
        DEFAULT_STATE;

    const query = useQuery({
        queryKey: ['desktop-windows', activePath],
        queryFn: async () => readSnapshot(),
        initialData: () => readSnapshot(),
        refetchInterval: 800,
        refetchIntervalInBackground: true,
        staleTime: 0,
    });

    const data = query.data || DEFAULT_STATE;

    return {
        ...query,
        data,
    };
}
