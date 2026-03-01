

import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FaApple } from 'react-icons/fa';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowLeftOnRectangle,
    HiOutlineArrowPathRoundedSquare,
    HiOutlineBolt,
    HiOutlineChevronDown,
    HiOutlineCommandLine,
    HiOutlineCursorArrowRays,
    HiOutlineMagnifyingGlass,
    HiOutlineMoon,
    HiOutlineQuestionMarkCircle,
    HiOutlineRectangleGroup,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineSun,
    HiOutlineUserCircle,
    HiOutlineUserPlus,
    HiOutlineArrowRightOnRectangle,
    HiOutlineWifi,
} from 'react-icons/hi2';

const MenuDivider = () => <div className="my-1 h-px bg-slate-200/80 dark:bg-white/10" />;

function MenuItem({ label, hotkey, onSelect }) {
    return (
        <button
            type="button"
            onClick={onSelect}
            className="group flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-800 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:text-slate-100 dark:hover:bg-white/10 dark:hover:text-white"
        >
            <span className="flex items-center gap-2">
                {label.icon ? <label.icon className="h-4 w-4 text-slate-500 dark:text-slate-300" /> : null}
                <span>{label.text}</span>
            </span>
            {hotkey ? (
                <span className="text-[11px] font-semibold tracking-wide text-slate-400 group-hover:text-slate-500 dark:text-slate-400 dark:group-hover:text-slate-200">
                    {hotkey}
                </span>
            ) : null}
        </button>
    );
}

MenuItem.propTypes = {
    label: PropTypes.shape({
        text: PropTypes.string.isRequired,
        icon: PropTypes.elementType,
    }).isRequired,
    hotkey: PropTypes.string,
    onSelect: PropTypes.func,
};

MenuItem.defaultProps = {
    hotkey: '',
    onSelect: undefined,
};

function ProfileMenu({ profile, items, open, onToggle }) {
    const profileName = profile?.name || 'Guest';
    const profileEmail = profile?.email || 'Not signed in';
    const profileInitial = profileName.charAt(0).toUpperCase();
    const roleLabel = profile?.isAdmin ? 'Admin' : profile?.isAuthenticated ? 'Member' : 'Guest';

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => onToggle(!open)}
                aria-haspopup="menu"
                aria-expanded={open}
                className={`group inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                    open
                        ? 'border-sky-400/50 bg-white/80 text-slate-800 shadow-md dark:border-sky-300/40 dark:bg-white/10 dark:text-slate-100'
                        : 'border-white/50 bg-white/70 text-slate-700 shadow-sm hover:-translate-y-[1px] hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-slate-100'
                }`}
            >
                <span className="relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-white/60 bg-white/80 text-sm font-semibold text-slate-700 shadow-inner dark:border-white/10 dark:bg-white/10 dark:text-white">
                    {profile?.avatar ? (
                        <img
                            src={profile.avatar}
                            alt={profileName}
                            className="h-full w-full object-cover"
                        />
                    ) : (
                        <span>{profileInitial}</span>
                    )}
                </span>
                <span className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300">
                        {roleLabel}
                    </span>
                    <span className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                        {profileName}
                    </span>
                </span>
                <HiOutlineChevronDown className="h-4 w-4 text-slate-500 transition group-hover:translate-y-[1px] dark:text-slate-200" />
            </button>
            {open ? (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-white/70 bg-white/95 text-slate-900 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-white">
                    <div className="flex items-center gap-3 border-b border-slate-100/60 p-3 dark:border-white/10">
                        <div className="relative h-12 w-12 overflow-hidden rounded-full border border-white/60 bg-white/80 shadow-sm dark:border-white/10 dark:bg-white/5">
                            {profile?.avatar ? (
                                <img
                                    src={profile.avatar}
                                    alt={profileName}
                                    className="h-full w-full object-cover"
                                />
                            ) : (
                                <div className="flex h-full w-full items-center justify-center text-base font-semibold text-slate-700 dark:text-white">
                                    {profileInitial}
                                </div>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                                {profileName}
                            </p>
                            <p className="truncate text-xs text-slate-500 dark:text-slate-300">
                                {profileEmail}
                            </p>
                            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:bg-white/10 dark:text-slate-200">
                                {roleLabel}
                            </span>
                        </div>
                    </div>
                    <div className="p-1.5">
                        {items.map((item, index) =>
                            item === 'divider' ? (
                                <MenuDivider key={`profile-divider-${index}`} />
                            ) : (
                                <MenuItem
                                    key={item.key}
                                    label={{ text: item.label, icon: item.icon }}
                                    hotkey={item.hotkey}
                                    onSelect={() => onToggle(false, item.onSelect)}
                                />
                            )
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

ProfileMenu.propTypes = {
    profile: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        avatar: PropTypes.string,
        isAdmin: PropTypes.bool,
        isAuthenticated: PropTypes.bool,
    }),
    items: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                key: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
                hotkey: PropTypes.string,
                icon: PropTypes.elementType,
                onSelect: PropTypes.func,
            }),
        ])
    ).isRequired,
    open: PropTypes.bool,
    onToggle: PropTypes.func.isRequired,
};

ProfileMenu.defaultProps = {
    profile: null,
    open: false,
};

function MenuButton({ id, label, items, openMenu, onToggle }) {
    const isOpen = openMenu === id;
    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => onToggle(isOpen ? null : id)}
                aria-label={label.ariaLabel || label.text || 'Menu'}
                className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-sm font-semibold transition ${
                    isOpen
                        ? 'bg-slate-900 text-white shadow-inner shadow-slate-900/30 dark:bg-white dark:text-slate-900'
                        : 'text-slate-800 hover:bg-white/60 dark:text-slate-100 dark:hover:bg-white/10'
                }`}
            >
                {label.icon ? <label.icon className="h-4 w-4" /> : null}
                <span className="whitespace-nowrap">{label.text}</span>
                <HiOutlineChevronDown className="h-4 w-4 opacity-70" />
            </button>
            {isOpen ? (
                <div className="absolute left-0 mt-2 min-w-[220px] rounded-2xl border border-white/70 bg-white/95 text-slate-900 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/95 dark:text-white">
                    <div className="p-1.5">
                        {items.map((item, index) =>
                            item === 'divider' ? (
                                <MenuDivider key={`${id}-divider-${index}`} />
                            ) : (
                                <MenuItem
                                    key={item.key}
                                    label={{ text: item.label, icon: item.icon }}
                                    hotkey={item.hotkey}
                                    onSelect={() => {
                                        if (item.onSelect) {
                                            item.onSelect();
                                        }
                                        onToggle(null);
                                    }}
                                />
                            )
                        )}
                    </div>
                </div>
            ) : null}
        </div>
    );
}

MenuButton.propTypes = {
    id: PropTypes.string.isRequired,
    label: PropTypes.shape({
        text: PropTypes.string.isRequired,
        icon: PropTypes.elementType,
        ariaLabel: PropTypes.string,
    }).isRequired,
    items: PropTypes.arrayOf(
        PropTypes.oneOfType([
            PropTypes.string,
            PropTypes.shape({
                key: PropTypes.string.isRequired,
                label: PropTypes.string.isRequired,
                hotkey: PropTypes.string,
                icon: PropTypes.elementType,
                onSelect: PropTypes.func,
            }),
        ])
    ).isRequired,
    openMenu: PropTypes.string,
    onToggle: PropTypes.func.isRequired,
};

MenuButton.defaultProps = {
    openMenu: null,
};

const STATUS_BADGE_CLASSES =
    'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition border border-white/50 bg-white/80 shadow-sm backdrop-blur dark:border-white/10 dark:bg-white/10';

const AUTOHIDE_HIDE_DELAY_MS = 1200;
const AUTOHIDE_EDGE_LINGER_MS = 2000;
const AUTOHIDE_REVEAL_EDGE_Y = 8;
const AUTOHIDE_PREVIEW_EDGE_Y = 28;

export default function DesktopMenuBar({
    activeAppTitle,
    activePath,
    clock,
    focusMode,
    theme,
    windowTelemetry,
    onNavigateHome,
    onNavigateSearch,
    onOpenCommandPalette,
    onOpenMissionControl,
    onOpenQuickLook,
    onOpenWindowSwitcher,
    onDuplicateWindow,
    onApplyWindowLayout,
    onToggleFocusMode,
    onToggleTheme,
    onToggleControlCenter,
    controlCenterOpen,
    profile,
    onProfileMenuAction,
    autoHide = false,
}) {
    const [openMenu, setOpenMenu] = useState(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);
    const [isHidden, setIsHidden] = useState(false);
    const [peekVisible, setPeekVisible] = useState(false);
    const barRef = useRef(null);
    const hideTimerRef = useRef(null);
    const revealZoneRef = useRef(null);
    const lastPointerYRef = useRef(Number.POSITIVE_INFINITY);

    const clearHideTimer = useCallback(() => {
        if (hideTimerRef.current) {
            clearTimeout(hideTimerRef.current);
            hideTimerRef.current = null;
        }
    }, []);

    const revealMenubar = useCallback(() => {
        setIsHidden(false);
        setPeekVisible(false);
    }, []);

    const hideMenubar = useCallback(() => {
        setIsHidden(true);
        setPeekVisible(false);
    }, []);

    const scheduleHide = useCallback(
        (delay = AUTOHIDE_HIDE_DELAY_MS) => {
            if (!autoHide) return;
            clearHideTimer();
            hideTimerRef.current = setTimeout(() => {
                if (!openMenu && !profileMenuOpen && !controlCenterOpen) {
                    hideMenubar();
                }
                hideTimerRef.current = null;
            }, delay);
        },
        [autoHide, clearHideTimer, controlCenterOpen, hideMenubar, openMenu, profileMenuOpen]
    );

    const handleMenuToggle = (menuId) => {
        setProfileMenuOpen(false);
        setOpenMenu(menuId);
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (barRef.current && !barRef.current.contains(event.target)) {
                setOpenMenu(null);
                setProfileMenuOpen(false);
            }
        };
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setOpenMenu(null);
                setProfileMenuOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleEsc);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, []);

    // Auto-hide the menubar (macOS-style): reveal on top-edge intent and stay hidden otherwise.
    useEffect(() => {
        if (!autoHide) {
            setIsHidden(false);
            setPeekVisible(false);
            clearHideTimer();
            return undefined;
        }

        const handlePointerMove = (event) => {
            const y =
                typeof event.clientY === 'number'
                    ? event.clientY
                    : lastPointerYRef.current ?? Number.POSITIVE_INFINITY;
            lastPointerYRef.current = y;
            const atEdge = y <= AUTOHIDE_REVEAL_EDGE_Y;
            const nearEdge = y <= AUTOHIDE_PREVIEW_EDGE_Y;

            if (controlCenterOpen || openMenu || profileMenuOpen) {
                revealMenubar();
                return;
            }

            if (atEdge) {
                revealMenubar();
                clearHideTimer();
                return;
            }

            if (nearEdge && isHidden) {
                setPeekVisible(true);
                clearHideTimer();
                return;
            }

            setPeekVisible(false);
            scheduleHide(AUTOHIDE_HIDE_DELAY_MS);
        };

        window.addEventListener('pointermove', handlePointerMove, { passive: true });
        window.addEventListener('scroll', handlePointerMove, { passive: true });

        scheduleHide(AUTOHIDE_EDGE_LINGER_MS);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('scroll', handlePointerMove);
            clearHideTimer();
        };
    }, [
        autoHide,
        clearHideTimer,
        controlCenterOpen,
        isHidden,
        openMenu,
        profileMenuOpen,
        revealMenubar,
        scheduleHide,
    ]);

    useEffect(() => {
        if (!autoHide) return undefined;
        const node = revealZoneRef.current;
        if (!node) return undefined;
        const handleEnter = () => {
            lastPointerYRef.current = AUTOHIDE_REVEAL_EDGE_Y;
            revealMenubar();
            clearHideTimer();
        };
        node.addEventListener('pointerenter', handleEnter);
        node.addEventListener('focus', handleEnter);
        return () => {
            node.removeEventListener('pointerenter', handleEnter);
            node.removeEventListener('focus', handleEnter);
        };
    }, [autoHide, clearHideTimer, revealMenubar]);

    useEffect(() => {
        if (!autoHide) {
            return undefined;
        }
        if (controlCenterOpen) {
            revealMenubar();
            clearHideTimer();
        } else if ((lastPointerYRef.current ?? Number.POSITIVE_INFINITY) > AUTOHIDE_PREVIEW_EDGE_Y) {
            scheduleHide(AUTOHIDE_EDGE_LINGER_MS);
        }
        return undefined;
    }, [autoHide, clearHideTimer, controlCenterOpen, revealMenubar, scheduleHide]);

    useEffect(() => {
        if (!autoHide) return undefined;
        const handleKeyReveal = (event) => {
            if (event.altKey || event.metaKey || ['Alt', 'Meta', 'Control', 'Escape'].includes(event.key)) {
                revealMenubar();
                scheduleHide(AUTOHIDE_EDGE_LINGER_MS);
            }
        };
        window.addEventListener('keydown', handleKeyReveal);
        return () => window.removeEventListener('keydown', handleKeyReveal);
    }, [autoHide, revealMenubar, scheduleHide]);

    useEffect(() => {
        if (!autoHide) return undefined;
        const node = barRef.current;
        if (!node) return undefined;
        const reveal = () => revealMenubar();
        node.addEventListener('focusin', reveal);
        node.addEventListener('mouseenter', reveal);
        return () => {
            node.removeEventListener('focusin', reveal);
            node.removeEventListener('mouseenter', reveal);
        };
    }, [autoHide, revealMenubar]);

    useEffect(() => {
        setOpenMenu(null);
        setProfileMenuOpen(false);
    }, [activeAppTitle, activePath]);

    const appleMenu = useMemo(
        () => [
            { key: 'about', label: 'About ScientistShield Desktop', icon: HiOutlineSparkles, onSelect: onNavigateHome },
            { key: 'palette', label: 'Command Palette…', icon: HiOutlineCommandLine, hotkey: '⌘K', onSelect: onOpenCommandPalette },
            { key: 'search', label: 'Search Everything', icon: HiOutlineMagnifyingGlass, hotkey: '⌘F', onSelect: onNavigateSearch },
            'divider',
            {
                key: 'mission',
                label: 'Mission Control',
                icon: HiOutlineRectangleGroup,
                hotkey: 'F3',
                onSelect: onOpenMissionControl,
            },
            {
                key: 'focus',
                label: focusMode ? 'Disable Focus Mode' : 'Enable Focus Mode',
                icon: HiOutlineCursorArrowRays,
                hotkey: '⌘⌥F',
                onSelect: onToggleFocusMode,
            },
            'divider',
            {
                key: 'theme',
                label: theme === 'dark' ? 'Use Light Appearance' : 'Use Dark Appearance',
                icon: theme === 'dark' ? HiOutlineSun : HiOutlineMoon,
                onSelect: onToggleTheme,
            },
        ],
        [focusMode, onNavigateHome, onNavigateSearch, onOpenCommandPalette, onOpenMissionControl, onToggleFocusMode, onToggleTheme, theme]
    );

    const windowMenu = useMemo(
        () => [
            { key: 'new-window', label: 'New Window', icon: HiOutlineRectangleGroup, hotkey: '⌘⇧N', onSelect: onDuplicateWindow },
            { key: 'switcher', label: 'Cycle Windows', icon: HiOutlineArrowPathRoundedSquare, hotkey: '⌘`', onSelect: () => onOpenWindowSwitcher(1) },
            { key: 'quick-look', label: 'Quick Look', icon: HiOutlineSparkles, hotkey: 'Space', onSelect: onOpenQuickLook },
            'divider',
            { key: 'mission', label: 'Mission Control', icon: HiOutlineRectangleGroup, onSelect: onOpenMissionControl },
            'divider',
            { key: 'layout-full', label: 'Fill Stage', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥⇧↑', onSelect: () => onApplyWindowLayout('full') },
            { key: 'layout-center', label: 'Center Window', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥⇧↓', onSelect: () => onApplyWindowLayout('center') },
            'divider',
            { key: 'layout-left', label: 'Left Split', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥←', onSelect: () => onApplyWindowLayout('left') },
            { key: 'layout-right', label: 'Right Split', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥→', onSelect: () => onApplyWindowLayout('right') },
            { key: 'layout-top', label: 'Top Half', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥↑', onSelect: () => onApplyWindowLayout('top') },
            { key: 'layout-bottom', label: 'Bottom Half', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥↓', onSelect: () => onApplyWindowLayout('bottom') },
            'divider',
            { key: 'layout-tl', label: 'Top Left Quarter', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥1', onSelect: () => onApplyWindowLayout('tl') },
            { key: 'layout-tr', label: 'Top Right Quarter', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥2', onSelect: () => onApplyWindowLayout('tr') },
            { key: 'layout-bl', label: 'Bottom Left Quarter', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥3', onSelect: () => onApplyWindowLayout('bl') },
            { key: 'layout-br', label: 'Bottom Right Quarter', icon: HiOutlineRectangleGroup, hotkey: '⌘⌥4', onSelect: () => onApplyWindowLayout('br') },
        ],
        [onApplyWindowLayout, onDuplicateWindow, onOpenMissionControl, onOpenQuickLook, onOpenWindowSwitcher]
    );

    const viewMenu = useMemo(
        () => [
            { key: 'focus', label: focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode', icon: HiOutlineCursorArrowRays, hotkey: '⌘⌥F', onSelect: onToggleFocusMode },
            { key: 'theme', label: theme === 'dark' ? 'Light Appearance' : 'Dark Appearance', icon: theme === 'dark' ? HiOutlineSun : HiOutlineMoon, onSelect: onToggleTheme },
        ],
        [focusMode, onToggleFocusMode, onToggleTheme, theme]
    );

    const helpMenu = useMemo(
        () => [
            { key: 'shortcuts', label: 'Keyboard Shortcuts', icon: HiOutlineQuestionMarkCircle, onSelect: onOpenCommandPalette },
            { key: 'search', label: 'Search Documentation', icon: HiOutlineMagnifyingGlass, onSelect: onNavigateSearch },
        ],
        [onNavigateSearch, onOpenCommandPalette]
    );

    const menuGroups = [
        { id: 'apple', label: { text: '', icon: FaApple, ariaLabel: 'Apple menu' }, items: appleMenu },
        { id: 'app', label: { text: activeAppTitle || 'Workspace' }, items: appleMenu },
        { id: 'view', label: { text: 'View' }, items: viewMenu },
        { id: 'window', label: { text: 'Window' }, items: windowMenu },
        { id: 'help', label: { text: 'Help' }, items: helpMenu },
    ];

    const windowCountLabel =
        windowTelemetry && typeof windowTelemetry.total === 'number'
            ? `${windowTelemetry.total - (windowTelemetry.minimized || 0)}/${windowTelemetry.total} windows`
            : 'Windows steady';

    const profileMenuItems = useMemo(() => {
        if (profile?.isAuthenticated) {
            return [
                { key: 'profile', label: 'View Profile', icon: HiOutlineUserCircle, onSelect: () => onProfileMenuAction('profile') },
                {
                    key: 'dashboard',
                    label: profile?.isAdmin ? 'Admin Panel' : 'Dashboard',
                    icon: profile?.isAdmin ? HiOutlineShieldCheck : HiOutlineRectangleGroup,
                    onSelect: () => onProfileMenuAction(profile?.isAdmin ? 'admin' : 'dashboard'),
                },
                'divider',
                { key: 'sign-out', label: 'Sign Out', icon: HiOutlineArrowLeftOnRectangle, onSelect: () => onProfileMenuAction('sign-out') },
            ];
        }

        return [
            { key: 'sign-in', label: 'Sign In', icon: HiOutlineArrowRightOnRectangle, onSelect: () => onProfileMenuAction('sign-in') },
            { key: 'sign-up', label: 'Create Account', icon: HiOutlineUserPlus, onSelect: () => onProfileMenuAction('sign-up') },
        ];
    }, [onProfileMenuAction, profile?.isAdmin, profile?.isAuthenticated]);

    const handleProfileToggle = (nextOpen, itemAction) => {
        setOpenMenu(null);
        setProfileMenuOpen(Boolean(nextOpen));
        if (itemAction) {
            itemAction();
        }
    };

    return (
        <>
            {autoHide ? (
                <div
                    ref={revealZoneRef}
                    className="fixed left-0 right-0 top-0 z-[63] h-4 w-full cursor-default"
                    aria-hidden
                />
            ) : null}
            {autoHide && peekVisible ? (
                <div className="desktop-menubar-peek" aria-hidden />
            ) : null}
            <div
                ref={barRef}
                className={`pointer-events-auto fixed left-3 right-3 top-3 z-[64] transition-transform duration-300 ${
                    isHidden ? '-translate-y-16 opacity-0' : 'translate-y-0 opacity-100'
                }`}
                data-autohide={autoHide ? 'true' : 'false'}
            >
                <div className="desktop-menubar text-sm">
                    <div className="flex items-center gap-1.5">
                        {menuGroups.map((menu) => (
                            <MenuButton
                                key={menu.id}
                                id={menu.id}
                                label={menu.label}
                                items={menu.items}
                                openMenu={openMenu}
                                onToggle={handleMenuToggle}
                            />
                        ))}
                        <span className="hidden lg:inline-flex items-center gap-2 rounded-xl bg-white/70 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500 shadow-inner shadow-white/60 dark:bg-white/5 dark:text-slate-300 dark:shadow-none">
                            <HiOutlineMagnifyingGlass className="h-4 w-4" />
                            {activePath || 'Home'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                        <ProfileMenu
                            profile={profile}
                            items={profileMenuItems}
                            open={profileMenuOpen}
                            onToggle={handleProfileToggle}
                        />
                        <span className={`${STATUS_BADGE_CLASSES} hidden sm:inline-flex items-center gap-1`}>
                            <HiOutlineWifi className="h-4 w-4" />
                            Online
                        </span>
                        <span className={`${STATUS_BADGE_CLASSES} hidden sm:inline-flex items-center gap-1`}>
                            <HiOutlineRectangleGroup className="h-4 w-4" />
                            {windowCountLabel}
                        </span>
                        <button
                            type="button"
                            onClick={onToggleTheme}
                            className="inline-flex items-center gap-1 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 dark:border-white/10 dark:bg-white/10 dark:text-slate-100"
                            aria-label="Toggle appearance"
                        >
                            {theme === 'dark' ? <HiOutlineSun className="h-4 w-4" /> : <HiOutlineMoon className="h-4 w-4" />}
                            {theme === 'dark' ? 'Light' : 'Dark'}
                        </button>
                        <button
                            type="button"
                            onClick={onToggleControlCenter}
                            aria-pressed={controlCenterOpen}
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50 ${
                                controlCenterOpen
                                    ? 'border-sky-400/50 bg-white/80 text-slate-800 shadow-md dark:border-sky-300/40 dark:bg-white/10 dark:text-slate-100'
                                    : 'border-white/50 bg-white/70 text-slate-700 shadow-sm hover:-translate-y-[1px] hover:shadow-md dark:border-white/10 dark:bg-white/10 dark:text-slate-100'
                            }`}
                        >
                            <HiOutlineAdjustmentsHorizontal className="h-4 w-4" />
                            Control Center
                        </button>
                        <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/70 px-3 py-1 text-sm font-semibold text-slate-800 shadow-sm dark:border-white/10 dark:bg-white/10 dark:text-slate-100">
                            <HiOutlineBolt className="h-4 w-4 text-amber-500" />
                            {clock}
                        </span>
                    </div>
                </div>
            </div>
        </>
    );
}

DesktopMenuBar.propTypes = {
    activeAppTitle: PropTypes.string,
    activePath: PropTypes.string,
    clock: PropTypes.string.isRequired,
    focusMode: PropTypes.bool.isRequired,
    theme: PropTypes.string.isRequired,
    windowTelemetry: PropTypes.shape({
        total: PropTypes.number,
        minimized: PropTypes.number,
        staged: PropTypes.number,
    }),
    onNavigateHome: PropTypes.func.isRequired,
    onNavigateSearch: PropTypes.func.isRequired,
    onOpenCommandPalette: PropTypes.func.isRequired,
    onOpenMissionControl: PropTypes.func.isRequired,
    onOpenQuickLook: PropTypes.func.isRequired,
    onOpenWindowSwitcher: PropTypes.func.isRequired,
    onDuplicateWindow: PropTypes.func.isRequired,
    onApplyWindowLayout: PropTypes.func.isRequired,
    onToggleFocusMode: PropTypes.func.isRequired,
    onToggleTheme: PropTypes.func.isRequired,
    onToggleControlCenter: PropTypes.func.isRequired,
    controlCenterOpen: PropTypes.bool,
    profile: PropTypes.shape({
        name: PropTypes.string,
        email: PropTypes.string,
        avatar: PropTypes.string,
        isAdmin: PropTypes.bool,
        isAuthenticated: PropTypes.bool,
    }),
    onProfileMenuAction: PropTypes.func,
    autoHide: PropTypes.bool,
};

DesktopMenuBar.defaultProps = {
    activeAppTitle: 'Workspace',
    activePath: '',
    windowTelemetry: null,
    controlCenterOpen: false,
    profile: null,
    onProfileMenuAction: () => {},
    autoHide: false,
};
