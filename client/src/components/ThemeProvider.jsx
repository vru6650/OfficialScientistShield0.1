// client/src/components/ThemeProvider.jsx
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flowbite } from 'flowbite-react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import { createMuiHybridTheme } from '../theme/muiHybridTheme.js';
import SkipToContent from './SkipToContent.jsx';
import DesktopWallpaper from './desktop/DesktopWallpaper.jsx';
import { DEFAULT_CUSTOM_ACCENT, deriveCustomAccentPreset, resolveThemeAccent } from '../utils/themeAccent.js';
import { ThemeContext } from './ThemeContext.jsx';
import {
    DEFAULT_THEME_MODE,
    THEME_MEDIA_QUERY,
    readSystemTheme,
    resolveThemeMode,
    sanitizeThemeMode,
} from '../utils/themeMode.js';

const UI_EFFECTS_STORAGE_KEY = 'ui.effects.v1';
const THEME_COLOR_META_SELECTOR = 'meta[name="theme-color"][data-dynamic-theme-color="true"]';
const STATUS_BAR_META_SELECTOR =
    'meta[name="apple-mobile-web-app-status-bar-style"][data-dynamic-status-bar="true"]';
const ACCESSIBILITY_MEDIA_QUERIES = Object.freeze({
    prefersContrast: '(prefers-contrast: more)',
    forcedColors: '(forced-colors: active)',
    reducedMotion: '(prefers-reduced-motion: reduce)',
});
const THEME_COLOR_FALLBACKS = Object.freeze({
    light: '#eef6ff',
    dark: '#0b1120',
});
const SURFACE_CLASS_MAP = Object.freeze({
    liquid: 'macos-liquid',
    sequoia: 'macos-sequoia',
    graphite: 'macos-graphite',
});

const ACCENT_FALLBACK_MAP = Object.freeze({
    system: { color: '#1677FF', strong: '#0D59D8', gradient: null },
    blue: {
        color: '#1677FF',
        strong: '#0D59D8',
        gradient: 'linear-gradient(135deg, rgba(22,119,255,0.94), rgba(102,198,255,0.72), rgba(13,89,216,0.88))',
    },
    pink: {
        color: '#F06292',
        strong: '#D63C74',
        gradient: 'linear-gradient(135deg, rgba(240,98,146,0.92), rgba(255,184,107,0.68), rgba(214,60,116,0.88))',
    },
    mint: {
        color: '#10B98A',
        strong: '#0B8A68',
        gradient: 'linear-gradient(135deg, rgba(16,185,138,0.92), rgba(92,227,218,0.64), rgba(11,138,104,0.86))',
    },
    amber: {
        color: '#F3A33C',
        strong: '#D66A10',
        gradient: 'linear-gradient(135deg, rgba(243,163,60,0.94), rgba(255,210,144,0.7), rgba(214,106,16,0.86))',
    },
    graphite: {
        color: '#1E2E46',
        strong: '#0F172A',
        gradient: 'linear-gradient(135deg, rgba(30,46,70,0.94), rgba(76,99,140,0.56), rgba(15,23,42,0.9))',
    },
});

const resolveUiEffects = () => {
    if (typeof window === 'undefined') {
        return {
            themeMode: DEFAULT_THEME_MODE,
            surfacePreset: 'liquid',
            accentPreset: 'system',
            customAccent: DEFAULT_CUSTOM_ACCENT,
        };
    }
    try {
        const parsed = JSON.parse(window.localStorage?.getItem(UI_EFFECTS_STORAGE_KEY) || '{}');
        return {
            themeMode: sanitizeThemeMode(parsed?.themeMode),
            surfacePreset: SURFACE_CLASS_MAP[parsed?.surfacePreset] ? parsed.surfacePreset : 'liquid',
            accentPreset: typeof parsed?.accentPreset === 'string' ? parsed.accentPreset : 'system',
            customAccent: resolveThemeAccent(parsed?.customAccent, DEFAULT_CUSTOM_ACCENT),
        };
    } catch {
        return {
            themeMode: DEFAULT_THEME_MODE,
            surfacePreset: 'liquid',
            accentPreset: 'system',
            customAccent: DEFAULT_CUSTOM_ACCENT,
        };
    }
};

const ensureThemeColorMeta = () => {
    if (typeof document === 'undefined') return null;
    let meta = document.querySelector(THEME_COLOR_META_SELECTOR);
    if (meta) return meta;
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    meta.setAttribute('data-dynamic-theme-color', 'true');
    document.head.appendChild(meta);
    return meta;
};

const ensureStatusBarMeta = () => {
    if (typeof document === 'undefined') return null;
    let meta = document.querySelector(STATUS_BAR_META_SELECTOR);
    if (meta) return meta;

    meta = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
    if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('name', 'apple-mobile-web-app-status-bar-style');
        document.head.appendChild(meta);
    }

    meta.setAttribute('data-dynamic-status-bar', 'true');
    return meta;
};

const resolveBrowserThemeColor = (resolvedTheme) => {
    if (typeof window === 'undefined' || typeof document === 'undefined' || typeof window.getComputedStyle !== 'function') {
        return THEME_COLOR_FALLBACKS[resolvedTheme] || THEME_COLOR_FALLBACKS.light;
    }
    const styles = window.getComputedStyle(document.documentElement);
    const candidates = ['--bg-app', '--color-bg-primary', '--bg-page', '--color-bg-secondary'];
    for (const variableName of candidates) {
        const value = styles.getPropertyValue(variableName).trim();
        if (value && !value.includes('gradient(')) {
            return value.replace(/\s+/g, ' ');
        }
    }
    return THEME_COLOR_FALLBACKS[resolvedTheme] || THEME_COLOR_FALLBACKS.light;
};

const readMediaQueryMatch = (query) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return false;
    }
    return window.matchMedia(query).matches;
};

const readAccessibilityPreferences = () => ({
    prefersContrast: readMediaQueryMatch(ACCESSIBILITY_MEDIA_QUERIES.prefersContrast),
    forcedColors: readMediaQueryMatch(ACCESSIBILITY_MEDIA_QUERIES.forcedColors),
    reducedMotion: readMediaQueryMatch(ACCESSIBILITY_MEDIA_QUERIES.reducedMotion),
});

const syncDocumentAccessibilityPreferences = (root, preferences) => {
    if (!root) return;
    root.setAttribute(
        'data-contrast-preference',
        preferences.prefersContrast ? 'more' : 'no-preference'
    );
    root.setAttribute('data-forced-colors', preferences.forcedColors ? 'active' : 'none');
    root.setAttribute('data-reduced-motion', preferences.reducedMotion ? 'reduce' : 'no-preference');
};

const subscribeToMediaQuery = (query, callback) => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {};
    }

    const media = window.matchMedia(query);
    const listener = () => callback(media.matches);

    if (media.addEventListener) {
        media.addEventListener('change', listener);
        return () => media.removeEventListener('change', listener);
    }

    if (media.addListener) {
        media.addListener(listener);
        return () => media.removeListener(listener);
    }

    return () => {};
};

export default function ThemeProvider({ children }) {
    const [uiEffects, setUiEffects] = useState(resolveUiEffects);
    const [systemTheme, setSystemTheme] = useState(readSystemTheme);
    const themeMode = sanitizeThemeMode(uiEffects.themeMode);
    const resolvedTheme = resolveThemeMode(themeMode, systemTheme);
    const surfacePreset = uiEffects.surfacePreset;
    const accentPreset = uiEffects.accentPreset;
    const customAccent = uiEffects.customAccent;
    const resolvedAccentPreset = useMemo(() => {
        if (accentPreset === 'custom') {
            return deriveCustomAccentPreset(customAccent);
        }
        return ACCENT_FALLBACK_MAP[accentPreset] || ACCENT_FALLBACK_MAP.system;
    }, [accentPreset, customAccent]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const syncUiEffects = () => {
            setUiEffects(resolveUiEffects());
        };

        syncUiEffects();
        window.addEventListener('ui-effects-changed', syncUiEffects);
        window.addEventListener('storage', syncUiEffects);

        return () => {
            window.removeEventListener('ui-effects-changed', syncUiEffects);
            window.removeEventListener('storage', syncUiEffects);
        };
    }, []);

    useEffect(() => subscribeToMediaQuery(THEME_MEDIA_QUERY, (matches) => {
        setSystemTheme(matches ? 'dark' : 'light');
    }), []);

    const setThemeMode = useCallback((nextMode) => {
        const sanitizedThemeMode = sanitizeThemeMode(nextMode);

        if (typeof window !== 'undefined') {
            try {
                const parsed = JSON.parse(window.localStorage.getItem(UI_EFFECTS_STORAGE_KEY) || '{}');
                const merged = typeof parsed === 'object' && parsed !== null ? parsed : {};
                window.localStorage.setItem(
                    UI_EFFECTS_STORAGE_KEY,
                    JSON.stringify({ ...merged, themeMode: sanitizedThemeMode })
                );
                window.dispatchEvent(new Event('ui-effects-changed'));
            } catch {
                window.localStorage.setItem(
                    UI_EFFECTS_STORAGE_KEY,
                    JSON.stringify({ themeMode: sanitizedThemeMode })
                );
                window.dispatchEvent(new Event('ui-effects-changed'));
            }
        }

        setUiEffects((prev) => ({ ...prev, themeMode: sanitizedThemeMode }));
    }, []);

    const toggleTheme = useCallback(() => {
        setThemeMode(resolvedTheme === 'dark' ? 'light' : 'dark');
    }, [resolvedTheme, setThemeMode]);

    const muiTheme = useMemo(() => {
        const fallbackAccent = resolvedAccentPreset;
        let accentColor = fallbackAccent.color;
        let accentStrong = fallbackAccent.strong;

        if (
            typeof window !== 'undefined' &&
            typeof document !== 'undefined' &&
            typeof window.getComputedStyle === 'function'
        ) {
            const styles = window.getComputedStyle(document.documentElement);
            const cssAccent = styles.getPropertyValue('--color-accent').trim();
            const cssAccentStrong = styles.getPropertyValue('--color-accent-strong').trim();
            if (cssAccent) accentColor = cssAccent;
            if (cssAccentStrong) accentStrong = cssAccentStrong;
        }

        return createMuiHybridTheme({
            mode: resolvedTheme,
            surfacePreset,
            accentColor,
            accentStrong,
        });
    }, [resolvedAccentPreset, resolvedTheme, surfacePreset]);

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        document.body.classList.add('macos-theme-transition');
        return () => {
            document.body.classList.remove('macos-theme-transition');
        };
    }, []);

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;

        const root = document.documentElement;
        const sync = () => {
            syncDocumentAccessibilityPreferences(root, readAccessibilityPreferences());
        };

        sync();

        const unsubscribers = Object.values(ACCESSIBILITY_MEDIA_QUERIES).map((query) =>
            subscribeToMediaQuery(query, sync)
        );

        return () => {
            unsubscribers.forEach((unsubscribe) => unsubscribe());
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const root = window.document.documentElement;
        const surfaceClass = SURFACE_CLASS_MAP[surfacePreset] || SURFACE_CLASS_MAP.liquid;
        root.classList.remove('light', 'dark', 'macos-sequoia', 'macos-liquid', 'macos-graphite', 'liquid-glass');
        root.classList.add(resolvedTheme);
        root.classList.add('bigsur');
        root.classList.add(surfaceClass);
        root.classList.add('liquid-glass');
        root.setAttribute('data-theme', 'liquid-glass');
        root.setAttribute('data-theme-mode', themeMode);
        root.setAttribute('data-resolved-theme', resolvedTheme);
        root.setAttribute('data-surface-preset', surfacePreset);
        root.setAttribute('data-accent-preset', accentPreset);
        if (accentPreset === 'custom') {
            root.setAttribute('data-custom-accent', resolvedAccentPreset.color);
        } else {
            root.removeAttribute('data-custom-accent');
        }
        root.style.setProperty('color-scheme', resolvedTheme);
        syncDocumentAccessibilityPreferences(root, readAccessibilityPreferences());

        if (accentPreset === 'system') {
            root.style.removeProperty('--color-accent');
            root.style.removeProperty('--color-accent-strong');
            root.style.removeProperty('--color-accent-gradient');
        } else {
            root.style.setProperty('--color-accent', resolvedAccentPreset.color);
            root.style.setProperty('--color-accent-strong', resolvedAccentPreset.strong);
            if (resolvedAccentPreset.gradient) {
                root.style.setProperty('--color-accent-gradient', resolvedAccentPreset.gradient);
            } else {
                root.style.removeProperty('--color-accent-gradient');
            }
        }

        const browserThemeColor = resolveBrowserThemeColor(resolvedTheme);
        const themeColorMeta = ensureThemeColorMeta();
        if (browserThemeColor && themeColorMeta) {
            themeColorMeta.setAttribute('content', browserThemeColor);
        }

        const statusBarMeta = ensureStatusBarMeta();
        if (statusBarMeta) {
            statusBarMeta.setAttribute('content', resolvedTheme === 'dark' ? 'black-translucent' : 'default');
        }
    }, [accentPreset, resolvedAccentPreset, resolvedTheme, surfacePreset, themeMode]);

    const liquidAccent =
        'radial-gradient(1320px 820px at 10% 6%, rgba(255,255,255,0.28), rgba(255,255,255,0)), radial-gradient(1180px 840px at 84% 2%, rgba(102,198,255,0.34), rgba(102,198,255,0)), radial-gradient(980px 680px at 76% 88%, rgba(243,163,60,0.2), rgba(243,163,60,0)), conic-gradient(from 126deg at 50% 50%, rgba(126,152,255,0.28), rgba(59,184,255,0.26), rgba(96,225,212,0.18), rgba(243,163,60,0.18), rgba(126,152,255,0.28))';
    const themeContextValue = useMemo(
        () => ({
            themeMode,
            resolvedTheme,
            systemTheme,
            setThemeMode,
            toggleTheme,
        }),
        [resolvedTheme, setThemeMode, systemTheme, themeMode, toggleTheme]
    );

    return (
        <ThemeContext.Provider value={themeContextValue}>
            <div className={`${resolvedTheme} macos-theme`}>
                <MuiThemeProvider theme={muiTheme}>
                    <CssBaseline enableColorScheme />
                    <Flowbite theme={{ theme: customFlowbiteTheme }}>
                        <div
                            className='
                                macos-desktop relative min-h-screen overflow-hidden
                                text-slate-700 transition-colors duration-300
                                dark:text-slate-100
                            '
                        >
                            <DesktopWallpaper
                                className='pointer-events-none absolute inset-0 -z-10'
                                accentGradient={liquidAccent}
                                focusMode={false}
                                theme={resolvedTheme}
                            />

                            {/* Content layer */}
                            <div className='relative z-10'>
                                {/* Accessibility: offer a skip link for keyboard users */}
                                <SkipToContent targetId='main-content' />
                                {children}
                            </div>
                        </div>
                    </Flowbite>
                </MuiThemeProvider>
            </div>
        </ThemeContext.Provider>
    );
}

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
