// client/src/components/ThemeProvider.jsx
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { Flowbite } from 'flowbite-react';
import { CssBaseline, ThemeProvider as MuiThemeProvider } from '@mui/material';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import { createMuiHybridTheme } from '../theme/muiHybridTheme.js';
import SkipToContent from './SkipToContent.jsx';
import DesktopWallpaper from './desktop/DesktopWallpaper.jsx';
import { applySystemTheme } from '../redux/theme/themeSlice.js';

const UI_EFFECTS_STORAGE_KEY = 'ui.effects.v1';
const SURFACE_CLASS_MAP = Object.freeze({
    liquid: 'macos-liquid',
    sequoia: 'macos-sequoia',
    graphite: 'macos-graphite',
});

const ACCENT_FALLBACK_MAP = Object.freeze({
    system: { color: '#0A84FF', strong: '#0064D1' },
    blue: { color: '#0A84FF', strong: '#0369D4' },
    pink: { color: '#EC4899', strong: '#DB2777' },
    mint: { color: '#0FB583', strong: '#0F766E' },
    amber: { color: '#F59E0B', strong: '#C2410C' },
    graphite: { color: '#111827', strong: '#0F172A' },
});

const persistTheme = (nextTheme) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem('theme', nextTheme);
    } catch {
        // Ignore blocked storage/quota errors.
    }
};

const resolveUiEffects = () => {
    if (typeof window === 'undefined') {
        return { surfacePreset: 'liquid', accentPreset: 'system' };
    }
    try {
        const parsed = JSON.parse(window.localStorage?.getItem(UI_EFFECTS_STORAGE_KEY) || '{}');
        return {
            surfacePreset: SURFACE_CLASS_MAP[parsed?.surfacePreset] ? parsed.surfacePreset : 'liquid',
            accentPreset: typeof parsed?.accentPreset === 'string' ? parsed.accentPreset : 'system',
        };
    } catch {
        return { surfacePreset: 'liquid', accentPreset: 'system' };
    }
};

export default function ThemeProvider({ children }) {
    const dispatch = useDispatch();
    const { theme, mode } = useSelector((state) => state.theme);
    const [uiEffects, setUiEffects] = useState(resolveUiEffects);
    const surfacePreset = uiEffects.surfacePreset;
    const accentPreset = uiEffects.accentPreset;

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

    const muiTheme = useMemo(() => {
        const fallbackAccent = ACCENT_FALLBACK_MAP[accentPreset] || ACCENT_FALLBACK_MAP.system;
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
            mode: theme,
            surfacePreset,
            accentColor,
            accentStrong,
        });
    }, [accentPreset, surfacePreset, theme]);

    useEffect(() => {
        if (typeof window === 'undefined' || typeof document === 'undefined') return;
        const root = window.document.documentElement;
        const surfaceClass = SURFACE_CLASS_MAP[surfacePreset] || SURFACE_CLASS_MAP.liquid;
        // Always apply chosen light/dark theme plus Big Sur style class
        root.classList.remove('light', 'dark', 'macos-sequoia', 'macos-liquid', 'macos-graphite', 'liquid-glass');
        root.classList.add(theme);
        root.classList.add('bigsur');
        root.classList.add(surfaceClass);
        root.classList.add('liquid-glass');
        root.setAttribute('data-theme', 'liquid-glass');
        root.setAttribute('data-theme-mode', mode);
        root.setAttribute('data-surface-preset', surfacePreset);
        root.setAttribute('data-accent-preset', accentPreset);
        root.style.setProperty('color-scheme', theme);
        persistTheme(theme);
        document.body.classList.add('macos-theme-transition');
    }, [accentPreset, mode, surfacePreset, theme]);

    useEffect(() => {
        if (mode !== 'auto') return undefined;
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = () => {
            dispatch(applySystemTheme(media.matches ? 'dark' : 'light'));
        };
        sync();
        if (media.addEventListener) {
            media.addEventListener('change', sync);
            return () => media.removeEventListener('change', sync);
        }
        if (media.addListener) {
            media.addListener(sync);
            return () => media.removeListener(sync);
        }
        return undefined;
    }, [dispatch, mode]);

    const liquidAccent =
        'radial-gradient(1200px 780px at 8% 8%, rgba(255,255,255,0.24), rgba(255,255,255,0)), radial-gradient(1200px 820px at 86% 0%, rgba(93,210,255,0.3), rgba(93,210,255,0)), conic-gradient(from 120deg at 50% 50%, rgba(129,140,248,0.24), rgba(93,210,255,0.28), rgba(56,189,248,0.18), rgba(251,191,36,0.18), rgba(129,140,248,0.24))';

    return (
        <div className={`${theme} macos-theme`}>
            <MuiThemeProvider theme={muiTheme}>
                <CssBaseline enableColorScheme />
                <Flowbite theme={{ theme: customFlowbiteTheme }}>
                    <div
                        className='
                            macos-desktop relative min-h-screen overflow-hidden
                            text-gray-700 dark:text-gray-200
                            transition-colors duration-300
                        '
                    >
                        <DesktopWallpaper
                            className='pointer-events-none absolute inset-0 -z-10'
                            accentGradient={liquidAccent}
                            focusMode={false}
                            theme={theme}
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
    );
}

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};
