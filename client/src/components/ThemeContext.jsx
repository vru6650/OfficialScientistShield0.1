import PropTypes from 'prop-types';
import { createContext, useState, useContext, useEffect } from 'react';

const ThemeContext = createContext();

const resolveInitialTheme = () => {
    if (typeof window === 'undefined') {
        return 'light';
    }

    try {
        const storedTheme = window.localStorage?.getItem('theme');
        if (storedTheme === 'light' || storedTheme === 'dark') {
            return storedTheme;
        }
    } catch {
        // Ignore blocked storage errors and fall back to system preference.
    }

    if (typeof window.matchMedia === 'function') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    return 'light';
};

const persistTheme = (theme) => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage?.setItem('theme', theme);
    } catch {
        // Ignore blocked storage errors.
    }
};

export const ThemeProvider = ({ children }) => {
    const [theme, setTheme] = useState(resolveInitialTheme);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.classList.remove('light', 'dark');
        root.classList.add(theme);
        persistTheme(theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme((prevTheme) => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};

ThemeProvider.propTypes = {
    children: PropTypes.node.isRequired,
};

export const useTheme = () => useContext(ThemeContext);
