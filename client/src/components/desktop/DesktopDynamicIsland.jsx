import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
    HiOutlineBolt,
    HiOutlineCursorArrowRays,
    HiOutlineLockClosed,
} from 'react-icons/hi2';
import paletteGlyph from '../../assets/dynamic-island/palette.svg';
import missionGlyph from '../../assets/dynamic-island/mission.svg';
import switcherGlyph from '../../assets/dynamic-island/switcher.svg';
import previewGlyph from '../../assets/dynamic-island/preview.svg';
import controlsGlyph from '../../assets/dynamic-island/controls.svg';
import pinGlyph from '../../assets/dynamic-island/pin.svg';
import genericGlyph from '../../assets/dynamic-island/generic.svg';

const DEFAULT_ACCENT =
    'linear-gradient(135deg, color-mix(in srgb, var(--color-accent, #1694ff) 78%, rgba(255,255,255,0.18)), color-mix(in srgb, var(--liquid-accent-secondary, #7e98ff) 66%, rgba(255,255,255,0.12)), color-mix(in srgb, var(--liquid-amber, #f3aa3c) 28%, rgba(255,255,255,0.08)))';
const DEFAULT_AUTO_HIDE_DELAY_MS = 2600;
const DEFAULT_REVEAL_THRESHOLD_PX = 56;

const BADGE_TONE_CLASSES = {
    neutral: 'border-white/12 bg-white/[0.08] text-white/68',
    accent: 'border-cyan-200/20 bg-cyan-300/14 text-cyan-50',
};

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

function isEditableTarget(target) {
    return Boolean(
        target &&
            (target instanceof HTMLInputElement ||
                target instanceof HTMLTextAreaElement ||
                target instanceof HTMLSelectElement ||
                target.isContentEditable)
    );
}

function isInteractiveTarget(target) {
    return Boolean(
        target instanceof Element &&
            target.closest('button, a, input, textarea, select, [role="button"], [role="link"]')
    );
}

function MeterBars({ reduceMotion }) {
    const bars = [0.42, 0.78, 0.58, 0.9];

    return (
        <div className="flex h-7 items-end gap-1" aria-hidden="true">
            {bars.map((bar, index) => (
                <motion.span
                    key={index}
                    className="w-1 rounded-full bg-white/78 shadow-[0_0_16px_rgba(125,211,252,0.22)]"
                    style={{ transformOrigin: 'bottom', height: '100%' }}
                    initial={false}
                    animate={
                        reduceMotion
                            ? { scaleY: bar }
                            : { scaleY: [Math.max(bar - 0.18, 0.18), bar, Math.max(bar - 0.1, 0.22)] }
                    }
                    transition={
                        reduceMotion
                            ? { duration: 0 }
                            : {
                                  duration: 1.65,
                                  repeat: Infinity,
                                  repeatType: 'mirror',
                                  delay: index * 0.11,
                                  ease: 'easeInOut',
                              }
                    }
                />
            ))}
        </div>
    );
}

MeterBars.propTypes = {
    reduceMotion: PropTypes.bool,
};

MeterBars.defaultProps = {
    reduceMotion: false,
};

function glyphForActionKey(actionKey) {
    switch (actionKey) {
        case 'mission':
            return missionGlyph;
        case 'switcher':
            return switcherGlyph;
        case 'preview':
            return previewGlyph;
        case 'controls':
            return controlsGlyph;
        case 'pin':
            return pinGlyph;
        default:
            return genericGlyph;
    }
}

function actionStateLabel(action) {
    if (!action) {
        return '';
    }

    if (action.active) {
        return 'Live';
    }

    if (action.disabled) {
        return 'Unavailable';
    }

    return 'Ready';
}

function ActionIconButton({
    glyph,
    label,
    hint,
    active,
    disabled,
    pressed,
    onClick,
    onFocus,
    onMouseEnter,
    reduceMotion,
    className,
    size,
}) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            onFocus={onFocus}
            onMouseEnter={onMouseEnter}
            aria-label={label}
            aria-pressed={pressed}
            disabled={disabled}
            title={hint ? `${label} (${hint})` : label}
            className={classNames(
                'dynamic-island-icon-button',
                size === 'large' && 'dynamic-island-icon-button--large',
                active && 'dynamic-island-icon-button--active',
                disabled && 'cursor-not-allowed opacity-45',
                className
            )}
            whileHover={
                reduceMotion || disabled
                    ? undefined
                    : { scale: 1.06, translateY: -4, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }
            }
            whileTap={
                reduceMotion || disabled
                    ? undefined
                    : { scale: 0.95, translateY: -1, transition: { duration: 0.12, ease: 'easeOut' } }
            }
        >
            <span className="dynamic-island-icon-button__icon" aria-hidden="true">
                <img src={glyph} alt="" className="dynamic-island-dock-glyph" />
            </span>
            <span className="dynamic-island-icon-button__label">{label}</span>
            {hint ? <span className="dynamic-island-icon-button__hint">{hint}</span> : null}
        </motion.button>
    );
}

ActionIconButton.propTypes = {
    glyph: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    pressed: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onMouseEnter: PropTypes.func,
    reduceMotion: PropTypes.bool,
    className: PropTypes.string,
    size: PropTypes.oneOf(['default', 'large']),
};

ActionIconButton.defaultProps = {
    hint: '',
    active: false,
    disabled: false,
    pressed: undefined,
    onFocus: undefined,
    onMouseEnter: undefined,
    reduceMotion: false,
    className: '',
    size: 'default',
};

function ActionRailButton({
    label,
    hint,
    icon,
    active,
    disabled,
    compact,
    onClick,
    onFocus,
    onMouseEnter,
    reduceMotion,
}) {
    return (
        <motion.button
            type="button"
            onClick={onClick}
            onFocus={onFocus}
            onMouseEnter={onMouseEnter}
            disabled={disabled}
            aria-label={label}
            className={classNames(
                'dynamic-island-rail-button',
                compact && 'dynamic-island-rail-button--compact',
                active && 'dynamic-island-rail-button--active',
                disabled && 'cursor-not-allowed opacity-55',
            )}
            whileHover={
                reduceMotion || disabled
                    ? undefined
                    : { y: -2, scale: 1.01, transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] } }
            }
            whileTap={
                reduceMotion || disabled
                    ? undefined
                    : { y: 0, scale: 0.985, transition: { duration: 0.12, ease: 'easeOut' } }
            }
        >
            <span className="dynamic-island-rail-button__icon" aria-hidden="true">
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="dynamic-island-rail-button__title">{label}</span>
                <span className="dynamic-island-rail-button__meta">
                    <span className="dynamic-island-rail-button__state">{actionStateLabel({ active, disabled })}</span>
                    {hint ? <span className="dynamic-island-rail-button__hint">{hint}</span> : null}
                </span>
            </span>
        </motion.button>
    );
}

ActionRailButton.propTypes = {
    label: PropTypes.string.isRequired,
    hint: PropTypes.string,
    icon: PropTypes.node.isRequired,
    active: PropTypes.bool,
    disabled: PropTypes.bool,
    compact: PropTypes.bool,
    onClick: PropTypes.func.isRequired,
    onFocus: PropTypes.func,
    onMouseEnter: PropTypes.func,
    reduceMotion: PropTypes.bool,
};

ActionRailButton.defaultProps = {
    hint: '',
    active: false,
    disabled: false,
    compact: false,
    onFocus: undefined,
    onMouseEnter: undefined,
    reduceMotion: false,
};

export default function DesktopDynamicIsland({
    className,
    summary,
    actions,
    stats,
    onPrimaryAction,
    primaryActionLabel,
    primaryHint,
    forceExpanded,
    reduceMotion,
    surfacePreset,
    autoHide,
    autoHideDelayMs,
    revealThresholdPx,
    pinPersistKey,
    onPinChange,
}) {
    const [autoHideEnabled, setAutoHideEnabled] = useState(false);
    const [isAutoHidden, setIsAutoHidden] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [hasFocusWithin, setHasFocusWithin] = useState(false);
    const [isPointerNearTop, setIsPointerNearTop] = useState(false);
    const [isPinnedOpen, setIsPinnedOpen] = useState(() => {
        if (!pinPersistKey || typeof window === 'undefined') {
            return false;
        }

        try {
            return window.localStorage.getItem(pinPersistKey) === 'true';
        } catch {
            return false;
        }
    });
    const [spotlightKey, setSpotlightKey] = useState(null);
    const resolvedAutoHideDelay = Math.max(
        0,
        Number.isFinite(Number(autoHideDelayMs))
            ? Number(autoHideDelayMs)
            : DEFAULT_AUTO_HIDE_DELAY_MS,
    );
    const resolvedRevealThreshold = Math.max(
        0,
        Number.isFinite(Number(revealThresholdPx))
            ? Number(revealThresholdPx)
            : DEFAULT_REVEAL_THRESHOLD_PX,
    );
    const autoHideActive = autoHide && autoHideEnabled;
    const expanded = forceExpanded || isPinnedOpen || isHovered || hasFocusWithin;
    const SummaryIcon = summary?.IconComponent || null;
    const accent = summary?.accent || DEFAULT_ACCENT;
    const badgeTone = summary?.badgeTone || 'neutral';
    const progress = Number.isFinite(summary?.progress) ? Math.min(Math.max(summary.progress, 0), 1) : null;
    const transition = useMemo(
        () =>
            reduceMotion
                ? { duration: 0 }
                : { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
        [reduceMotion]
    );
    const islandStyle = useMemo(() => ({ '--dynamic-island-accent': accent }), [accent]);
    const visibleStats = stats.slice(0, 3);
    const prioritizedActions = useMemo(() => {
        return [...actions].sort((left, right) => {
            const activeDelta = Number(Boolean(right.active)) - Number(Boolean(left.active));
            if (activeDelta !== 0) {
                return activeDelta;
            }

            const disabledDelta = Number(Boolean(left.disabled)) - Number(Boolean(right.disabled));
            if (disabledDelta !== 0) {
                return disabledDelta;
            }

            return 0;
        });
    }, [actions]);
    const availableActions = useMemo(
        () => prioritizedActions.filter((action) => !action.disabled),
        [prioritizedActions]
    );
    const availableActionCount = availableActions.length;
    const activeActionCount = prioritizedActions.filter((action) => action.active).length;
    const collapsedQuickActions = useMemo(
        () => availableActions.slice(0, Math.min(3, availableActions.length)),
        [availableActions],
    );
    const spotlightAction = useMemo(
        () =>
            prioritizedActions.find((action) => action.key === spotlightKey) ||
            prioritizedActions.find((action) => action.active) ||
            prioritizedActions[0] ||
            null,
        [prioritizedActions, spotlightKey]
    );
    const secondarySpotlightAction = useMemo(
        () =>
            prioritizedActions.find(
                (action) => action.key !== spotlightAction?.key && (!action.disabled || action.active),
            ) || null,
        [prioritizedActions, spotlightAction],
    );
    const collapsedRailActions = useMemo(
        () =>
            [spotlightAction, secondarySpotlightAction]
                .filter(Boolean)
                .filter((action, index, actionList) => index === actionList.findIndex((item) => item.key === action.key)),
        [secondarySpotlightAction, spotlightAction],
    );
    const expandedRailActions = useMemo(
        () =>
            prioritizedActions
                .slice(0, Math.min(3, prioritizedActions.length))
                .filter((action, index, actionList) => index === actionList.findIndex((item) => item.key === action.key)),
        [prioritizedActions],
    );
    const extraActionCount = Math.max(availableActionCount - collapsedQuickActions.length, 0);
    const shouldKeepVisible =
        forceExpanded || isPinnedOpen || isHovered || hasFocusWithin || isPointerNearTop || !autoHideActive;
    const autoHidden = autoHideActive && isAutoHidden && !expanded && !isPointerNearTop && !forceExpanded;
    const shellInitial = useMemo(() => (reduceMotion ? false : { opacity: 0, y: -12, scale: 0.97 }), [reduceMotion]);
    const shellAnimate = useMemo(
        () =>
            reduceMotion
                ? {}
                : {
                      opacity: 1,
                      y: autoHidden ? -6 : 0,
                      scale: expanded ? 1 : 0.995,
                  },
        [autoHidden, expanded, reduceMotion]
    );
    const summaryIconStyle = useMemo(
        () => (progress !== null ? { '--dynamic-island-progress': `${Math.round(progress * 100)}%` } : undefined),
        [progress],
    );
    useEffect(() => {
        setSpotlightKey((currentKey) => {
            if (currentKey && prioritizedActions.some((action) => action.key === currentKey)) {
                return currentKey;
            }

            const fallback = prioritizedActions.find((action) => action.active) || prioritizedActions[0] || null;
            return fallback ? fallback.key : null;
        });
    }, [prioritizedActions]);
    const actionAvailabilityLabel =
        activeActionCount > 0
            ? `${activeActionCount} live controls ready`
            : availableActionCount > 0
                ? `${availableActionCount} quick controls ready`
                : 'No quick controls available';
    const dockStyle = useMemo(() => ({ '--dynamic-island-dock-accent': accent }), [accent]);
    const revealStatusLabel = autoHideActive
        ? autoHidden
            ? 'Reveal from the top edge'
            : 'Auto-hide tracks the top edge'
        : 'Desktop controls stay visible';
    const keyboardHints = useMemo(() => {
        const hints = [];

        if (primaryHint) {
            hints.push({
                key: 'palette',
                label: 'Palette',
                value: primaryHint,
                accent: true,
            });
        }

        availableActions.forEach((action) => {
            if (!action.hint || hints.length >= 4) {
                return;
            }

            hints.push({
                key: action.key,
                label: action.shortLabel || action.label,
                value: action.hint,
                accent: Boolean(action.active),
            });
        });

        if (hints.length < 4) {
            hints.push({
                key: 'pin',
                label: 'Pin',
                value: 'P',
                accent: isPinnedOpen,
            });
        }

        return hints.slice(0, 4);
    }, [availableActions, isPinnedOpen, primaryHint]);
    const presence = useMemo(() => {
        if (isPinnedOpen) {
            return {
                label: 'Pinned',
                detail: 'Island stays open until you collapse it.',
                accent: true,
                IconComponent: HiOutlineLockClosed,
            };
        }

        if (autoHideActive && autoHidden) {
            return {
                label: 'Peek',
                detail: 'Move to the top edge or focus the island to reveal it.',
                accent: false,
                IconComponent: HiOutlineCursorArrowRays,
            };
        }

        if (forceExpanded) {
            return {
                label: 'Focused',
                detail: 'Workspace controls are expanded around the current task.',
                accent: true,
                IconComponent: HiOutlineBolt,
            };
        }

        if (activeActionCount > 0) {
            return {
                label: 'Live',
                detail: `${activeActionCount} live control${activeActionCount === 1 ? '' : 's'} ready.`,
                accent: true,
                IconComponent: HiOutlineBolt,
            };
        }

        if (autoHideActive) {
            return {
                label: 'Adaptive',
                detail: 'The island tucks away until your pointer reaches the top edge.',
                accent: false,
                IconComponent: HiOutlineCursorArrowRays,
            };
        }

        return {
            label: 'Ready',
            detail: 'Desktop controls stay available while you work.',
            accent: false,
            IconComponent: HiOutlineBolt,
        };
    }, [activeActionCount, autoHideActive, autoHidden, forceExpanded, isPinnedOpen]);
    const PresenceIcon = presence.IconComponent || HiOutlineBolt;
    const compactSignalItems = useMemo(() => {
        const items = [];

        if (summary?.progressLabel) {
            items.push({
                key: 'progress-label',
                label: summary.progressLabel,
                accent: true,
            });
        }

        visibleStats.forEach((stat) => {
            const tokenValue = stat.value || stat.sub;
            if (!tokenValue || items.length >= 3) {
                return;
            }

            items.push({
                key: stat.key,
                label: `${stat.label} ${tokenValue}`.trim(),
                accent: stat.tone === 'accent',
            });
        });

        if (items.length < 3) {
            items.push({
                key: 'presence-detail',
                label: presence.detail,
                accent: false,
            });
        }

        return items.slice(0, 3);
    }, [presence.detail, summary?.progressLabel, visibleStats]);
    const compactTelemetryCopy = useMemo(() => {
        if (summary?.progressLabel) {
            return summary.progressLabel;
        }

        if (spotlightAction?.description) {
            return spotlightAction.description;
        }

        return presence.detail;
    }, [presence.detail, spotlightAction?.description, summary?.progressLabel]);
    const summaryChips = useMemo(() => {
        const chips = [];

        if (summary?.badge) {
            chips.push({
                key: 'badge',
                label: summary.badge,
                accent: badgeTone === 'accent',
            });
        }

        chips.push({
            key: 'presence',
            label: presence.label,
            accent: presence.accent,
        });

        if (activeActionCount > 0) {
            chips.push({
                key: 'active-actions',
                label: `${activeActionCount} live`,
                accent: true,
            });
        }

        visibleStats.forEach((stat) => {
            if (chips.length >= 4) {
                return;
            }

            const tokenValue = stat.value || stat.sub;
            if (!tokenValue) {
                return;
            }

            chips.push({
                key: stat.key,
                label: `${stat.label} ${tokenValue}`.trim(),
                accent: stat.tone === 'accent',
            });
        });

        if (chips.length === 0 && primaryHint) {
            chips.push({
                key: 'primary-hint',
                label: primaryHint,
                accent: false,
            });
        }

        return chips.slice(0, expanded ? 4 : 2);
    }, [activeActionCount, badgeTone, expanded, presence, primaryHint, summary?.badge, visibleStats]);
    const statusStripItems = useMemo(() => {
        const items = [];

        if (summary?.badge) {
            items.push({
                key: 'summary-badge',
                label: summary.badge,
                accent: badgeTone === 'accent',
            });
        }

        items.push({
            key: 'presence',
            label: presence.label,
            accent: presence.accent,
        });

        items.push({
            key: 'palette',
            label: `Palette ${primaryHint}`,
            accent: false,
        });

        items.push({
            key: 'actions',
            label: `${availableActionCount} quick actions`,
            accent: false,
        });

        visibleStats.slice(0, 1).forEach((stat) => {
            const tokenValue = stat.value || stat.sub;
            if (!tokenValue) {
                return;
            }

            items.push({
                key: `status-${stat.key}`,
                label: `${stat.label} ${tokenValue}`.trim(),
                accent: stat.tone === 'accent',
            });
        });

        return items.slice(0, 4);
    }, [availableActionCount, badgeTone, presence, primaryHint, summary?.badge, visibleStats]);
    const tickerItems = useMemo(() => statusStripItems.slice(0, 3), [statusStripItems]);

    const togglePinnedOpen = useCallback(() => {
        setIsPinnedOpen((currentValue) => !currentValue);
        setIsAutoHidden(false);
    }, []);

    const triggerPrimaryAction = useCallback(() => {
        setIsAutoHidden(false);
        onPrimaryAction();
    }, [onPrimaryAction]);

    const triggerQuickAction = useCallback((action) => {
        if (!action || action.disabled || typeof action.onClick !== 'function') {
            return;
        }

        setIsAutoHidden(false);
        action.onClick();
    }, []);
    const spotlightShortcut = useMemo(() => {
        if (!spotlightAction) {
            return '';
        }

        const availableIndex = availableActions.findIndex((candidate) => candidate.key === spotlightAction.key);
        if (availableIndex >= 0) {
            return `Press ${availableIndex + 1}`;
        }

        return spotlightAction.hint || '';
    }, [availableActions, spotlightAction]);

    const keyboardShortcutCopy = useMemo(() => {
        const quickActionRange = availableActionCount > 0 ? ` · 1-${availableActionCount} quick actions` : '';
        return `Enter opens the palette · P pins the island${quickActionRange}`;
    }, [availableActionCount]);

    const handleRootKeyDown = useCallback(
        (event) => {
            if (event.defaultPrevented || isEditableTarget(event.target)) {
                return;
            }

            if (event.altKey || event.ctrlKey || event.metaKey) {
                return;
            }

            if (event.key === 'Escape' && isPinnedOpen) {
                event.preventDefault();
                setIsPinnedOpen(false);
                return;
            }

            if (event.key.toLowerCase() === 'p') {
                event.preventDefault();
                togglePinnedOpen();
                return;
            }

            const actionIndex = Number.parseInt(event.key, 10);
            if (Number.isInteger(actionIndex) && actionIndex >= 1 && actionIndex <= availableActions.length) {
                event.preventDefault();
                triggerQuickAction(availableActions[actionIndex - 1]);
                return;
            }

            if (event.target !== event.currentTarget) {
                return;
            }

            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                triggerPrimaryAction();
            }
        },
        [availableActions, isPinnedOpen, togglePinnedOpen, triggerPrimaryAction, triggerQuickAction]
    );

    const handleShellDoubleClick = useCallback(
        (event) => {
            if (isInteractiveTarget(event.target) && event.target !== event.currentTarget) {
                return;
            }

            togglePinnedOpen();
        },
        [togglePinnedOpen],
    );

    useEffect(() => {
        if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
            return undefined;
        }

        const mediaQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
        const syncAutoHideMode = () => {
            setAutoHideEnabled(mediaQuery.matches);
        };

        syncAutoHideMode();

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', syncAutoHideMode);

            return () => {
                mediaQuery.removeEventListener('change', syncAutoHideMode);
            };
        }

        mediaQuery.addListener(syncAutoHideMode);

        return () => {
            mediaQuery.removeListener(syncAutoHideMode);
        };
    }, []);

    useEffect(() => {
        if (!pinPersistKey || typeof window === 'undefined') {
            return undefined;
        }

        try {
            const stored = window.localStorage.getItem(pinPersistKey);
            if (stored === 'true' || stored === 'false') {
                setIsPinnedOpen(stored === 'true');
            }
        } catch {
            // ignore storage read errors
        }

        return undefined;
    }, [pinPersistKey]);

    useEffect(() => {
        if (!pinPersistKey || typeof window === 'undefined') {
            return undefined;
        }

        try {
            window.localStorage.setItem(pinPersistKey, isPinnedOpen ? 'true' : 'false');
        } catch {
            // ignore storage write errors
        }

        return undefined;
    }, [isPinnedOpen, pinPersistKey]);

    useEffect(() => {
        if (typeof onPinChange === 'function') {
            onPinChange(isPinnedOpen);
        }
    }, [isPinnedOpen, onPinChange]);

    useEffect(() => {
        if (!autoHideActive || typeof window === 'undefined') {
            setIsPointerNearTop(false);
            return undefined;
        }

        const handlePointerMove = (event) => {
            const nextValue = event.clientY <= resolvedRevealThreshold;

            setIsPointerNearTop((currentValue) => (currentValue === nextValue ? currentValue : nextValue));
        };

        const handleWindowBlur = () => {
            setIsPointerNearTop(false);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('pointerdown', handlePointerMove, { passive: true });
        window.addEventListener('blur', handleWindowBlur);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerdown', handlePointerMove);
            window.removeEventListener('blur', handleWindowBlur);
        };
    }, [autoHideActive, resolvedRevealThreshold]);

    useEffect(() => {
        if (!autoHideActive) {
            setIsAutoHidden(false);
            return undefined;
        }

        if (shouldKeepVisible) {
            setIsAutoHidden(false);
            return undefined;
        }

        const timeoutId = window.setTimeout(() => {
            setIsAutoHidden(true);
        }, resolvedAutoHideDelay);

        return () => {
            window.clearTimeout(timeoutId);
        };
    }, [autoHideActive, resolvedAutoHideDelay, shouldKeepVisible]);

    return (
        <motion.section
            layout
            initial={shellInitial}
            animate={shellAnimate}
            onHoverStart={() => {
                setIsHovered(true);
                setIsAutoHidden(false);
            }}
            onHoverEnd={() => setIsHovered(false)}
            onFocusCapture={() => {
                setHasFocusWithin(true);
                setIsAutoHidden(false);
            }}
            onBlurCapture={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget)) {
                    setHasFocusWithin(false);
                }
            }}
            onDoubleClick={handleShellDoubleClick}
            transition={transition}
            aria-label="Desktop Dynamic Island"
            tabIndex={0}
            onKeyDownCapture={handleRootKeyDown}
            data-expanded={expanded ? 'true' : 'false'}
            data-auto-hidden={autoHidden ? 'true' : 'false'}
            data-pinned={isPinnedOpen ? 'true' : 'false'}
            className={classNames(
                'dynamic-island-shell relative overflow-hidden text-white focus-visible:outline-none',
                surfacePreset === 'liquid-glass' && 'dynamic-island-shell--liquid-glass',
                surfacePreset === 'frosted-glass' && 'dynamic-island-shell--frosted',
                expanded ? 'max-w-[min(96vw,50rem)] rounded-[2.4rem]' : 'max-w-[min(92vw,26rem)] rounded-[999px]',
                isPinnedOpen ? 'ring-1 ring-cyan-300/25' : '',
                className
            )}
            style={islandStyle}
        >
            <span className="sr-only" aria-live="polite">
                {presence.label}: {presence.detail}
            </span>
            <div className="dynamic-island-shell__halo" aria-hidden="true" />
            <div className="dynamic-island-shell__aurora" aria-hidden="true" />
            <div className="dynamic-island-shell__liquid" aria-hidden="true" />
            <div className="dynamic-island-shell__plasma" aria-hidden="true" />
            <div className="dynamic-island-shell__caustic" aria-hidden="true" />
            <div className="dynamic-island-shell__prism" aria-hidden="true" />
            <div className="dynamic-island-shell__grain" aria-hidden="true" />
            <div className="dynamic-island-shell__sheen" aria-hidden="true" />
            <motion.div
                aria-hidden="true"
                className="dynamic-island-shell__pulse"
                animate={
                    reduceMotion
                        ? { opacity: expanded ? 0.24 : 0.14 }
                        : {
                              opacity: expanded ? 0.35 : 0.2,
                              scale: expanded ? 1.02 : 0.98,
                          }
                }
                transition={reduceMotion ? { duration: 0 } : { duration: 1.2, repeat: Infinity, repeatType: 'mirror' }}
            />
            <div className="dynamic-island-shell__rim" aria-hidden="true" />

            <div className="dynamic-island-shell__sensor" aria-hidden="true">
                <span className="dynamic-island-shell__sensor-halo" />
                <span className="dynamic-island-shell__sensor-pill" />
                <span className="dynamic-island-shell__sensor-dot" />
            </div>

            <div className="relative px-3 pb-3 pt-5 sm:px-4 sm:pb-4 sm:pt-6">
                <div className="flex items-start gap-3">
                    <button
                        type="button"
                        onClick={triggerPrimaryAction}
                        aria-label={primaryActionLabel}
                        title={`${primaryActionLabel} (${primaryHint})`}
                        className="group flex min-w-0 flex-1 items-start gap-3 rounded-[1.7rem] px-2 py-2 text-left transition duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                        <span
                            className="dynamic-island-summary__icon"
                            style={summaryIconStyle}
                            data-progress={progress !== null ? 'true' : undefined}
                        >
                            <span className="dynamic-island-summary__ring" aria-hidden="true" />
                            {SummaryIcon ? <SummaryIcon className="relative z-[1] h-5 w-5 text-white" /> : null}
                        </span>

                        <span className="min-w-0 flex-1">
                            <span className="flex flex-wrap items-center gap-2">
                                <span className="truncate text-[0.58rem] font-semibold uppercase tracking-[0.34em] text-white/50">
                                    {summary?.eyebrow}
                                </span>
                                {summary?.badge ? (
                                    <span
                                        className={classNames(
                                            'dynamic-island-chip',
                                            BADGE_TONE_CLASSES[badgeTone] || BADGE_TONE_CLASSES.neutral
                                        )}
                                    >
                                        {summary.badge}
                                    </span>
                                ) : null}
                            </span>

                            <span className="mt-1 block truncate text-[1rem] font-semibold leading-tight text-white">
                                {summary?.title}
                            </span>
                            <span className="mt-0.5 block truncate text-xs text-white/64">
                                {summary?.detail}
                            </span>
                            {summaryChips.length > 0 ? (
                                <span className="mt-2 flex flex-wrap gap-1.5">
                                    {summaryChips.map((chip) => (
                                        <span
                                            key={chip.key}
                                            className={classNames(
                                                'dynamic-island-chip',
                                                chip.accent
                                                    ? 'border-cyan-200/22 bg-cyan-300/14 text-cyan-50'
                                                    : 'border-white/12 bg-white/[0.08] text-white/64'
                                            )}
                                        >
                                            {chip.label}
                                        </span>
                                    ))}
                                </span>
                            ) : null}

                            <AnimatePresence initial={false}>
                                {expanded && progress !== null ? (
                                    <motion.span
                                        key="progress"
                                        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                                        transition={transition}
                                        className="mt-3 block"
                                    >
                                        <span className="mb-1.5 flex items-center justify-between gap-3 text-[0.56rem] font-semibold uppercase tracking-[0.24em] text-white/50">
                                            <span>{summary?.progressLabel || 'Live signal'}</span>
                                            <span>{Math.round(progress * 100)}%</span>
                                        </span>
                                        <span className="dynamic-island-progress__track">
                                            <span
                                                className="dynamic-island-progress__fill"
                                                style={{ width: `${progress * 100}%` }}
                                            />
                                        </span>
                                    </motion.span>
                                ) : null}
                            </AnimatePresence>
                        </span>
                    </button>

                    <AnimatePresence initial={false} mode="wait">
                        {expanded ? (
                            <motion.div
                                key="ambient"
                                initial={reduceMotion ? false : { opacity: 0, x: 12 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, x: 10 }}
                                transition={transition}
                                className="dynamic-island-ambient dynamic-island-ambient--glance min-w-[13rem] shrink-0"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <span
                                            className={classNames(
                                                'dynamic-island-presence',
                                                presence.accent && 'dynamic-island-presence--accent'
                                            )}
                                        >
                                            <PresenceIcon className="dynamic-island-presence__icon" aria-hidden="true" />
                                            <span className="dynamic-island-presence__dot" aria-hidden="true" />
                                            <span className="truncate">{presence.label}</span>
                                        </span>
                                        <p className="mt-2 text-[0.52rem] font-semibold uppercase tracking-[0.28em] text-white/44">
                                            Workspace Pulse
                                        </p>
                                        <p className="mt-1 text-[0.78rem] font-semibold leading-5 text-white/82">
                                            {actionAvailabilityLabel}
                                        </p>
                                        <p className="mt-1 text-[0.68rem] leading-5 text-white/54">
                                            {presence.detail}
                                        </p>
                                    </div>
                                    <span className="dynamic-island-chip dynamic-island-chip--subtle">
                                        {isPinnedOpen ? 'Pinned' : 'P to pin'}
                                    </span>
                                </div>

                                <div className="dynamic-island-glance-card mt-3">
                                    <div className="flex items-center gap-3">
                                        <MeterBars reduceMotion={reduceMotion} />
                                        <div className="min-w-0">
                                            <p className="text-[0.52rem] font-semibold uppercase tracking-[0.28em] text-white/44">
                                                Reveal Mode
                                            </p>
                                            <p className="mt-1 text-[0.72rem] font-semibold leading-5 text-white/78">
                                                {revealStatusLabel}
                                            </p>
                                            <p className="mt-1 text-[0.66rem] leading-5 text-white/52">
                                                Double-click the island to pin it open instantly.
                                            </p>
                                        </div>
                                    </div>

                                    {keyboardHints.length > 0 ? (
                                        <div className="dynamic-island-shortcuts mt-3">
                                            {keyboardHints.map((hint) => (
                                                <span
                                                    key={hint.key}
                                                    className={classNames(
                                                        'dynamic-island-shortcut',
                                                        hint.accent && 'dynamic-island-shortcut--accent'
                                                    )}
                                                >
                                                    <span className="dynamic-island-shortcut__label">{hint.label}</span>
                                                    <span className="dynamic-island-shortcut__value">{hint.value}</span>
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                </div>

                            </motion.div>
                        ) : (
                            <motion.div
                                key="collapsed-meta"
                                initial={reduceMotion ? false : { opacity: 0, scale: 0.92 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.92 }}
                                transition={transition}
                                className="dynamic-island-ambient dynamic-island-ambient--compact"
                            >
                                <div className="dynamic-island-glance min-w-0 flex-1">
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0 flex-1">
                                            <span
                                                className={classNames(
                                                    'dynamic-island-presence',
                                                    presence.accent && 'dynamic-island-presence--accent'
                                                )}
                                            >
                                                <PresenceIcon className="dynamic-island-presence__icon" aria-hidden="true" />
                                                <span className="dynamic-island-presence__dot" aria-hidden="true" />
                                                <span className="truncate">{presence.label}</span>
                                            </span>
                                            <p className="mt-1 truncate text-[0.78rem] font-semibold text-white/88">
                                                {summary?.title}
                                            </p>
                                            <p className="mt-1 text-[0.64rem] leading-5 text-white/54">
                                                {compactTelemetryCopy}
                                            </p>
                                        </div>
                                        <div className="dynamic-island-compact-stack">
                                            {summary?.badge ? (
                                                <span
                                                    className={classNames(
                                                        'dynamic-island-chip',
                                                        BADGE_TONE_CLASSES[badgeTone] || BADGE_TONE_CLASSES.neutral
                                                    )}
                                                >
                                                    {summary.badge}
                                                </span>
                                            ) : null}
                                            <span className="dynamic-island-compact-metric">
                                                {progress !== null
                                                    ? `${Math.round(progress * 100)}%`
                                                    : activeActionCount > 0
                                                        ? `${activeActionCount} live`
                                                        : `${availableActionCount} ready`}
                                            </span>
                                        </div>
                                    </div>
                                    {progress !== null ? (
                                        <span className="dynamic-island-progress__track dynamic-island-progress__track--compact mt-2">
                                            <span
                                                className="dynamic-island-progress__fill"
                                                style={{ width: `${progress * 100}%` }}
                                            />
                                        </span>
                                    ) : null}
                                    {compactSignalItems.length > 0 ? (
                                        <div className="dynamic-island-compact-grid" aria-hidden="true">
                                            {compactSignalItems.map((item) => (
                                                <span
                                                    key={item.key}
                                                    className={classNames(
                                                        'dynamic-island-ticker__item',
                                                        item.accent && 'dynamic-island-ticker__item--accent'
                                                    )}
                                                >
                                                    {item.label}
                                                </span>
                                            ))}
                                        </div>
                                    ) : null}
                                    {collapsedRailActions.length > 0 ? (
                                        <div className="dynamic-island-rail dynamic-island-rail--compact">
                                            {collapsedRailActions.map((action) => (
                                                <ActionRailButton
                                                    key={action.key}
                                                    label={action.shortLabel || action.label}
                                                    hint={action.hint}
                                                    icon={action.icon}
                                                    active={action.active}
                                                    disabled={action.disabled}
                                                    compact
                                                    onClick={() => triggerQuickAction(action)}
                                                    onMouseEnter={() => setSpotlightKey(action.key)}
                                                    onFocus={() => setSpotlightKey(action.key)}
                                                    reduceMotion={reduceMotion}
                                                />
                                            ))}
                                        </div>
                                    ) : null}
                                    <p className="mt-2 truncate text-[0.58rem] uppercase tracking-[0.22em] text-white/42">
                                        {revealStatusLabel}
                                    </p>
                                </div>
                                <div
                                    className="dynamic-island-dock dynamic-island-dock--compact shrink-0"
                                    role="toolbar"
                                    aria-label="Dynamic Island dock"
                                    style={dockStyle}
                                >
                                    <ActionIconButton
                                        glyph={paletteGlyph}
                                        label={primaryActionLabel}
                                        hint={primaryHint}
                                        onClick={triggerPrimaryAction}
                                        reduceMotion={reduceMotion}
                                    />
                                    {collapsedQuickActions.map((action, index) => (
                                        <ActionIconButton
                                            key={action.key}
                                            glyph={glyphForActionKey(action.key)}
                                            label={action.label}
                                            hint={action.hint || `Press ${index + 1}`}
                                            onClick={() => triggerQuickAction(action)}
                                            disabled={action.disabled}
                                            active={action.active}
                                            pressed={action.active}
                                            onMouseEnter={() => setSpotlightKey(action.key)}
                                            onFocus={() => setSpotlightKey(action.key)}
                                            reduceMotion={reduceMotion}
                                        />
                                    ))}
                                    {extraActionCount > 0 ? (
                                        <span className="dynamic-island-dock__count" aria-hidden="true">
                                            +{extraActionCount}
                                        </span>
                                    ) : null}
                                    <ActionIconButton
                                        glyph={pinGlyph}
                                        label={isPinnedOpen ? 'Collapse pinned island' : 'Keep island open'}
                                        hint="P"
                                        onClick={togglePinnedOpen}
                                        active={isPinnedOpen}
                                        pressed={isPinnedOpen}
                                        reduceMotion={reduceMotion}
                                    />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <AnimatePresence initial={false}>
                    {expanded ? (
                        <motion.div
                            key="expanded"
                            initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                            transition={transition}
                            className="dynamic-island-scroll-region mt-3 space-y-3 sm:mt-4"
                            tabIndex={0}
                            aria-label="Dynamic Island details"
                        >
                            {statusStripItems.length > 0 ? (
                                <div className="dynamic-island-scroll-region__sticky flex flex-wrap gap-2">
                                    {statusStripItems.map((item) => (
                                        <span
                                            key={item.key}
                                            className={classNames(
                                                'dynamic-island-chip',
                                                item.accent
                                                    ? 'border-cyan-200/22 bg-cyan-300/14 text-cyan-50'
                                                    : 'border-white/12 bg-white/[0.08] text-white/60'
                                            )}
                                        >
                                            {item.label}
                                        </span>
                                    ))}
                                </div>
                            ) : null}

                            {visibleStats.length > 0 ? (
                                <div className="grid gap-2.5 sm:grid-cols-3">
                                    {visibleStats.map((stat) => {
                                        const StatIcon = stat.IconComponent || null;
                                        const tone = stat.tone || 'neutral';

                                        return (
                                            <div
                                                key={stat.key}
                                                className={classNames(
                                                    'dynamic-island-card dynamic-island-card--stat',
                                                    tone === 'accent' && 'dynamic-island-card--accent'
                                                )}
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-[0.52rem] font-semibold uppercase tracking-[0.32em] text-white/46">
                                                            {stat.label}
                                                        </p>
                                                        <p className="mt-1 truncate text-sm font-semibold text-white">
                                                            {stat.value || stat.label}
                                                        </p>
                                                        {stat.sub ? (
                                                            <p className="mt-1 text-[0.7rem] text-white/58">{stat.sub}</p>
                                                        ) : null}
                                                    </div>
                                                    {StatIcon ? (
                                                        <span className="dynamic-island-card__icon">
                                                            <StatIcon className="h-4 w-4" />
                                                        </span>
                                                    ) : null}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}

                            {expandedRailActions.length > 0 ? (
                                <div className="dynamic-island-rail">
                                    {expandedRailActions.map((action) => (
                                        <ActionRailButton
                                            key={action.key}
                                            label={action.label}
                                            hint={action.hint}
                                            icon={action.icon}
                                            active={action.active}
                                            disabled={action.disabled}
                                            onClick={() => triggerQuickAction(action)}
                                            onMouseEnter={() => setSpotlightKey(action.key)}
                                            onFocus={() => setSpotlightKey(action.key)}
                                            reduceMotion={reduceMotion}
                                        />
                                    ))}
                                </div>
                            ) : null}

                            {spotlightAction ? (
                                <div className="dynamic-island-spotlight" role="status" aria-live="polite">
                                    <div className="dynamic-island-spotlight__glow" aria-hidden="true" />
                                    <div className="dynamic-island-spotlight__icon" aria-hidden="true">
                                        {spotlightAction.icon}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="dynamic-island-spotlight__eyebrow">Action spotlight</p>
                                        <div className="mt-1 flex flex-wrap items-center gap-2">
                                            <span className="dynamic-island-spotlight__title">{spotlightAction.label}</span>
                                            <span
                                                className={classNames(
                                                    'dynamic-island-chip',
                                                    spotlightAction.active
                                                        ? 'border-cyan-200/22 bg-cyan-300/14 text-cyan-50'
                                                        : 'border-white/12 bg-white/[0.08] text-white/64'
                                                )}
                                            >
                                                {spotlightAction.active ? 'Live' : spotlightAction.disabled ? 'Unavailable' : 'Ready'}
                                            </span>
                                            {spotlightShortcut ? (
                                                <span className="dynamic-island-chip border-white/12 bg-white/[0.08] text-white/64">
                                                    {spotlightShortcut}
                                                </span>
                                            ) : null}
                                        </div>
                                        {spotlightAction.description ? (
                                            <p className="dynamic-island-spotlight__copy">{spotlightAction.description}</p>
                                        ) : null}
                                        <div className="dynamic-island-spotlight__meta">
                                            <span className="dynamic-island-spotlight__hint">{actionAvailabilityLabel}</span>
                                            {presence.detail ? (
                                                <span className="dynamic-island-spotlight__hint">{presence.detail}</span>
                                            ) : null}
                                        </div>
                                    </div>
                                    <div className="dynamic-island-spotlight__cta-wrap">
                                        <button
                                            type="button"
                                            className="dynamic-island-spotlight__cta"
                                            onClick={() => triggerQuickAction(spotlightAction)}
                                            disabled={spotlightAction.disabled}
                                        >
                                            {spotlightAction.disabled ? 'Paused' : 'Run'}
                                            {spotlightShortcut ? (
                                                <span className="dynamic-island-spotlight__cta-hint">{spotlightShortcut}</span>
                                            ) : null}
                                        </button>
                                        <button
                                            type="button"
                                            className="dynamic-island-spotlight__ghost"
                                            onClick={togglePinnedOpen}
                                        >
                                            {isPinnedOpen ? 'Pinned' : 'Pin island'}
                                        </button>
                                    </div>
                                </div>
                            ) : null}

                            <div className="dynamic-island-command flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="text-[0.58rem] font-semibold uppercase tracking-[0.32em] text-white/46">
                                        Workspace Dock
                                    </p>
                                    <p className="mt-1 text-xs text-white/58">
                                        Icon-only controls keep the island compact like the desktop dock.
                                    </p>
                                    <p className="mt-2 text-[0.58rem] text-white/42">{keyboardShortcutCopy}</p>
                                </div>
                                <div className="dynamic-island-dock" role="toolbar" aria-label="Dynamic Island dock">
                                    <ActionIconButton
                                        glyph={paletteGlyph}
                                        label={primaryActionLabel}
                                        hint={primaryHint}
                                        onClick={triggerPrimaryAction}
                                        size="large"
                                        reduceMotion={reduceMotion}
                                    />
                                    {prioritizedActions.map((action) => {
                                        const availableIndex = availableActions.findIndex(
                                            (candidate) => candidate.key === action.key
                                        );

                                        return (
                                            <ActionIconButton
                                                key={action.key}
                                                glyph={glyphForActionKey(action.key)}
                                                label={action.label}
                                                hint={
                                                    action.hint || (availableIndex >= 0 ? `Press ${availableIndex + 1}` : '')
                                                }
                                                onClick={() => triggerQuickAction(action)}
                                                active={action.active}
                                                pressed={action.active}
                                                disabled={action.disabled}
                                                size="large"
                                                onMouseEnter={() => setSpotlightKey(action.key)}
                                                onFocus={() => setSpotlightKey(action.key)}
                                                reduceMotion={reduceMotion}
                                            />
                                        );
                                    })}
                                    <ActionIconButton
                                        glyph={pinGlyph}
                                        label={isPinnedOpen ? 'Collapse pinned island' : 'Keep island open'}
                                        hint="P"
                                        onClick={togglePinnedOpen}
                                        active={isPinnedOpen}
                                        pressed={isPinnedOpen}
                                        size="large"
                                        reduceMotion={reduceMotion}
                                    />
                                </div>
                            </div>
                        </motion.div>
                    ) : null}
                </AnimatePresence>
            </div>
        </motion.section>
    );
}

DesktopDynamicIsland.propTypes = {
    className: PropTypes.string,
    summary: PropTypes.shape({
        eyebrow: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        detail: PropTypes.string,
        badge: PropTypes.string,
        badgeTone: PropTypes.oneOf(['neutral', 'accent']),
        accent: PropTypes.string,
        progress: PropTypes.number,
        progressLabel: PropTypes.string,
        IconComponent: PropTypes.elementType,
    }).isRequired,
    actions: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            shortLabel: PropTypes.string,
            description: PropTypes.string,
            hint: PropTypes.string,
            icon: PropTypes.node.isRequired,
            active: PropTypes.bool,
            disabled: PropTypes.bool,
            onClick: PropTypes.func.isRequired,
        })
    ),
    stats: PropTypes.arrayOf(
        PropTypes.shape({
            key: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
            value: PropTypes.string,
            sub: PropTypes.string,
            tone: PropTypes.oneOf(['neutral', 'accent']),
            IconComponent: PropTypes.elementType,
        })
    ),
    onPrimaryAction: PropTypes.func.isRequired,
    primaryActionLabel: PropTypes.string.isRequired,
    primaryHint: PropTypes.string.isRequired,
    forceExpanded: PropTypes.bool,
    reduceMotion: PropTypes.bool,
    surfacePreset: PropTypes.oneOf(['liquid-glass', 'frosted-glass']),
    autoHide: PropTypes.bool,
    autoHideDelayMs: PropTypes.number,
    revealThresholdPx: PropTypes.number,
    pinPersistKey: PropTypes.string,
    onPinChange: PropTypes.func,
};

DesktopDynamicIsland.defaultProps = {
    className: '',
    actions: [],
    stats: [],
    forceExpanded: false,
    reduceMotion: false,
    surfacePreset: 'liquid-glass',
    autoHide: true,
    autoHideDelayMs: DEFAULT_AUTO_HIDE_DELAY_MS,
    revealThresholdPx: DEFAULT_REVEAL_THRESHOLD_PX,
    pinPersistKey: '',
    onPinChange: undefined,
};
