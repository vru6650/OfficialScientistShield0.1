import { alpha, createTheme } from '@mui/material/styles';

const SURFACE_PRESET_STYLES = Object.freeze({
    hybrid: {
        light: {
            paper: alpha('#ffffff', 0.92),
            border: alpha('#d8e8ff', 0.94),
            glow: alpha('#72d5ff', 0.34),
            shadow: '0 58px 154px -82px rgba(15, 23, 42, 0.26)',
            blur: 34,
        },
        dark: {
            paper: alpha('#08111f', 0.9),
            border: alpha('#a5b8d8', 0.46),
            glow: alpha('#7fd4ff', 0.3),
            shadow: '0 44px 128px -60px rgba(0, 0, 0, 0.84)',
            blur: 30,
        },
    },
    liquid: {
        light: {
            paper: alpha('#ffffff', 0.9),
            border: alpha('#d6e8ff', 0.94),
            glow: alpha('#7ad0ff', 0.28),
            shadow: '0 46px 128px -68px rgba(15, 23, 42, 0.22)',
            blur: 30,
        },
        dark: {
            paper: alpha('#0b1220', 0.84),
            border: alpha('#94a3b8', 0.4),
            glow: alpha('#7fd4ff', 0.24),
            shadow: '0 36px 108px -54px rgba(0, 0, 0, 0.78)',
            blur: 28,
        },
    },
    sequoia: {
        light: {
            paper: alpha('#ffffff', 0.92),
            border: alpha('#d9e7ff', 0.88),
            glow: alpha('#8bd2ff', 0.28),
            shadow: '0 48px 134px -72px rgba(15, 23, 42, 0.24)',
            blur: 30,
        },
        dark: {
            paper: alpha('#0a1020', 0.86),
            border: alpha('#7dd3fc', 0.34),
            glow: alpha('#7dd3fc', 0.22),
            shadow: '0 38px 112px -58px rgba(0, 0, 0, 0.82)',
            blur: 26,
        },
    },
    graphite: {
        light: {
            paper: alpha('#fbfdff', 0.92),
            border: alpha('#d6dee9', 0.86),
            glow: alpha('#7bb0ff', 0.22),
            shadow: '0 40px 108px -60px rgba(15, 23, 42, 0.24)',
            blur: 24,
        },
        dark: {
            paper: alpha('#0b1322', 0.88),
            border: alpha('#64748b', 0.48),
            glow: alpha('#60a5fa', 0.2),
            shadow: '0 36px 102px -54px rgba(0, 0, 0, 0.84)',
            blur: 24,
        },
    },
    aurora: {
        light: {
            paper: alpha('#fcfdff', 0.9),
            border: alpha('#cbd7ff', 0.82),
            glow: alpha('#8b5cf6', 0.24),
            shadow: '0 52px 144px -78px rgba(49, 70, 120, 0.24)',
            blur: 32,
        },
        dark: {
            paper: alpha('#0a1022', 0.88),
            border: alpha('#93c5fd', 0.28),
            glow: alpha('#7c3aed', 0.24),
            shadow: '0 42px 122px -60px rgba(0, 0, 0, 0.82)',
            blur: 30,
        },
    },
    eclipse: {
        light: {
            paper: alpha('#fdfcff', 0.9),
            border: alpha('#d7dbff', 0.84),
            glow: alpha('#7c5cff', 0.26),
            shadow: '0 56px 150px -82px rgba(49, 46, 129, 0.22)',
            blur: 34,
        },
        dark: {
            paper: alpha('#090b17', 0.9),
            border: alpha('#a5b4fc', 0.28),
            glow: alpha('#8b5cf6', 0.28),
            shadow: '0 44px 128px -58px rgba(0, 0, 0, 0.86)',
            blur: 30,
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
    surfacePreset = 'hybrid',
    accentColor = '#0A84FF',
    accentStrong = '#0064D1',
} = {}) {
    const normalizedMode = mode === 'dark' ? 'dark' : 'light';
    const surfacePresetStyle =
        SURFACE_PRESET_STYLES[surfacePreset]?.[normalizedMode] ||
        SURFACE_PRESET_STYLES.hybrid[normalizedMode];
    const isDark = normalizedMode === 'dark';
    const textPrimary = isDark ? '#edf4ff' : '#0c1b2d';
    const textSecondary = isDark ? '#c6d3e3' : '#35526e';
    const focusRing = alpha(accentColor, isDark ? 0.5 : 0.42);
    const controlBackground = isDark ? alpha('#020617', 0.8) : alpha('#ffffff', 0.96);

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
                        background: `var(--hybrid-refraction, linear-gradient(transparent, transparent)), linear-gradient(155deg, ${surfacePresetStyle.paper}, ${alpha(surfacePresetStyle.paper, isDark ? 0.92 : 0.88)})`,
                        border: `1px solid ${surfacePresetStyle.border}`,
                        backdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(180%)`,
                        WebkitBackdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(180%)`,
                        boxShadow: `${surfacePresetStyle.shadow}, 0 22px 48px -28px ${alpha(accentColor, isDark ? 0.18 : 0.12)}, 0 0 0 1px ${alpha(surfacePresetStyle.glow, 0.7)} inset, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.42)}`,
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
                        background: `var(--hybrid-refraction-strong, linear-gradient(transparent, transparent)), linear-gradient(160deg, ${surfacePresetStyle.paper}, ${alpha(surfacePresetStyle.paper, isDark ? 0.92 : 0.88)})`,
                        boxShadow: `${surfacePresetStyle.shadow}, 0 26px 62px -28px ${alpha(accentColor, 0.28)}, inset 0 1px 0 ${alpha('#ffffff', isDark ? 0.08 : 0.34)}`,
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
                        background: `var(--hybrid-refraction, linear-gradient(transparent, transparent)), linear-gradient(160deg, ${alpha(surfacePresetStyle.paper, 0.96)}, ${alpha(surfacePresetStyle.paper, 0.88)})`,
                        borderBottom: `1px solid ${surfacePresetStyle.border}`,
                        backdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(172%)`,
                        WebkitBackdropFilter: `blur(${surfacePresetStyle.blur}px) saturate(172%)`,
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
                            'linear-gradient(180deg, color-mix(in srgb, var(--theme-primary-top, #66b9ff) 92%, #ffffff 8%), var(--theme-primary-mid, #1677ff) 48%, var(--theme-primary-bottom, #0d59d8))',
                        boxShadow: `var(--theme-primary-shadow, 0 18px 40px -18px ${alpha(accentColor, 0.56)}), 0 8px 18px -12px ${alpha('#ffffff', isDark ? 0.08 : 0.18)} inset`,
                        '&:hover': {
                            backgroundImage:
                                'linear-gradient(180deg, color-mix(in srgb, var(--theme-primary-top, #66b9ff) 88%, #ffffff 12%), color-mix(in srgb, var(--theme-primary-mid, #1677ff) 92%, #ffffff 8%) 52%, color-mix(in srgb, var(--theme-primary-bottom, #0d59d8) 90%, #082346 10%))',
                            boxShadow: `0 22px 48px -22px ${alpha(accentColor, isDark ? 0.46 : 0.38)}, 0 8px 18px -12px ${alpha('#ffffff', isDark ? 0.08 : 0.2)} inset`,
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
                        backgroundImage: `var(--hybrid-refraction, linear-gradient(transparent, transparent)), linear-gradient(145deg, ${alpha('#ffffff', isDark ? 0.06 : 0.84)}, ${controlBackground})`,
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
