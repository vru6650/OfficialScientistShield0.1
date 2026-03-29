// client/src/hooks/useReadingSettings.js
import { useEffect, useMemo, useState } from 'react';

const STORAGE_KEY = 'reading-preferences';

export const marginStyleMap = {
    narrow: '0.75rem',
    medium: '1.5rem',
    wide: '2.25rem',
};

export const defaultSettings = {
    fontSize: 18,
    fontFamily: 'serif',
    fontWeight: 400,
    lineHeight: 1.8,
    letterSpacing: 0,
    wordSpacing: 0, // New setting
    paragraphSpacing: 1.25, // New setting
    pageWidth: 'comfortable',
    pageMargin: 'medium',
    theme: 'day',
    pageColor: '',
    textAlign: 'left',
    brightness: 1,
    focusMode: false,
    readingGuide: false,
    highContrast: false,
    // NEW: Advanced controls
    ttsVoiceURI: '',
    ttsRate: 1,
    ttsPitch: 1,
    autoScroll: false,
    autoScrollSpeed: 40, // px/sec
    hideImages: false,
};

const fontFamilyMap = {
    serif: `'Merriweather', 'Georgia', 'Cambria', "Times New Roman", Times, serif`,
    sans: `'Inter', 'Segoe UI', system-ui, -apple-system, BlinkMacSystemFont, sans-serif`,
    mono: `'Fira Code', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'Liberation Mono', 'Courier New', monospace`,
};

const widthStyleMap = {
    cozy: '640px',
    comfortable: '720px',
    spacious: '860px',
};
const READER_SURFACE_KEYS = new Set(['day', 'sepia', 'mint']);

const themeClassMap = {
    day: 'reading-theme-day',
    sepia: 'reading-theme-sepia',
    mint: 'reading-theme-mint',
};

const readerSurfaceMap = {
    day: 'linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(248, 250, 252, 0.95))',
    sepia: 'linear-gradient(180deg, rgba(247, 242, 231, 0.98), rgba(239, 229, 210, 0.96))',
    mint: 'linear-gradient(180deg, rgba(240, 253, 244, 0.98), rgba(220, 252, 231, 0.96))',
};

export const normalizeHexColor = (value = '') => {
    const normalizedValue = String(value).trim();
    if (/^#[0-9a-f]{3}$/i.test(normalizedValue)) {
        return `#${normalizedValue.slice(1).split('').map((segment) => `${segment}${segment}`).join('')}`.toLowerCase();
    }

    return /^#[0-9a-f]{6}$/i.test(normalizedValue) ? normalizedValue.toLowerCase() : '';
};

const hexToRgba = (value, alpha) => {
    const normalizedValue = normalizeHexColor(value);
    if (!normalizedValue) {
        return '';
    }

    const red = Number.parseInt(normalizedValue.slice(1, 3), 16);
    const green = Number.parseInt(normalizedValue.slice(3, 5), 16);
    const blue = Number.parseInt(normalizedValue.slice(5, 7), 16);

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
};

export const resolveReaderPageSurface = (theme = 'day') => readerSurfaceMap[theme] || readerSurfaceMap.day;

export const resolveReaderPageTint = ({ theme = 'day', pageColor = '' } = {}) => {
    const normalizedPageColor = normalizeHexColor(pageColor);
    if (!normalizedPageColor) {
        return '';
    }

    const topTint = hexToRgba(normalizedPageColor, 0.58);
    const bottomTint = hexToRgba(normalizedPageColor, 0.42);

    return `linear-gradient(180deg, ${topTint}, ${bottomTint})`;
};

const getStoredSettings = () => {
    if (typeof window === 'undefined') {
        return defaultSettings;
    }
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (!stored) {
            return defaultSettings;
        }
        const parsed = JSON.parse(stored);
        const theme = READER_SURFACE_KEYS.has(parsed?.theme) ? parsed.theme : defaultSettings.theme;
        return {
            ...defaultSettings,
            ...parsed,
            theme,
        };
    } catch (error) {
        console.error('Failed to parse reading preferences:', error);
        return defaultSettings;
    }
};

export default function useReadingSettings() {
    const [settings, setSettings] = useState(getStoredSettings);

    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
        } catch (error) {
            console.error('Failed to persist reading preferences:', error);
        }
    }, [settings]);

    const updateSetting = (key, value) => {
        setSettings(prev => ({
            ...prev,
            [key]: value,
        }));
    };

    const resetSettings = () => setSettings(defaultSettings);

    const contentPadding = useMemo(
        () => marginStyleMap[settings.pageMargin] || marginStyleMap.medium,
        [settings.pageMargin]
    );
    const readerPageSurface = useMemo(
        () => resolveReaderPageSurface(settings.theme),
        [settings.theme]
    );
    const readerPageTint = useMemo(
        () => resolveReaderPageTint({ theme: settings.theme, pageColor: settings.pageColor }),
        [settings.pageColor, settings.theme]
    );

    const contentStyles = useMemo(() => {
        const filterParts = [`brightness(${settings.brightness})`];
        if (settings.highContrast) {
            filterParts.push('contrast(1.15)');
        }

        return {
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}em`,
            wordSpacing: `${settings.wordSpacing}em`, // New style
            fontWeight: settings.fontWeight,
            textAlign: settings.textAlign,
            '--paragraph-spacing': `${settings.paragraphSpacing}em`, // New CSS variable for paragraph spacing
            '--reader-page-surface': readerPageSurface || undefined,
            '--reader-page-tint': readerPageTint || undefined,
            fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
            filter: filterParts.join(' '),
            paddingInline: contentPadding,
        };
    }, [
        settings.fontSize,
        settings.lineHeight,
        settings.letterSpacing,
        settings.wordSpacing,
        settings.fontWeight,
        settings.fontFamily,
        settings.textAlign,
        settings.paragraphSpacing,
        readerPageSurface,
        readerPageTint,
        settings.brightness,
        settings.highContrast,
        contentPadding
    ]);

    const contentMaxWidth = useMemo(() => widthStyleMap[settings.pageWidth] || widthStyleMap.comfortable, [settings.pageWidth]);

    const surfaceClass = useMemo(() => {
        return themeClassMap[settings.theme] || themeClassMap.day;
    }, [settings.theme]);

    return {
        settings,
        updateSetting,
        resetSettings,
        contentStyles,
        contentMaxWidth,
        surfaceClass,
        contentPadding,
    };
}
