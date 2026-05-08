import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowPathRoundedSquare,
    HiOutlineBolt,
    HiOutlineCog6Tooth,
    HiOutlineCursorArrowRays,
    HiOutlineDevicePhoneMobile,
    HiOutlineLink,
    HiOutlinePhoto,
    HiOutlineSparkles,
    HiOutlineSwatch,
    HiOutlineWifi,
    HiOutlineXMark,
} from 'react-icons/hi2';
import settingsIcon from '../../assets/dock/settings.svg';
import { deriveCustomAccentPreset, normalizeThemeAccent } from '../../utils/themeAccent.js';
import ThemeToggle from '../ThemeToggle.jsx';
import { useTheme } from '../ThemeContext.jsx';

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const DOCK_CUSTOM_ICON_STORAGE_KEY = 'dock.customIcons.v1';
const SETTINGS_ICON_WHITESUR = '/icons/whitesur/settings.svg';

export default function ControlCenter({
    open,
    effects,
    focusMode,
    surfacePreset,
    onClose,
    onChangeEffects,
    onToggleFocusMode,
    surfacePresets,
    accentPreset,
    customAccent,
    wallpaperMode,
    accentPresets,
    wallpaperOptions,
    onSelectSurfacePreset,
    onSelectAccentPreset,
    onApplyCustomAccent,
    onResetCustomAccent,
    onSelectWallpaperMode,
    onOpenMissionControl,
    onOpenQuickLook,
    onOpenWindowSwitcher,
    onDuplicateWindow,
    onApplyWindowLayout,
}) {
    const { themeMode, resolvedTheme, systemTheme } = useTheme();
    const [settingsIconChoice, setSettingsIconChoice] = useState('default');
    const [settingsIconInput, setSettingsIconInput] = useState('');
    const [settingsIconPreview, setSettingsIconPreview] = useState(settingsIcon);
    const [customAccentInput, setCustomAccentInput] = useState(customAccent);
    const brightness = clamp(Number(effects?.brightness ?? 1), 0.4, 1.6);
    const contrast = clamp(Number(effects?.contrast ?? 1), 0.6, 1.6);
    const veil = clamp(Number(effects?.veil ?? 0), 0, 0.75);
    const reduceMotion = Boolean(effects?.reduceMotion);
    const selectedSurfacePreset = useMemo(
        () => surfacePresets.find((preset) => preset.key === surfacePreset) || surfacePresets[0] || null,
        [surfacePreset, surfacePresets]
    );
    const selectedWallpaperOption = useMemo(
        () => wallpaperOptions.find((option) => option.key === wallpaperMode) || wallpaperOptions[0] || null,
        [wallpaperMode, wallpaperOptions]
    );
    const appearanceSummary = selectedSurfacePreset?.label || 'Hybrid Glass';
    const appearanceBadgeLabel = `${appearanceSummary} surface`;
    const themeSummary = useMemo(() => {
        if (themeMode === 'system') {
            return `System theme (${systemTheme} now)`;
        }

        return resolvedTheme === 'dark' ? 'Dark mode' : 'Light mode';
    }, [resolvedTheme, systemTheme, themeMode]);
    const themeBadgeLabel = useMemo(() => {
        if (themeMode === 'system') {
            return `Theme follows system (${systemTheme})`;
        }

        return `${resolvedTheme === 'dark' ? 'Dark' : 'Light'} theme active`;
    }, [resolvedTheme, systemTheme, themeMode]);
    const customAccentPreset = useMemo(
        () => deriveCustomAccentPreset(customAccent),
        [customAccent]
    );
    const normalizedCustomAccent = useMemo(
        () => normalizeThemeAccent(customAccentInput),
        [customAccentInput]
    );
    const accentSwatches = useMemo(
        () => [
            ...accentPresets,
            {
                ...customAccentPreset,
                mood:
                    accentPreset === 'custom'
                        ? `Live ${customAccent.toUpperCase()}`
                        : 'Create your own hue',
            },
        ],
        [accentPreset, accentPresets, customAccent, customAccentPreset]
    );
    const customAccentDirty = Boolean(
        normalizedCustomAccent &&
            (normalizedCustomAccent !== customAccent || accentPreset !== 'custom')
    );

    const statusLabel = useMemo(() => {
        const focus = focusMode ? 'Focus on' : 'Focus off';
        const motion = reduceMotion ? 'Motion reduced' : 'Motion fluid';
        const wallpaper = selectedWallpaperOption?.label || 'Dynamic';
        return `${focus} • ${motion} • ${themeSummary} • ${appearanceSummary} • ${wallpaper} wallpaper`;
    }, [appearanceSummary, focusMode, reduceMotion, selectedWallpaperOption?.label, themeSummary]);

    useEffect(() => {
        setCustomAccentInput(customAccent);
    }, [customAccent]);

    const quickToggleItems = useMemo(
        () => [
            {
                key: 'focus',
                label: 'Focus Mode',
                sub: focusMode ? 'Active' : 'Off',
                icon: HiOutlineCursorArrowRays,
                active: focusMode,
                onClick: onToggleFocusMode,
            },
            {
                key: 'motion',
                label: 'Motion',
                sub: reduceMotion ? 'Reduced' : 'Fluid',
                icon: HiOutlineBolt,
                active: reduceMotion,
                onClick: () => onChangeEffects({ ...effects, reduceMotion: !reduceMotion }),
            },
        ],
        [effects, focusMode, onChangeEffects, onToggleFocusMode, reduceMotion]
    );

    const syncSettingsIcon = useCallback(() => {
        if (typeof window === 'undefined') {
            setSettingsIconChoice('default');
            setSettingsIconPreview(settingsIcon);
            setSettingsIconInput('');
            return;
        }
        try {
            const parsed = JSON.parse(localStorage.getItem(DOCK_CUSTOM_ICON_STORAGE_KEY) || 'null');
            const stored = parsed?.settings;
            if (typeof stored === 'string' && stored.trim()) {
                const value = stored.trim();
                const mode = value === SETTINGS_ICON_WHITESUR ? 'whitesur' : 'custom';
                setSettingsIconChoice(mode);
                setSettingsIconPreview(value);
                setSettingsIconInput(value);
                return;
            }
        } catch {
            // fall through to default
        }
        setSettingsIconChoice('default');
        setSettingsIconPreview(settingsIcon);
        setSettingsIconInput('');
    }, []);

    useEffect(() => {
        syncSettingsIcon();
        if (typeof window === 'undefined') return undefined;
        window.addEventListener('dock:icons-changed', syncSettingsIcon);
        window.addEventListener('storage', syncSettingsIcon);
        return () => {
            window.removeEventListener('dock:icons-changed', syncSettingsIcon);
            window.removeEventListener('storage', syncSettingsIcon);
        };
    }, [syncSettingsIcon]);

    const persistSettingsIcon = useCallback((value) => {
        if (typeof window === 'undefined') return;
        try {
            const parsed = JSON.parse(localStorage.getItem(DOCK_CUSTOM_ICON_STORAGE_KEY) || 'null') || {};
            const next = { ...parsed };
            if (!value) {
                delete next.settings;
            } else {
                next.settings = value;
            }
            const serialized = Object.keys(next).length ? JSON.stringify(next) : null;
            if (serialized) {
                localStorage.setItem(DOCK_CUSTOM_ICON_STORAGE_KEY, serialized);
            } else {
                localStorage.removeItem(DOCK_CUSTOM_ICON_STORAGE_KEY);
            }
        } catch {
            if (value) {
                localStorage.setItem(DOCK_CUSTOM_ICON_STORAGE_KEY, JSON.stringify({ settings: value }));
            } else {
                localStorage.removeItem(DOCK_CUSTOM_ICON_STORAGE_KEY);
            }
        }
        window.dispatchEvent(new Event('dock:icons-changed'));
    }, []);

    const applySettingsIcon = useCallback(
        (mode) => {
            if (mode === 'default') {
                setSettingsIconChoice('default');
                setSettingsIconPreview(settingsIcon);
                setSettingsIconInput('');
                persistSettingsIcon(null);
                return;
            }
            if (mode === 'whitesur') {
                setSettingsIconChoice('whitesur');
                setSettingsIconPreview(SETTINGS_ICON_WHITESUR);
                setSettingsIconInput(SETTINGS_ICON_WHITESUR);
                persistSettingsIcon(SETTINGS_ICON_WHITESUR);
                return;
            }
            setSettingsIconChoice('custom');
        },
        [persistSettingsIcon]
    );

    const applyCustomSettingsIcon = useCallback(() => {
        const trimmed = settingsIconInput.trim();
        if (!trimmed) return;
        setSettingsIconChoice('custom');
        setSettingsIconPreview(trimmed);
        persistSettingsIcon(trimmed);
    }, [persistSettingsIcon, settingsIconInput]);

    const settingsIconLabel = useMemo(() => {
        if (settingsIconChoice === 'whitesur') return 'WhiteSur gear';
        if (settingsIconChoice === 'custom') return 'Custom image';
        return 'Default glass gear';
    }, [settingsIconChoice]);

    const handleCustomAccentHexChange = useCallback((event) => {
        const rawValue = event.target.value.replace(/[^#0-9a-f]/gi, '');
        if (!rawValue) {
            setCustomAccentInput('');
            return;
        }

        const prefixedValue = rawValue.startsWith('#') ? rawValue : `#${rawValue}`;
        setCustomAccentInput(`#${prefixedValue.slice(1, 7)}`.toLowerCase());
    }, []);

    if (!open) return null;

    return (
        <div className="fixed right-4 top-16 z-[80] w-full max-w-xl">
            <div className="macos-control-center shadow-xl shadow-slate-900/10">
                <div className="macos-control-center__hero">
                    <div className="macos-control-center__hero-copy">
                        <div className="macos-control-center__hero-topline">
                            <p className="macos-control-center__eyebrow">Control Center</p>
                            <span className="macos-control-center__pill macos-control-center__pill--accent macos-control-center__pill--mini">Live</span>
                        </div>
                        <p className="macos-control-center__headline">{statusLabel}</p>
                        <div className="macos-control-center__hero-badges">
                            <span className="macos-control-center__hero-badge">
                                <HiOutlineCursorArrowRays className="h-4 w-4" />
                                {focusMode ? 'Focus on' : 'Focus off'}
                            </span>
                            <span className="macos-control-center__hero-badge">
                                <HiOutlineSparkles className="h-4 w-4" />
                                {themeMode === 'system' ? `System ${systemTheme}` : `${resolvedTheme} mode`}
                            </span>
                            <span className="macos-control-center__hero-badge">
                                <HiOutlineSwatch className="h-4 w-4" />
                                {appearanceBadgeLabel}
                            </span>
                        </div>
                    </div>
                    <div className="macos-control-center__hero-actions">
                        <button
                            type="button"
                            onClick={onOpenMissionControl}
                            className="macos-control-center__icon-btn"
                            aria-label="Open Mission Control"
                        >
                            <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={onOpenQuickLook} className="macos-control-center__icon-btn" aria-label="Open Quick Look">
                            <HiOutlineSparkles className="h-5 w-5" />
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="macos-control-center__icon-btn macos-control-center__icon-btn--ghost"
                            aria-label="Close Control Center"
                        >
                            <HiOutlineXMark className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="macos-control-center__body">
                    <section className="macos-control-center__section">
                        <header className="macos-control-center__section-head">
                            <div>
                                <p className="macos-control-center__section-title">System overview</p>
                                <p className="macos-control-center__section-sub">Presence, spaces, and live status</p>
                            </div>
                            <span className="macos-control-center__section-meta">Workspace status</span>
                        </header>
                        <div className="macos-control-center__status-row" aria-label="Active settings">
                            <span className="macos-control-center__pill">{themeBadgeLabel}</span>
                            <span className="macos-control-center__pill macos-control-center__pill--accent">{appearanceSummary} surface</span>
                            <span className="macos-control-center__pill">Brightness {Math.round(brightness * 100)}%</span>
                            <span className="macos-control-center__pill">Contrast {Math.round(contrast * 100)}%</span>
                        </div>
                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Quick Toggles</p>
                                        <p className="macos-control-center__tile-sub">Presence and motion</p>
                                    </div>
                                    <HiOutlineAdjustmentsHorizontal className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="macos-control-center__quick-grid">
                                    {quickToggleItems.map((item) => (
                                        <button
                                            key={item.key}
                                            type="button"
                                            onClick={item.onClick}
                                            aria-pressed={item.active}
                                            className={`macos-control-center__quick ${item.active ? 'macos-control-center__quick--active' : ''}`}
                                        >
                                            <span className="macos-control-center__quick-icon">
                                                <item.icon className="h-5 w-5" />
                                            </span>
                                            <div className="macos-control-center__quick-text">
                                                <span className="macos-control-center__quick-label">{item.label}</span>
                                                <span className="macos-control-center__quick-sub">{item.sub}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Windows & Spaces</p>
                                        <p className="macos-control-center__tile-sub">Switchers and previews</p>
                                    </div>
                                    <HiOutlineArrowPathRoundedSquare className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="macos-control-center__chip-row">
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onOpenWindowSwitcher(1)}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Cycle windows
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={onDuplicateWindow}>
                                        <HiOutlineSparkles className="h-4 w-4" />
                                        New window
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={onOpenMissionControl}>
                                        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                                        Mission Control
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={onOpenQuickLook}>
                                        <HiOutlineSparkles className="h-4 w-4" />
                                        Quick Look
                                    </button>
                                </div>
                                <p className="macos-control-center__meta">Keep windows tidy with Mission Control or preview the topmost window with Quick Look.</p>
                            </div>
                        </div>
                    </section>

                    <section className="macos-control-center__section">
                        <header className="macos-control-center__section-head">
                            <div>
                                <p className="macos-control-center__section-title">Display & Focus</p>
                                <p className="macos-control-center__section-sub">Focus, motion, and screen tuning</p>
                            </div>
                            <span className="macos-control-center__section-meta">Fine control</span>
                        </header>
                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Focus</p>
                                        <p className="macos-control-center__tile-sub">{focusMode ? 'On' : 'Off'}</p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={onToggleFocusMode}
                                        className={`macos-chip ${focusMode ? 'macos-chip--active' : ''}`}
                                    >
                                        <HiOutlineCursorArrowRays className="h-4 w-4 macos-chip__dot" />
                                        {focusMode ? 'Disable' : 'Enable'}
                                    </button>
                                </div>
                                <div className="macos-control-center__chip-row">
                                    <button
                                        type="button"
                                        className={`macos-control-center__chip ${reduceMotion ? 'macos-control-center__chip--active' : 'macos-control-center__chip--ghost'}`}
                                        onClick={() => onChangeEffects({ ...effects, reduceMotion: !reduceMotion })}
                                    >
                                        <HiOutlineBolt className="h-4 w-4" />
                                        Motion
                                    </button>
                                </div>
                            </div>

                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Screen & Sound</p>
                                        <p className="macos-control-center__tile-sub">Brightness, contrast, veil</p>
                                    </div>
                                    <HiOutlineSparkles className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="space-y-3">
                                    <div className="macos-control-center__slider">
                                        <div className="macos-control-center__slider-label">
                                            <span>Brightness</span>
                                            <span className="macos-control-center__slider-value">{Math.round(brightness * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="40"
                                            max="160"
                                            value={Math.round(brightness * 100)}
                                            onChange={(e) => onChangeEffects({ ...effects, brightness: Number(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <div className="macos-control-center__slider">
                                        <div className="macos-control-center__slider-label">
                                            <span>Contrast</span>
                                            <span className="macos-control-center__slider-value">{Math.round(contrast * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="60"
                                            max="160"
                                            value={Math.round(contrast * 100)}
                                            onChange={(e) => onChangeEffects({ ...effects, contrast: Number(e.target.value) / 100 })}
                                        />
                                    </div>
                                    <div className="macos-control-center__slider">
                                        <div className="macos-control-center__slider-label">
                                            <span>Focus veil</span>
                                            <span className="macos-control-center__slider-value">{Math.round(veil * 100)}%</span>
                                        </div>
                                        <input
                                            type="range"
                                            min="0"
                                            max="75"
                                            value={Math.round(veil * 100)}
                                            onChange={(e) => onChangeEffects({ ...effects, veil: Number(e.target.value) / 100 })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="macos-control-center__section">
                        <header className="macos-control-center__section-head">
                            <div>
                                <p className="macos-control-center__section-title">Personalization</p>
                                <p className="macos-control-center__section-sub">Theme, accent, and wallpaper pairings</p>
                            </div>
                            <span className="macos-control-center__section-meta">Your vibe</span>
                        </header>
                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <ThemeToggle
                                    themeMode={themeMode}
                                    resolvedTheme={resolvedTheme}
                                    systemTheme={systemTheme}
                                    reduceMotion={reduceMotion}
                                    onChange={(mode) => onChangeEffects({ themeMode: mode })}
                                />
                            </div>
                        </div>
                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Surface & Accent</p>
                                        <p className="macos-control-center__tile-sub">Surface style, accent, and highlight</p>
                                    </div>
                                    <HiOutlineSwatch className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="macos-control-center__surface-grid" role="group" aria-label="Surface style">
                                    {surfacePresets.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            className={`macos-control-center__surface ${
                                                surfacePreset === preset.key ? 'macos-control-center__surface--active' : ''
                                            }`}
                                            onClick={() => onSelectSurfacePreset(preset.key)}
                                            aria-pressed={surfacePreset === preset.key}
                                        >
                                            <span className={`macos-control-center__surface-preview macos-control-center__surface-preview--${preset.key}`} />
                                            <span className="macos-control-center__surface-label">{preset.label}</span>
                                            {preset.helper ? (
                                                <span className="macos-control-center__surface-sub">{preset.helper}</span>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                                <div className="macos-control-center__swatches" role="group" aria-label="Accent color">
                                    {accentSwatches.map((preset) => (
                                        <button
                                            key={preset.key}
                                            type="button"
                                            className={`macos-control-center__swatch ${accentPreset === preset.key ? 'macos-control-center__swatch--active' : ''}`}
                                            onClick={() =>
                                                preset.key === 'custom'
                                                    ? onApplyCustomAccent(normalizedCustomAccent || customAccent)
                                                    : onSelectAccentPreset(preset.key)
                                            }
                                            aria-pressed={accentPreset === preset.key}
                                        >
                                            <span
                                                className="macos-control-center__swatch-dot"
                                                style={{
                                                    background: preset.gradient || 'var(--color-accent-gradient, linear-gradient(135deg, #0A84FF, #38BDF8))',
                                                }}
                                            />
                                            <div className="macos-control-center__swatch-text">
                                                <span className="macos-control-center__swatch-label">{preset.label}</span>
                                                <span className="macos-control-center__swatch-sub">
                                                    {preset.mood || (preset.key === 'system' ? 'Follow active app' : 'Static accent')}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                                <div className="macos-control-center__accent-lab">
                                    <div className="macos-control-center__accent-lab-head">
                                        <div>
                                            <p className="macos-control-center__accent-lab-title">Accent Studio</p>
                                            <p className="macos-control-center__accent-lab-sub">
                                                {accentPreset === 'custom'
                                                    ? `Custom accent live at ${customAccent.toUpperCase()}.`
                                                    : 'Build a personal accent and apply it instantly.'}
                                            </p>
                                        </div>
                                        <span className={`macos-control-center__pill ${accentPreset === 'custom' ? 'macos-control-center__pill--accent' : ''}`}>
                                            {accentPreset === 'custom' ? 'Custom live' : 'Preset active'}
                                        </span>
                                    </div>
                                    <div className="macos-control-center__accent-lab-grid">
                                        <label className="macos-control-center__accent-field">
                                            <span className="macos-control-center__accent-field-label">Color</span>
                                            <div className="macos-control-center__accent-picker">
                                                <input
                                                    type="color"
                                                    value={normalizedCustomAccent || customAccent}
                                                    onChange={(event) => setCustomAccentInput(event.target.value)}
                                                    aria-label="Pick a custom accent color"
                                                    className="macos-control-center__accent-color-input"
                                                />
                                                <span
                                                    className="macos-control-center__accent-preview"
                                                    style={{ background: customAccentPreset.gradient }}
                                                    aria-hidden="true"
                                                />
                                            </div>
                                        </label>
                                        <label className="macos-control-center__accent-field">
                                            <span className="macos-control-center__accent-field-label">Hex</span>
                                            <input
                                                type="text"
                                                inputMode="text"
                                                value={customAccentInput}
                                                onChange={handleCustomAccentHexChange}
                                                placeholder="#7c8cff"
                                                aria-label="Custom accent hex color"
                                                className="macos-control-center__accent-hex-input"
                                            />
                                        </label>
                                    </div>
                                    <div className="macos-control-center__chip-row">
                                        <button
                                            type="button"
                                            className={`macos-control-center__chip ${customAccentDirty ? 'macos-control-center__chip--active' : 'macos-control-center__chip--ghost'}`}
                                            onClick={() => {
                                                if (!normalizedCustomAccent) return;
                                                onApplyCustomAccent(normalizedCustomAccent);
                                            }}
                                            disabled={!normalizedCustomAccent}
                                        >
                                            <HiOutlineSparkles className="h-4 w-4" />
                                            Apply custom
                                        </button>
                                        <button
                                            type="button"
                                            className="macos-control-center__chip macos-control-center__chip--ghost"
                                            onClick={onResetCustomAccent}
                                        >
                                            <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                            Reset accent
                                        </button>
                                    </div>
                                    <p className="macos-control-center__accent-lab-meta">
                                        Custom accents generate a matching strong shade and highlight gradient automatically.
                                    </p>
                                </div>
                            </div>
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Wallpaper</p>
                                        <p className="macos-control-center__tile-sub">Dynamic gradients</p>
                                    </div>
                                    <HiOutlinePhoto className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="macos-control-center__chip-row">
                                    {wallpaperOptions.map((option) => (
                                        <button
                                            key={option.key}
                                            type="button"
                                            className={`macos-control-center__chip macos-control-center__chip--stacked ${
                                                wallpaperMode === option.key ? 'macos-control-center__chip--active' : 'macos-control-center__chip--ghost'
                                            }`}
                                            aria-pressed={wallpaperMode === option.key}
                                            onClick={() => onSelectWallpaperMode(option.key)}
                                        >
                                            <span className="macos-control-center__chip-label">{option.label}</span>
                                            {option.helper ? (
                                                <span className="macos-control-center__chip-subtext">{option.helper}</span>
                                            ) : null}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Dock settings icon</p>
                                        <p className="macos-control-center__tile-sub">{settingsIconLabel}</p>
                                    </div>
                                    <HiOutlineCog6Tooth className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/30 bg-white/70 shadow-sm dark:border-white/10 dark:bg-white/5">
                                            <img
                                                src={settingsIconPreview}
                                                alt="Settings icon preview"
                                                className="h-9 w-9 select-none object-contain drop-shadow-sm"
                                                draggable={false}
                                            />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <button
                                                type="button"
                                                className={`macos-control-center__chip ${
                                                    settingsIconChoice === 'default'
                                                        ? 'macos-control-center__chip--active'
                                                        : 'macos-control-center__chip--ghost'
                                                }`}
                                                aria-pressed={settingsIconChoice === 'default'}
                                                onClick={() => applySettingsIcon('default')}
                                            >
                                                Default
                                            </button>
                                            <button
                                                type="button"
                                                className={`macos-control-center__chip ${
                                                    settingsIconChoice === 'whitesur'
                                                        ? 'macos-control-center__chip--active'
                                                        : 'macos-control-center__chip--ghost'
                                                }`}
                                                aria-pressed={settingsIconChoice === 'whitesur'}
                                                onClick={() => applySettingsIcon('whitesur')}
                                            >
                                                WhiteSur
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                                            Custom icon URL
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            <div className="min-w-[220px] flex-1">
                                                <div className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/70 px-3 py-2 text-sm text-slate-700 shadow-sm focus-within:ring-2 focus-within:ring-sky-400/60 dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-100">
                                                    <HiOutlineLink className="h-4 w-4 text-slate-400 dark:text-slate-500" />
                                                    <input
                                                        type="url"
                                                        value={settingsIconInput}
                                                        onChange={(event) => setSettingsIconInput(event.target.value)}
                                                        placeholder="https://cdn.example.com/icon.svg or data:image/png..."
                                                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                                                    />
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                className="macos-control-center__chip macos-control-center__chip--ghost"
                                                onClick={applyCustomSettingsIcon}
                                                disabled={!settingsIconInput.trim()}
                                            >
                                                Apply
                                            </button>
                                            <button
                                                type="button"
                                                className="macos-control-center__chip macos-control-center__chip--ghost"
                                                onClick={() => applySettingsIcon('default')}
                                            >
                                                Reset
                                            </button>
                                        </div>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                                            Works with SVG/PNG URLs or data URIs. Updates the dock instantly.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="macos-control-center__section">
                        <header className="macos-control-center__section-head">
                            <div>
                                <p className="macos-control-center__section-title">Connectivity & Layout</p>
                                <p className="macos-control-center__section-sub">Wi‑Fi and window tools</p>
                            </div>
                            <span className="macos-control-center__section-meta">Stable</span>
                        </header>
                        <div className="macos-control-center__row">
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Connectivity</p>
                                        <p className="macos-control-center__tile-sub">Wi‑Fi • Personal Hotspot</p>
                                    </div>
                                    <HiOutlineWifi className="h-5 w-5 text-emerald-500" />
                                </div>
                                <div className="macos-control-center__chip-row">
                                    <span className="macos-control-center__chip macos-control-center__chip--active">
                                        <HiOutlineWifi className="h-4 w-4" />
                                        Connected
                                    </span>
                                    <span className="macos-control-center__chip macos-control-center__chip--ghost">
                                        <HiOutlineDevicePhoneMobile className="h-4 w-4" />
                                        Personal Hotspot
                                    </span>
                                </div>
                            </div>
                            <div className="macos-control-center__tile macos-control-center__tile--column">
                                <div className="macos-control-center__tile-head">
                                    <div>
                                        <p className="macos-control-center__tile-title">Windows</p>
                                        <p className="macos-control-center__tile-sub">Switchers and previews</p>
                                    </div>
                                    <HiOutlineArrowPathRoundedSquare className="h-5 w-5 text-slate-400 dark:text-slate-300" />
                                </div>
                                <div className="macos-control-center__chip-row">
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onOpenWindowSwitcher(1)}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Cycle windows
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={onOpenMissionControl}>
                                        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                                        Mission Control
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={onOpenQuickLook}>
                                        <HiOutlineSparkles className="h-4 w-4" />
                                        Quick Look
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('full')}>
                                        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                                        Fill stage
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('center')}>
                                        <HiOutlineSparkles className="h-4 w-4" />
                                        Center
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('left')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Left split
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('right')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Right split
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('top')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Top half
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('bottom')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Bottom half
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('tl')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Top-left
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('tr')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Top-right
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('bl')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Bottom-left
                                    </button>
                                    <button type="button" className="macos-control-center__chip macos-control-center__chip--ghost" onClick={() => onApplyWindowLayout('br')}>
                                        <HiOutlineArrowPathRoundedSquare className="h-4 w-4" />
                                        Bottom-right
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="macos-control-center__footer">
                        <div className="flex items-center gap-2">
                            <span className="macos-control-center__status-dot" aria-hidden />
                            <span className="macos-control-center__footer-text">Workspace synced</span>
                        </div>
                        <span className="macos-control-center__footer-text">Designed to echo macOS Sequoia</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

ControlCenter.propTypes = {
    open: PropTypes.bool.isRequired,
    effects: PropTypes.shape({
        brightness: PropTypes.number,
        contrast: PropTypes.number,
        veil: PropTypes.number,
        reduceMotion: PropTypes.bool,
        themeMode: PropTypes.string,
        surfacePreset: PropTypes.string,
    }).isRequired,
    focusMode: PropTypes.bool.isRequired,
    surfacePreset: PropTypes.string.isRequired,
    onClose: PropTypes.func.isRequired,
    onChangeEffects: PropTypes.func.isRequired,
    onToggleFocusMode: PropTypes.func.isRequired,
    surfacePresets: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            helper: PropTypes.string,
        })
    ).isRequired,
    accentPreset: PropTypes.string.isRequired,
    customAccent: PropTypes.string.isRequired,
    wallpaperMode: PropTypes.string.isRequired,
    accentPresets: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            gradient: PropTypes.string,
            strong: PropTypes.string,
            mood: PropTypes.string,
        })
    ).isRequired,
    wallpaperOptions: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            helper: PropTypes.string,
        })
    ).isRequired,
    onSelectSurfacePreset: PropTypes.func.isRequired,
    onSelectAccentPreset: PropTypes.func.isRequired,
    onApplyCustomAccent: PropTypes.func.isRequired,
    onResetCustomAccent: PropTypes.func.isRequired,
    onSelectWallpaperMode: PropTypes.func.isRequired,
    onOpenMissionControl: PropTypes.func.isRequired,
    onOpenQuickLook: PropTypes.func.isRequired,
    onOpenWindowSwitcher: PropTypes.func.isRequired,
    onDuplicateWindow: PropTypes.func.isRequired,
    onApplyWindowLayout: PropTypes.func.isRequired,
};
