import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type ThemeMode = 'light' | 'dark' | 'system';

type ThemeState = {
    mode: ThemeMode;
    theme: 'light' | 'dark';
    setMode: (mode: ThemeMode) => void;
    toggle: () => void;
};

const storage = createJSONStorage(() =>
    typeof window !== 'undefined' ? window.localStorage : undefined
);

const resolveSystemTheme = (): 'light' | 'dark' => {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

export const useThemeStore = create<ThemeState>()(
    persist(
        (set, get) => ({
            mode: 'system',
            theme: resolveSystemTheme(),
            setMode: (mode) => {
                const theme = mode === 'system' ? resolveSystemTheme() : mode;
                set({ mode, theme });
            },
            toggle: () => {
                const order: ThemeMode[] = ['light', 'dark', 'system'];
                const current = get().mode;
                const next = order[(order.indexOf(current) + 1) % order.length];
                const theme = next === 'system' ? resolveSystemTheme() : next;
                set({ mode: next, theme });
            },
        }),
        {
            name: 'ss-theme',
            storage,
            partialize: (state) => ({ mode: state.mode, theme: state.theme }),
        }
    )
);
