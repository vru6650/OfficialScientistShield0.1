import {
    DEFAULT_CUSTOM_ACCENT,
    resolveThemeAccent,
} from '../utils/themeAccent.js';
import {
    DEFAULT_THEME_MODE,
    sanitizeThemeMode,
} from '../utils/themeMode.js';
import {
    DEFAULT_ACCENT_PRESET,
    DEFAULT_SURFACE_PRESET,
    DEFAULT_WALLPAPER_MODE,
    WALLPAPER_MODES,
    resolveAccentPresetKey,
    resolveSurfacePresetKey,
} from './themePresets.js';

export const UI_EFFECTS_STORAGE_KEY = 'ui.effects.v1';
export const UI_EFFECTS_CHANGED_EVENT = 'ui-effects-changed';

export const DEFAULT_EFFECTS = Object.freeze({
    brightness: 1,
    contrast: 1,
    veil: 0,
    reduceMotion: false,
    themeMode: DEFAULT_THEME_MODE,
    surfacePreset: DEFAULT_SURFACE_PRESET,
    accentPreset: DEFAULT_ACCENT_PRESET,
    customAccent: DEFAULT_CUSTOM_ACCENT,
    wallpaperMode: DEFAULT_WALLPAPER_MODE,
});

const clampNumber = (value, min, max) => {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue)) {
        return null;
    }

    return Math.min(Math.max(numericValue, min), max);
};

const sanitizeBoolean = (value) => value === true;

export const sanitizeUiEffects = (value = {}) => {
    const source = typeof value === 'object' && value !== null ? value : {};
    const merged = { ...DEFAULT_EFFECTS, ...source };

    return {
        brightness:
            clampNumber(merged.brightness, 0.4, 1.6) ?? DEFAULT_EFFECTS.brightness,
        contrast:
            clampNumber(merged.contrast, 0.6, 1.6) ?? DEFAULT_EFFECTS.contrast,
        veil: clampNumber(merged.veil, 0, 1) ?? DEFAULT_EFFECTS.veil,
        reduceMotion: sanitizeBoolean(merged.reduceMotion),
        themeMode: sanitizeThemeMode(merged.themeMode),
        surfacePreset: resolveSurfacePresetKey(merged.surfacePreset),
        accentPreset: resolveAccentPresetKey(merged.accentPreset),
        customAccent: resolveThemeAccent(
            merged.customAccent,
            DEFAULT_EFFECTS.customAccent
        ),
        wallpaperMode: WALLPAPER_MODES.includes(merged.wallpaperMode)
            ? merged.wallpaperMode
            : DEFAULT_EFFECTS.wallpaperMode,
    };
};

export const mergeUiEffects = (currentValue, patchValue) => {
    const safePatch =
        typeof patchValue === 'object' && patchValue !== null ? patchValue : {};

    return sanitizeUiEffects({ ...currentValue, ...safePatch });
};

export const readUiEffects = () => {
    if (typeof window === 'undefined') {
        return { ...DEFAULT_EFFECTS };
    }

    try {
        const parsed = JSON.parse(
            window.localStorage.getItem(UI_EFFECTS_STORAGE_KEY) || 'null'
        );
        if (parsed && typeof parsed === 'object') {
            return sanitizeUiEffects(parsed);
        }
    } catch {
        // fall back to defaults
    }

    return { ...DEFAULT_EFFECTS };
};

export const dispatchUiEffectsChanged = () => {
    if (typeof window === 'undefined') {
        return;
    }

    window.dispatchEvent(new Event(UI_EFFECTS_CHANGED_EVENT));
};

export const saveUiEffects = (value) => {
    const sanitized = sanitizeUiEffects(value);

    if (typeof window !== 'undefined') {
        try {
            window.localStorage.setItem(
                UI_EFFECTS_STORAGE_KEY,
                JSON.stringify(sanitized)
            );
        } catch {
            // ignore storage errors
        }

        dispatchUiEffectsChanged();
    }

    return sanitized;
};

export const updateUiEffects = (patchOrUpdater) => {
    const current = readUiEffects();
    const patch =
        typeof patchOrUpdater === 'function'
            ? patchOrUpdater(current)
            : patchOrUpdater;

    return saveUiEffects(mergeUiEffects(current, patch));
};

export const readReduceMotionPreference = () => {
    if (typeof window === 'undefined') {
        return false;
    }

    let systemReduceMotion = false;

    try {
        systemReduceMotion = window.matchMedia(
            '(prefers-reduced-motion: reduce)'
        ).matches;
    } catch {
        systemReduceMotion = false;
    }

    return systemReduceMotion || Boolean(readUiEffects().reduceMotion);
};
