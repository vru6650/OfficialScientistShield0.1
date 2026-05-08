// client/src/components/ThemeProvider.jsx
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Flowbite } from 'flowbite-react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import { createMuiHybridTheme } from '../theme/muiHybridTheme.js';
import {
    ACCENT_PRESETS,
    SURFACE_CLASS_MAP,
    SURFACE_CLASS_NAMES,
    SURFACE_PRESETS,
    WALLPAPER_OPTIONS,
    resolveAccentPresetDefinition,
    resolveWallpaperMode,
} from '../theme/themePresets.js';
import {
    UI_EFFECTS_CHANGED_EVENT,
    mergeUiEffects,
    readUiEffects,
    saveUiEffects,
} from '../theme/uiEffects.js';
import SkipToContent from './SkipToContent.jsx';
import DesktopWallpaper from './desktop/DesktopWallpaper.jsx';
import { DEFAULT_CUSTOM_ACCENT } from '../utils/themeAccent.js';
import { ThemeContext } from './ThemeContext.jsx';
import {
    THEME_MEDIA_QUERY,
    readSystemTheme,
    resolveThemeMode,
    sanitizeThemeMode,
} from '../utils/themeMode.js';

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
    const [uiEffects, setUiEffects] = useState(readUiEffects);
    const [systemTheme, setSystemTheme] = useState(readSystemTheme);
    const [accessibilityPreferences, setAccessibilityPreferences] = useState(
        readAccessibilityPreferences
    );
    const themeMode = sanitizeThemeMode(uiEffects.themeMode);
    const resolvedTheme = resolveThemeMode(themeMode, systemTheme);
    const surfacePreset = uiEffects.surfacePreset;
    const accentPreset = uiEffects.accentPreset;
    const customAccent = uiEffects.customAccent;
    const wallpaperMode = resolveWallpaperMode(uiEffects.wallpaperMode);
    const effectiveReduceMotion =
        accessibilityPreferences.reducedMotion || uiEffects.reduceMotion;
    const resolvedAccentPreset = useMemo(
        () =>
            resolveAccentPresetDefinition({
                accentPreset,
                customAccent,
            }),
        [accentPreset, customAccent]
    );

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const syncUiEffects = () => {
            setUiEffects(readUiEffects());
        };

        syncUiEffects();
        window.addEventListener(UI_EFFECTS_CHANGED_EVENT, syncUiEffects);
        window.addEventListener('storage', syncUiEffects);

        return () => {
            window.removeEventListener(UI_EFFECTS_CHANGED_EVENT, syncUiEffects);
            window.removeEventListener('storage', syncUiEffects);
        };
    }, []);

    useEffect(() => subscribeToMediaQuery(THEME_MEDIA_QUERY, (matches) => {
        setSystemTheme(matches ? 'dark' : 'light');
    }), []);

    const updateEffects = useCallback((nextEffects) => {
        setUiEffects((previousEffects) => {
            const patch =
                typeof nextEffects === 'function'
                    ? nextEffects(previousEffects)
                    : nextEffects;
            return saveUiEffects(mergeUiEffects(previousEffects, patch));
        });
    }, []);

    const setThemeMode = useCallback((nextMode) => {
        updateEffects({ themeMode: sanitizeThemeMode(nextMode) });
    }, [updateEffects]);

    const setSurfacePreset = useCallback((nextPreset) => {
        updateEffects({ surfacePreset: nextPreset });
    }, [updateEffects]);

    const setAccentPreset = useCallback((nextPreset) => {
        updateEffects({ accentPreset: nextPreset });
    }, [updateEffects]);

    const applyCustomAccent = useCallback((accentColor) => {
        updateEffects({
            accentPreset: 'custom',
            customAccent: accentColor,
        });
    }, [updateEffects]);

    const resetCustomAccent = useCallback(() => {
        updateEffects({
            accentPreset: 'system',
            customAccent: DEFAULT_CUSTOM_ACCENT,
        });
    }, [updateEffects]);

    const setWallpaperMode = useCallback((nextWallpaperMode) => {
        updateEffects({ wallpaperMode: nextWallpaperMode });
    }, [updateEffects]);

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
            const nextPreferences = readAccessibilityPreferences();
            setAccessibilityPreferences(nextPreferences);
            syncDocumentAccessibilityPreferences(root, nextPreferences);
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
        const surfaceClass = SURFACE_CLASS_MAP[surfacePreset] || SURFACE_CLASS_MAP.hybrid;
        root.classList.remove('light', 'dark', 'liquid-glass', ...SURFACE_CLASS_NAMES);
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
            effects: uiEffects,
            themeMode,
            resolvedTheme,
            systemTheme,
            brightness: uiEffects.brightness,
            contrast: uiEffects.contrast,
            veil: uiEffects.veil,
            reduceMotion: effectiveReduceMotion,
            prefersContrast: accessibilityPreferences.prefersContrast,
            forcedColors: accessibilityPreferences.forcedColors,
            surfacePreset,
            accentPreset,
            customAccent,
            wallpaperMode,
            resolvedAccentPreset,
            surfacePresets: SURFACE_PRESETS,
            accentPresets: ACCENT_PRESETS,
            wallpaperOptions: WALLPAPER_OPTIONS,
            updateEffects,
            setThemeMode,
            setSurfacePreset,
            setAccentPreset,
            applyCustomAccent,
            resetCustomAccent,
            setWallpaperMode,
            toggleTheme,
        }),
        [
            accentPreset,
            applyCustomAccent,
            accessibilityPreferences,
            customAccent,
            effectiveReduceMotion,
            resolvedAccentPreset,
            resolvedTheme,
            resetCustomAccent,
            setAccentPreset,
            setSurfacePreset,
            setThemeMode,
            setWallpaperMode,
            surfacePreset,
            systemTheme,
            themeMode,
            toggleTheme,
            uiEffects,
            updateEffects,
            wallpaperMode,
        ]
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
                                wallpaperMode={wallpaperMode}
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
