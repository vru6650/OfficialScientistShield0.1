export const DEFAULT_THEME_MODE = 'system';
export const THEME_MEDIA_QUERY = '(prefers-color-scheme: dark)';
export const THEME_MODES = Object.freeze(['system', 'light', 'dark']);

export function sanitizeThemeMode(value) {
    return THEME_MODES.includes(value) ? value : DEFAULT_THEME_MODE;
}

export function readSystemTheme() {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return 'light';
    }

    return window.matchMedia(THEME_MEDIA_QUERY).matches ? 'dark' : 'light';
}

export function resolveThemeMode(themeMode, systemTheme = 'light') {
    const sanitizedThemeMode = sanitizeThemeMode(themeMode);

    if (sanitizedThemeMode === 'system') {
        return systemTheme === 'dark' ? 'dark' : 'light';
    }

    return sanitizedThemeMode;
}
