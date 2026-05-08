import { AnimatePresence, motion } from 'framer-motion';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineArrowsPointingOut,
    HiOutlineBars3,
    HiOutlineBell,
    HiOutlineChevronDown,
    HiOutlineCheckCircle,
    HiOutlineCog6Tooth,
    HiOutlineExclamationTriangle,
    HiOutlineHome,
    HiOutlineIdentification,
    HiOutlineInbox,
    HiOutlineInformationCircle,
    HiOutlineMagnifyingGlass,
    HiOutlineMapPin,
    HiOutlineRectangleStack,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineUserCircle,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';

import { signoutSuccess } from '../../redux/user/userSlice';
import { apiFetch } from '../../utils/apiFetch';

const DEFAULT_ACCENT = 'linear-gradient(135deg, rgba(14,116,244,0.88), rgba(56,189,248,0.7))';
const DEFAULT_BRAND_NAME = 'Scientist Shield';
const EMPTY_BRANDING = Object.freeze({});
const EMPTY_NOTIFICATIONS = Object.freeze([]);
const NOTIFICATION_READ_STORAGE_KEY = 'scientistshield.desktop.notifications.read.v1';
const MAX_STORED_NOTIFICATION_IDS = 120;
const DEFAULT_AUTO_HIDE_DELAY_MS = 2600;
const AUTO_HIDE_REVEAL_ZONE_PX = 88;
const NOOP = () => {};
const PROFILE_MENU_ITEM_CLASS =
    'group flex w-full items-center gap-2.5 rounded-xl border border-slate-200/70 bg-white/80 px-2.5 py-2.5 text-left text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-[0_16px_34px_-24px_rgba(14,116,244,0.35)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-cyan-300/10 dark:bg-slate-900/60 dark:text-slate-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] dark:hover:border-cyan-300/25 dark:hover:bg-cyan-300/10 dark:hover:shadow-[0_18px_42px_-28px_rgba(8,145,178,0.55)] dark:focus-visible:ring-cyan-300/40';
const PROFILE_MENU_ICON_CLASS =
    'inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm transition-colors duration-150 group-hover:border-sky-200 group-hover:text-sky-700 dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-200 dark:group-hover:border-cyan-300/25 dark:group-hover:bg-cyan-300/20';
const PROFILE_MENU_SHORTCUT_CLASS =
    'hidden rounded-lg border border-slate-200/80 bg-white/90 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500 shadow-sm dark:border-cyan-300/10 dark:bg-slate-950/75 dark:text-cyan-200 sm:inline-flex';
const PROFILE_MENU_CHIP_CLASS =
    'inline-flex items-center rounded-lg border border-slate-200/70 bg-white/80 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-600 shadow-sm dark:border-cyan-300/10 dark:bg-slate-900/70 dark:text-slate-300 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]';
const PROFILE_MENU_SECTION_CLASS =
    'rounded-2xl border border-slate-200/70 bg-white/70 p-2 shadow-sm dark:border-cyan-300/10 dark:bg-slate-900/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)]';
const PROFILE_MENU_SECTION_TITLE_CLASS =
    'px-1 pb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400';
const MOBILE_PRIMARY_WORKSPACE_KEYS = new Set(['search', 'mission-control', 'control-center', 'quick-look']);
const NOTIFICATION_ITEM_CLASS =
    'group relative flex w-full items-start gap-2.5 rounded-2xl border px-2.5 py-2.5 text-left shadow-sm transition-all duration-150 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:focus-visible:ring-cyan-300/40';
const NOTIFICATION_TONE_CLASSES = {
    info: {
        item: 'border-slate-200/70 bg-white/78 text-slate-800 hover:border-sky-200 hover:bg-white dark:border-cyan-300/10 dark:bg-slate-900/62 dark:text-slate-100 dark:hover:border-cyan-300/25 dark:hover:bg-cyan-300/10',
        icon: 'border-sky-200/70 bg-sky-50 text-sky-700 dark:border-cyan-300/15 dark:bg-cyan-300/10 dark:text-cyan-200',
        dot: 'bg-sky-500 dark:bg-cyan-300',
    },
    success: {
        item: 'border-emerald-200/70 bg-emerald-50/70 text-emerald-950 hover:border-emerald-300 hover:bg-emerald-50 dark:border-emerald-300/15 dark:bg-emerald-400/10 dark:text-emerald-100 dark:hover:border-emerald-300/25',
        icon: 'border-emerald-200/80 bg-emerald-100/80 text-emerald-700 dark:border-emerald-300/15 dark:bg-emerald-300/10 dark:text-emerald-200',
        dot: 'bg-emerald-500 dark:bg-emerald-300',
    },
    warning: {
        item: 'border-amber-200/80 bg-amber-50/78 text-amber-950 hover:border-amber-300 hover:bg-amber-50 dark:border-amber-300/15 dark:bg-amber-300/10 dark:text-amber-100 dark:hover:border-amber-300/25',
        icon: 'border-amber-200/80 bg-amber-100/80 text-amber-700 dark:border-amber-300/15 dark:bg-amber-300/10 dark:text-amber-200',
        dot: 'bg-amber-500 dark:bg-amber-300',
    },
};

const buildShortcutTitle = (label, shortcut) => (shortcut ? `${label} (${shortcut})` : label);
const readNonEmptyString = (value, fallback = '') => {
    const text = typeof value === 'string' ? value.trim() : '';
    return text || fallback;
};
const buildInitials = (value) =>
    String(value || '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((segment) => segment[0]?.toUpperCase() || '')
        .join('') || 'SS';

const readErrorMessage = async (response, fallbackMessage) => {
    const payload = await response.json().catch(() => ({}));
    return payload?.message || fallbackMessage;
};

const readStoredNotificationIds = () => {
    if (typeof window === 'undefined') {
        return [];
    }
    try {
        const parsed = JSON.parse(window.localStorage.getItem(NOTIFICATION_READ_STORAGE_KEY) || '[]');
        return Array.isArray(parsed)
            ? parsed
                  .map((id) => String(id || '').trim())
                  .filter(Boolean)
                  .slice(-MAX_STORED_NOTIFICATION_IDS)
            : [];
    } catch {
        return [];
    }
};

const persistReadNotificationIds = (ids) => {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        window.localStorage.setItem(
            NOTIFICATION_READ_STORAGE_KEY,
            JSON.stringify(ids.slice(-MAX_STORED_NOTIFICATION_IDS))
        );
    } catch {
        // Ignore storage failures. Notifications still work for the current session.
    }
};

const getNotificationTone = (tone) =>
    Object.prototype.hasOwnProperty.call(NOTIFICATION_TONE_CLASSES, tone) ? tone : 'info';

const getNotificationIcon = (tone) => {
    if (tone === 'success') {
        return HiOutlineCheckCircle;
    }
    if (tone === 'warning') {
        return HiOutlineExclamationTriangle;
    }
    return HiOutlineInformationCircle;
};

const normalizeNotification = (notification, index) => {
    const source = typeof notification === 'object' && notification !== null ? notification : {};
    const title = String(source.title || 'Notification');
    const id = String(source.id || `${title}-${index}`).trim();
    const tone = getNotificationTone(source.tone);
    return {
        ...source,
        id,
        title,
        description: source.description || '',
        timestampLabel: source.timestampLabel || source.timeLabel || 'Now',
        actionLabel: source.actionLabel || '',
        tone,
        Icon: source.Icon || getNotificationIcon(tone),
        read: Boolean(source.read),
    };
};

export default function AdvancedHeader({
    accent = '',
    routeLabel = 'Workspace',
    stagedWindowCount = 0,
    focusMode = false,
    surfacePresetLabel = '',
    wallpaperLabel = '',
    commandPaletteShortcut = '',
    missionControlOpen = false,
    missionControlShortcut = '',
    controlCenterOpen = false,
    controlCenterShortcut = '',
    quickLookAvailable = true,
    quickLookOpen = false,
    quickLookShortcut = 'Space',
    autoHide = false,
    autoHideDelay = DEFAULT_AUTO_HIDE_DELAY_MS,
    branding = EMPTY_BRANDING,
    notifications = EMPTY_NOTIFICATIONS,
    onGoHome = NOOP,
    onOpenCommandPalette = NOOP,
    onToggleMissionControl = NOOP,
    onToggleControlCenter = NOOP,
    onToggleQuickLook = NOOP,
    onNotificationsRead = NOOP,
}) {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { currentUser } = useSelector((state) => state.user || {});
    const [now, setNow] = useState(() => new Date());
    const [profileOpen, setProfileOpen] = useState(false);
    const [notificationsOpen, setNotificationsOpen] = useState(false);
    const [readNotificationIds, setReadNotificationIds] = useState(readStoredNotificationIds);
    const [headerVisible, setHeaderVisible] = useState(true);
    const [headerHovered, setHeaderHovered] = useState(false);
    const [headerFocused, setHeaderFocused] = useState(false);
    const [isSigningOut, setIsSigningOut] = useState(false);
    const [signOutError, setSignOutError] = useState('');
    const headerRef = useRef(null);
    const profileRef = useRef(null);
    const notificationsRef = useRef(null);
    const autoHideTimerRef = useRef(null);
    const profileTriggerRef = useRef(null);
    const notificationsTriggerRef = useRef(null);
    const pendingProfileFocusRef = useRef(null);
    const profileMenuId = useId();
    const notificationsPanelId = useId();

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        // Updated frequency to 5s for better minute accuracy
        const intervalId = window.setInterval(() => setNow(new Date()), 5000);
        return () => window.clearInterval(intervalId);
    }, []);

    const { dayLabel, timeLabel } = useMemo(
        () => ({
            dayLabel: new Intl.DateTimeFormat(undefined, { weekday: 'short' }).format(now),
            timeLabel: new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(now),
        }),
        [now]
    );

    const profileName = currentUser?.username || currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Guest';
    const profileRole = currentUser ? (currentUser.isAdmin ? 'Admin account' : 'Signed in') : 'Guest workspace';
    const profileEmail = currentUser?.email || 'Sign in to sync your workspace';
    const profileInitials = useMemo(
        () => buildInitials(currentUser?.username || currentUser?.displayName || profileName),
        [currentUser?.displayName, currentUser?.username, profileName]
    );
    const quickActionLabel = currentUser ? 'Profile' : 'Sign In';
    const quickActionTitle = currentUser ? 'Open account and workspace menu' : 'Open sign in and workspace menu';
    const profilePresenceClass = currentUser
        ? 'bg-emerald-400 shadow-[0_0_0_3px_rgba(16,185,129,0.18)] dark:shadow-[0_0_0_4px_rgba(16,185,129,0.16)]'
        : 'bg-amber-400 shadow-[0_0_0_3px_rgba(245,158,11,0.18)] dark:shadow-[0_0_0_4px_rgba(245,158,11,0.16)]';

    const resolvedAccent = accent || DEFAULT_ACCENT;
    const brand = useMemo(() => {
        const source = typeof branding === 'object' && branding !== null ? branding : EMPTY_BRANDING;
        const name = readNonEmptyString(source.name, DEFAULT_BRAND_NAME);
        const subtitle = readNonEmptyString(source.subtitle, routeLabel);
        const badge = readNonEmptyString(source.badge);
        const logoSrc = readNonEmptyString(source.logoSrc);
        const logoAlt = readNonEmptyString(source.logoAlt, `${name} logo`);
        const title = readNonEmptyString(source.title, `Open ${name} home`);
        return {
            name,
            subtitle,
            badge,
            logoSrc,
            logoAlt,
            title,
            LogoIcon: source.LogoIcon || HiOutlineShieldCheck,
        };
    }, [branding, routeLabel]);
    const quickLookCanToggle = quickLookAvailable || quickLookOpen;
    const shortcutHintTitle = buildShortcutTitle('Search tools, windows, and actions', commandPaletteShortcut);
    const missionControlTitle = buildShortcutTitle(missionControlOpen ? 'Hide Mission Control' : 'Show Mission Control', missionControlShortcut);
    const controlCenterTitle = buildShortcutTitle(controlCenterOpen ? 'Hide Control Center' : 'Show Control Center', controlCenterShortcut);
    const quickLookTitle = buildShortcutTitle(
        quickLookOpen ? 'Hide Quick Look' : quickLookCanToggle ? 'Show Quick Look' : 'Quick Look unavailable',
        quickLookShortcut
    );

    const handleControlCenterToggle = useCallback(() => {
        onToggleControlCenter(!controlCenterOpen);
    }, [controlCenterOpen, onToggleControlCenter]);

    const preventControlCenterClickAway = useCallback(
        (event) => {
            if (controlCenterOpen) {
                event.stopPropagation();
            }
        },
        [controlCenterOpen]
    );

    const generatedNotifications = useMemo(() => {
        const entries = [
            currentUser
                ? {
                      id: `account-sync-${currentUser._id || currentUser.email || profileName}`,
                      title: 'Workspace sync is active',
                      description: `${profileName} is signed in and ready to sync profile changes.`,
                      timestampLabel: 'Account',
                      tone: 'success',
                      Icon: HiOutlineCheckCircle,
                      path: '/dashboard?tab=profile',
                      actionLabel: 'Profile',
                  }
                : {
                      id: 'account-sync-guest',
                      title: 'Workspace sync is off',
                      description: 'Sign in to keep profile, dashboard, and workspace activity connected.',
                      timestampLabel: 'Guest',
                      tone: 'warning',
                      Icon: HiOutlineExclamationTriangle,
                      path: '/sign-in',
                      actionLabel: 'Sign in',
                  },
            currentUser?.isAdmin
                ? {
                      id: 'admin-panel-ready',
                      title: 'Admin tools available',
                      description: 'Open the Admin Panel to review content, users, and moderation queues.',
                      timestampLabel: 'Admin',
                      tone: 'info',
                      Icon: HiOutlineCog6Tooth,
                      path: '/admin',
                      actionLabel: 'Open',
                  }
                : null,
            {
                id: `stage-window-count-${stagedWindowCount}`,
                title: stagedWindowCount > 0 ? `${stagedWindowCount} live window${stagedWindowCount === 1 ? '' : 's'}` : 'No live windows',
                description:
                    stagedWindowCount > 0
                        ? `${routeLabel} is active on the desktop stage.`
                        : 'Open a tool or page to populate the desktop stage.',
                timestampLabel: 'Stage',
                tone: stagedWindowCount > 0 ? 'info' : 'warning',
                Icon: HiOutlineRectangleStack,
                actionLabel: stagedWindowCount > 0 ? 'View' : '',
            },
        ];

        return entries.filter(Boolean);
    }, [
        currentUser,
        profileName,
        routeLabel,
        stagedWindowCount,
    ]);

    const normalizedNotifications = useMemo(() => {
        const sourceNotifications =
            Array.isArray(notifications) && notifications.length > 0 ? notifications : generatedNotifications;
        return sourceNotifications.map(normalizeNotification);
    }, [generatedNotifications, notifications]);

    const readNotificationIdSet = useMemo(
        () => new Set(readNotificationIds),
        [readNotificationIds]
    );

    const displayedNotifications = useMemo(
        () =>
            normalizedNotifications.map((notification) => ({
                ...notification,
                read: notification.read || readNotificationIdSet.has(notification.id),
            })),
        [normalizedNotifications, readNotificationIdSet]
    );

    const unreadNotificationIds = useMemo(
        () =>
            displayedNotifications
                .filter((notification) => !notification.read)
                .map((notification) => notification.id),
        [displayedNotifications]
    );
    const unreadNotificationCount = unreadNotificationIds.length;
    const notificationButtonTitle =
        unreadNotificationCount > 0
            ? `${unreadNotificationCount} unread notification${unreadNotificationCount === 1 ? '' : 's'}`
            : 'Notifications';
    const autoHideDelayMs = Math.max(Number(autoHideDelay) || DEFAULT_AUTO_HIDE_DELAY_MS, 900);
    const headerAutoHidePaused = Boolean(
        profileOpen ||
            notificationsOpen ||
            headerHovered ||
            headerFocused ||
            missionControlOpen ||
            controlCenterOpen ||
            quickLookOpen
    );
    const headerIsHidden = autoHide && !headerVisible && !headerAutoHidePaused;

    const getProfileMenuItems = useCallback(
        () =>
            Array.from(
                profileRef.current?.querySelectorAll('[data-profile-menuitem="true"]:not(:disabled)') || []
            ),
        []
    );

    const focusProfileMenuItem = useCallback(
        (targetIndex) => {
            const items = getProfileMenuItems();
            if (!items.length) {
                return;
            }
            const normalizedIndex = ((targetIndex % items.length) + items.length) % items.length;
            items[normalizedIndex]?.focus();
        },
        [getProfileMenuItems]
    );

    useEffect(() => {
        persistReadNotificationIds(readNotificationIds);
    }, [readNotificationIds]);

    useEffect(
        () => () => {
            if (autoHideTimerRef.current && typeof window !== 'undefined') {
                window.clearTimeout(autoHideTimerRef.current);
                autoHideTimerRef.current = null;
            }
        },
        []
    );

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        if (!autoHide) {
            setHeaderVisible(true);
            if (autoHideTimerRef.current) {
                window.clearTimeout(autoHideTimerRef.current);
                autoHideTimerRef.current = null;
            }
            return undefined;
        }

        const clearAutoHideTimer = () => {
            if (autoHideTimerRef.current) {
                window.clearTimeout(autoHideTimerRef.current);
                autoHideTimerRef.current = null;
            }
        };

        const scheduleAutoHide = () => {
            clearAutoHideTimer();
            if (headerAutoHidePaused) {
                setHeaderVisible(true);
                return;
            }
            autoHideTimerRef.current = window.setTimeout(() => {
                setHeaderVisible(false);
                autoHideTimerRef.current = null;
            }, autoHideDelayMs);
        };

        const revealAndSchedule = () => {
            setHeaderVisible(true);
            scheduleAutoHide();
        };

        const handlePointerMove = (event) => {
            const targetInsideHeader =
                event.target instanceof Node && Boolean(headerRef.current?.contains(event.target));
            if (event.clientY <= AUTO_HIDE_REVEAL_ZONE_PX || targetInsideHeader) {
                revealAndSchedule();
            }
        };

        const handleActivity = () => {
            revealAndSchedule();
        };

        if (headerAutoHidePaused) {
            setHeaderVisible(true);
            clearAutoHideTimer();
        } else {
            scheduleAutoHide();
        }

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('keydown', handleActivity);
        window.addEventListener('touchstart', handleActivity, { passive: true });
        window.addEventListener('scroll', scheduleAutoHide, { passive: true });

        return () => {
            clearAutoHideTimer();
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('keydown', handleActivity);
            window.removeEventListener('touchstart', handleActivity);
            window.removeEventListener('scroll', scheduleAutoHide);
        };
    }, [autoHide, autoHideDelayMs, headerAutoHidePaused]);

    const handleHeaderPointerEnter = useCallback(() => {
        setHeaderHovered(true);
        setHeaderVisible(true);
    }, []);

    const handleHeaderPointerLeave = useCallback(() => {
        setHeaderHovered(false);
    }, []);

    const handleHeaderFocus = useCallback(() => {
        setHeaderFocused(true);
        setHeaderVisible(true);
    }, []);

    const handleHeaderBlur = useCallback((event) => {
        if (event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)) {
            return;
        }
        setHeaderFocused(false);
    }, []);

    const closeProfileMenu = useCallback((restoreFocus = false) => {
        setProfileOpen(false);
        setSignOutError('');
        pendingProfileFocusRef.current = null;
        if (restoreFocus && typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                profileTriggerRef.current?.focus();
            });
        }
    }, []);

    const closeNotificationsPanel = useCallback((restoreFocus = false) => {
        setNotificationsOpen(false);
        if (restoreFocus && typeof window !== 'undefined') {
            window.requestAnimationFrame(() => {
                notificationsTriggerRef.current?.focus();
            });
        }
    }, []);

    const openProfileMenu = useCallback((focusTarget = null) => {
        closeNotificationsPanel();
        setSignOutError('');
        pendingProfileFocusRef.current = focusTarget;
        setProfileOpen(true);
    }, [closeNotificationsPanel]);

    const openNotificationsPanel = useCallback(() => {
        closeProfileMenu();
        setNotificationsOpen(true);
    }, [closeProfileMenu]);

    useEffect(() => {
        closeProfileMenu();
        closeNotificationsPanel();
    }, [closeNotificationsPanel, closeProfileMenu, location.hash, location.pathname, location.search]);

    useEffect(() => {
        if (!profileOpen || typeof window === 'undefined') {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (event.target instanceof Node && !profileRef.current?.contains(event.target)) {
                closeProfileMenu();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeProfileMenu(true);
            }
        };

        const focusTarget = pendingProfileFocusRef.current;
        const focusFrameId = window.requestAnimationFrame(() => {
            if (!focusTarget) {
                return;
            }
            const items = getProfileMenuItems();
            if (!items.length) {
                pendingProfileFocusRef.current = null;
                return;
            }
            const targetIndex = focusTarget === 'last' ? items.length - 1 : 0;
            items[targetIndex]?.focus();
            pendingProfileFocusRef.current = null;
        });

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.cancelAnimationFrame(focusFrameId);
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeProfileMenu, getProfileMenuItems, profileOpen]);

    useEffect(() => {
        if (!notificationsOpen || typeof window === 'undefined') {
            return undefined;
        }

        const handlePointerDown = (event) => {
            if (event.target instanceof Node && !notificationsRef.current?.contains(event.target)) {
                closeNotificationsPanel();
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeNotificationsPanel(true);
            }
        };

        window.addEventListener('pointerdown', handlePointerDown);
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('pointerdown', handlePointerDown);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [closeNotificationsPanel, notificationsOpen]);

    const markNotificationRead = useCallback(
        (notificationId) => {
            if (!notificationId) {
                return;
            }
            setReadNotificationIds((previousIds) => {
                if (previousIds.includes(notificationId)) {
                    return previousIds;
                }
                return [...previousIds, notificationId].slice(-MAX_STORED_NOTIFICATION_IDS);
            });
            onNotificationsRead([notificationId]);
        },
        [onNotificationsRead]
    );

    const markAllNotificationsRead = useCallback(() => {
        if (!unreadNotificationIds.length) {
            return;
        }
        setReadNotificationIds((previousIds) => {
            const nextIds = Array.from(new Set([...previousIds, ...unreadNotificationIds]));
            return nextIds.slice(-MAX_STORED_NOTIFICATION_IDS);
        });
        onNotificationsRead(unreadNotificationIds);
    }, [onNotificationsRead, unreadNotificationIds]);

    const handleNotificationSelect = useCallback(
        (notification) => {
            markNotificationRead(notification.id);
            closeNotificationsPanel();
            if (typeof notification.onSelect === 'function') {
                notification.onSelect(notification);
                return;
            }
            if (notification.path) {
                navigate(notification.path);
            }
        },
        [closeNotificationsPanel, markNotificationRead, navigate]
    );

    const handleSignOut = useCallback(async () => {
        if (isSigningOut) {
            return;
        }
        setIsSigningOut(true);
        setSignOutError('');
        try {
            const response = await apiFetch('/api/v1/user/signout', { method: 'POST' });
            if (!response.ok) {
                throw new Error(await readErrorMessage(response, 'Failed to sign out.'));
            }
            dispatch(signoutSuccess());
            closeProfileMenu(true);
            closeNotificationsPanel();
            navigate('/');
        } catch (error) {
            setSignOutError(error?.message || 'Failed to sign out.');
        } finally {
            setIsSigningOut(false);
        }
    }, [closeNotificationsPanel, closeProfileMenu, dispatch, isSigningOut, navigate]);

    const goTo = useCallback(
        (path) => {
            closeProfileMenu();
            closeNotificationsPanel();
            navigate(path);
        },
        [closeNotificationsPanel, closeProfileMenu, navigate]
    );

    const handleProfileTriggerKeyDown = (event) => {
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (profileOpen) {
                focusProfileMenuItem(0);
                return;
            }
            openProfileMenu('first');
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (profileOpen) {
                const items = getProfileMenuItems();
                focusProfileMenuItem(items.length - 1);
                return;
            }
            openProfileMenu('last');
            return;
        }

        if (event.key === 'Escape' && profileOpen) {
            event.preventDefault();
            closeProfileMenu(true);
        }
    };

    const handleProfileMenuKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeProfileMenu(true);
            return;
        }

        const items = getProfileMenuItems();
        if (!items.length) {
            return;
        }

        const currentIndex = items.findIndex((item) => item === event.target);

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            focusProfileMenuItem(currentIndex >= 0 ? currentIndex + 1 : 0);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            focusProfileMenuItem(currentIndex >= 0 ? currentIndex - 1 : items.length - 1);
            return;
        }

        if (event.key === 'Home') {
            event.preventDefault();
            focusProfileMenuItem(0);
            return;
        }

        if (event.key === 'End') {
            event.preventDefault();
            focusProfileMenuItem(items.length - 1);
            return;
        }
    };

    const accountMenuItems = useMemo(
        () =>
            currentUser
                ? [
                      {
                          key: 'profile',
                          label: 'Profile',
                          description: 'Manage your account details',
                          shortcut: '',
                          Icon: HiOutlineUserCircle,
                          onSelect: () => goTo('/dashboard?tab=profile'),
                      },
                      {
                          key: 'dashboard',
                          label: 'Dashboard',
                          description: currentUser.isAdmin ? 'Open moderation dashboard' : 'Open personal dashboard',
                          shortcut: '',
                          Icon: HiOutlineIdentification,
                          onSelect: () => goTo(currentUser.isAdmin ? '/dashboard?tab=dash' : '/dashboard?tab=profile'),
                      },
                      currentUser.isAdmin
                          ? {
                                key: 'admin',
                                label: 'Admin Panel',
                                description: 'Review and manage platform content',
                                shortcut: '',
                                Icon: HiOutlineCog6Tooth,
                                onSelect: () => goTo('/admin'),
                            }
                          : null,
                  ].filter(Boolean)
                : [
                      {
                          key: 'signin',
                          label: 'Sign In',
                          description: 'Access your synced workspace',
                          shortcut: '',
                          Icon: HiOutlineArrowLeftOnRectangle,
                          onSelect: () => goTo('/sign-in'),
                      },
                      {
                          key: 'signup',
                          label: 'Create Account',
                          description: 'Start syncing profile and settings',
                          shortcut: '',
                          Icon: HiOutlineUserCircle,
                          onSelect: () => goTo('/sign-up'),
                      },
                  ],
        [currentUser, goTo]
    );

    const workspaceMenuItems = useMemo(
        () => [
            {
                key: 'home',
                label: 'Home',
                description: 'Go to workspace home',
                shortcut: '',
                Icon: HiOutlineHome,
                disabled: false,
                onSelect: () => {
                    closeProfileMenu();
                    onGoHome();
                },
            },
            {
                key: 'search',
                label: 'Command Palette',
                description: 'Search tools, windows, and actions',
                shortcut: commandPaletteShortcut,
                Icon: HiOutlineMagnifyingGlass,
                disabled: false,
                onSelect: () => {
                    closeProfileMenu();
                    onOpenCommandPalette();
                },
            },
            {
                key: 'mission-control',
                label: missionControlOpen ? 'Hide Mission Control' : 'Show Mission Control',
                description: 'Window overview mode',
                shortcut: missionControlShortcut,
                Icon: HiOutlineArrowsPointingOut,
                disabled: false,
                onSelect: () => {
                    closeProfileMenu();
                    onToggleMissionControl();
                },
            },
            {
                key: 'control-center',
                label: controlCenterOpen ? 'Hide Control Center' : 'Show Control Center',
                description: 'Desktop and appearance controls',
                shortcut: controlCenterShortcut,
                Icon: HiOutlineAdjustmentsHorizontal,
                disabled: false,
                onMouseDown: preventControlCenterClickAway,
                onSelect: () => {
                    closeProfileMenu();
                    handleControlCenterToggle();
                },
            },
            {
                key: 'quick-look',
                label: quickLookOpen ? 'Hide Quick Look' : 'Show Quick Look',
                description: quickLookCanToggle ? 'Preview the focused workspace' : 'No staged window available',
                shortcut: quickLookShortcut,
                Icon: HiOutlineSparkles,
                disabled: !quickLookCanToggle,
                onSelect: () => {
                    closeProfileMenu();
                    onToggleQuickLook();
                },
            },
        ],
        [
            closeProfileMenu,
            commandPaletteShortcut,
            controlCenterOpen,
            controlCenterShortcut,
            handleControlCenterToggle,
            missionControlOpen,
            missionControlShortcut,
            onGoHome,
            onOpenCommandPalette,
            onToggleMissionControl,
            onToggleQuickLook,
            preventControlCenterClickAway,
            quickLookCanToggle,
            quickLookOpen,
            quickLookShortcut,
        ]
    );

    const mobilePrimaryWorkspaceItems = useMemo(
        () => workspaceMenuItems.filter(({ key }) => MOBILE_PRIMARY_WORKSPACE_KEYS.has(key)),
        [workspaceMenuItems]
    );

    const mobileSecondaryWorkspaceItems = useMemo(
        () => workspaceMenuItems.filter(({ key }) => !MOBILE_PRIMARY_WORKSPACE_KEYS.has(key)),
        [workspaceMenuItems]
    );

    return (
        <motion.header
            ref={headerRef}
            onFocusCapture={handleHeaderFocus}
            onBlurCapture={handleHeaderBlur}
            onPointerEnter={handleHeaderPointerEnter}
            onPointerLeave={handleHeaderPointerLeave}
            initial={false}
            animate={{
                y: headerIsHidden ? '-120%' : 0,
                opacity: headerIsHidden ? 0 : 1,
                scale: headerIsHidden ? 0.98 : 1,
            }}
            transition={{ type: 'spring', damping: 28, stiffness: 250 }}
            className="pointer-events-none fixed inset-x-0 top-0 z-[84] px-2 sm:px-3"
            style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.44rem)' }}
        >
            <motion.div
                onPointerEnter={handleHeaderPointerEnter}
                onPointerLeave={handleHeaderPointerLeave}
                layout
                className="pointer-events-auto mx-auto flex w-full max-w-[84rem] items-center gap-2 rounded-[1.4rem] border border-white/35 bg-white/55 p-2 shadow-[0_22px_44px_-18px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.5)] backdrop-blur-[40px] transition-all duration-300 dark:border-white/10 dark:bg-slate-950/50 dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
                style={{ '--advanced-header-accent': resolvedAccent }}
            >
                <div className="flex min-w-0 items-center gap-2">
                    <div className="hidden items-center gap-1.5 rounded-full border border-white/40 bg-white/50 px-2 py-1 dark:border-white/10 dark:bg-slate-900/60 md:flex">
                        <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={() => {
                                closeProfileMenu();
                                closeNotificationsPanel();
                                onGoHome();
                            }}
                            aria-label="Go to home"
                            title="Go to home"
                            className="h-3 w-3 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)] transition-shadow hover:shadow-[0_0_12px_rgba(244,63,94,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/70"
                        />
                        <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={onToggleMissionControl}
                            aria-label={missionControlTitle}
                            aria-pressed={missionControlOpen}
                            title={missionControlTitle}
                            className={`h-3 w-3 rounded-full shadow-[0_0_8px_rgba(251,191,36,0.4)] transition-all duration-150 hover:shadow-[0_0_12px_rgba(251,191,36,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/70 ${
                                missionControlOpen ? 'bg-amber-400 ring-2 ring-amber-300/80 scale-110' : 'bg-amber-400'
                            }`}
                        />
                        <motion.button
                            whileHover={{ scale: 1.2 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={handleControlCenterToggle}
                            onMouseDown={preventControlCenterClickAway}
                            aria-label={controlCenterTitle}
                            aria-pressed={controlCenterOpen}
                            title={controlCenterTitle}
                            className={`h-3 w-3 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] transition-all duration-150 hover:shadow-[0_0_12px_rgba(16,185,129,0.6)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/70 ${
                                controlCenterOpen ? 'bg-emerald-500 ring-2 ring-emerald-300/80 scale-110' : 'bg-emerald-500'
                            }`}
                        />
                    </div>

                    <motion.button
                        whileHover={{ y: -2, scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        type="button"
                        onClick={() => {
                            closeProfileMenu();
                            closeNotificationsPanel();
                            onGoHome();
                        }}
                        aria-label={brand.title}
                        className="group flex min-w-0 items-center gap-2 rounded-2xl border border-white/45 bg-white/75 px-3 py-1.5 text-left shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:hover:bg-slate-900"
                        title={brand.title}
                    >
                        <span
                            className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-white shadow-[0_8px_16px_-4px_rgba(0,0,0,0.2)] transition-transform group-hover:scale-110"
                            style={{ background: 'var(--advanced-header-accent)' }}
                            aria-hidden="true"
                        >
                            {brand.logoSrc ? (
                                <img
                                    src={brand.logoSrc}
                                    alt={brand.logoAlt}
                                    className="h-full w-full rounded-[inherit] object-cover"
                                />
                            ) : (
                                <brand.LogoIcon className="h-5 w-5" />
                            )}
                        </span>
                        <span className="hidden min-w-0 flex-col sm:flex">
                            <span className="flex min-w-0 items-center gap-2">
                                <span className="truncate text-[13px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{brand.name}</span>
                                {brand.badge ? (
                                    <span className="hidden flex-shrink-0 rounded-md border border-sky-200/50 bg-sky-50/50 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-[0.15em] text-sky-700 shadow-sm dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-200 2xl:inline-flex">
                                        {brand.badge}
                                    </span>
                                ) : null}
                            </span>
                            <span className="truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500/80 dark:text-slate-400/80">
                                {brand.subtitle}
                            </span>
                        </span>
                    </motion.button>
                </div>

                <motion.button
                    whileHover={{ y: -2, scale: 1.005 }}
                    whileTap={{ scale: 0.995 }}
                    type="button"
                    onClick={onOpenCommandPalette}
                    aria-label={shortcutHintTitle}
                    title={shortcutHintTitle}
                    className="hidden min-w-0 flex-1 items-center gap-3 rounded-[1.1rem] border border-white/45 bg-white/80 px-4 py-2 text-left shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:hover:bg-slate-900 sm:flex"
                >
                    <span className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl border border-white/50 bg-white/80 text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-400">
                        <HiOutlineMagnifyingGlass className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] font-bold text-slate-900 dark:text-slate-100">
                            Search tools, windows, and actions
                        </span>
                        <span className="hidden truncate text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500/70 dark:text-slate-400/70 2xl:block">
                            {routeLabel} • {stagedWindowCount} live windows
                        </span>
                    </span>
                    {commandPaletteShortcut ? (
                        <kbd className="ml-auto hidden rounded-lg border border-slate-200/60 bg-white/90 px-2 py-1 text-[10px] font-black uppercase tracking-[0.15em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-slate-800 dark:text-slate-400 md:inline-flex">
                            {commandPaletteShortcut}
                        </kbd>
                    ) : null}
                </motion.button>

                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="button"
                    onClick={onOpenCommandPalette}
                    aria-label={shortcutHintTitle}
                    title={shortcutHintTitle}
                    className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/45 bg-white/80 text-slate-700 shadow-sm transition-colors hover:bg-white dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900 sm:hidden"
                >
                    <HiOutlineMagnifyingGlass className="h-5 w-5" />
                </motion.button>

                <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                    <div className="hidden min-w-0 items-center gap-1.5 2xl:flex">
                        <span className="rounded-lg border border-white/45 bg-white/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-white/15 dark:bg-slate-900/78 dark:text-slate-300">
                            {stagedWindowCount} live
                        </span>
                        {surfacePresetLabel ? (
                            <span className="hidden rounded-lg border border-white/45 bg-white/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-white/15 dark:bg-slate-900/78 dark:text-slate-300 xl:inline-flex">
                                {surfacePresetLabel}
                            </span>
                        ) : null}
                        {wallpaperLabel ? (
                            <span className="hidden rounded-lg border border-white/45 bg-white/78 px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-white/15 dark:bg-slate-900/78 dark:text-slate-300 xl:inline-flex">
                                {wallpaperLabel}
                            </span>
                        ) : null}
                    </div>

                    <div className="inline-flex items-center gap-1 rounded-xl border border-white/55 bg-white/78 px-2.5 py-1.5 text-slate-700 dark:border-white/15 dark:bg-slate-900/78 dark:text-slate-200">
                        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400 sm:inline">
                            {dayLabel}
                        </span>
                        <span className="text-xs font-semibold">{timeLabel}</span>
                    </div>

                    <div className="hidden items-center rounded-2xl border border-white/45 bg-white/70 p-1 dark:border-white/10 dark:bg-slate-900/80 min-[430px]:inline-flex">
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={onToggleMissionControl}
                            aria-label={missionControlTitle}
                            aria-pressed={missionControlOpen}
                            title={missionControlTitle}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 dark:text-slate-300 ${
                                missionControlOpen ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 dark:bg-sky-500 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <HiOutlineArrowsPointingOut className="h-4.5 w-4.5" />
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            type="button"
                            onClick={handleControlCenterToggle}
                            onMouseDown={preventControlCenterClickAway}
                            aria-label={controlCenterTitle}
                            aria-pressed={controlCenterOpen}
                            title={controlCenterTitle}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 dark:text-slate-300 ${
                                controlCenterOpen ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 dark:bg-sky-500 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <HiOutlineAdjustmentsHorizontal className="h-4.5 w-4.5" />
                        </motion.button>
                        <motion.button
                            whileHover={quickLookCanToggle ? { scale: 1.1 } : {}}
                            whileTap={quickLookCanToggle ? { scale: 0.9 } : {}}
                            type="button"
                            onClick={onToggleQuickLook}
                            aria-label={quickLookTitle}
                            aria-pressed={quickLookOpen}
                            title={quickLookTitle}
                            disabled={!quickLookCanToggle}
                            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 disabled:cursor-not-allowed disabled:opacity-30 dark:text-slate-300 ${
                                quickLookOpen ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/30 dark:bg-sky-500 dark:text-white' : 'hover:bg-white dark:hover:bg-slate-800'
                            }`}
                        >
                            <HiOutlineSparkles className="h-4.5 w-4.5" />
                        </motion.button>
                    </div>

                    <div className="relative" ref={notificationsRef}>
                        <motion.button
                            whileHover={{ y: -2, scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            type="button"
                            ref={notificationsTriggerRef}
                            onClick={() => {
                                if (notificationsOpen) {
                                    closeNotificationsPanel();
                                    return;
                                }
                                openNotificationsPanel();
                            }}
                            aria-haspopup="dialog"
                            aria-expanded={notificationsOpen}
                            aria-controls={notificationsOpen ? notificationsPanelId : undefined}
                            aria-label={notificationButtonTitle}
                            title={notificationButtonTitle}
                            className={`relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/45 bg-white/80 text-slate-700 shadow-sm transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/70 dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-300 dark:hover:bg-slate-900 ${
                                notificationsOpen ? 'border-sky-500/50 bg-white ring-4 ring-sky-500/10 dark:border-sky-400/30 dark:bg-slate-900 dark:ring-sky-400/10' : ''
                            }`}
                        >
                            <HiOutlineBell className="h-5 w-5" />
                            {unreadNotificationCount > 0 ? (
                                <span className="absolute -right-1 -top-1 inline-flex min-h-4.5 min-w-4.5 items-center justify-center rounded-full border-2 border-white bg-rose-500 px-1 text-[10px] font-black leading-none text-white shadow-lg shadow-rose-500/30 dark:border-slate-950">
                                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                                </span>
                            ) : null}
                        </motion.button>

                        <AnimatePresence mode="wait">
                            {notificationsOpen && (
                                <motion.div
                                    id={notificationsPanelId}
                                    role="dialog"
                                    aria-modal="false"
                                    aria-label="Notifications"
                                    initial={{ opacity: 0, y: 15, scale: 0.94, filter: 'blur(12px)' }}
                                    animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                    exit={{ opacity: 0, y: 10, scale: 0.96, filter: 'blur(8px)' }}
                                    transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                                    className="absolute right-0 top-[calc(100%+0.65rem)] z-[120] w-[min(24rem,calc(100vw-1.2rem))] overflow-hidden rounded-[1.6rem] border border-slate-200/50 bg-white/75 p-3 text-slate-800 shadow-[0_45px_100px_-35px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-[45px] dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-100 dark:shadow-[0_50px_110px_-40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)]"
                                >
                                    <div className="pointer-events-none absolute -right-14 -top-16 h-40 w-40 rounded-full bg-sky-400/20 blur-3xl dark:bg-cyan-400/15" aria-hidden="true" />
                                    <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/60 to-transparent dark:from-cyan-300/10" aria-hidden="true" />
                                    <div className="relative flex items-start justify-between gap-3 rounded-[1.2rem] border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-cyan-300/15 dark:bg-slate-900/60">
                                        <span className="min-w-0">
                                            <span className="block text-sm font-bold text-slate-900 dark:text-slate-100">Notifications</span>
                                            <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">
                                                {unreadNotificationCount > 0
                                                    ? `${unreadNotificationCount} unread update${unreadNotificationCount === 1 ? '' : 's'}`
                                                    : 'All updates are read'}
                                            </span>
                                        </span>
                                        <button
                                            type="button"
                                            onClick={markAllNotificationsRead}
                                            disabled={!unreadNotificationCount}
                                            className="inline-flex flex-shrink-0 items-center gap-1.5 rounded-xl border border-slate-200/70 bg-white/90 px-2.5 py-1.5 text-[11px] font-bold text-slate-600 shadow-sm transition-all hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-45 dark:border-cyan-300/10 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:border-cyan-300/25 dark:hover:text-cyan-200"
                                        >
                                            <HiOutlineCheckCircle className="h-3.5 w-3.5" />
                                            Mark read
                                        </button>
                                    </div>

                                    <div className="relative mt-3 max-h-[56vh] space-y-2.5 overflow-y-auto pr-1">
                                        {displayedNotifications.length > 0 ? (
                                            displayedNotifications.map((notification) => {
                                                const toneClasses = NOTIFICATION_TONE_CLASSES[notification.tone] || NOTIFICATION_TONE_CLASSES.info;
                                                const Icon = notification.Icon || HiOutlineInformationCircle;
                                                return (
                                                    <motion.button
                                                        key={notification.id}
                                                        layout
                                                        type="button"
                                                        onClick={() => handleNotificationSelect(notification)}
                                                        className={`${NOTIFICATION_ITEM_CLASS} ${toneClasses.item} ${
                                                            notification.read ? 'opacity-65' : ''
                                                        } rounded-[1.2rem]`}
                                                    >
                                                        <span className={`inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border shadow-sm ${toneClasses.icon}`}>
                                                            <Icon className="h-4 w-4" />
                                                        </span>
                                                        <span className="min-w-0 flex-1">
                                                            <span className="flex items-start gap-2">
                                                                <span className="min-w-0 flex-1 truncate text-sm font-bold">{notification.title}</span>
                                                                {!notification.read ? (
                                                                    <span className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${toneClasses.dot}`} aria-hidden="true" />
                                                                ) : null}
                                                            </span>
                                                            {notification.description ? (
                                                                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                                                                    {notification.description}
                                                                </span>
                                                            ) : null}
                                                            <span className="mt-2 flex items-center gap-2 text-[9px] font-bold uppercase tracking-[0.12em] text-slate-400 dark:text-slate-500">
                                                                <span>{notification.timestampLabel}</span>
                                                                {notification.actionLabel ? (
                                                                    <span className="rounded-md border border-slate-200/80 bg-white/75 px-1.5 py-0.5 text-slate-600 dark:border-cyan-300/10 dark:bg-slate-950/70 dark:text-cyan-200">
                                                                        {notification.actionLabel}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                    </motion.button>
                                                );
                                            })
                                        ) : (
                                            <div className="rounded-[1.2rem] border border-slate-200/60 bg-white/70 p-5 text-center text-slate-500 shadow-sm dark:border-cyan-300/10 dark:bg-slate-900/50 dark:text-slate-300">
                                                <HiOutlineInbox className="mx-auto h-7 w-7 opacity-50" />
                                                <p className="mt-3 text-sm font-bold text-slate-700 dark:text-slate-100">No notifications</p>
                                                <p className="mt-1 text-[11px] font-medium">Workspace updates will appear here.</p>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="relative" ref={profileRef}>
                        <motion.button
                            whileHover={{ y: -2, scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            type="button"
                            ref={profileTriggerRef}
                            onClick={() => {
                                if (profileOpen) {
                                    closeProfileMenu();
                                    return;
                                }
                                openProfileMenu();
                            }}
                            onKeyDown={handleProfileTriggerKeyDown}
                            aria-haspopup="menu"
                            aria-expanded={profileOpen}
                            aria-controls={profileOpen ? profileMenuId : undefined}
                            aria-label={quickActionTitle}
                            title={quickActionTitle}
                            className={`relative inline-flex items-center gap-2.5 overflow-hidden rounded-2xl border border-white/45 bg-white/80 px-2.5 py-1.5 text-slate-700 shadow-sm transition-all hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-white/10 dark:bg-slate-950/80 dark:text-slate-100 dark:hover:bg-slate-900 ${
                                profileOpen ? 'border-sky-500/50 bg-white ring-4 ring-sky-500/10 dark:border-sky-400/30 dark:bg-slate-900 dark:ring-sky-400/10' : ''
                            }`}
                        >
                            <span className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/40 via-transparent to-sky-100/20 opacity-80 dark:from-sky-400/5 dark:to-blue-500/5" aria-hidden="true" />
                            <span className="relative inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded-xl border border-white/40 bg-gradient-to-br from-sky-500 to-cyan-400 text-[11px] font-black text-white shadow-[0_10px_20px_-8px_rgba(14,116,244,0.5)] transition-transform group-hover:scale-110 dark:border-white/10 dark:from-sky-400 dark:to-blue-600">
                                {currentUser?.profilePicture ? (
                                    <img src={currentUser.profilePicture} alt="" className="h-full w-full object-cover" />
                                ) : (
                                    profileInitials
                                )}
                                <span
                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${profilePresenceClass}`}
                                    aria-hidden="true"
                                />
                            </span>
                            <span className="relative hidden max-w-[7rem] truncate text-[13px] font-bold tracking-tight md:inline">{quickActionLabel}</span>
                            <span className="relative inline-flex h-4 w-4 items-center justify-center text-slate-400 dark:text-slate-500 md:hidden" aria-hidden="true">
                                {profileOpen ? <HiOutlineXMark className="h-4.5 w-4.5" /> : <HiOutlineBars3 className="h-4.5 w-4.5" />}
                            </span>
                            <HiOutlineChevronDown
                                className={`relative hidden h-4 w-4 text-slate-400 transition-transform duration-300 md:block ${
                                    profileOpen ? 'rotate-180 text-sky-600' : ''
                                }`}
                            />
                        </motion.button>

                        <AnimatePresence mode="wait">
                            {profileOpen && (
                                <>
                                    <motion.button
                                        type="button"
                                        aria-label="Close menu"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="fixed inset-0 z-[110] cursor-default bg-slate-950/15 backdrop-blur-[1px] sm:hidden"
                                        onClick={() => closeProfileMenu(true)}
                                    />
                                    <motion.div
                                        id={profileMenuId}
                                        role="menu"
                                        initial={{ opacity: 0, y: 15, scale: 0.94, filter: 'blur(12px)' }}
                                        animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                                        exit={{ opacity: 0, y: 10, scale: 0.96, filter: 'blur(8px)' }}
                                        transition={{ type: 'spring', damping: 26, stiffness: 280 }}
                                        className="fixed inset-x-3 top-20 z-[120] max-h-[calc(100svh-6rem)] w-auto overflow-hidden rounded-[1.6rem] border border-slate-200/50 bg-white/75 p-3 text-slate-800 shadow-[0_45px_100px_-35px_rgba(15,23,42,0.35),0_0_0_1px_rgba(255,255,255,0.4)] backdrop-blur-[45px] dark:border-white/10 dark:bg-slate-950/75 dark:text-slate-100 dark:shadow-[0_50px_110px_-40px_rgba(0,0,0,0.6),0_0_0_1px_rgba(255,255,255,0.05)] sm:absolute sm:inset-x-auto sm:right-0 sm:top-[calc(100%+0.65rem)] sm:max-h-none sm:w-[min(25rem,calc(100vw-1.2rem))]"
                                        onKeyDown={handleProfileMenuKeyDown}
                                    >
                                        <div className="pointer-events-none absolute -right-16 -top-20 h-44 w-44 rounded-full bg-sky-300/20 blur-3xl dark:bg-cyan-400/15" aria-hidden="true" />
                                        <div className="pointer-events-none absolute -bottom-24 left-4 h-44 w-44 rounded-full bg-blue-400/15 blur-3xl dark:bg-blue-500/10" aria-hidden="true" />
                                        <div className="pointer-events-none absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-white/60 to-transparent dark:from-cyan-300/10" aria-hidden="true" />
                                        <div className="pointer-events-none absolute inset-x-5 top-0 h-px bg-gradient-to-r from-transparent via-sky-200/70 to-transparent dark:via-cyan-300/30" aria-hidden="true" />

                                        <div className="relative mb-3 flex items-center justify-between gap-3 rounded-[1.2rem] border border-slate-200/60 bg-white/80 p-2.5 shadow-sm dark:border-cyan-300/15 dark:bg-slate-900/60 sm:hidden">
                                            <span className="min-w-0">
                                                <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">Menu</span>
                                                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-300">{routeLabel}</span>
                                            </span>
                                            <button
                                                type="button"
                                                aria-label="Close menu"
                                                onClick={() => closeProfileMenu(true)}
                                                className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/90 text-slate-600 shadow-sm transition hover:border-sky-300 hover:text-sky-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 dark:border-cyan-300/10 dark:bg-slate-950/70 dark:text-slate-300 dark:hover:border-cyan-300/25 dark:hover:text-cyan-200"
                                            >
                                                <HiOutlineXMark className="h-4 w-4" />
                                            </button>
                                        </div>

                                        <div className="relative flex items-center gap-3 overflow-hidden rounded-[1.2rem] border border-slate-200/60 bg-white/80 p-3 shadow-sm dark:border-cyan-300/15 dark:bg-slate-900/60 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.045)]">
                                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-sky-100/30 dark:from-cyan-300/10 dark:to-blue-500/10" aria-hidden="true" />
                                            <span className="relative inline-flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/40 bg-gradient-to-br from-sky-500 to-cyan-300 text-sm font-bold text-white shadow-[0_15px_35px_-18px_rgba(14,116,244,0.6)] dark:border-cyan-200/20 dark:from-cyan-400 dark:via-sky-500 dark:to-blue-600">
                                                {currentUser?.profilePicture ? (
                                                    <img src={currentUser.profilePicture} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    profileInitials
                                                )}
                                                <span
                                                    className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-slate-950 ${profilePresenceClass}`}
                                                    aria-hidden="true"
                                                />
                                            </span>
                                            <span className="relative min-w-0">
                                                <span className="block truncate text-sm font-bold text-slate-900 dark:text-slate-100">{profileName}</span>
                                                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{profileEmail}</span>
                                                <span className="mt-1.5 inline-flex rounded-lg border border-sky-200/70 bg-sky-50/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-sky-700 shadow-sm dark:border-cyan-300/15 dark:bg-cyan-300/10 dark:text-cyan-200">
                                                    {profileRole}
                                                </span>
                                            </span>
                                        </div>

                                        <div className="relative mt-3 flex flex-wrap gap-1.5" aria-hidden="true">
                                            <span className={`${PROFILE_MENU_CHIP_CLASS} gap-1 rounded-[0.6rem] font-bold`}>
                                                <HiOutlineMapPin className="h-3.5 w-3.5" />
                                                {routeLabel}
                                            </span>
                                            <span className={`${PROFILE_MENU_CHIP_CLASS} rounded-[0.6rem] font-bold`}>
                                                {stagedWindowCount} live
                                            </span>
                                            {surfacePresetLabel ? (
                                                <span className={`${PROFILE_MENU_CHIP_CLASS} rounded-[0.6rem] font-bold`}>
                                                    {surfacePresetLabel}
                                                </span>
                                            ) : null}
                                        </div>

                                        <div className="relative mt-3 grid grid-cols-2 gap-2 sm:hidden">
                                            {mobilePrimaryWorkspaceItems.map(({ key, label, description, Icon, onSelect, disabled, onMouseDown }) => (
                                                <button
                                                    key={key}
                                                    type="button"
                                                    role="menuitem"
                                                    data-profile-menuitem="true"
                                                    disabled={disabled}
                                                    onClick={onSelect}
                                                    onMouseDown={onMouseDown}
                                                    className="group flex min-h-[4.75rem] flex-col items-start justify-between rounded-2xl border border-slate-200/70 bg-white/78 p-3 text-left text-slate-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500/60 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 dark:border-cyan-300/10 dark:bg-slate-900/62 dark:text-slate-100 dark:hover:border-cyan-300/25 dark:hover:bg-cyan-300/10 dark:focus-visible:ring-cyan-300/40"
                                                >
                                                    <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200/80 bg-white/90 text-slate-600 shadow-sm dark:border-cyan-300/10 dark:bg-cyan-300/10 dark:text-cyan-200">
                                                        <Icon className="h-4 w-4" />
                                                    </span>
                                                    <span className="min-w-0">
                                                        <span className="block truncate text-sm font-bold">{label}</span>
                                                        <span className="mt-0.5 block max-h-8 overflow-hidden text-[11px] font-medium leading-4 text-slate-500 dark:text-slate-400">
                                                            {description}
                                                        </span>
                                                    </span>
                                                </button>
                                            ))}
                                        </div>

                                        <div className="relative mt-3 max-h-[calc(100svh-21rem)] space-y-2 overflow-y-auto pr-1 sm:max-h-[56vh]">
                                            <section className={PROFILE_MENU_SECTION_CLASS + " rounded-[1.2rem]"}>
                                                <p className={PROFILE_MENU_SECTION_TITLE_CLASS}>
                                                    {currentUser ? 'Account' : 'Guest'}
                                                </p>
                                                <div className="grid gap-1.5">
                                                    {accountMenuItems.map(({ key, label, description, Icon, shortcut, onSelect }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            role="menuitem"
                                                            data-profile-menuitem="true"
                                                            onClick={onSelect}
                                                            className={PROFILE_MENU_ITEM_CLASS}
                                                        >
                                                            <span className={PROFILE_MENU_ICON_CLASS}>
                                                                <Icon className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-bold">{label}</span>
                                                                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{description}</span>
                                                            </span>
                                                            {shortcut ? (
                                                                <span className={PROFILE_MENU_SHORTCUT_CLASS}>
                                                                    {shortcut}
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    ))}
                                                </div>
                                            </section>

                                            <section className={PROFILE_MENU_SECTION_CLASS + " rounded-[1.2rem]"}>
                                                <p className={PROFILE_MENU_SECTION_TITLE_CLASS}>
                                                    Workspace Actions
                                                </p>
                                                <div className="hidden gap-1.5 sm:grid">
                                                    {workspaceMenuItems.map(({ key, label, description, shortcut, Icon, onSelect, disabled, onMouseDown }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            role="menuitem"
                                                            data-profile-menuitem="true"
                                                            disabled={disabled}
                                                            onClick={onSelect}
                                                            onMouseDown={onMouseDown}
                                                            className={PROFILE_MENU_ITEM_CLASS}
                                                        >
                                                            <span className={PROFILE_MENU_ICON_CLASS}>
                                                                <Icon className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-bold">{label}</span>
                                                                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{description}</span>
                                                            </span>
                                                            {shortcut ? (
                                                                <span className={PROFILE_MENU_SHORTCUT_CLASS}>
                                                                    {shortcut}
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="grid gap-1.5 sm:hidden">
                                                    {mobileSecondaryWorkspaceItems.map(({ key, label, description, shortcut, Icon, onSelect, disabled, onMouseDown }) => (
                                                        <button
                                                            key={key}
                                                            type="button"
                                                            role="menuitem"
                                                            data-profile-menuitem="true"
                                                            disabled={disabled}
                                                            onClick={onSelect}
                                                            onMouseDown={onMouseDown}
                                                            className={PROFILE_MENU_ITEM_CLASS}
                                                        >
                                                            <span className={PROFILE_MENU_ICON_CLASS}>
                                                                <Icon className="h-4 w-4" />
                                                            </span>
                                                            <span className="min-w-0 flex-1">
                                                                <span className="block truncate text-sm font-bold">{label}</span>
                                                                <span className="block truncate text-[11px] font-medium text-slate-500 dark:text-slate-400">{description}</span>
                                                            </span>
                                                            {shortcut ? (
                                                                <span className={PROFILE_MENU_SHORTCUT_CLASS}>
                                                                    {shortcut}
                                                                </span>
                                                            ) : null}
                                                        </button>
                                                    ))}
                                                </div>
                                            </section>
                                        </div>

                                        {currentUser ? (
                                            <button
                                                type="button"
                                                role="menuitem"
                                                data-profile-menuitem="true"
                                                onClick={handleSignOut}
                                                disabled={isSigningOut}
                                                className="relative mt-2 flex w-full items-center gap-2 rounded-xl border border-rose-200/50 bg-rose-50/90 px-2.5 py-2.5 text-left text-sm font-bold text-rose-700 shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:bg-rose-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-200 dark:shadow-[inset_0_1px_0_rgba(255,255,255,0.035)] dark:hover:border-rose-300/30 dark:hover:bg-rose-400/15"
                                            >
                                                <HiOutlineArrowLeftOnRectangle className="h-4 w-4" />
                                                {isSigningOut ? 'Signing out...' : 'Sign Out'}
                                            </button>
                                        ) : null}

                                        {signOutError ? (
                                            <p className="relative mt-2 rounded-xl border border-rose-200 bg-rose-50/90 px-2.5 py-2 text-xs font-bold text-rose-700 shadow-sm dark:border-rose-300/20 dark:bg-rose-400/10 dark:text-rose-200" role="alert">
                                                {signOutError}
                                            </p>
                                        ) : null}
                                    </motion.div>
                                </>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </motion.header>
    );
}

AdvancedHeader.propTypes = {
    accent: PropTypes.string,
    routeLabel: PropTypes.string,
    stagedWindowCount: PropTypes.number,
    focusMode: PropTypes.bool,
    surfacePresetLabel: PropTypes.string,
    wallpaperLabel: PropTypes.string,
    commandPaletteShortcut: PropTypes.string,
    missionControlOpen: PropTypes.bool,
    missionControlShortcut: PropTypes.string,
    controlCenterOpen: PropTypes.bool,
    controlCenterShortcut: PropTypes.string,
    quickLookAvailable: PropTypes.bool,
    quickLookOpen: PropTypes.bool,
    quickLookShortcut: PropTypes.string,
    autoHide: PropTypes.bool,
    autoHideDelay: PropTypes.number,
    branding: PropTypes.shape({
        name: PropTypes.string,
        subtitle: PropTypes.string,
        badge: PropTypes.string,
        logoSrc: PropTypes.string,
        logoAlt: PropTypes.string,
        title: PropTypes.string,
        LogoIcon: PropTypes.elementType,
    }),
    notifications: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
            title: PropTypes.string,
            description: PropTypes.string,
            timestampLabel: PropTypes.string,
            timeLabel: PropTypes.string,
            actionLabel: PropTypes.string,
            tone: PropTypes.oneOf(['info', 'success', 'warning']),
            read: PropTypes.bool,
            path: PropTypes.string,
            Icon: PropTypes.elementType,
            onSelect: PropTypes.func,
        })
    ),
    onGoHome: PropTypes.func,
    onOpenCommandPalette: PropTypes.func,
    onToggleMissionControl: PropTypes.func,
    onToggleControlCenter: PropTypes.func,
    onToggleQuickLook: PropTypes.func,
    onNotificationsRead: PropTypes.func,
};
