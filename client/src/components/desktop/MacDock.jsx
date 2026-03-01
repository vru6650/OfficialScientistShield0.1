import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineBolt,
    HiOutlineMagnifyingGlass,
    HiOutlineSparkles,
    HiOutlineXMark,
} from 'react-icons/hi2';

import { renderWindowIcon } from './windowIcons';

const STATUS_TONES = Object.freeze({
    open: {
        badge: 'from-emerald-400/90 via-emerald-500/80 to-cyan-400/80',
        dot: 'bg-emerald-400',
        glow: 'shadow-[0_24px_60px_-28px_rgba(16,185,129,0.65)]',
    },
    minimized: {
        badge: 'from-amber-400/90 via-amber-500/80 to-orange-400/80',
        dot: 'bg-amber-300',
        glow: 'shadow-[0_24px_60px_-28px_rgba(251,191,36,0.6)]',
    },
    staged: {
        badge: 'from-sky-400/90 via-sky-500/80 to-cyan-400/80',
        dot: 'bg-sky-400',
        glow: 'shadow-[0_24px_60px_-28px_rgba(56,189,248,0.65)]',
    },
    closed: {
        badge: 'from-slate-500/80 via-slate-500/70 to-slate-400/70',
        dot: 'bg-slate-500/60',
        glow: 'shadow-[0_20px_48px_-26px_rgba(15,23,42,0.65)]',
    },
});

const BASE_VARIANT = {
    rest: { scale: 1, y: 0, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    hover: { scale: 1.15, y: -12, transition: { type: 'spring', stiffness: 260, damping: 20 } },
    focus: { scale: 1.05, y: -6, transition: { type: 'spring', stiffness: 260, damping: 24 } },
};

export default function MacDock({ entries, focusedId, onActivate, autoHide }) {
    const dockRef = useRef(null);
    const buttonRefs = useRef([]);
    const [hoveredIndex, setHoveredIndex] = useState(null);
    const [hoveredEntry, setHoveredEntry] = useState(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
    const [calmMode, setCalmMode] = useState(false);
    const [denseMode, setDenseMode] = useState(false);
    const [showControls, setShowControls] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [cursorX, setCursorX] = useState(null);
    const [spotlightX, setSpotlightX] = useState('50%');
    const [launchingKey, setLaunchingKey] = useState(null);
    const [hoverGeometry, setHoverGeometry] = useState({ left: null, width: null });
    const [magnifyStrength, setMagnifyStrength] = useState(0.5);
    const [iconSpacing, setIconSpacing] = useState(12);
    const [labelsAlways, setLabelsAlways] = useState(false);
    const [focusHalo, setFocusHalo] = useState(true);
    const [isInteracting, setIsInteracting] = useState(false);
    const [isRevealed, setIsRevealed] = useState(!autoHide);
    const hideTimerRef = useRef(null);

    const orderedEntries = useMemo(
        () =>
            entries.map((entry, index) => ({
                ...entry,
                label: entry.title || entry.id || entry.type || 'Dock item',
                key: `${entry.id ?? entry.type}-${index}`,
            })),
        [entries]
    );

    const filteredEntries = useMemo(() => {
        if (!searchTerm.trim()) return orderedEntries;
        const query = searchTerm.trim().toLowerCase();
        return orderedEntries.filter(
            (entry) =>
                entry.label.toLowerCase().includes(query) ||
                entry.status?.toLowerCase().includes(query) ||
                entry.type?.toLowerCase().includes(query)
        );
    }, [orderedEntries, searchTerm]);

    const activityCounts = useMemo(() => {
        const open = orderedEntries.filter((entry) => entry.status && entry.status !== 'closed').length;
        const minimized = orderedEntries.filter((entry) => entry.status === 'minimized').length;
        const closed = orderedEntries.filter((entry) => entry.status === 'closed').length;
        return { open, minimized, closed };
    }, [orderedEntries]);

    const hasPrimaryEntries = useMemo(() => filteredEntries.some((entry) => !entry.isUtility), [filteredEntries]);
    const hasUtilityEntries = useMemo(() => filteredEntries.some((entry) => entry.isUtility), [filteredEntries]);

    const liquidStrength = useMemo(() => {
        const base = 0.45 + magnifyStrength * 0.4;
        return Math.min(1, base + (hoveredEntry ? 0.18 : 0));
    }, [hoveredEntry, magnifyStrength]);

    const focusedEntry = useMemo(
        () =>
            orderedEntries.find((entry) => (entry.id ?? entry.type) === focusedId) || null,
        [focusedId, orderedEntries]
    );

    const activeAccentColor = useMemo(() => {
        const accentSource = hoveredEntry?.accent || focusedEntry?.accent;
        if (typeof accentSource === 'string' && accentSource.toLowerCase().includes('gradient')) {
            return 'var(--color-accent)';
        }
        if (typeof accentSource === 'string' && accentSource.trim().length > 0) {
            return accentSource;
        }
        return 'var(--color-accent)';
    }, [focusedEntry, hoveredEntry]);

    const activeAccentGradient = useMemo(() => {
        const accentSource = hoveredEntry?.accent || focusedEntry?.accent;
        if (typeof accentSource === 'string' && accentSource.toLowerCase().includes('gradient')) {
            return accentSource;
        }
        return 'var(--color-accent-gradient, var(--color-accent))';
    }, [focusedEntry, hoveredEntry]);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current && typeof window !== 'undefined') {
            window.clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const scheduleHide = useCallback(
        (delay = 900) => {
            if (!autoHide) return;
            clearHideTimer();
            if (typeof window === 'undefined') return;
            hideTimerRef.current = window.setTimeout(() => {
                if (!isInteracting) {
                    setIsRevealed(false);
                    setHoveredIndex(null);
                    setHoveredEntry(null);
                }
            }, delay);
        },
        [autoHide, clearHideTimer, isInteracting]
    );

    useEffect(() => {
        if (hoveredIndex === null) {
            return;
        }
        if (hoveredIndex >= filteredEntries.length) {
            setHoveredIndex(null);
            setHoveredEntry(null);
            return;
        }
        const candidate = filteredEntries[hoveredIndex];
        if (!candidate || (hoveredEntry && candidate.key !== hoveredEntry.key)) {
            setHoveredEntry(candidate ?? null);
        }
    }, [filteredEntries, hoveredEntry, hoveredIndex]);

    useEffect(() => {
        setHoveredIndex(null);
        setHoveredEntry(null);
    }, [searchTerm]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
        const update = () => setPrefersReducedMotion(mq.matches);
        update();
        mq.addEventListener('change', update);
        return () => mq.removeEventListener('change', update);
    }, []);

    useEffect(() => {
        if (!launchingKey || prefersReducedMotion) return undefined;
        const timeoutId = window.setTimeout(() => setLaunchingKey(null), 680);
        return () => window.clearTimeout(timeoutId);
    }, [launchingKey, prefersReducedMotion]);

    useEffect(() => {
        if (!autoHide) {
            setIsRevealed(true);
            clearHideTimer();
            return undefined;
        }
        setIsRevealed(false);
        scheduleHide(300);
        return clearHideTimer;
    }, [autoHide, clearHideTimer, scheduleHide]);

    useEffect(
        () => () => {
            clearHideTimer();
        },
        [clearHideTimer]
    );

    useEffect(() => {
        if (!autoHide || typeof window === 'undefined') return undefined;
        const handleEdgeReveal = (event) => {
            const edgeThreshold = 120;
            const viewportHeight = window.innerHeight || 0;
            if (event.clientY >= viewportHeight - edgeThreshold) {
                setIsRevealed(true);
                clearHideTimer();
            } else if (!isInteracting) {
                scheduleHide(1000);
            }
        };
        window.addEventListener('pointermove', handleEdgeReveal);
        return () => window.removeEventListener('pointermove', handleEdgeReveal);
    }, [autoHide, clearHideTimer, isInteracting, scheduleHide]);

    useEffect(() => {
        if (!autoHide) return undefined;
        if (isInteracting || showControls) {
            setIsRevealed(true);
            clearHideTimer();
            return undefined;
        }
        scheduleHide(1200);
        return undefined;
    }, [autoHide, clearHideTimer, isInteracting, scheduleHide, showControls]);

    const reduceAnimations = prefersReducedMotion || calmMode;

    const scaleForIndex = useCallback(
        (index) => {
            const magnetism = Math.max(0.2, Math.min(0.8, magnifyStrength));
            if (reduceAnimations) {
                return hoveredIndex === index ? 1 + magnetism * 0.26 : 1;
            }

            const node = buttonRefs.current[index];
            if (node && cursorX !== null) {
                const rect = node.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const distance = Math.abs(cursorX - center);
                const influence = Math.max(0, 1 - distance / 120);
                return 1 + magnetism * influence * influence * 1.1;
            }

            if (hoveredIndex === null) return 1;
            const distance = Math.abs(index - hoveredIndex);
            const primary = 1 + magnetism * 0.8;
            const near = 1 + magnetism * 0.42;
            const mid = 1 + magnetism * 0.18;
            if (distance === 0) return primary;
            if (distance === 1) return near;
            if (distance === 2) return mid;
            return 1;
        },
        [cursorX, hoveredIndex, magnifyStrength, reduceAnimations]
    );

    const tiltForIndex = useCallback(
        (index) => {
            if (reduceAnimations || cursorX === null) {
                return { rotateX: 0, rotateY: 0 };
            }

            const node = buttonRefs.current[index];
            if (!node) return { rotateX: 0, rotateY: 0 };

            const rect = node.getBoundingClientRect();
            const center = rect.left + rect.width / 2;
            const deltaX = cursorX - center;
            const ratio = Math.max(-1, Math.min(1, deltaX / (rect.width * 0.9)));

            return {
                rotateX: -Math.abs(ratio) * 8,
                rotateY: ratio * 10,
            };
        },
        [cursorX, reduceAnimations]
    );

    const updateHoverGeometry = useCallback(
        (index) => {
            if (buttonRefs.current[index] && dockRef.current) {
                const dockRect = dockRef.current.getBoundingClientRect();
                const iconRect = buttonRefs.current[index].getBoundingClientRect();
                const magnetism = Math.max(0.2, Math.min(0.8, magnifyStrength));
                const width = iconRect.width * (denseMode ? 1.25 : 1.45) * (1 + magnetism * 0.35);
                setHoverGeometry({
                    left: iconRect.left - dockRect.left + iconRect.width / 2,
                    width,
                });
            }
        },
        [denseMode, magnifyStrength]
    );

    useEffect(() => {
        if (hoveredIndex === null) return;
        updateHoverGeometry(hoveredIndex);
    }, [hoveredIndex, iconSpacing, magnifyStrength, updateHoverGeometry]);

    const updateSpotlight = useCallback((clientX) => {
        if (!dockRef.current) return;
        const rect = dockRef.current.getBoundingClientRect();
        const xRatio = (clientX - rect.left) / rect.width;
        if (!Number.isFinite(xRatio)) return;
        const clamped = Math.min(1, Math.max(0, xRatio));
        setSpotlightX(`${(clamped * 100).toFixed(2)}%`);
    }, []);

    const handleEnter = useCallback((entry, index, event) => {
        setIsInteracting(true);
        setIsRevealed(true);
        clearHideTimer();
        setHoveredIndex(index);
        setHoveredEntry(entry);
        if (event && typeof event.clientX === 'number') {
            updateSpotlight(event.clientX);
        } else {
            setSpotlightX('50%');
        }
        setCursorX(event?.clientX ?? null);
        updateHoverGeometry(index);
    }, [clearHideTimer, updateHoverGeometry, updateSpotlight]);

    const handleLeave = useCallback(() => {
        setHoveredIndex(null);
        setHoveredEntry(null);
        setSpotlightX('50%');
        setCursorX(null);
        setHoverGeometry({ left: null, width: null });
        setIsInteracting(false);
        scheduleHide(900);
    }, [scheduleHide]);

    const handleActivate = useCallback(
        (entry) => {
            if (!entry || entry.disabled) return;
            if (!prefersReducedMotion) {
                setLaunchingKey(entry.key);
            }
            onActivate(entry);
        },
        [onActivate, prefersReducedMotion]
    );

    const handlePointerMove = useCallback(
        (event) => {
            setIsInteracting(true);
            setIsRevealed(true);
            clearHideTimer();
            if (prefersReducedMotion) return;
            setCursorX(event.clientX);
            updateSpotlight(event.clientX);

            let closestIndex = null;
            let bestDistance = Infinity;

            filteredEntries.forEach((_, idx) => {
                const node = buttonRefs.current[idx];
                if (!node) return;
                const rect = node.getBoundingClientRect();
                const center = rect.left + rect.width / 2;
                const distance = Math.abs(event.clientX - center);
                if (distance < bestDistance) {
                    bestDistance = distance;
                    closestIndex = idx;
                }
            });

            if (closestIndex !== null && closestIndex !== hoveredIndex) {
                setHoveredIndex(closestIndex);
                setHoveredEntry(filteredEntries[closestIndex]);
                updateHoverGeometry(closestIndex);
            }
        },
        [clearHideTimer, filteredEntries, hoveredIndex, prefersReducedMotion, updateHoverGeometry, updateSpotlight]
    );

    const tooltipId = hoveredEntry ? `dock-tooltip-${hoveredEntry.key}` : undefined;
    const focusLabel = hoveredEntry ? hoveredEntry.label : focusedEntry?.label || 'Sequoia Dock';
    const summaryLabel = focusLabel;
    const summaryDetail = hoveredEntry
        ? hoveredEntry.description || 'Open from dock'
        : `${filteredEntries.length} icons • ${activityCounts.open} active • ${Math.round(magnifyStrength * 100)}% mag • ${Math.round(iconSpacing)}px lane`;
    const modeSummary = autoHide ? 'Edge reveal' : 'Pinned open';
    const motionSummary = calmMode ? 'Calm glass' : 'Playful bounce';
    const densitySummary = denseMode ? 'Compact lane' : 'Airy lane';
    const tuningSummary = `${Math.round(magnifyStrength * 100)}% magnify • ${Math.round(iconSpacing)}px spacing`;
    const activitySummary = `${activityCounts.open} running • ${activityCounts.minimized} resting • ${activityCounts.closed} parked`;

    const buttonSizeClass = denseMode ? 'h-14 w-14 rounded-[1.6rem]' : 'h-16 w-16 rounded-[1.9rem]';
    const innerSizeClass = denseMode ? 'h-10 w-10 rounded-[1.2rem]' : 'h-11 w-11 rounded-[1.35rem]';
    const labelOffsetClass = denseMode ? '-bottom-6' : '-bottom-7';

    const renderDockButton = (entry, index) => {
        const statusTone = STATUS_TONES[entry.status] || STATUS_TONES.closed;
        const scale = scaleForIndex(index);
        const isFocused = (entry.id ?? entry.type) === focusedId;
        const IconComponent = entry.iconComponent;
        const fallbackIcon = renderWindowIcon(entry.type, 'h-7 w-7');
        const glowClass = statusTone.glow || '';
        const showGlow = isFocused || hoveredIndex === index;
        const shadowClass = showGlow
            ? `${glowClass} shadow-[0_30px_84px_-52px_rgba(15,23,42,0.82)]`
            : 'shadow-[0_20px_58px_-36px_rgba(15,23,42,0.72)]';
        const accentOverlayStyle = entry.accent ? { background: entry.accent } : undefined;
        const dotStyle = entry.accent ? { background: entry.accent } : undefined;
        const showIndicator = entry.status && entry.status !== 'closed' && !entry.disabled;
        const isLaunching = launchingKey === entry.key && !reduceAnimations;
        const tilt = tiltForIndex(index);
        const baseLift = hoveredIndex === index ? -2 : isFocused ? -1 : 0;

        return (
            <motion.button
                key={entry.key}
                type="button"
                variants={BASE_VARIANT}
                initial="rest"
                animate="rest"
                whileHover={reduceAnimations ? undefined : 'hover'}
                whileTap={
                    reduceAnimations
                        ? undefined
                        : {
                              scale: 0.96,
                              y: -6,
                              transition: { type: 'spring', stiffness: 260, damping: 18 },
                          }
                }
                onHoverStart={(event) => handleEnter(entry, index, event)}
                onHoverEnd={handleLeave}
                onFocus={(event) => handleEnter(entry, index, event)}
                onBlur={handleLeave}
                onClick={() => handleActivate(entry)}
                onPointerMove={handlePointerMove}
                aria-describedby={hoveredEntry && hoveredEntry.key === entry.key ? tooltipId : undefined}
                className={`desktop-dock__button group relative flex ${buttonSizeClass} origin-bottom items-center justify-center text-slate-100 ${shadowClass} ${
                    entry.disabled ? 'desktop-dock__button--disabled' : ''
                } ${denseMode ? 'desktop-dock__button--compact' : ''} ${showGlow ? 'desktop-dock__button--lifted' : ''}`}
                style={{ transform: `scale(${scale})`, perspective: '1200px' }}
                aria-label={`Open ${entry.label}`}
                disabled={entry.disabled}
                ref={(el) => {
                    buttonRefs.current[index] = el;
                }}
            >
                <motion.span
                    className="desktop-dock__button-ambient"
                    style={{ background: entry.accent || 'var(--dock-active-accent)' }}
                    animate={{
                        opacity: showGlow ? 0.26 : 0.12,
                        scale: hoveredIndex === index ? 1.1 : 1,
                    }}
                    transition={{ duration: 0.22 }}
                    aria-hidden
                />
                {accentOverlayStyle ? (
                    <motion.div
                        className="pointer-events-none absolute inset-0 rounded-[1.7rem]"
                        style={accentOverlayStyle}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: showGlow ? 0.22 : 0.08 }}
                        transition={{ duration: 0.2 }}
                    />
                ) : null}
                <span className="desktop-dock__button-shine" aria-hidden />
                <motion.div
                    className={`flex ${innerSizeClass} items-center justify-center bg-slate-900/55 shadow-inner shadow-slate-900/50 backdrop-blur-md dark:bg-slate-950/65`}
                    style={{ transformStyle: 'preserve-3d' }}
                    animate={{
                        scale: isFocused ? 1.08 : hoveredIndex === index ? 1.02 : 1,
                        rotate: isFocused ? [0, 2, -2, 0] : 0,
                        rotateX: tilt.rotateX,
                        rotateY: tilt.rotateY,
                        y: isLaunching ? [-2, -18, 0, -12, -4, 0] : baseLift,
                    }}
                    transition={{
                        rotate: { repeat: isFocused ? Infinity : 0, duration: 4, ease: 'easeInOut' },
                        rotateX: { duration: 0.26, ease: 'easeOut' },
                        rotateY: { duration: 0.26, ease: 'easeOut' },
                        y: { duration: isLaunching ? 0.78 : 0.22, ease: 'easeOut' },
                        scale: { duration: 0.16, ease: 'easeOut' },
                    }}
                >
                    {IconComponent ? (
                        <IconComponent className="h-7 w-7 text-sky-100 drop-shadow" />
                    ) : fallbackIcon ? (
                        fallbackIcon
                    ) : (
                        <HiOutlineSparkles className="h-6 w-6 text-sky-300" />
                    )}
                </motion.div>
                <span className="desktop-dock__reflection" aria-hidden />
                <motion.span
                    className="absolute inset-0 rounded-2xl"
                    animate={{ borderColor: isFocused ? 'rgba(10,132,255,0.45)' : 'rgba(255,255,255,0.22)' }}
                    transition={{ duration: 0.24 }}
                    style={{
                        borderWidth: isFocused ? 2 : 1,
                        borderStyle: 'solid',
                    }}
                />
                {entry.badgeCount ? (
                    <span className="pointer-events-none absolute -right-1.5 -top-1.5 inline-flex min-w-[1.4rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.6rem] font-semibold text-white shadow-lg">
                        {entry.badgeCount > 99 ? '99+' : entry.badgeCount}
                    </span>
                ) : null}
                <AnimatePresence>
                    {showIndicator ? (
                        <motion.span
                            key="indicator"
                            className="desktop-dock__indicator"
                            style={dotStyle}
                            initial={{ opacity: 0, scale: 0.6 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.6 }}
                        />
                    ) : null}
                </AnimatePresence>
                <motion.div
                    className="pointer-events-none absolute inset-x-1 bottom-2 h-1 rounded-full bg-white/20"
                    animate={{ opacity: hoveredIndex === index ? 0.12 : 0.06 }}
                />
                <motion.div
                    className={`pointer-events-none absolute inset-x-0 bottom-0 h-12 rounded-b-2xl bg-gradient-to-t ${statusTone.badge}`}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredIndex === index || showIndicator ? 0.28 : isFocused ? 0.18 : 0 }}
                    transition={{ duration: 0.2 }}
                    style={{ mixBlendMode: 'screen' }}
                />
                <span className={`desktop-dock__label pointer-events-none absolute ${labelOffsetClass} left-1/2 w-max -translate-x-1/2 rounded-full bg-slate-900/82 px-3 py-1 text-[0.65rem] font-medium text-slate-100 ${labelsAlways ? 'opacity-100' : 'opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100'} shadow-md backdrop-blur transition dark:bg-slate-900/90`}>
                    {entry.label}
                </span>
            </motion.button>
        );
    };

    const dockItems = [];
    let dividerInserted = false;
    filteredEntries.forEach((entry, index) => {
        const shouldInsertDivider = hasPrimaryEntries && hasUtilityEntries && entry.isUtility && !dividerInserted;
        if (shouldInsertDivider) {
            dividerInserted = true;
            dockItems.push(
                <div
                    key="dock-divider"
                    className="desktop-dock__divider"
                    aria-hidden
                />
            );
        }
        dockItems.push(renderDockButton(entry, index));
    });

    return (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[70] flex justify-center">
            <motion.div
                ref={dockRef}
                className="desktop-dock pointer-events-auto relative px-6 py-4"
                data-interactive={isInteracting}
                data-autohide={autoHide ? 'true' : 'false'}
                data-hidden={autoHide && !isRevealed ? 'true' : 'false'}
                data-style="sequoia"
                style={{
                    '--dock-spotlight-x': spotlightX,
                    '--dock-liquid-strength': liquidStrength,
                    '--dock-active-accent': activeAccentColor,
                    '--dock-active-gradient': activeAccentGradient,
                    pointerEvents: isRevealed ? 'auto' : 'none',
                }}
                initial={{ opacity: 0, y: 20 }}
                animate={isRevealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 26, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 220, damping: 26 }}
                onPointerMove={handlePointerMove}
                onMouseLeave={handleLeave}
                onPointerLeave={handleLeave}
                aria-hidden={autoHide && !isRevealed}
            >
                <div className="pointer-events-auto absolute -top-24 right-3 z-[5] flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setShowControls((open) => !open)}
                        className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-lg backdrop-blur hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:text-sky-200"
                    >
                        <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                        Dock Controls
                    </button>
                    <div className="rounded-full border border-white/40 bg-white/70 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-slate-900/80 dark:text-slate-200">
                        {autoHide ? 'Auto-hide on' : 'Pinned'} | {activityCounts.open} open | {activityCounts.closed} hidden
                    </div>
                </div>

                <AnimatePresence>
                    {showControls ? (
                        <motion.div
                            key="dock-controls"
                            drag
                            dragMomentum={false}
                            dragElastic={0.12}
                            dragConstraints={{ top: -260, bottom: 40, left: -220, right: 220 }}
                            className="pointer-events-auto absolute -top-64 right-3 z-[6] w-72 max-h-[360px] overflow-y-auto rounded-2xl border border-white/40 bg-white/90 p-4 text-xs text-slate-700 shadow-2xl backdrop-blur dark:border-white/12 dark:bg-slate-900/90 dark:text-slate-200"
                            initial={{ opacity: 0, y: 10, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.98 }}
                            transition={{ duration: 0.18 }}
                            style={{
                                borderColor: 'color-mix(in srgb, var(--dock-active-accent) 25%, rgba(255,255,255,0.4))',
                                boxShadow: `0 18px 50px -28px ${activeAccentColor}, 0 10px 30px -24px rgba(15,23,42,0.45)`,
                                backgroundImage: `linear-gradient(160deg, color-mix(in srgb, var(--dock-active-gradient) 35%, rgba(255,255,255,0.92)), rgba(255,255,255,0.9))`,
                            }}
                        >
                            <div className="relative overflow-hidden rounded-xl border border-white/60 bg-white/85 p-3 shadow-inner dark:border-white/10 dark:bg-slate-800/70">
                                <div
                                    className="pointer-events-none absolute inset-0 opacity-80"
                                    style={{
                                        background: `radial-gradient(120% 80% at 18% 12%, rgba(255,255,255,0.48), transparent 52%), radial-gradient(120% 90% at 82% 6%, color-mix(in srgb, ${activeAccentColor} 65%, rgba(255,255,255,0.24)), transparent 62%)`,
                                    }}
                                />
                                <div className="relative flex items-start justify-between gap-3">
                                    <div>
                                        <p className="text-[0.58rem] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">Dock Control Center</p>
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">The dock follows your theme</p>
                                        <p className="text-[11px] text-slate-500 dark:text-slate-400">Accent, glow, and glass sync with the active palette.</p>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600 shadow-sm dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-100">
                                        <span className="h-2.5 w-2.5 rounded-full shadow-[0_0_0_6px_rgba(255,255,255,0.2)]" style={{ background: activeAccentColor }} />
                                        Live Accent
                                    </span>
                                </div>
                            </div>
                            <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] font-semibold">
                                <div className="desktop-dock__control-chip">
                                    <span className="desktop-dock__control-chip-label">Presence</span>
                                    <span className="desktop-dock__control-chip-value">{modeSummary}</span>
                                </div>
                                <div className="desktop-dock__control-chip">
                                    <span className="desktop-dock__control-chip-label">Motion</span>
                                    <span className="desktop-dock__control-chip-value">{motionSummary}</span>
                                </div>
                                <div className="desktop-dock__control-chip desktop-dock__control-chip--accent">
                                    <span className="desktop-dock__control-chip-label">Feel</span>
                                    <span className="desktop-dock__control-chip-value">{tuningSummary}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-[0.6rem] uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Layout</p>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-50">Dock Control Center</p>
                                </div>
                                <button
                                    type="button"
                                    aria-label="Close dock controls"
                                    onClick={() => setShowControls(false)}
                                    className="rounded-full border border-slate-200 bg-white/80 p-1 text-slate-500 shadow-sm transition hover:-translate-y-0.5 hover:border-sky-200 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-300 dark:hover:border-sky-500/40 dark:hover:text-sky-200"
                                >
                                    <HiOutlineXMark className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mt-3 space-y-2">
                                <button
                                    type="button"
                                    onClick={() => setDenseMode((val) => !val)}
                                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
                                        denseMode
                                            ? 'border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/40 dark:text-sky-100'
                                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100'
                                    }`}
                                >
                                    <span>Compact icons</span>
                                    <span className="text-[11px] uppercase tracking-[0.18em]">{denseMode ? 'On' : 'Off'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCalmMode((val) => !val)}
                                    className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-sm font-semibold transition hover:-translate-y-0.5 ${
                                        calmMode
                                            ? 'border-amber-200/80 bg-amber-50 text-amber-700 dark:border-amber-500/40 dark:bg-amber-900/30 dark:text-amber-100'
                                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100'
                                    }`}
                                >
                                    <span>Calm motion</span>
                                    <span className="text-[11px] uppercase tracking-[0.18em]">{calmMode ? 'On' : 'Off'}</span>
                                </button>
                            </div>

                            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50/80 p-3 text-[11px] leading-5 text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300">
                                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-white">
                                    <HiOutlineBolt className="h-4 w-4 text-amber-500" />
                                    Live activity
                                </div>
                                <p className="mt-1">Open {activityCounts.open} | Minimized {activityCounts.minimized} | Hidden {activityCounts.closed}</p>
                                <p>Auto-hide {autoHide ? 'enabled' : 'off'} | {filteredEntries.length} visible</p>
                                <p>Magnify {Math.round(magnifyStrength * 100)}% • Spacing {Math.round(iconSpacing)}px</p>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2">
                                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-inner dark:border-slate-800 dark:bg-slate-800/60">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        <span>Magnify strength</span>
                                        <span>{Math.round(magnifyStrength * 100)}%</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0.2"
                                        max="0.8"
                                        step="0.05"
                                        value={magnifyStrength}
                                        onChange={(event) => setMagnifyStrength(Number(event.target.value))}
                                        className="mt-2 w-full"
                                        aria-label="Adjust dock magnification strength"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Increase for dramatic bounce, lower for subtlety.</p>
                                </div>
                                <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-inner dark:border-slate-800 dark:bg-slate-800/60">
                                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                                        <span>Icon spacing</span>
                                        <span>{Math.round(iconSpacing)}px</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="8"
                                        max="24"
                                        step="1"
                                        value={iconSpacing}
                                        onChange={(event) => setIconSpacing(Number(event.target.value))}
                                        className="mt-2 w-full"
                                        aria-label="Adjust dock icon spacing"
                                    />
                                    <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">Wider spacing for focus or tighter for density.</p>
                                </div>
                            </div>

                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm font-semibold">
                                <button
                                    type="button"
                                    onClick={() => setLabelsAlways((value) => !value)}
                                    className={`flex items-center justify-between rounded-xl border px-3 py-2 transition hover:-translate-y-0.5 ${
                                        labelsAlways
                                            ? 'border-emerald-200/80 bg-emerald-50 text-emerald-700 dark:border-emerald-500/40 dark:bg-emerald-900/30 dark:text-emerald-100'
                                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100'
                                    }`}
                                >
                                    <span>Persistent labels</span>
                                    <span className="text-[11px] uppercase tracking-[0.18em]">{labelsAlways ? 'Pinned' : 'On hover'}</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFocusHalo((value) => !value)}
                                    className={`flex items-center justify-between rounded-xl border px-3 py-2 transition hover:-translate-y-0.5 ${
                                        focusHalo
                                            ? 'border-sky-200/80 bg-sky-50 text-sky-700 dark:border-sky-500/40 dark:bg-sky-900/30 dark:text-sky-100'
                                            : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100'
                                    }`}
                                >
                                    <span>Focus halo</span>
                                    <span className="text-[11px] uppercase tracking-[0.18em]">{focusHalo ? 'Glowing' : 'Minimal'}</span>
                                </button>
                            </div>

                            <div className="mt-3 grid grid-cols-3 gap-2 text-xs font-semibold">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMagnifyStrength(0.35);
                                        setIconSpacing(10);
                                        setCalmMode(true);
                                        setDenseMode(true);
                                        setLabelsAlways(false);
                                        setFocusHalo(false);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-amber-200 hover:bg-amber-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-amber-500/40 dark:hover:bg-amber-900/30"
                                >
                                    Minimal
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMagnifyStrength(0.5);
                                        setIconSpacing(12);
                                        setCalmMode(false);
                                        setDenseMode(false);
                                        setLabelsAlways(false);
                                        setFocusHalo(true);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-200 hover:bg-sky-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-sky-500/40 dark:hover:bg-sky-900/30"
                                >
                                    Balanced
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setMagnifyStrength(0.72);
                                        setIconSpacing(16);
                                        setCalmMode(false);
                                        setDenseMode(false);
                                        setLabelsAlways(true);
                                        setFocusHalo(true);
                                    }}
                                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:hover:border-emerald-500/40 dark:hover:bg-emerald-900/30"
                                >
                                    Showcase
                                </button>
                            </div>

                            <div className="mt-3 relative">
                                <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(event) => setSearchTerm(event.target.value)}
                                    placeholder="Filter apps or tools..."
                                    className="w-full rounded-xl border border-slate-200 bg-white/90 py-2 pl-9 pr-3 text-sm text-slate-700 shadow-inner focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-200 dark:border-slate-700 dark:bg-slate-800/80 dark:text-slate-100 dark:focus:border-sky-500 dark:focus:ring-sky-500/30"
                                    />
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>

                <div className="desktop-dock__meta">
                    <div className="desktop-dock__meta-chip">
                        <span className="desktop-dock__meta-label">Presence</span>
                        <span className="desktop-dock__meta-value">{modeSummary}</span>
                        <span className="desktop-dock__meta-sub">{motionSummary}</span>
                    </div>
                    <div className="desktop-dock__meta-chip">
                        <span className="desktop-dock__meta-label">Flow</span>
                        <span className="desktop-dock__meta-value">{densitySummary}</span>
                        <span className="desktop-dock__meta-sub">{tuningSummary}</span>
                    </div>
                    <div className="desktop-dock__meta-chip desktop-dock__meta-chip--accent">
                        <span className="desktop-dock__meta-label">Focus</span>
                        <span className="desktop-dock__meta-value">{focusLabel}</span>
                        <span className="desktop-dock__meta-sub">{activitySummary}</span>
                        <span className="desktop-dock__meta-glow" style={{ background: activeAccentGradient }} aria-hidden />
                    </div>
                </div>

                <div className="desktop-dock__floor" aria-hidden />
                <div className="desktop-dock__halo" aria-hidden />
                <div className="desktop-dock__spotlight" aria-hidden />
                <div className="desktop-dock__aura" aria-hidden />
                <div className="desktop-dock__beams" aria-hidden />
                <div className="desktop-dock__mesh" aria-hidden />
                <div className="desktop-dock__ribbon" aria-hidden />
                <div className="desktop-dock__liquid" aria-hidden />
                <div className="desktop-dock__wave" aria-hidden />
                <div className="desktop-dock__sheen" aria-hidden />
                <div className="desktop-dock__base" aria-hidden />
                <div className="desktop-dock__glare" aria-hidden />
                <div className="desktop-dock__grain" aria-hidden />
                <AnimatePresence>
                    {focusHalo && hoverGeometry.left !== null ? (
                        <motion.span
                            key="dock-focus"
                            className="desktop-dock__focus"
                            style={{ left: hoverGeometry.left, width: hoverGeometry.width || 88 }}
                            initial={{ opacity: 0, scaleX: 0.82 }}
                            animate={{ opacity: 1, scaleX: 1 }}
                            exit={{ opacity: 0, scaleX: 0.82 }}
                            transition={{ duration: 0.18 }}
                            aria-hidden
                        />
                    ) : null}
                </AnimatePresence>
                <div className="desktop-dock__caption">
                    <span className="desktop-dock__caption-pill">Dock</span>
                    <div className="desktop-dock__caption-text">
                        <span className="desktop-dock__caption-label">{summaryLabel}</span>
                        <span className="desktop-dock__caption-detail">{summaryDetail}</span>
                    </div>
                </div>
                <AnimatePresence>
                    {hoveredEntry ? (
                        <motion.div
                            key={hoveredEntry.key}
                            id={tooltipId}
                            className="pointer-events-none absolute -top-20 w-max max-w-[260px] -translate-x-1/2 rounded-2xl border border-white/25 bg-white/85 px-4 py-3 text-xs font-medium text-slate-900 shadow-[0_22px_44px_-26px_rgba(15,23,42,0.65)] backdrop-blur-lg dark:border-white/12 dark:bg-slate-900/85 dark:text-slate-100"
                            style={{ left: hoverGeometry.left ?? '50%' }}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 8 }}
                            transition={{ duration: 0.18 }}
                        >
                            <span
                                className="desktop-dock__tooltip-accent"
                                aria-hidden
                                style={{ background: hoveredEntry.accent || activeAccentGradient }}
                            />
                            <div className="flex items-center gap-2 text-sm font-semibold">
                                <span className="truncate max-w-[200px]" title={hoveredEntry.label}>
                                    {hoveredEntry.label}
                                </span>
                                {hoveredEntry.badgeCount ? (
                                    <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[0.65rem] font-semibold text-white">
                                        {hoveredEntry.badgeCount > 99 ? '99+' : hoveredEntry.badgeCount}
                                    </span>
                                ) : null}
                            </div>
                            <p className="mt-1 text-[0.65rem] uppercase tracking-[0.26em] text-slate-300">
                                {hoveredEntry.description}
                            </p>
                            <p className="mt-1 text-[0.58rem] uppercase tracking-[0.26em] text-slate-400">
                                {hoveredEntry.status ? hoveredEntry.status : 'Ready'}
                            </p>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
                <div className="desktop-dock__rail" aria-hidden />
                {filteredEntries.length === 0 ? (
                    <div className="relative z-[2] rounded-2xl border border-dashed border-slate-300/70 bg-white/70 px-4 py-3 text-sm font-semibold text-slate-500 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
                        No apps match your filter. Clear it to show all shortcuts.
                    </div>
                ) : (
                    <div className="relative z-[2] flex items-end gap-3 px-2" style={{ gap: `${iconSpacing}px` }}>
                        {dockItems}
                    </div>
                )}
            </motion.div>
        </div>
    );
}

MacDock.propTypes = {
    entries: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string,
            type: PropTypes.string,
            title: PropTypes.string,
            status: PropTypes.string.isRequired,
            iconComponent: PropTypes.elementType,
            disabled: PropTypes.bool,
            description: PropTypes.string,
            badgeCount: PropTypes.number,
        })
    ).isRequired,
    focusedId: PropTypes.string,
    onActivate: PropTypes.func.isRequired,
    autoHide: PropTypes.bool,
};

MacDock.defaultProps = {
    focusedId: null,
    autoHide: false,
};
