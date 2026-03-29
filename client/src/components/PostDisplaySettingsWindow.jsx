import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowsPointingOut,
    HiOutlineEye,
    HiOutlineLightBulb,
    HiOutlineSparkles,
    HiOutlineXMark,
} from 'react-icons/hi2';
import {
    marginStyleMap,
    normalizeHexColor,
    resolveReaderPageSurface,
    resolveReaderPageTint,
} from '../hooks/useReadingSettings';

const DESKTOP_BREAKPOINT = 1024;

const themeOptions = [
    { id: 'day', label: 'Day', swatchClass: 'bg-white' },
    { id: 'sepia', label: 'Sepia', swatchClass: 'bg-[#f7f2e7]' },
    { id: 'mint', label: 'Mint', swatchClass: 'bg-[#f0fdf4]' },
];

const pageColorOptions = [
    { id: 'default', label: 'Default', value: '' },
    { id: 'ivory', label: 'Ivory', value: '#fff9ed' },
    { id: 'linen', label: 'Linen', value: '#f7efe2' },
    { id: 'sage', label: 'Sage', value: '#ecf8ef' },
    { id: 'sky', label: 'Sky', value: '#ecf7ff' },
    { id: 'rose', label: 'Rose', value: '#fdf0f6' },
    { id: 'lilac', label: 'Lilac', value: '#f1edff' },
];

const fontOptions = [
    { id: 'serif', label: 'Serif', style: { fontFamily: '\'Merriweather\', Georgia, serif' } },
    { id: 'sans', label: 'Sans', style: { fontFamily: '\'Inter\', \'Segoe UI\', sans-serif' } },
    { id: 'mono', label: 'Mono', style: { fontFamily: '\'Fira Code\', \'SFMono-Regular\', monospace' } },
];

const widthOptions = [
    { id: 'cozy', label: 'Cozy' },
    { id: 'comfortable', label: 'Comfort' },
    { id: 'spacious', label: 'Wide' },
];

const marginOptions = [
    { id: 'narrow', label: 'Narrow', description: 'More words per line.' },
    { id: 'medium', label: 'Medium', description: 'Balanced page breathing room.' },
    { id: 'wide', label: 'Wide', description: 'Extra margin for focused reading.' },
];

const alignmentOptions = [
    { id: 'left', label: 'Left' },
    { id: 'justify', label: 'Justify' },
];

const layoutPresetOptions = [
    {
        id: 'compact',
        label: 'Compact',
        description: 'Wider page, tighter spacing, justified text.',
        settings: {
            pageWidth: 'spacious',
            pageMargin: 'narrow',
            textAlign: 'justify',
            lineHeight: 1.65,
            paragraphSpacing: 1,
        },
    },
    {
        id: 'classic',
        label: 'Classic',
        description: 'Balanced Kindle-style page rhythm.',
        settings: {
            pageWidth: 'comfortable',
            pageMargin: 'medium',
            textAlign: 'left',
            lineHeight: 1.8,
            paragraphSpacing: 1.25,
        },
    },
    {
        id: 'relaxed',
        label: 'Relaxed',
        description: 'Narrower column with more breathing room.',
        settings: {
            pageWidth: 'cozy',
            pageMargin: 'wide',
            textAlign: 'left',
            lineHeight: 1.95,
            paragraphSpacing: 1.45,
        },
    },
];

const readingToolOptions = [
    { id: 'focusMode', label: 'Focus', Icon: HiOutlineEye },
    { id: 'highContrast', label: 'Contrast', Icon: HiOutlineLightBulb },
    { id: 'hideImages', label: 'Hide media', Icon: HiOutlineAdjustmentsHorizontal },
    { id: 'readingGuide', label: 'Guide', Icon: HiOutlineSparkles },
];

const fontFamilyMap = {
    serif: '\'Merriweather\', Georgia, serif',
    sans: '\'Inter\', \'Segoe UI\', sans-serif',
    mono: '\'Fira Code\', \'SFMono-Regular\', monospace',
};

const previewThemeClassMap = {
    day: 'border-slate-200 bg-white text-slate-900',
    sepia: 'border-[#d8c7ab] bg-[#f7f2e7] text-[#5b4636]',
    mint: 'border-[#bbf7d0] bg-[#f0fdf4] text-[#14532d]',
};

const clampNumber = (value, min, max) => Math.min(Math.max(value, min), max);
const defaultPreviewSurface = 'linear-gradient(180deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.92))';
const matchesLayoutPreset = (settings, preset) =>
    Object.entries(preset.settings).every(([key, value]) => settings[key] === value);

export default function PostDisplaySettingsWindow({
    settings,
    onChange,
    onReset,
    onClose,
}) {
    const panelRef = useRef(null);
    const dragRef = useRef({
        active: false,
        originX: 0,
        originY: 0,
        startX: 0,
        startY: 0,
    });

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : false,
    );

    const activeThemeLabel = useMemo(
        () => themeOptions.find((option) => option.id === settings.theme)?.label || 'Day',
        [settings.theme],
    );
    const activeFontLabel = useMemo(
        () => fontOptions.find((option) => option.id === settings.fontFamily)?.label || 'Serif',
        [settings.fontFamily],
    );
    const activeMarginLabel = useMemo(
        () => marginOptions.find((option) => option.id === settings.pageMargin)?.label || 'Medium',
        [settings.pageMargin],
    );
    const activeLayoutPreset = useMemo(
        () => layoutPresetOptions.find((option) => matchesLayoutPreset(settings, option)) || null,
        [
            settings.lineHeight,
            settings.pageMargin,
            settings.pageWidth,
            settings.paragraphSpacing,
            settings.textAlign,
        ],
    );
    const activeLayoutLabel = activeLayoutPreset?.label || 'Custom';
    const normalizedPageColor = useMemo(
        () => normalizeHexColor(settings.pageColor),
        [settings.pageColor],
    );
    const pageColorLabel = normalizedPageColor ? normalizedPageColor.toUpperCase() : 'Surface default';
    const previewThemeClass = previewThemeClassMap[settings.theme] || previewThemeClassMap.day;
    const previewSurface = useMemo(() => {
        const surface = resolveReaderPageSurface(settings.theme) || defaultPreviewSurface;
        const tint = resolveReaderPageTint({ theme: settings.theme, pageColor: normalizedPageColor });
        return tint ? `${tint}, ${surface}` : surface;
    }, [normalizedPageColor, settings.theme]);
    const previewStyles = useMemo(
        () => ({
            fontSize: `${settings.fontSize}px`,
            lineHeight: settings.lineHeight,
            letterSpacing: `${settings.letterSpacing}em`,
            wordSpacing: `${settings.wordSpacing}em`,
            fontWeight: settings.fontWeight,
            textAlign: settings.textAlign,
            fontFamily: fontFamilyMap[settings.fontFamily] || fontFamilyMap.serif,
            filter: `brightness(${settings.brightness})${settings.highContrast ? ' contrast(1.15)' : ''}`,
            background: previewSurface,
            paddingInline: marginStyleMap[settings.pageMargin] || marginStyleMap.medium,
        }),
        [
            settings.brightness,
            settings.fontFamily,
            settings.fontSize,
            settings.fontWeight,
            settings.highContrast,
            settings.letterSpacing,
            settings.lineHeight,
            settings.pageMargin,
            settings.textAlign,
            settings.wordSpacing,
            previewSurface,
        ],
    );

    const clampOffset = useCallback((x, y) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }

        const panelRect = panelRef.current?.getBoundingClientRect();
        if (!panelRect) {
            return { x, y };
        }

        const edgePadding = 12;
        const minX = -(panelRect.left - edgePadding);
        const maxX = window.innerWidth - panelRect.right - edgePadding;
        const minY = -(panelRect.top - edgePadding);
        const maxY = window.innerHeight - panelRect.bottom - edgePadding;

        return {
            x: Math.min(Math.max(x, minX), maxX),
            y: Math.min(Math.max(y, minY), maxY),
        };
    }, []);

    const startDrag = useCallback(
        (event) => {
            if (!isDesktop || event.button !== 0) {
                return;
            }

            const target = event.target;
            if (target?.closest?.('button, input, textarea, select, a, label')) {
                return;
            }

            dragRef.current = {
                active: true,
                originX: offset.x,
                originY: offset.y,
                startX: event.clientX,
                startY: event.clientY,
            };
            setIsDragging(true);
            event.preventDefault();
        },
        [isDesktop, offset.x, offset.y],
    );

    useEffect(() => {
        if (!isDragging) {
            return undefined;
        }

        const handlePointerMove = (event) => {
            const drag = dragRef.current;
            if (!drag.active) {
                return;
            }

            const nextX = drag.originX + (event.clientX - drag.startX);
            const nextY = drag.originY + (event.clientY - drag.startY);

            setOffset((previous) => {
                const clamped = clampOffset(nextX, nextY);
                if (previous.x === clamped.x && previous.y === clamped.y) {
                    return previous;
                }

                return clamped;
            });
        };

        const stopDragging = () => {
            dragRef.current.active = false;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', stopDragging);
            window.removeEventListener('pointercancel', stopDragging);
        };
    }, [clampOffset, isDragging]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handleResize = () => {
            const nextIsDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
            setIsDesktop(nextIsDesktop);
            setOffset((previous) => (nextIsDesktop ? clampOffset(previous.x, previous.y) : { x: 0, y: 0 }));
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [clampOffset]);

    useEffect(() => {
        if (!isDesktop) {
            return;
        }

        setOffset((previous) => clampOffset(previous.x, previous.y));
    }, [clampOffset, isDesktop, settings.brightness, settings.fontSize, settings.lineHeight, normalizedPageColor, settings.theme]);

    const shellStyle = useMemo(() => {
        if (!isDesktop) {
            return undefined;
        }

        return {
            position: 'fixed',
            top: '5.5rem',
            left: '1rem',
            width: 'min(94vw, 38rem)',
            maxHeight: 'calc(100vh - 7rem)',
            zIndex: 60,
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        };
    }, [isDesktop, offset.x, offset.y]);

    const adjustValue = useCallback((key, delta, min, max, precision = 0) => {
        const currentValue = Number(settings[key] ?? 0);
        const nextValue = clampNumber(currentValue + delta, min, max);
        const normalizedValue = precision > 0 ? Number(nextValue.toFixed(precision)) : nextValue;
        onChange(key, normalizedValue);
    }, [onChange, settings]);

    const applyLayoutPreset = useCallback((presetSettings) => {
        Object.entries(presetSettings).forEach(([key, value]) => {
            onChange(key, value);
        });
    }, [onChange]);

    const toggleSetting = useCallback((key) => {
        onChange(key, !settings[key]);
    }, [onChange, settings]);
    const colorInputValue = normalizedPageColor || '#fff9ed';

    return (
        <section
            ref={panelRef}
            style={shellStyle}
            className={`overflow-hidden rounded-[28px] border border-white/35 bg-white/75 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72 ${
                isDesktop ? 'pointer-events-auto' : 'sticky top-20 z-20'
            } ${isDragging ? 'shadow-[0_28px_70px_-36px_rgba(15,23,42,0.95)]' : ''}`}
        >
            <div
                className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.16),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(245,158,11,0.16),transparent_22%)]'
                aria-hidden='true'
            />
            <div className='relative space-y-4 p-4 sm:p-5'>
                <div
                    onPointerDown={startDrag}
                    className={`flex items-center justify-between gap-3 rounded-2xl border border-white/45 bg-white/65 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/35 ${
                        isDesktop ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                >
                    <div className='inline-flex items-center gap-2 rounded-full bg-amber-100/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-amber-700 shadow-sm ring-1 ring-amber-200 dark:bg-amber-950/60 dark:text-amber-100 dark:ring-amber-500/30'>
                        <HiOutlineAdjustmentsHorizontal className='h-4 w-4' aria-hidden='true' />
                        Aa Display
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                            {isDesktop ? (
                                <>
                                    <HiOutlineArrowsPointingOut className='h-4 w-4' aria-hidden='true' />
                                    Drag window
                                </>
                            ) : (
                                'Reading controls'
                            )}
                        </div>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-full border border-slate-200/80 bg-white/80 p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                            aria-label='Close font and display window'
                            title='Close font and display window'
                        >
                            <HiOutlineXMark className='h-4 w-4' aria-hidden='true' />
                        </button>
                    </div>
                </div>

                <div className={`space-y-4 ${isDesktop ? 'max-h-[calc(100vh-11rem)] overflow-y-auto pr-1' : ''}`}>
                    <div className='space-y-2'>
                        <div className='flex items-center gap-2'>
                            <HiOutlineAdjustmentsHorizontal className='h-5 w-5 text-amber-600 dark:text-amber-300' aria-hidden='true' />
                            <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                                Font and display for this post
                            </h2>
                        </div>
                        <p className='max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                            Tune surface, type size, spacing, and reading aids in a separate window while the article stays visible.
                        </p>
                    </div>

                    <div className={`rounded-3xl border p-4 shadow-inner ${previewThemeClass}`} style={previewStyles}>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Live preview
                                </p>
                                <p className='mt-1 text-sm font-semibold'>
                                    {activeThemeLabel} surface · {activeFontLabel} type · {activeLayoutLabel} layout
                                </p>
                            </div>
                            <div className='flex flex-wrap items-center gap-2'>
                                <span className='rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-700/80'>
                                    {settings.fontSize}px
                                </span>
                                <span className='rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200/80 dark:bg-slate-900/60 dark:text-slate-200 dark:ring-slate-700/80'>
                                    {settings.lineHeight.toFixed(2)} line
                                </span>
                            </div>
                        </div>
                        <p className='mt-4 leading-relaxed'>
                            Settle into the article with the spacing, tone, and typography that match your reading pace.
                        </p>
                        <p className='mt-3 text-xs opacity-80'>
                            {settings.paragraphSpacing.toFixed(2)}em paragraph spacing · {Math.round(settings.brightness * 100)}% brightness · {pageColorLabel} page color · {activeMarginLabel} margins · {settings.textAlign} alignment
                        </p>
                    </div>

                    <div className='grid gap-4 lg:grid-cols-2'>
                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <div className='flex items-center justify-between gap-3'>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Surface
                                </p>
                                <span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>{activeThemeLabel}</span>
                            </div>
                            <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                                {themeOptions.map((option) => {
                                    const isActive = settings.theme === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type='button'
                                            onClick={() => onChange('theme', option.id)}
                                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                            }`}
                                            aria-pressed={isActive}
                                        >
                                            <span className={`h-4 w-4 rounded-full border border-slate-300/80 ${option.swatchClass}`} aria-hidden='true' />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <div className='flex items-center justify-between gap-3'>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Page color
                                </p>
                                <span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>{pageColorLabel}</span>
                            </div>
                            <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3'>
                                {pageColorOptions.map((option) => {
                                    const isActive = option.value
                                        ? option.value === normalizedPageColor
                                        : !normalizedPageColor;

                                    return (
                                        <button
                                            key={option.id}
                                            type='button'
                                            onClick={() => onChange('pageColor', option.value)}
                                            className={`flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                            }`}
                                            aria-pressed={isActive}
                                        >
                                            <span
                                                className='h-4 w-4 rounded-full border border-slate-300/80 shadow-sm'
                                                style={{
                                                    background: option.value
                                                        ? option.value
                                                        : 'linear-gradient(135deg, rgba(255,255,255,0.98), rgba(226,232,240,0.96))',
                                                }}
                                                aria-hidden='true'
                                            />
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className='mt-4 flex flex-wrap items-center gap-3'>
                                <label htmlFor='post-page-color' className='text-sm font-medium text-slate-700 dark:text-slate-200'>
                                    Custom tint
                                </label>
                                <input
                                    id='post-page-color'
                                    type='color'
                                    value={colorInputValue}
                                    onChange={(event) => onChange('pageColor', normalizeHexColor(event.target.value))}
                                    className='h-11 w-16 cursor-pointer rounded-2xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-700 dark:bg-slate-900'
                                    aria-label='Custom page color'
                                />
                                <p className='text-xs text-slate-500 dark:text-slate-400'>
                                    Adds a live tint to the article page in both scroll and EPUB views.
                                </p>
                            </div>
                        </section>

                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <div className='flex items-center justify-between gap-3'>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Typography
                                </p>
                                <span className='text-xs font-semibold text-slate-500 dark:text-slate-400'>{activeFontLabel}</span>
                            </div>
                            <div className='mt-3 grid grid-cols-3 gap-2'>
                                {fontOptions.map((option) => {
                                    const isActive = settings.fontFamily === option.id;
                                    return (
                                        <button
                                            key={option.id}
                                            type='button'
                                            onClick={() => onChange('fontFamily', option.id)}
                                            className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                            }`}
                                            style={option.style}
                                            aria-pressed={isActive}
                                        >
                                            {option.label}
                                        </button>
                                    );
                                })}
                            </div>
                            <div className='mt-4 space-y-3'>
                                <div className='flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                    <span>Font size</span>
                                    <span>{settings.fontSize}px</span>
                                </div>
                                <div className='grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => adjustValue('fontSize', -1, 14, 26)}
                                        disabled={settings.fontSize <= 14}
                                        className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                        aria-label='Decrease font size'
                                    >
                                        A-
                                    </button>
                                    <input
                                        type='range'
                                        min='14'
                                        max='26'
                                        step='1'
                                        value={settings.fontSize}
                                        onChange={(event) => onChange('fontSize', clampNumber(Number(event.target.value), 14, 26))}
                                        className='w-full accent-sky-500'
                                        aria-label='Font size'
                                    />
                                    <button
                                        type='button'
                                        onClick={() => adjustValue('fontSize', 1, 14, 26)}
                                        disabled={settings.fontSize >= 26}
                                        className='rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                        aria-label='Increase font size'
                                    >
                                        A+
                                    </button>
                                </div>
                            </div>
                        </section>

                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                Spacing and light
                            </p>
                            <div className='mt-3 space-y-4'>
                                <div className='space-y-2'>
                                    <div className='flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Line height</span>
                                        <span>{settings.lineHeight.toFixed(2)}</span>
                                    </div>
                                    <input
                                        type='range'
                                        min='1.3'
                                        max='2.3'
                                        step='0.05'
                                        value={settings.lineHeight}
                                        onChange={(event) => onChange('lineHeight', Number(clampNumber(Number(event.target.value), 1.3, 2.3).toFixed(2)))}
                                        className='w-full accent-sky-500'
                                        aria-label='Line height'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <div className='flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Paragraph spacing</span>
                                        <span>{settings.paragraphSpacing.toFixed(2)}em</span>
                                    </div>
                                    <input
                                        type='range'
                                        min='0.75'
                                        max='2'
                                        step='0.05'
                                        value={settings.paragraphSpacing}
                                        onChange={(event) => onChange('paragraphSpacing', Number(clampNumber(Number(event.target.value), 0.75, 2).toFixed(2)))}
                                        className='w-full accent-sky-500'
                                        aria-label='Paragraph spacing'
                                    />
                                </div>
                                <div className='space-y-2'>
                                    <div className='flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Brightness</span>
                                        <span>{Math.round(settings.brightness * 100)}%</span>
                                    </div>
                                    <input
                                        type='range'
                                        min='0.6'
                                        max='1.4'
                                        step='0.05'
                                        value={settings.brightness}
                                        onChange={(event) => onChange('brightness', Number(clampNumber(Number(event.target.value), 0.6, 1.4).toFixed(2)))}
                                        className='w-full accent-sky-500'
                                        aria-label='Brightness'
                                    />
                                </div>
                            </div>
                        </section>

                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                Layout
                            </p>
                            <div className='mt-3 space-y-4'>
                                <div>
                                    <div className='mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Reader layout</span>
                                        <span className='text-xs text-slate-500 dark:text-slate-400'>{activeLayoutLabel}</span>
                                    </div>
                                    <div className='grid gap-2 sm:grid-cols-3'>
                                        {layoutPresetOptions.map((option) => {
                                            const isActive = activeLayoutPreset?.id === option.id;
                                            const previewWidthClass = option.settings.pageWidth === 'spacious'
                                                ? 'mx-0'
                                                : option.settings.pageWidth === 'comfortable'
                                                    ? 'mx-2'
                                                    : 'mx-4';
                                            const previewMarginClass = option.settings.pageMargin === 'narrow'
                                                ? 'w-[88%]'
                                                : option.settings.pageMargin === 'medium'
                                                    ? 'w-[74%]'
                                                    : 'w-[60%]';

                                            return (
                                                <button
                                                    key={option.id}
                                                    type='button'
                                                    onClick={() => applyLayoutPreset(option.settings)}
                                                    className={`rounded-3xl border px-3 py-3 text-left transition ${
                                                        isActive
                                                            ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                                    }`}
                                                    aria-pressed={isActive}
                                                >
                                                    <div className='rounded-2xl border border-slate-200/80 bg-slate-50/85 p-2 dark:border-slate-700/80 dark:bg-slate-950/60'>
                                                        <div className={`rounded-xl bg-white/95 px-2 py-2 shadow-sm dark:bg-slate-900/95 ${previewWidthClass}`}>
                                                            <div className={`mx-auto space-y-1 ${previewMarginClass}`}>
                                                                <span className='block h-1.5 rounded-full bg-slate-300 dark:bg-slate-600' />
                                                                <span className='block h-1.5 rounded-full bg-slate-300/90 dark:bg-slate-600/90' />
                                                                <span className={`block h-1.5 rounded-full bg-slate-300/75 dark:bg-slate-600/75 ${option.settings.textAlign === 'justify' ? 'w-full' : 'w-4/5'}`} />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className='mt-3'>
                                                        <p className='text-sm font-semibold'>{option.label}</p>
                                                        <p className='mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400'>
                                                            {option.description}
                                                        </p>
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className='mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Column width</span>
                                        <span className='text-xs text-slate-500 dark:text-slate-400'>{settings.pageWidth}</span>
                                    </div>
                                    <div className='grid grid-cols-3 gap-2'>
                                        {widthOptions.map((option) => {
                                            const isActive = settings.pageWidth === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type='button'
                                                    onClick={() => onChange('pageWidth', option.id)}
                                                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                                        isActive
                                                            ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                                    }`}
                                                    aria-pressed={isActive}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className='mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Page margins</span>
                                        <span className='text-xs text-slate-500 dark:text-slate-400'>{activeMarginLabel}</span>
                                    </div>
                                    <div className='grid grid-cols-3 gap-2'>
                                        {marginOptions.map((option) => {
                                            const isActive = settings.pageMargin === option.id;

                                            return (
                                                <button
                                                    key={option.id}
                                                    type='button'
                                                    onClick={() => onChange('pageMargin', option.id)}
                                                    className={`rounded-2xl border px-3 py-3 text-center transition ${
                                                        isActive
                                                            ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                                    }`}
                                                    aria-pressed={isActive}
                                                >
                                                    <div className='mx-auto mb-2 flex h-10 w-full max-w-[4.75rem] items-center justify-center rounded-xl bg-slate-200/70 dark:bg-slate-800/70'>
                                                        <div
                                                            className={`h-7 rounded-lg bg-white shadow-sm dark:bg-slate-900 ${
                                                                option.id === 'narrow'
                                                                    ? 'w-[88%]'
                                                                    : option.id === 'medium'
                                                                        ? 'w-[72%]'
                                                                        : 'w-[56%]'
                                                            }`}
                                                        />
                                                    </div>
                                                    <p className='text-sm font-semibold'>{option.label}</p>
                                                    <p className='mt-1 text-[11px] leading-4 text-slate-500 dark:text-slate-400'>
                                                        {option.description}
                                                    </p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div>
                                    <div className='mb-2 flex items-center justify-between gap-3 text-sm font-medium text-slate-700 dark:text-slate-200'>
                                        <span>Alignment</span>
                                        <span className='text-xs text-slate-500 dark:text-slate-400'>{settings.textAlign}</span>
                                    </div>
                                    <div className='grid grid-cols-2 gap-2'>
                                        {alignmentOptions.map((option) => {
                                            const isActive = settings.textAlign === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type='button'
                                                    onClick={() => onChange('textAlign', option.id)}
                                                    className={`rounded-2xl border px-3 py-2 text-sm font-semibold transition ${
                                                        isActive
                                                            ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                            : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                                    }`}
                                                    aria-pressed={isActive}
                                                >
                                                    {option.label}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20 lg:col-span-2'>
                            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                Reader tools
                            </p>
                            <div className='mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-4'>
                                {readingToolOptions.map(({ id, label, Icon }) => {
                                    const isActive = Boolean(settings[id]);
                                    return (
                                        <button
                                            key={id}
                                            type='button'
                                            onClick={() => toggleSetting(id)}
                                            className={`flex items-center justify-center gap-2 rounded-2xl border px-4 py-3 text-sm font-semibold transition ${
                                                isActive
                                                    ? 'border-sky-300 bg-sky-50 text-sky-700 shadow-sm dark:border-sky-500/60 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                            }`}
                                            aria-pressed={isActive}
                                        >
                                            <Icon className='h-4 w-4' aria-hidden='true' />
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                        </section>
                    </div>

                    <div className='flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50/75 px-4 py-3 dark:border-slate-700 dark:bg-slate-900/40'>
                        <p className='text-sm text-slate-600 dark:text-slate-300'>
                            Changes apply immediately to the article body and EPUB reader.
                        </p>
                        <button
                            type='button'
                            onClick={onReset}
                            className='rounded-full bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-sky-500/20 transition hover:shadow-xl'
                        >
                            Reset display
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}

PostDisplaySettingsWindow.propTypes = {
    settings: PropTypes.shape({
        brightness: PropTypes.number,
        fontFamily: PropTypes.string,
        fontSize: PropTypes.number,
        fontWeight: PropTypes.number,
        highContrast: PropTypes.bool,
        hideImages: PropTypes.bool,
        letterSpacing: PropTypes.number,
        lineHeight: PropTypes.number,
        pageColor: PropTypes.string,
        pageMargin: PropTypes.string,
        pageWidth: PropTypes.string,
        paragraphSpacing: PropTypes.number,
        readingGuide: PropTypes.bool,
        textAlign: PropTypes.string,
        theme: PropTypes.string,
        wordSpacing: PropTypes.number,
    }).isRequired,
    onChange: PropTypes.func.isRequired,
    onReset: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};
