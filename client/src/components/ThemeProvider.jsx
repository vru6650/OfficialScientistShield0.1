// client/src/components/ThemeProvider.jsx
import { useSelector } from 'react-redux';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Flowbite } from 'flowbite-react';
import { customFlowbiteTheme } from '../theme/flowbiteTheme.js';
import SkipToContent from './SkipToContent.jsx';
import DesktopWallpaper from './desktop/DesktopWallpaper.jsx';
import { applySystemTheme } from '../redux/theme/themeSlice.js';

export default function ThemeProvider({ children }) {
    const dispatch = useDispatch();
    const { theme, mode } = useSelector((state) => state.theme);

    useEffect(() => {
        const root = window.document.documentElement;
        // Always apply chosen light/dark theme plus Big Sur style class
        root.classList.remove('light', 'dark', 'macos-sequoia', 'macos-liquid', 'liquid-glass');
        root.classList.add(theme);
        root.classList.add('bigsur');
        root.classList.add('macos-liquid');
        root.classList.add('liquid-glass');
        root.setAttribute('data-theme', 'liquid-glass');
        localStorage.setItem('theme', theme);
        document.body.classList.add('macos-theme-transition');
    }, [theme]);

    useEffect(() => {
        if (mode !== 'auto') return undefined;
        if (typeof window === 'undefined' || !window.matchMedia) return undefined;
        const media = window.matchMedia('(prefers-color-scheme: dark)');
        const sync = (event) => {
            dispatch(applySystemTheme(event.matches ? 'dark' : 'light'));
        };
        sync(media);
        media.addEventListener('change', sync);
        return () => media.removeEventListener('change', sync);
    }, [dispatch, mode]);

    const liquidAccent =
        'radial-gradient(1200px 780px at 8% 8%, rgba(255,255,255,0.2), rgba(255,255,255,0)), radial-gradient(1200px 820px at 86% 0%, rgba(93,210,255,0.26), rgba(93,210,255,0)), conic-gradient(from 120deg at 50% 50%, rgba(129,140,248,0.22), rgba(93,210,255,0.24), rgba(56,189,248,0.18), rgba(129,140,248,0.22))';

    return (
        <div className={`${theme} macos-theme`}>
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
        </div>
    );
}
