import { createSlice } from '@reduxjs/toolkit';

const THEME_MODES = ['light', 'dark', 'auto'];

const getStorage = () => {
    if (typeof window === 'undefined') return null;
    try {
        return window.localStorage;
    } catch {
        return null;
    }
};

const readStorage = (key) => {
    const storage = getStorage();
    if (!storage) return null;
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
};

const writeStorage = (key, value) => {
    const storage = getStorage();
    if (!storage) return;
    try {
        storage.setItem(key, value);
    } catch {
        // Ignore blocked storage/quota errors so theme state still works in memory.
    }
};

const resolveSystemTheme = () => {
    if (typeof window === 'undefined' || !window.matchMedia) return 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const storageAvailable = () => getStorage() !== null;

const resolveThemeFromMode = (mode) => {
    if (mode === 'light' || mode === 'dark') return mode;
    return resolveSystemTheme();
};

const getInitialThemeState = () => {
    if (!storageAvailable()) {
        const mode = 'auto';
        const theme = resolveThemeFromMode(mode);
        return { mode, theme };
    }

    const storedMode = readStorage('themeMode');
    const mode = THEME_MODES.includes(storedMode) ? storedMode : 'auto';
    const theme = resolveThemeFromMode(mode);
    writeStorage('themeMode', mode);
    writeStorage('theme', theme);
    return { mode, theme };
};

const initialState = getInitialThemeState();

const themeSlice = createSlice({
    name: 'theme',
    initialState,
    reducers: {
        toggleTheme: (state) => {
            const order = ['light', 'dark', 'auto'];
            const currentIndex = order.indexOf(state.mode);
            const nextMode = order[(currentIndex + 1) % order.length];
            state.mode = nextMode;
            state.theme = resolveThemeFromMode(nextMode);
            if (storageAvailable()) {
                writeStorage('themeMode', nextMode);
                writeStorage('theme', state.theme);
            }
        },
        setThemeMode: (state, action) => {
            const nextMode = action.payload;
            if (!THEME_MODES.includes(nextMode)) {
                console.warn(`Attempted to set invalid theme mode: ${nextMode}`);
                return;
            }
            state.mode = nextMode;
            state.theme = resolveThemeFromMode(nextMode);
            if (storageAvailable()) {
                writeStorage('themeMode', nextMode);
                writeStorage('theme', state.theme);
            }
        },
        applySystemTheme: (state, action) => {
            if (state.mode !== 'auto') return;
            const nextTheme = action.payload === 'dark' ? 'dark' : 'light';
            state.theme = nextTheme;
            if (storageAvailable()) {
                writeStorage('theme', nextTheme);
            }
        },
    },
});

export const { toggleTheme, setThemeMode, applySystemTheme } = themeSlice.actions;

export default themeSlice.reducer;
