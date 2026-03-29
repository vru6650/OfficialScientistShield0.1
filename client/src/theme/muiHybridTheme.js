import { alpha, createTheme } from '@mui/material/styles';

const SURFACE_PRESET_STYLES = Object.freeze({
    liquid: {
        light: {
            paper: alpha('#ffffff', 0.86),
            border: alpha('#d6e8ff', 0.92),
            glow: alpha('#7ad0ff', 0.28),
            shadow: '0 46px 128px -68px rgba(15, 23, 42, 0.22)',
            blur: 32,
        },
        dark: {
            paper: alpha('#0b1220', 0.78),
            border: alpha('#94a3b8', 0.34),
            glow: alpha('#7fd4ff', 0.24),
            shadow: '0 36px 108px -54px rgba(0, 0, 0, 0.78)',
            blur: 28,
        },
    },
    sequoia: {
        light: {
            paper: alpha('#ffffff', 0.88),
            border: alpha('#d9e7ff', 0.84),
            glow: alpha('#8bd2ff', 0.28),
            shadow: '0 48px 134px -72px rgba(15, 23, 42, 0.24)',
            blur: 32,
        },
        dark: {
            paper: alpha('#0a1020', 0.82),
            border: alpha('#7dd3fc', 0.28),
            glow: alpha('#7dd3fc', 0.22),
            shadow: '0 38px 112px -58px rgba(0, 0, 0, 0.82)',
            blur: 28,
        },
    },
    graphite: {
        light: {
            paper: alpha('#fbfdff', 0.88),
            border: alpha('#d6dee9', 0.82),
            glow: alpha('#7bb0ff', 0.22),
            shadow: '0 40px 108px -60px rgba(15, 23, 42, 0.24)',
            blur: 26,
        },
        dark: {
            paper: alpha('#0b1322', 0.86),
            border: alpha('#64748b', 0.44),
            glow: alpha('#60a5fa', 0.2),
            shadow: '0 36px 102px -54px rgba(0, 0, 0, 0.84)',
            blur: 24,
        },
    },
});

const makeShadows = (mode, accentColor) => {
    const shadows = Array.from({ length: 25 }, () => 'none');
    const darkShadow = mode === 'dark' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(15, 23, 42, 0.22)';
    const glow = alpha(accentColor, mode === 'dark' ? 0.3 : 0.2);
    shadows[1] = `0 10px 28px -18px ${darkShadow}`;
    shadows[2] = `0 14px 34px -20px ${darkShadow}, 0 0 0 1px ${glow}`;
    shadows[3] = `0 18px 42px -22px ${darkShadow}, 0 0 0 1px ${alpha(accentColor, 0.16)}`;
    shadows[8] = `0 22px 58px -30px ${darkShadow}, 0 0 0 1px ${alpha(accentColor, 0.14)}`;
    return shadows;
};

export function createMuiHybridTheme({
    mode = 'light',
    surfacePreset = 'liquid',
    accentColor = '#0A84FF',
    accentStrong = '#0064D1',
} = {}) {
    const normalizedMode = mode === 'dark' ? 'dark' : 'light';
    const surfacePresetStyle =
        SURFACE_PRESET_STYLES[surfacePreset]?.[normalizedMode] ||
        SURFACE_PRESET_STYLES.liquid[normalizedMode];
    const isDark = normalizedMode === 'dark';
    const textPrimary = isDark ? '#e2e8f0' : '#0f172a';
    const textSecondary = isDark ? '#94a3b8' : '#425972';
    const focusRing = alpha(accentColor, isDark ? 0.5 : 0.42);
    const controlBackground = isDark ? alpha('#020617', 0.68) : alpha('#ffffff', 0.9);

    return createTheme({
        palette: {
            mode: normalizedMode,
            primary: {
                main: accentColor,
                dark: accentStrong,
                light: alpha(accentColor, 0.72),
                contrastText: '#ffffff',
            },
            secondary: {
                main: isDark ? '#7dd3fc' : '#0ea5e9',
                contrastText: '#ffffff',
            },
            background: {
                default: 'transparent',
                paper: surfacePresetStyle.paper,
            },
            text: {
                primary: textPrimary,
                secondary: textSecondary,
            },
            divider: surfacePresetStyle.border,
        },
        shape: {
            borderRadius: 22,
        },
        typography: {
            fontFamily: "'Sora', 'Space Grotesk', 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            h1: {
                fontFamily: "'Space Grotesk', 'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.04em',
            },
            h2: {
                fontFamily: "'Space Grotesk', 'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.035em',
            },
            h3: {
                fontFamily: "'Space Grotesk', 'Sora', 'Inter', sans-serif",
                fontWeight: 700,
                letterSpacing: '-0.03em',
            },
            body1: {
                lineHeight: 1.6,
            },
            body2: {
                lineHeight: 1.55,
            },
            button: {
                fontWeight: 600,
                letterSpacing: '-0.015em',
                textTransform: 'none',
            },
        },
        shadows: makeShadows(normalizedMode, accentColor),
        components: {
            MuiCssBaseline: {
                styleOverrides: {
                    ':root': {
                        '--mui-glass-blur': `${surfacePresetStyle.blur}px`,
                    },
                    body: {
                        color: 'var(--color-text-primary)',
                        background: 'var(--app-body-bg)',
                    },
                    '::selection': {
                        background: alpha(accentColor, isDark ? 0.34 : 0.24),
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        background: `linear-gradient(155deg, ${surfacePresetStyle.paper}, ${alpha(surfacePresetStyle.paper, isDark ? 0.92 : 0.86)})`,
                        border: `1px solid ${surfacePresetStyle.border}`,
                        backdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(165%)`,
                        WebkitBackdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(165%)`,
                        boxShadow: `${surfacePresetStyle.shadow}, 0 0 0 1px ${alpha(surfacePresetStyle.glow, 0.68)} inset, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.42)}`,
                    },
                },
            },
            MuiCard: {
                styleOverrides: {
                    root: {
                        borderRadius: 22,
                    },
                },
            },
            MuiDrawer: {
                styleOverrides: {
                    paper: {
                        background: `linear-gradient(170deg, ${surfacePresetStyle.paper}, ${alpha(surfacePresetStyle.paper, 0.9)})`,
                        borderColor: surfacePresetStyle.border,
                    },
                },
            },
            MuiDialog: {
                styleOverrides: {
                    paper: {
                        borderRadius: 24,
                        border: `1px solid ${surfacePresetStyle.border}`,
                        boxShadow: `${surfacePresetStyle.shadow}, 0 22px 52px -24px ${alpha(accentColor, 0.28)}, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.34)}`,
                    },
                },
            },
            MuiPopover: {
                styleOverrides: {
                    paper: {
                        borderRadius: 18,
                        border: `1px solid ${surfacePresetStyle.border}`,
                    },
                },
            },
            MuiAppBar: {
                styleOverrides: {
                    root: {
                        color: textPrimary,
                        background: `linear-gradient(160deg, ${alpha(surfacePresetStyle.paper, 0.96)}, ${alpha(surfacePresetStyle.paper, 0.86)})`,
                        borderBottom: `1px solid ${surfacePresetStyle.border}`,
                        backdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(160%)`,
                        WebkitBackdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(160%)`,
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        paddingInline: 18,
                        backdropFilter: 'blur(12px)',
                        WebkitBackdropFilter: 'blur(12px)',
                    },
                    containedPrimary: {
                        color: '#ffffff',
                        border: `1px solid ${alpha(accentColor, 0.48)}`,
                        backgroundImage:
                            'linear-gradient(180deg, var(--theme-primary-top, #66b9ff), var(--theme-primary-mid, #1677ff) 52%, var(--theme-primary-bottom, #0d59d8))',
                        boxShadow: `var(--theme-primary-shadow, 0 18px 40px -18px ${alpha(accentColor, 0.56)})`,
                        '&:hover': {
                            backgroundImage:
                                'linear-gradient(180deg, color-mix(in srgb, var(--theme-primary-top, #66b9ff) 92%, #ffffff 8%), color-mix(in srgb, var(--theme-primary-mid, #1677ff) 94%, #ffffff 6%) 52%, color-mix(in srgb, var(--theme-primary-bottom, #0d59d8) 92%, #082346 8%))',
                        },
                    },
                    outlinedPrimary: {
                        color: accentColor,
                        borderColor: alpha(accentColor, 0.4),
                        background: controlBackground,
                        '&:hover': {
                            borderColor: alpha(accentColor, 0.55),
                            background: alpha(accentColor, isDark ? 0.14 : 0.08),
                        },
                    },
                    textPrimary: {
                        color: accentColor,
                    },
                },
            },
            MuiChip: {
                styleOverrides: {
                    root: {
                        borderRadius: 999,
                        border: `1px solid ${alpha(accentColor, isDark ? 0.36 : 0.26)}`,
                        backgroundColor: alpha(accentColor, isDark ? 0.22 : 0.1),
                    },
                },
            },
            MuiOutlinedInput: {
                styleOverrides: {
                    root: {
                        borderRadius: 14,
                        backgroundImage: `linear-gradient(145deg, ${alpha('#ffffff', isDark ? 0.06 : 0.84)}, ${controlBackground})`,
                        backdropFilter: 'blur(14px)',
                        WebkitBackdropFilter: 'blur(14px)',
                        boxShadow: `inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.4)}, 0 16px 36px -28px ${alpha('#0f172a', isDark ? 0.64 : 0.18)}`,
                        '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(accentColor, isDark ? 0.3 : 0.22),
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: alpha(accentColor, isDark ? 0.45 : 0.38),
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: accentColor,
                            borderWidth: 1.5,
                        },
                    },
                },
            },
            MuiInputLabel: {
                styleOverrides: {
                    root: {
                        color: textSecondary,
                        '&.Mui-focused': {
                            color: accentColor,
                        },
                    },
                },
            },
            MuiSwitch: {
                styleOverrides: {
                    switchBase: {
                        '&.Mui-checked': {
                            color: accentColor,
                            '& + .MuiSwitch-track': {
                                backgroundColor: alpha(accentColor, 0.48),
                            },
                        },
                    },
                },
            },
            MuiTabs: {
                styleOverrides: {
                    indicator: {
                        height: 3,
                        borderRadius: 999,
                        backgroundColor: accentColor,
                    },
                },
            },
            MuiTooltip: {
                styleOverrides: {
                    tooltip: {
                        borderRadius: 12,
                        border: `1px solid ${alpha(accentColor, 0.28)}`,
                        background: `linear-gradient(145deg, ${alpha(surfacePresetStyle.paper, 0.96)}, ${alpha(surfacePresetStyle.paper, 0.88)})`,
                        color: textPrimary,
                        backdropFilter: `blur(${Math.max(12, surfacePresetStyle.blur - 6)}px)`,
                        WebkitBackdropFilter: `blur(${Math.max(12, surfacePresetStyle.blur - 6)}px)`,
                    },
                },
            },
            MuiLink: {
                styleOverrides: {
                    root: {
                        color: accentColor,
                        textDecorationColor: alpha(accentColor, 0.4),
                        textUnderlineOffset: 3,
                        '&:hover': {
                            textDecorationColor: accentColor,
                        },
                    },
                },
            },
            MuiIconButton: {
                styleOverrides: {
                    root: {
                        borderRadius: 14,
                        '&.Mui-focusVisible': {
                            boxShadow: `0 0 0 3px ${focusRing}`,
                        },
                    },
                },
            },
            MuiButtonBase: {
                styleOverrides: {
                    root: {
                        '&.Mui-focusVisible': {
                            boxShadow: `0 0 0 3px ${focusRing}`,
                        },
                    },
                },
            },
        },
    });
}
