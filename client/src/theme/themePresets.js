import {
    DEFAULT_CUSTOM_ACCENT,
    deriveCustomAccentPreset,
} from '../utils/themeAccent.js';

export const DEFAULT_SURFACE_PRESET = 'hybrid';
export const DEFAULT_ACCENT_PRESET = 'system';
export const DEFAULT_WALLPAPER_MODE = 'prism';

export const SURFACE_PRESETS = Object.freeze([
    {
        key: 'hybrid',
        label: 'Hybrid Glass',
        helper: 'Layered refraction, liquid caustics, and adaptive chrome',
    },
    {
        key: 'liquid',
        label: 'Liquid Glass',
        helper: 'Fluid caustics and vibrant translucency',
    },
    {
        key: 'sequoia',
        label: 'Sequoia Frost',
        helper: 'Balanced frost with subtle chroma glow',
    },
    {
        key: 'graphite',
        label: 'Graphite Pro',
        helper: 'Neutral chrome with deeper contrast',
    },
    {
        key: 'aurora',
        label: 'Aurora Deck',
        helper: 'Polar chroma glow with a brighter cinematic edge',
    },
    {
        key: 'eclipse',
        label: 'Eclipse Studio',
        helper: 'Pearl glass by day, obsidian chrome after dark',
    },
]);

export const SURFACE_PRESET_MAP = Object.freeze(
    SURFACE_PRESETS.reduce((map, preset) => {
        map[preset.key] = preset;
        return map;
    }, {})
);

export const SURFACE_CLASS_MAP = Object.freeze({
    hybrid: 'macos-hybrid',
    liquid: 'macos-liquid',
    sequoia: 'macos-sequoia',
    graphite: 'macos-graphite',
    aurora: 'macos-aurora',
    eclipse: 'macos-eclipse',
});

export const SURFACE_CLASS_NAMES = Object.freeze(Object.values(SURFACE_CLASS_MAP));

export const LEGACY_SURFACE_PRESET_ALIASES = Object.freeze({
    'liquid-glass': 'liquid',
    'frosted-glass': 'sequoia',
});

export const resolveSurfacePresetKey = (value) => {
    if (SURFACE_PRESET_MAP[value]?.key) {
        return SURFACE_PRESET_MAP[value].key;
    }

    const legacyValue = LEGACY_SURFACE_PRESET_ALIASES[value];
    return SURFACE_PRESET_MAP[legacyValue]?.key ?? DEFAULT_SURFACE_PRESET;
};

export const ACCENT_PRESETS = Object.freeze([
    {
        key: 'system',
        label: 'App accent',
        gradient: null,
        color: '#0A84FF',
        strong: '#0064D1',
        mood: 'Matches the active workspace',
    },
    {
        key: 'blue',
        label: 'macOS Blue',
        gradient: 'linear-gradient(135deg, rgba(14,116,244,0.9), rgba(56,189,248,0.7))',
        color: '#0A84FF',
        strong: '#0369D4',
        mood: 'Classic and crisp',
    },
    {
        key: 'pink',
        label: 'Pink',
        gradient: 'linear-gradient(135deg, rgba(236,72,153,0.9), rgba(168,85,247,0.72))',
        color: '#EC4899',
        strong: '#DB2777',
        mood: 'Vivid and energetic',
    },
    {
        key: 'mint',
        label: 'Mint',
        gradient: 'linear-gradient(135deg, rgba(16,185,129,0.9), rgba(59,130,246,0.65))',
        color: '#0FB583',
        strong: '#0F766E',
        mood: 'Calm and focused',
    },
    {
        key: 'amber',
        label: 'Gold',
        gradient: 'linear-gradient(135deg, rgba(245,158,11,0.92), rgba(249,115,22,0.8))',
        color: '#F59E0B',
        strong: '#C2410C',
        mood: 'Warm and luminous',
    },
    {
        key: 'violet',
        label: 'Violet',
        gradient: 'linear-gradient(135deg, rgba(124,92,255,0.92), rgba(56,189,248,0.72))',
        color: '#7C5CFF',
        strong: '#5B3DF2',
        mood: 'Electric and cinematic',
    },
    {
        key: 'coral',
        label: 'Coral',
        gradient: 'linear-gradient(135deg, rgba(255,122,89,0.92), rgba(244,114,182,0.74))',
        color: '#FF7A59',
        strong: '#E85D3A',
        mood: 'Warm and expressive',
    },
    {
        key: 'indigo',
        label: 'Indigo',
        gradient: 'linear-gradient(135deg, rgba(99,102,241,0.92), rgba(168,85,247,0.74))',
        color: '#6366F1',
        strong: '#4338CA',
        mood: 'Deep and contemplative',
    },
    {
        key: 'graphite',
        label: 'Graphite',
        gradient: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.9))',
        color: '#111827',
        strong: '#0F172A',
        mood: 'Low-key and professional',
    },
]);

export const ACCENT_PRESET_MAP = Object.freeze(
    ACCENT_PRESETS.reduce((map, preset) => {
        map[preset.key] = preset;
        return map;
    }, {})
);

export const resolveAccentPresetKey = (value) => {
    if (value === 'custom') {
        return 'custom';
    }

    return ACCENT_PRESET_MAP[value]?.key ?? DEFAULT_ACCENT_PRESET;
};

export const resolveAccentPresetDefinition = ({
    accentPreset = DEFAULT_ACCENT_PRESET,
    customAccent = DEFAULT_CUSTOM_ACCENT,
} = {}) => {
    const presetKey = resolveAccentPresetKey(accentPreset);

    if (presetKey === 'custom') {
        return deriveCustomAccentPreset(customAccent);
    }

    return ACCENT_PRESET_MAP[presetKey] || ACCENT_PRESET_MAP.system;
};

export const WALLPAPER_MODES = Object.freeze([
    'auto',
    'sunrise',
    'day',
    'sunset',
    'night',
    'nebula',
    'liquid',
    'prism',
    'sequoia',
]);

export const WALLPAPER_OPTIONS = Object.freeze([
    { key: 'auto', label: 'Dynamic', helper: 'Follows the clock' },
    { key: 'sunrise', label: 'Sunrise', helper: 'Warm gradients' },
    { key: 'day', label: 'Daylight', helper: 'Brighter glass' },
    { key: 'sunset', label: 'Sunset', helper: 'Golden hour' },
    { key: 'night', label: 'Night', helper: 'Midnight blue' },
    { key: 'nebula', label: 'Nebula', helper: 'Deep-space bloom with aurora haze' },
    { key: 'liquid', label: 'Liquid Glass', helper: 'Cyan, mint, and amber caustics' },
    {
        key: 'prism',
        label: 'Prismatic',
        helper: 'High-depth refraction with cinematic highlights',
    },
    {
        key: 'sequoia',
        label: 'Sequoia',
        helper: 'Official macOS Sequoia vibrant gradients',
    },
]);

export const resolveWallpaperMode = (value) =>
    WALLPAPER_MODES.includes(value) ? value : DEFAULT_WALLPAPER_MODE;
