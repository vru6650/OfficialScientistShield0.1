import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSelector, useDispatch } from 'react-redux';

import {
    baseDockItems,
    dashboardDockItem,
    resolveDockIcons,
    settingsDockItem,
    themeDockItem,
} from '../data/dockItems';
import { toggleTheme } from '../redux/theme/themeSlice';

const ICON_SIZE = 64;
const MIN_ICON = 48;
const MAX_ICON = 88;
const BASE_GAP = 16;
const AUTOHIDE_ZONE_PX = 140;
const AUTOHIDE_DELAY_MS = 1200;
const DOCK_STORAGE_KEY = 'dock.settings.v3';
const DEFAULT_SETTINGS = Object.freeze({
    iconSize: ICON_SIZE,
    magnifyStrength: 0.6,
    dockOpacity: 0.92,
    autoHide: false,
});

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function Dock() {
    const location = useLocation();
    const dispatch = useDispatch();
    const { currentUser } = useSelector((state) => state.user);

    const [hoverX, setHoverX] = useState(null);
    const [hoverRatio, setHoverRatio] = useState(0.5);
    const [launchingKey, setLaunchingKey] = useState(null);
    const [customizerOpen, setCustomizerOpen] = useState(false);
    const [dockSettings, setDockSettings] = useState(() => {
        if (typeof window === 'undefined') return DEFAULT_SETTINGS;
        try {
            return { ...DEFAULT_SETTINGS, ...(JSON.parse(localStorage.getItem(DOCK_STORAGE_KEY) || 'null') || {}) };
        } catch {
            return DEFAULT_SETTINGS;
        }
    });
    const [isHoveringDock, setIsHoveringDock] = useState(false);
    const [hasFocusWithin, setHasFocusWithin] = useState(false);
    const [isPointerNear, setIsPointerNear] = useState(true);
    const hideTimeoutRef = useRef(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [tilt, setTilt] = useState({ rotateX: 0, rotateY: 0 });
    const iconRefs = useRef([]);
    const [centers, setCenters] = useState([]);
    const containerRef = useRef(null);
    const customizerRef = useRef(null);
    const cancelHide = useCallback(() => {
        if (hideTimeoutRef.current && typeof window !== 'undefined') {
            window.clearTimeout(hideTimeoutRef.current);
        }
        hideTimeoutRef.current = null;
    }, []);

    const scheduleHide = useCallback(() => {
        if (!dockSettings.autoHide || typeof window === 'undefined') return;
        cancelHide();
        hideTimeoutRef.current = window.setTimeout(() => setIsPointerNear(false), AUTOHIDE_DELAY_MS);
    }, [cancelHide, dockSettings.autoHide]);

    const items = useMemo(() => {
        const list = [...baseDockItems];
        if (currentUser) list.push(dashboardDockItem);
        list.push(settingsDockItem, themeDockItem);
        return resolveDockIcons(list);
    }, [currentUser]);

    const visualItems = useMemo(() => {
        const list = [];
        let dividerPlaced = false;
        items.forEach((item) => {
            const isUtility = item.type === 'settings' || item.type === 'theme';
            if (isUtility && !dividerPlaced && list.length > 0) {
                list.push({ key: 'divider', type: 'divider' });
                dividerPlaced = true;
            }
            list.push(item);
        });
        return list;
    }, [items]);

    const updateCenters = useCallback(() => {
        const mapped = iconRefs.current.map((el) => {
            if (!el) return null;
            const rect = el.getBoundingClientRect();
            return rect.left + rect.width / 2;
        });
        setCenters(mapped);
    }, []);

    useEffect(() => {
        if (!customizerOpen) return undefined;
        const handleClick = (event) => {
            if (customizerRef.current && !customizerRef.current.contains(event.target)) {
                setCustomizerOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') setCustomizerOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClick);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [customizerOpen]);

    useEffect(() => {
        iconRefs.current = iconRefs.current.slice(0, visualItems.length);
        updateCenters();
        window.addEventListener('resize', updateCenters);
        return () => window.removeEventListener('resize', updateCenters);
    }, [visualItems.length, updateCenters]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const media = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(media.matches);
        update();
        media.addEventListener('change', update);
        return () => media.removeEventListener('change', update);
    }, []);

    // Auto-hide: reveal near bottom edge, hide after a short delay when idle
    useEffect(() => {
        if (!dockSettings.autoHide) {
            cancelHide();
            setIsPointerNear(true);
            return undefined;
        }
        if (typeof window === 'undefined') return undefined;

        const handlePointer = (event) => {
            const clientY = event.touches?.[0]?.clientY ?? event.clientY ?? 0;
            const nearBottom = clientY >= window.innerHeight - AUTOHIDE_ZONE_PX;
            if (nearBottom) {
                setIsPointerNear(true);
                cancelHide();
            } else if (!isHoveringDock && !hasFocusWithin && !customizerOpen) {
                scheduleHide();
            }
        };

        const handlePassiveHide = () => {
            if (isHoveringDock || hasFocusWithin || customizerOpen) return;
            scheduleHide();
        };

        window.addEventListener('mousemove', handlePointer, { passive: true });
        window.addEventListener('touchstart', handlePointer, { passive: true });
        window.addEventListener('scroll', handlePassiveHide, { passive: true });

        handlePassiveHide();

        return () => {
            window.removeEventListener('mousemove', handlePointer);
            window.removeEventListener('touchstart', handlePointer);
            window.removeEventListener('scroll', handlePassiveHide);
            cancelHide();
        };
    }, [cancelHide, customizerOpen, dockSettings.autoHide, hasFocusWithin, isHoveringDock, scheduleHide]);

    const handleLaunch = (key) => {
        setLaunchingKey(key);
        window.setTimeout(() => setLaunchingKey(null), 680);
    };

    const metricsFor = (idx, isActive) => {
        const center = centers[idx];
        const iconScale = dockSettings.iconSize / ICON_SIZE;
        const baseScale = isActive ? 1.06 : 0.98;
        const baseLift = (isActive ? -12 : -6) * iconScale;
        if (hoverX == null || center == null) return { scale: baseScale, lift: baseLift, proximity: 0 };
        const distance = Math.abs(hoverX - center);
        const radius = 150 * iconScale;
        const falloff = clamp(distance / radius, 0, 1);
        const proximity = Math.pow(1 - falloff, 2.5);
        const hoverScale = 0.12 + dockSettings.magnifyStrength * 0.9;
        const hoverLift = (8 + dockSettings.magnifyStrength * 36) * iconScale;
        return {
            scale: baseScale + proximity * hoverScale,
            lift: baseLift - proximity * hoverLift,
            proximity,
        };
    };

    const activePath = location.pathname;
    const gap = Math.max(10, Math.round(BASE_GAP * (dockSettings.iconSize / ICON_SIZE)));
    const dockWidth = useMemo(() => {
        const count = visualItems.length || 1;
        const raw = count * dockSettings.iconSize + Math.max(0, count - 1) * gap + 32;
        const maxWidth = Math.max(320, (typeof window !== 'undefined' ? window.innerWidth : 1280) - 32);
        return Math.min(raw, maxWidth);
    }, [visualItems.length, dockSettings.iconSize, gap]);
    const isDockVisible = !dockSettings.autoHide || customizerOpen || isHoveringDock || isPointerNear || hasFocusWithin;
    const dockOpacity = dockSettings.dockOpacity ?? DEFAULT_SETTINGS.dockOpacity;
    const hideOffset = Math.max(dockSettings.iconSize + 36, 72);

    useEffect(() => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem(DOCK_STORAGE_KEY, JSON.stringify(dockSettings));
            }
        } catch {
            // ignore persistence errors
        }
    }, [dockSettings]);

    return (
        <nav
            aria-label="Dock"
            aria-hidden={dockSettings.autoHide && !isDockVisible}
            data-visible={isDockVisible}
            className="macos-dock pointer-events-none fixed bottom-6 left-1/2 z-[70] w-full max-w-5xl -translate-x-1/2 px-4"
            onFocusCapture={() => {
                setHasFocusWithin(true);
                setIsPointerNear(true);
                cancelHide();
            }}
            onBlurCapture={(event) => {
                const currentTarget = event.currentTarget;
                window.requestAnimationFrame(() => {
                    const stillFocused = currentTarget.contains(document.activeElement);
                    setHasFocusWithin(stillFocused);
                    if (!stillFocused && dockSettings.autoHide && !customizerOpen && !isHoveringDock) {
                        scheduleHide();
                    }
                });
            }}
        >
            <motion.ul
                ref={containerRef}
                className="macos-dock__shell pointer-events-auto relative flex items-end rounded-[26px] px-5 py-3"
                initial={{ opacity: 0, y: 18 }}
                animate={{
                    opacity: isDockVisible ? dockOpacity : 0,
                    y: isDockVisible ? 0 : hideOffset,
                    scale: isDockVisible ? 1 : 0.98,
                    rotateX: tilt.rotateX,
                    rotateY: tilt.rotateY,
                }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                style={{
                    gap,
                    width: dockWidth,
                    '--dock-spotlight-x': `${Math.round(hoverRatio * 100)}%`,
                    pointerEvents: isDockVisible ? 'auto' : 'none',
                }}
                data-interactive={hoverX != null}
                onMouseEnter={() => {
                    setIsHoveringDock(true);
                    setIsPointerNear(true);
                    cancelHide();
                }}
                onMouseMove={(event) => {
                    const rect = containerRef.current?.getBoundingClientRect();
                    if (!rect) return;
                    const xRatio = clamp((event.clientX - rect.left) / rect.width, 0, 1);
                    setHoverX(event.clientX);
                    setHoverRatio(xRatio);
                    if (!prefersReducedMotion) {
                        const tiltDamp = 0.8;
                        setTilt({ rotateX: (0.5 - xRatio) * 3 * tiltDamp, rotateY: (xRatio - 0.5) * 6 * tiltDamp });
                    }
                }}
                onMouseLeave={() => {
                    setHoverX(null);
                    setHoverRatio(0.5);
                    setTilt({ rotateX: 0, rotateY: 0 });
                    setIsHoveringDock(false);
                    if (dockSettings.autoHide && !customizerOpen && !hasFocusWithin) {
                        scheduleHide();
                    }
                }}
            >
                <div className="macos-dock__shelf" aria-hidden />
                <div className="macos-dock__grain" aria-hidden />
                <div className="macos-dock__rail" aria-hidden />

                {visualItems.map((item, idx) => {
                    if (item.type === 'divider') {
                        return <li key={`divider-${idx}`} className="macos-dock__divider" aria-hidden />;
                    }
                    const isSettings = item.type === 'settings';
                    const isTheme = item.type === 'theme';
                    const isActive = isSettings
                        ? customizerOpen
                        : item.match
                        ? item.match(activePath)
                        : false;
                    const { scale, lift } = metricsFor(idx, isActive);
                    const isLaunching = launchingKey === item.key;
                    const indicatorOffset = Math.max(10, Math.round(dockSettings.iconSize * 0.18 * scale));

                    const tile = (
                        <motion.span
                            aria-hidden
                            className="macos-dock__tile relative flex items-center justify-center overflow-hidden rounded-2xl ring-1 ring-white/35 bg-gradient-to-br from-white/40 via-white/12 to-white/6 shadow-[0_18px_36px_-26px_rgba(15,23,42,0.75)] backdrop-blur-[22px] dark:ring-white/12 dark:from-slate-900/70 dark:via-slate-900/55 dark:to-slate-950/70"
                            whileHover={prefersReducedMotion ? { scale: 1.01 } : { scale: 1.05 }}
                            style={{ width: dockSettings.iconSize, height: dockSettings.iconSize }}
                        >
                            <motion.img
                                src={item.iconSrc}
                                alt={item.iconAlt ?? item.label}
                                className="macos-dock__icon select-none object-contain"
                                style={{ width: Math.round(dockSettings.iconSize * 0.72), height: Math.round(dockSettings.iconSize * 0.72) }}
                                draggable={false}
                                animate={{
                                    scale: isActive ? 1.05 : 1,
                                    y: isLaunching ? [-2, -14, 0, -8, -3, 0] : 0,
                                }}
                                transition={{ duration: isLaunching ? 0.65 : 0.2, ease: isLaunching ? 'easeOut' : 'easeInOut' }}
                            />
                        </motion.span>
                    );

                    const indicator = (
                        <motion.span
                            aria-hidden
                            className="macos-dock__indicator h-1.5 w-3 rounded-full bg-white/90 shadow-[0_6px_14px_-6px_rgba(255,255,255,0.9)] dark:bg-white/80"
                            style={{ marginTop: indicatorOffset }}
                            animate={{ opacity: isActive ? 1 : 0.6, scale: isActive ? 1 : 0.8 }}
                            transition={{ duration: 0.16 }}
                        />
                    );

                    const isAction = isSettings || isTheme;
                    const commonProps = {
                        className: 'group relative flex flex-col items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/80 focus-visible:ring-offset-2',
                        tabIndex: isDockVisible ? 0 : -1,
                        ref: (el) => {
                            iconRefs.current[idx] = el;
                        },
                    };

                    const content = isAction ? (
                        <button
                            type="button"
                            aria-label={item.label}
                            onClick={() => {
                                handleLaunch(item.key);
                                if (isTheme) {
                                    dispatch(toggleTheme());
                                } else {
                                    setCustomizerOpen((open) => !open);
                                }
                            }}
                            {...commonProps}
                        >
                            {tile}
                            {indicator}
                        </button>
                    ) : (
                        <Link
                            to={item.to}
                            aria-label={item.label}
                            aria-current={isActive ? 'page' : undefined}
                            onClick={() => handleLaunch(item.key)}
                            {...commonProps}
                        >
                            {tile}
                            {indicator}
                        </Link>
                    );

                    return (
                        <motion.li
                            key={item.key}
                            className="group relative flex flex-col items-center"
                            animate={{ y: lift, scale }}
                            transition={{ type: 'spring', stiffness: 240, damping: prefersReducedMotion ? 26 : 21 }}
                        >
                            <span className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/26 via-white/8 to-white/0 opacity-70 blur-lg" aria-hidden />
                            {content}
                            {isSettings ? null : null}
                        </motion.li>
                    );
                })}
            </motion.ul>

            {customizerOpen ? (
                <motion.div
                    ref={customizerRef}
                    className="pointer-events-auto absolute bottom-28 right-6 z-[80] w-[320px] max-w-[calc(100vw-32px)] rounded-2xl border border-white/40 bg-white/92 p-4 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/92"
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: 'easeOut' }}
                >
                    <div className="mb-3 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">Dock Control Center</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Adjust icon size, magnify, opacity, and behavior.</p>
                        </div>
                        <button
                            type="button"
                            onClick={() => setCustomizerOpen(false)}
                            className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-300 dark:hover:text-white"
                        >
                            Close
                        </button>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-start justify-between rounded-xl border border-slate-200/80 bg-white/80 px-3 py-2.5 shadow-[0_12px_32px_-26px_rgba(15,23,42,0.55)] dark:border-slate-700/70 dark:bg-slate-800/80">
                            <div className="pr-3">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-100">Auto-hide Dock</p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400">Slide away until your cursor nears the bottom edge.</p>
                            </div>
                            <button
                                type="button"
                                role="switch"
                                aria-checked={dockSettings.autoHide}
                                onClick={() => {
                                    setDockSettings((prev) => ({ ...prev, autoHide: !prev.autoHide }));
                                    setIsPointerNear(true);
                                }}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                                    dockSettings.autoHide
                                        ? 'bg-sky-500/90 shadow-[0_10px_22px_-14px_rgba(14,165,233,0.85)]'
                                        : 'bg-slate-300/80 shadow-inner dark:bg-slate-600/80'
                                }`}
                            >
                                <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                        dockSettings.autoHide ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                                />
                            </button>
                        </div>
                        <label className="block space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Icon Size • {dockSettings.iconSize}px
                            <input
                                type="range"
                                min={MIN_ICON}
                                max={MAX_ICON}
                                value={dockSettings.iconSize}
                                onChange={(e) => setDockSettings((prev) => ({ ...prev, iconSize: clamp(Number(e.target.value), MIN_ICON, MAX_ICON) }))}
                                className="w-full accent-sky-500/90"
                            />
                        </label>
                        <label className="block space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Magnify • {Math.round(dockSettings.magnifyStrength * 100)}%
                            <input
                                type="range"
                                min={0.1}
                                max={1}
                                step={0.05}
                                value={dockSettings.magnifyStrength}
                                onChange={(e) => setDockSettings((prev) => ({ ...prev, magnifyStrength: clamp(Number(e.target.value), 0.1, 1) }))}
                                className="w-full accent-sky-500/90"
                            />
                        </label>
                        <label className="block space-y-1 text-xs font-semibold text-slate-600 dark:text-slate-300">
                            Dock Opacity • {Math.round(dockSettings.dockOpacity * 100)}%
                            <input
                                type="range"
                                min={0.65}
                                max={1}
                                step={0.01}
                                value={dockSettings.dockOpacity}
                                onChange={(e) => setDockSettings((prev) => ({ ...prev, dockOpacity: clamp(Number(e.target.value), 0.65, 1) }))}
                                className="w-full accent-sky-500/90"
                            />
                        </label>
                        <div className="flex justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                            <span>Current</span>
                            <span className="text-slate-700 dark:text-slate-200">
                                {dockSettings.iconSize}px · {Math.round(dockSettings.magnifyStrength * 100)}% · {Math.round(dockSettings.dockOpacity * 100)}% · Auto-hide {dockSettings.autoHide ? 'On' : 'Off'}
                            </span>
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() =>
                                    setDockSettings((prev) => ({
                                        ...prev,
                                        iconSize: 56,
                                        magnifyStrength: 0.45,
                                        dockOpacity: 0.9,
                                    }))
                                }
                                className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-0.5 hover:border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                            >
                                Compact
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setDockSettings((prev) => ({
                                        ...prev,
                                        iconSize: 64,
                                        magnifyStrength: 0.6,
                                        dockOpacity: 0.92,
                                    }))
                                }
                                className="flex-1 rounded-lg border border-sky-200/80 bg-sky-50 px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-sky-100"
                            >
                                Balanced
                            </button>
                            <button
                                type="button"
                                onClick={() =>
                                    setDockSettings((prev) => ({
                                        ...prev,
                                        iconSize: 74,
                                        magnifyStrength: 0.8,
                                        dockOpacity: 0.95,
                                    }))
                                }
                                className="flex-1 rounded-lg border border-emerald-200/80 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100"
                            >
                                Showcase
                            </button>
                        </div>
                        <button
                            type="button"
                            onClick={() => setDockSettings(DEFAULT_SETTINGS)}
                            className="w-full rounded-lg border border-amber-200/70 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm transition hover:-translate-y-0.5 hover:border-amber-300 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100"
                        >
                            Reset
                        </button>
                    </div>
                </motion.div>
            ) : null}
        </nav>
    );
}
