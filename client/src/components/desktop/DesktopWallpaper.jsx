import PropTypes from 'prop-types';
import { useEffect, useMemo, useRef, useState } from 'react';

const WALLPAPER_REFRESH_INTERVAL = 5 * 60 * 1000; // 5 minutes
const WALLPAPER_MODES = ['auto', 'sunrise', 'day', 'sunset', 'night', 'liquid'];

const WALLPAPER_PRESETS = {
    liquid: {
        light: {
            wallpaper:
                'radial-gradient(1520px 900px at 8% -18%, rgba(102, 214, 255, 0.38), transparent 56%), radial-gradient(1300px 780px at 92% -14%, rgba(255, 196, 138, 0.24), transparent 60%), radial-gradient(1100px 720px at 24% 112%, rgba(116, 236, 214, 0.22), transparent 72%), radial-gradient(980px 640px at 78% 118%, rgba(255, 255, 255, 0.34), transparent 74%), linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(236, 244, 255, 0.94))',
            auroraPrimary: 'radial-gradient(900px 580px at 14% 6%, rgba(84, 198, 255, 0.28), transparent 74%)',
            auroraSecondary: 'radial-gradient(960px 600px at 88% 18%, rgba(255, 192, 122, 0.2), transparent 76%)',
            orbTop: 'rgba(255, 255, 255, 0.72)',
            orbBottom: 'rgba(88, 196, 255, 0.34)',
            grid: 'rgba(126, 178, 236, 0.12)',
            horizon:
                'radial-gradient(150% 200% at 48% 92%, rgba(84, 198, 255, 0.22), transparent 64%), radial-gradient(140% 180% at 14% 94%, rgba(255, 255, 255, 0.24), transparent 72%)',
            noise: 0.05,
        },
        dark: {
            wallpaper:
                'radial-gradient(1460px 900px at 12% -18%, rgba(38, 188, 245, 0.32), transparent 58%), radial-gradient(1260px 800px at 90% -12%, rgba(255, 176, 96, 0.16), transparent 64%), radial-gradient(1120px 700px at 20% 112%, rgba(64, 224, 208, 0.24), transparent 72%), radial-gradient(980px 640px at 78% 122%, rgba(118, 101, 255, 0.18), transparent 72%), linear-gradient(180deg, rgba(5, 10, 22, 0.96), rgba(9, 15, 30, 0.94))',
            auroraPrimary: 'radial-gradient(820px 540px at 12% -4%, rgba(32, 196, 229, 0.28), transparent 74%)',
            auroraSecondary: 'radial-gradient(880px 560px at 90% 12%, rgba(255, 165, 90, 0.2), transparent 76%)',
            orbTop: 'rgba(186, 230, 253, 0.26)',
            orbBottom: 'rgba(16, 185, 129, 0.24)',
            grid: 'rgba(59, 130, 246, 0.14)',
            horizon:
                'radial-gradient(150% 200% at 48% 94%, rgba(15, 185, 219, 0.18), transparent 64%), radial-gradient(140% 180% at 14% 94%, rgba(20, 83, 136, 0.32), transparent 72%)',
            noise: 0.14,
        },
    },
    sunrise: {
        light: {
            wallpaper:
                'radial-gradient(1440px 840px at 10% -16%, rgba(255, 210, 168, 0.76), transparent 54%), radial-gradient(1240px 760px at 86% -10%, rgba(255, 178, 146, 0.34), transparent 64%), radial-gradient(1040px 620px at 26% 110%, rgba(132, 204, 255, 0.34), transparent 72%), radial-gradient(940px 580px at 76% 118%, rgba(255, 210, 150, 0.32), transparent 72%), linear-gradient(180deg, rgba(255, 247, 238, 0.98), rgba(255, 232, 214, 0.92))',
            auroraPrimary: 'radial-gradient(780px 520px at 16% 6%, rgba(255, 192, 148, 0.32), transparent 72%)',
            auroraSecondary: 'radial-gradient(840px 520px at 88% 20%, rgba(255, 170, 136, 0.24), transparent 74%)',
            orbTop: 'rgba(255, 244, 230, 0.64)',
            orbBottom: 'rgba(255, 184, 132, 0.42)',
            grid: 'rgba(255, 194, 160, 0.14)',
            horizon:
                'radial-gradient(140% 180% at 48% 92%, rgba(255, 200, 144, 0.38), transparent 62%), radial-gradient(120% 140% at 18% 94%, rgba(255, 242, 222, 0.3), transparent 74%)',
            noise: 0.08,
        },
        dark: {
            wallpaper:
                'radial-gradient(1400px 840px at 12% -18%, rgba(255, 176, 136, 0.28), transparent 58%), radial-gradient(1180px 720px at 86% -12%, rgba(212, 122, 194, 0.32), transparent 66%), radial-gradient(1040px 620px at 30% 116%, rgba(96, 146, 214, 0.32), transparent 74%), radial-gradient(920px 580px at 78% 120%, rgba(255, 168, 122, 0.24), transparent 72%), linear-gradient(180deg, rgba(30, 26, 52, 0.98), rgba(36, 34, 62, 0.92))',
            auroraPrimary: 'radial-gradient(720px 500px at 14% -2%, rgba(255, 168, 132, 0.3), transparent 74%)',
            auroraSecondary: 'radial-gradient(780px 520px at 86% 18%, rgba(170, 118, 214, 0.32), transparent 74%)',
            orbTop: 'rgba(255, 208, 170, 0.32)',
            orbBottom: 'rgba(204, 138, 196, 0.32)',
            grid: 'rgba(245, 188, 170, 0.12)',
            horizon:
                'radial-gradient(150% 200% at 52% 96%, rgba(255, 162, 126, 0.32), transparent 68%), radial-gradient(120% 140% at 18% 92%, rgba(86, 128, 200, 0.28), transparent 74%)',
            noise: 0.12,
        },
    },
    day: {
        light: {
            wallpaper:
                'radial-gradient(1460px 860px at 12% -16%, rgba(132, 212, 255, 0.42), transparent 54%), radial-gradient(1260px 760px at 90% -12%, rgba(140, 208, 255, 0.32), transparent 60%), radial-gradient(1100px 660px at 22% 108%, rgba(118, 236, 214, 0.32), transparent 70%), radial-gradient(980px 600px at 76% 116%, rgba(255, 216, 150, 0.24), transparent 72%), linear-gradient(180deg, rgba(248, 251, 255, 0.98), rgba(232, 241, 252, 0.92))',
            auroraPrimary: 'radial-gradient(800px 540px at 16% 4%, rgba(86, 200, 255, 0.32), transparent 72%)',
            auroraSecondary: 'radial-gradient(860px 540px at 90% 18%, rgba(88, 224, 206, 0.24), transparent 74%)',
            orbTop: 'rgba(255, 255, 255, 0.68)',
            orbBottom: 'rgba(78, 192, 255, 0.42)',
            grid: 'rgba(148, 191, 225, 0.14)',
            horizon:
                'radial-gradient(150% 200% at 48% 92%, rgba(126, 214, 255, 0.28), transparent 62%), radial-gradient(120% 140% at 12% 92%, rgba(255, 255, 255, 0.24), transparent 74%)',
            noise: 0.07,
        },
        dark: {
            wallpaper:
                'radial-gradient(1420px 860px at 12% -18%, rgba(82, 164, 255, 0.26), transparent 56%), radial-gradient(1240px 760px at 90% -12%, rgba(88, 118, 230, 0.32), transparent 64%), radial-gradient(1100px 660px at 24% 114%, rgba(54, 186, 196, 0.32), transparent 72%), radial-gradient(980px 620px at 76% 120%, rgba(255, 174, 132, 0.18), transparent 72%), linear-gradient(180deg, rgba(7, 12, 28, 0.97), rgba(10, 18, 36, 0.95))',
            auroraPrimary: 'radial-gradient(720px 500px at 14% -2%, rgba(84, 170, 255, 0.3), transparent 74%)',
            auroraSecondary: 'radial-gradient(780px 520px at 88% 16%, rgba(86, 134, 255, 0.32), transparent 76%)',
            orbTop: 'rgba(148, 178, 234, 0.36)',
            orbBottom: 'rgba(64, 150, 255, 0.32)',
            grid: 'rgba(120, 164, 214, 0.16)',
            horizon:
                'radial-gradient(150% 200% at 48% 94%, rgba(78, 138, 230, 0.24), transparent 64%), radial-gradient(120% 140% at 14% 92%, rgba(24, 104, 184, 0.3), transparent 72%)',
            noise: 0.16,
        },
    },
    sunset: {
        light: {
            wallpaper:
                'radial-gradient(1460px 860px at 14% -16%, rgba(255, 196, 170, 0.72), transparent 54%), radial-gradient(1220px 760px at 86% -10%, rgba(255, 170, 146, 0.34), transparent 64%), radial-gradient(1060px 660px at 26% 112%, rgba(154, 202, 255, 0.3), transparent 72%), radial-gradient(980px 620px at 74% 118%, rgba(255, 198, 144, 0.3), transparent 72%), linear-gradient(180deg, rgba(255, 240, 236, 0.96), rgba(255, 220, 208, 0.9))',
            auroraPrimary: 'radial-gradient(780px 520px at 12% 2%, rgba(255, 176, 142, 0.32), transparent 74%)',
            auroraSecondary: 'radial-gradient(860px 520px at 90% 18%, rgba(255, 168, 140, 0.24), transparent 74%)',
            orbTop: 'rgba(255, 236, 224, 0.56)',
            orbBottom: 'rgba(255, 166, 126, 0.36)',
            grid: 'rgba(255, 174, 160, 0.14)',
            horizon:
                'radial-gradient(150% 200% at 50% 92%, rgba(255, 168, 126, 0.38), transparent 60%), radial-gradient(120% 140% at 14% 92%, rgba(255, 222, 212, 0.3), transparent 74%)',
            noise: 0.08,
        },
        dark: {
            wallpaper:
                'radial-gradient(1440px 880px at 16% -18%, rgba(228, 120, 144, 0.32), transparent 56%), radial-gradient(1240px 760px at 86% -12%, rgba(168, 108, 214, 0.34), transparent 66%), radial-gradient(1060px 660px at 32% 116%, rgba(88, 134, 214, 0.32), transparent 74%), radial-gradient(960px 620px at 74% 122%, rgba(232, 128, 126, 0.24), transparent 72%), linear-gradient(180deg, rgba(20, 18, 34, 0.97), rgba(34, 22, 52, 0.94))',
            auroraPrimary: 'radial-gradient(720px 520px at 14% -4%, rgba(234, 118, 132, 0.32), transparent 76%)',
            auroraSecondary: 'radial-gradient(780px 520px at 86% 14%, rgba(158, 104, 214, 0.34), transparent 74%)',
            orbTop: 'rgba(214, 118, 144, 0.34)',
            orbBottom: 'rgba(170, 122, 210, 0.32)',
            grid: 'rgba(214, 132, 144, 0.14)',
            horizon:
                'radial-gradient(150% 200% at 50% 96%, rgba(230, 118, 132, 0.32), transparent 62%), radial-gradient(120% 140% at 18% 94%, rgba(116, 98, 200, 0.26), transparent 74%)',
            noise: 0.15,
        },
    },
    night: {
        light: {
            wallpaper:
                'radial-gradient(1460px 860px at 12% -16%, rgba(178, 202, 255, 0.34), transparent 58%), radial-gradient(1260px 780px at 90% -12%, rgba(146, 182, 255, 0.28), transparent 66%), radial-gradient(1060px 660px at 24% 114%, rgba(164, 214, 255, 0.3), transparent 72%), radial-gradient(980px 640px at 74% 118%, rgba(116, 176, 255, 0.24), transparent 72%), linear-gradient(180deg, rgba(240, 244, 255, 0.96), rgba(216, 226, 248, 0.9))',
            auroraPrimary: 'radial-gradient(780px 520px at 10% 0%, rgba(182, 212, 255, 0.32), transparent 74%)',
            auroraSecondary: 'radial-gradient(840px 520px at 90% 18%, rgba(166, 188, 255, 0.24), transparent 76%)',
            orbTop: 'rgba(218, 226, 255, 0.44)',
            orbBottom: 'rgba(138, 174, 255, 0.32)',
            grid: 'rgba(182, 198, 255, 0.14)',
            horizon:
                'radial-gradient(150% 200% at 50% 94%, rgba(174, 200, 255, 0.28), transparent 60%), radial-gradient(120% 140% at 14% 94%, rgba(222, 232, 255, 0.3), transparent 74%)',
            noise: 0.09,
        },
        dark: {
            wallpaper:
                'radial-gradient(1440px 880px at 18% -18%, rgba(60, 110, 195, 0.34), transparent 60%), radial-gradient(1260px 760px at 90% -12%, rgba(52, 80, 168, 0.32), transparent 68%), radial-gradient(1100px 660px at 30% 120%, rgba(52, 122, 172, 0.32), transparent 74%), radial-gradient(1000px 640px at 76% 122%, rgba(120, 92, 204, 0.24), transparent 74%), linear-gradient(180deg, rgba(4, 8, 18, 0.98), rgba(10, 16, 36, 0.96))',
            auroraPrimary: 'radial-gradient(720px 520px at 14% -6%, rgba(74, 124, 210, 0.34), transparent 76%)',
            auroraSecondary: 'radial-gradient(780px 520px at 84% 12%, rgba(118, 96, 210, 0.34), transparent 76%)',
            orbTop: 'rgba(84, 122, 196, 0.34)',
            orbBottom: 'rgba(48, 98, 188, 0.32)',
            grid: 'rgba(62, 94, 150, 0.18)',
            horizon:
                'radial-gradient(150% 200% at 52% 96%, rgba(72, 124, 204, 0.32), transparent 62%), radial-gradient(120% 140% at 14% 94%, rgba(40, 86, 160, 0.28), transparent 72%)',
            noise: 0.18,
        },
    },
};

function resolvePhase(hourFraction) {
    if (hourFraction >= 4 && hourFraction < 7.5) return 'sunrise';
    if (hourFraction >= 7.5 && hourFraction < 17.5) return 'day';
    if (hourFraction >= 17.5 && hourFraction < 20.5) return 'sunset';
    return 'night';
}

function buildWallpaperStyle(phase, theme) {
    const palette = WALLPAPER_PRESETS[phase] || WALLPAPER_PRESETS.day;
    const effectiveTheme = theme === 'dark' ? 'dark' : 'light';
    const active = palette[effectiveTheme];
    const light = palette.light;
    const dark = palette.dark;

    const toNoise = (value) => (typeof value === 'number' ? value.toString() : value);

    return {
        '--macos-wallpaper': active.wallpaper,
        '--macos-wallpaper-light': light.wallpaper,
        '--macos-wallpaper-dark': dark.wallpaper,
        '--macos-aurora-primary': active.auroraPrimary,
        '--macos-aurora-secondary': active.auroraSecondary,
        '--macos-aurora-primary-light': light.auroraPrimary,
        '--macos-aurora-secondary-light': light.auroraSecondary,
        '--macos-aurora-primary-dark': dark.auroraPrimary,
        '--macos-aurora-secondary-dark': dark.auroraSecondary,
        '--macos-orb-top': active.orbTop,
        '--macos-orb-bottom': active.orbBottom,
        '--macos-orb-top-light': light.orbTop,
        '--macos-orb-bottom-light': light.orbBottom,
        '--macos-orb-top-dark': dark.orbTop,
        '--macos-orb-bottom-dark': dark.orbBottom,
        '--macos-grid-color': active.grid,
        '--macos-grid-color-light': light.grid,
        '--macos-grid-color-dark': dark.grid,
        '--macos-horizon': active.horizon,
        '--macos-horizon-light': light.horizon,
        '--macos-horizon-dark': dark.horizon,
        '--macos-noise-opacity': toNoise(active.noise),
        '--macos-noise-opacity-light': toNoise(light.noise),
        '--macos-noise-opacity-dark': toNoise(dark.noise),
        '--macos-tilt-x': '0px',
        '--macos-tilt-y': '0px',
        '--macos-highlight-x': '52%',
        '--macos-highlight-y': '48%',
    };
}

/**
 * Renders a layered macOS-style wallpaper with subtle motion,
 * optional accent gradients, and a focus veil for distraction-free mode.
 */
export default function DesktopWallpaper({
    accentGradient,
    focusMode,
    className,
    theme,
    wallpaperMode,
    children,
}) {
    const [timestamp, setTimestamp] = useState(() => Date.now());
    const wallpaperRef = useRef(null);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const intervalId = window.setInterval(() => {
            setTimestamp(Date.now());
        }, WALLPAPER_REFRESH_INTERVAL);
        return () => window.clearInterval(intervalId);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const motionQuery = window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null;
        if (motionQuery?.matches) {
            return undefined;
        }

        let frameId = null;

        const updateTilt = (xShift, yShift) => {
            if (!wallpaperRef.current) {
                return;
            }
            wallpaperRef.current.style.setProperty('--macos-tilt-x', `${xShift.toFixed(2)}px`);
            wallpaperRef.current.style.setProperty('--macos-tilt-y', `${yShift.toFixed(2)}px`);
        };

        const updateHighlight = (xPercent, yPercent) => {
            if (!wallpaperRef.current) {
                return;
            }
            wallpaperRef.current.style.setProperty('--macos-highlight-x', `${xPercent.toFixed(2)}%`);
            wallpaperRef.current.style.setProperty('--macos-highlight-y', `${yPercent.toFixed(2)}%`);
        };

        const handlePointerMove = (event) => {
            if (frameId) {
                return;
            }
            frameId = window.requestAnimationFrame(() => {
                const { innerWidth, innerHeight } = window;
                const xRatio = event.clientX / innerWidth - 0.5;
                const yRatio = event.clientY / innerHeight - 0.5;
                updateTilt(xRatio * 22, yRatio * 16);
                updateHighlight((xRatio + 0.5) * 100, (yRatio + 0.5) * 100);
                frameId = null;
            });
        };

        const handlePointerLeave = () => {
            updateTilt(0, 0);
            updateHighlight(50, 46);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerleave', handlePointerLeave);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerleave', handlePointerLeave);
            if (frameId) {
                window.cancelAnimationFrame(frameId);
            }
        };
    }, []);

    const timeOfDayPhase = useMemo(() => {
        const now = new Date(timestamp);
        const hourFraction = now.getHours() + now.getMinutes() / 60;
        const clockPhase = resolvePhase(hourFraction);
        const normalizedMode = WALLPAPER_MODES.includes(wallpaperMode) ? wallpaperMode : 'auto';
        return normalizedMode === 'auto' ? clockPhase : normalizedMode;
    }, [timestamp, wallpaperMode]);

    const wallpaperStyle = useMemo(
        () => buildWallpaperStyle(timeOfDayPhase, theme),
        [timeOfDayPhase, theme]
    );

    const accentStyle = useMemo(() => {
        if (!accentGradient) {
            return undefined;
        }
        return {
            background: accentGradient,
        };
    }, [accentGradient]);

    const rootClassName = className ? `macos-wallpaper-shell ${className}` : 'macos-wallpaper-shell';

    return (
        <div ref={wallpaperRef} className={rootClassName} aria-hidden style={wallpaperStyle}>
            <div className="macos-wallpaper">
                <div className="macos-wallpaper__gradient macos-wallpaper__gradient--light" />
                <div className="macos-wallpaper__gradient macos-wallpaper__gradient--dark" />
                <div className="macos-wallpaper__aurora macos-wallpaper__aurora--primary" />
                <div className="macos-wallpaper__aurora macos-wallpaper__aurora--secondary" />
                <div className="macos-wallpaper__orb macos-wallpaper__orb--top" />
                <div className="macos-wallpaper__orb macos-wallpaper__orb--bottom" />
                <div className="macos-wallpaper__horizon" />
                <div className="macos-wallpaper__caustics" />
                <div className="macos-wallpaper__prism" />
                <div className="macos-wallpaper__sheen" />
                <div className="macos-wallpaper__grid macos-wallpaper__grid--light" />
                <div className="macos-wallpaper__grid macos-wallpaper__grid--dark" />
                <div className="macos-wallpaper__noise" />
                {accentGradient ? (
                    <div className="macos-wallpaper__accent" style={accentStyle} />
                ) : null}
                <div
                    className={`macos-wallpaper__veil ${
                        focusMode ? 'macos-wallpaper__veil--active' : ''
                    }`}
                />
            </div>
            {children}
        </div>
    );
}

DesktopWallpaper.propTypes = {
    accentGradient: PropTypes.string,
    focusMode: PropTypes.bool,
    className: PropTypes.string,
    theme: PropTypes.oneOf(['light', 'dark']),
    wallpaperMode: PropTypes.oneOf(WALLPAPER_MODES),
    children: PropTypes.node,
};

DesktopWallpaper.defaultProps = {
    accentGradient: '',
    focusMode: false,
    className: '',
    theme: 'light',
    wallpaperMode: 'auto',
    children: null,
};
