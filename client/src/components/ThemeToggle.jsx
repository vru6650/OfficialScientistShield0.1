import { FaMoon, FaSun } from 'react-icons/fa';
import { useDispatch, useSelector } from 'react-redux';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { setThemeMode, toggleTheme } from '../redux/theme/themeSlice';

/**
 * Small reusable button that toggles the application's theme.
 * The current theme is persisted in localStorage via the redux slice.
 *
 * Usage:
 * <ThemeToggle className="w-10 h-10" />
 */
export default function ThemeToggle({ className = '', ...props }) {
    const dispatch = useDispatch();
    const { theme, mode } = useSelector((state) => state.theme);
    const isDark = theme === 'dark';

    const thumbTarget = useMemo(() => {
        if (mode === 'auto') return 'calc(50% - 1.35rem)';
        return isDark ? 'calc(100% - 2.7rem)' : '0rem';
    }, [isDark, mode]);

    const modeLabel =
        mode === 'auto'
            ? 'Auto · Follows system'
            : isDark
                ? 'Nightfall · Deep slate'
                : 'Daybreak · Soft glass';

    const setMode = (nextMode) => dispatch(setThemeMode(nextMode));
    const cycleMode = () => dispatch(toggleTheme());

    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.01 }}
            onClick={cycleMode}
            className={`macos-theme-toggle ${isDark ? 'macos-theme-toggle--dark' : 'macos-theme-toggle--light'} ${className}`}
            aria-label={`Switch theme (current: ${mode})`}
            aria-pressed={isDark}
            {...props}
        >
            <div className="macos-theme-toggle__rail" aria-hidden="true">
                <span
                    role="button"
                    tabIndex={0}
                    className={`macos-theme-toggle__chip ${mode === 'light' ? 'macos-theme-toggle__chip--active' : ''}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        setMode('light');
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setMode('light');
                        }
                    }}
                >
                    <FaSun />
                    <span>Light</span>
                </span>
                <span
                    role="button"
                    tabIndex={0}
                    className={`macos-theme-toggle__chip ${mode === 'auto' ? 'macos-theme-toggle__chip--active' : ''}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        setMode('auto');
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setMode('auto');
                        }
                    }}
                >
                    <span className="text-xs font-semibold">A</span>
                    <span>Auto</span>
                </span>
                <span
                    role="button"
                    tabIndex={0}
                    className={`macos-theme-toggle__chip ${mode === 'dark' ? 'macos-theme-toggle__chip--active' : ''}`}
                    onClick={(event) => {
                        event.stopPropagation();
                        setMode('dark');
                    }}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault();
                            setMode('dark');
                        }
                    }}
                >
                    <FaMoon />
                    <span>Dark</span>
                </span>
                <span className="macos-theme-toggle__icon macos-theme-toggle__icon--sun">
                    <FaSun />
                </span>
                <span className="macos-theme-toggle__icon macos-theme-toggle__icon--moon">
                    <FaMoon />
                </span>
                <motion.span
                    className="macos-theme-toggle__thumb"
                    layout
                    initial={false}
                    animate={{ x: thumbTarget }}
                    transition={{ type: 'spring', stiffness: 320, damping: 32 }}
                />
            </div>
            <div className="macos-theme-toggle__labels">
                <span className="macos-theme-toggle__title">macOS theme</span>
                <span className="macos-theme-toggle__subtitle">{modeLabel}</span>
            </div>
        </motion.button>
    );
}
