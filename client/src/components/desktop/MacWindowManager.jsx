import { AnimatePresence, motion } from 'framer-motion';
import { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import { Routes, useNavigate } from 'react-router-dom';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineArrowsPointingOut,
    HiOutlinePlay,
    HiOutlineRectangleStack,
    HiOutlineShieldCheck,
    HiOutlineSparkles,
    HiOutlineSquares2X2,
    HiOutlineViewColumns,
    HiOutlineXMark,
} from 'react-icons/hi2';

import { APP_WINDOW_ACTIVATED_EVENT, WINDOW_STORAGE_KEY } from '../../constants/desktop';
import { buildRouteElements, mainLayoutRoutes } from '../../routes/mainLayoutRoutes.jsx';
import MacWindow from './MacWindow';
import { renderWindowIcon, iconComponentForType } from './windowIcons';
import DesktopWallpaper from './DesktopWallpaper.jsx';
import { queryClient } from '../../lib/queryClient.js';
import { toggleTheme } from '../../redux/theme/themeSlice.js';
import { signoutSuccess } from '../../redux/user/userSlice.js';
import DesktopMenuBar from './DesktopMenuBar.jsx';
import ControlCenter from './ControlCenter.jsx';
import { apiFetch } from '../../utils/apiFetch.js';

const WindowCommandPalette = lazy(() => import('./WindowCommandPalette.jsx'));

const WINDOW_STORAGE_VERSION = 3;
const WINDOW_CHANNEL_NAME = 'scientistshield.desktop.windows.v1';
const WINDOW_EVENT_NAME = 'scientistshield.desktop.windows-changed';
const MAX_OPEN_WINDOWS = 10;
const WINDOW_LIMIT_MESSAGE = `Window limit reached (${MAX_OPEN_WINDOWS}). Close a window to open another.`;
const SINGLE_WINDOW_MODE = false;
const WINDOW_SESSION_ID = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
const MAIN_WINDOW_ID = 'main-window';
const MAC_STAGE_MARGIN = 72;
const MAC_HEADER_HEIGHT = 82;
const HOT_CORNER_STORAGE_KEY = 'scientistshield.desktop.hotCorners.v1';
const UI_EFFECTS_STORAGE_KEY = 'ui.effects.v1';
const DEFAULT_EFFECTS = Object.freeze({
    brightness: 1,
    contrast: 1,
    veil: 0,
    reduceMotion: false,
    autoHideMenuBar: true,
    surfacePreset: 'liquid',
    accentPreset: 'system',
    wallpaperMode: 'liquid',
});
const HOT_CORNER_THRESHOLD_PX = 44;
const HOT_CORNER_DELAY_MS = 320;
const HOT_CORNER_DEFAULTS = Object.freeze({
    topLeft: 'mission-control',
    topRight: 'quick-look',
    bottomLeft: 'quick-look',
    bottomRight: 'focus-mode',
});
const HOT_CORNER_ACTION_LABELS = Object.freeze({
    'mission-control': 'Mission Control',
    'quick-look': 'Quick Look',
    'focus-mode': 'Focus Mode',
});
const HOT_CORNER_KEYS = Object.freeze(['topLeft', 'topRight', 'bottomLeft', 'bottomRight']);
const HOT_CORNER_SYMBOLS = Object.freeze({
    topLeft: '↖︎',
    topRight: '↗︎',
    bottomLeft: '↙︎',
    bottomRight: '↘︎',
});
const HOT_CORNER_ICONS = Object.freeze({
    'mission-control': HiOutlineArrowsPointingOut,
    'quick-look': HiOutlineSparkles,
    'focus-mode': HiOutlineShieldCheck,
});

const LAYOUT_PRESETS = Object.freeze({
    full: { id: 'full', label: 'Fill Stage', target: 'full' },
    left: { id: 'left', label: 'Left Split', target: 'left' },
    right: { id: 'right', label: 'Right Split', target: 'right' },
    top: { id: 'top', label: 'Top Half', target: 'top' },
    bottom: { id: 'bottom', label: 'Bottom Half', target: 'bottom' },
    tl: { id: 'tl', label: 'Top Left', target: 'tl' },
    tr: { id: 'tr', label: 'Top Right', target: 'tr' },
    bl: { id: 'bl', label: 'Bottom Left', target: 'bl' },
    br: { id: 'br', label: 'Bottom Right', target: 'br' },
    center: { id: 'center', label: 'Centered', target: 'center' },
});

const LAYOUT_PRESET_MAP = Object.freeze(
    Object.values(LAYOUT_PRESETS).reduce((acc, preset) => {
        acc[preset.id] = preset;
        return acc;
    }, {})
);

const DRAG_VELOCITY_SMOOTHING = 0.55;
const DRAG_MOMENTUM_SAMPLE_MS = 320;
const DRAG_MOMENTUM_MAX_TRAVEL = 280;
const DRAG_MOMENTUM_THRESHOLD = 0.16;
const DRAG_MOMENTUM_MIN_DISTANCE = 18;
const DRAG_MOMENTUM_DECAY = 0.86;
const DRAG_MOMENTUM_MIN_SPEED = 0.018;
const DRAG_MOMENTUM_MAX_DURATION = 520;
const DRAG_MOMENTUM_FRAME_CLAMP = 32;
const DRAG_POINTER_OFFSET_X = 28;
const DRAG_POINTER_OFFSET_Y = -56;

const ACCENT_PRESETS = Object.freeze([
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
        key: 'graphite',
        label: 'Graphite',
        gradient: 'linear-gradient(135deg, rgba(30,41,59,0.95), rgba(15,23,42,0.9))',
        color: '#111827',
        strong: '#0F172A',
        mood: 'Low-key and professional',
    },
]);

const ACCENT_PRESET_MAP = ACCENT_PRESETS.reduce((map, preset) => {
    map[preset.key] = preset;
    return map;
}, {});

const SURFACE_PRESETS = Object.freeze([
    { key: 'liquid', label: 'Liquid Glass', helper: 'Fluid caustics and vibrant translucency' },
    { key: 'sequoia', label: 'Sequoia Frost', helper: 'Balanced frost with subtle chroma glow' },
    { key: 'graphite', label: 'Graphite Pro', helper: 'Neutral chrome with deeper contrast' },
]);

const SURFACE_PRESET_MAP = SURFACE_PRESETS.reduce((map, preset) => {
    map[preset.key] = preset;
    return map;
}, {});

const WALLPAPER_MODES = ['auto', 'sunrise', 'day', 'sunset', 'night', 'liquid'];
const WALLPAPER_OPTIONS = Object.freeze([
    { key: 'auto', label: 'Dynamic', helper: 'Follows the clock' },
    { key: 'sunrise', label: 'Sunrise', helper: 'Warm gradients' },
    { key: 'day', label: 'Daylight', helper: 'Brighter glass' },
    { key: 'sunset', label: 'Sunset', helper: 'Golden hour' },
    { key: 'night', label: 'Night', helper: 'Midnight blue' },
    { key: 'liquid', label: 'Liquid Glass', helper: 'Cyan, mint, and amber caustics' },
]);

const MISSION_CONTROL_FILTERS = Object.freeze([
    { key: 'all', label: 'All Windows' },
    { key: 'visible', label: 'Visible' },
    { key: 'minimized', label: 'Minimized' },
    { key: 'closed', label: 'Closed Tools' },
]);

const WindowRouteFallback = () => (
    <div className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-500 dark:text-slate-400">
        Loading view...
    </div>
);

function WindowRouteRenderer({ location }) {
    const routeElements = useMemo(() => buildRouteElements(mainLayoutRoutes), []);
    if (!location) {
        return <WindowRouteFallback />;
    }
    return (
        <Suspense fallback={<WindowRouteFallback />}>
            <Routes location={location}>
                {routeElements}
            </Routes>
        </Suspense>
    );
}

WindowRouteRenderer.propTypes = {
    location: PropTypes.shape({
        pathname: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
        state: PropTypes.any,
        key: PropTypes.string,
    }),
};

WindowRouteRenderer.defaultProps = {
    location: null,
};

const createDefaultHotCornerState = () => ({
    enabled: true,
    corners: { ...HOT_CORNER_DEFAULTS },
});

const sanitizeEffects = (value = {}) => {
    const source = typeof value === 'object' && value !== null ? value : {};
    const merged = { ...DEFAULT_EFFECTS, ...source };

    const brightness = clampNumber(merged.brightness, 0.4, 1.6) ?? DEFAULT_EFFECTS.brightness;
    const contrast = clampNumber(merged.contrast, 0.6, 1.6) ?? DEFAULT_EFFECTS.contrast;
    const veil = clampNumber(merged.veil, 0, 1) ?? DEFAULT_EFFECTS.veil;

    const reduceMotion = Boolean(merged.reduceMotion);
    const autoHideMenuBar = merged.autoHideMenuBar !== false;

    const surfacePreset = SURFACE_PRESET_MAP[merged.surfacePreset]?.key ?? DEFAULT_EFFECTS.surfacePreset;
    const accentPreset = ACCENT_PRESET_MAP[merged.accentPreset]?.key ?? DEFAULT_EFFECTS.accentPreset;
    const wallpaperMode = WALLPAPER_MODES.includes(merged.wallpaperMode)
        ? merged.wallpaperMode
        : DEFAULT_EFFECTS.wallpaperMode;

    return {
        brightness,
        contrast,
        veil,
        reduceMotion,
        autoHideMenuBar,
        surfacePreset,
        accentPreset,
        wallpaperMode,
    };
};

const WINDOW_TYPES = {
    MAIN: 'main',
    SCRATCHPAD: 'scratchpad',
    NOW_PLAYING: 'now-playing',
    STATUS: 'status',
    QUEUE: 'queue',
};

const APP_ICON_MAP = Object.freeze({
    home: HiOutlineSquares2X2,
    tutorials: HiOutlineSparkles,
    quizzes: HiOutlineRectangleStack,
    tools: HiOutlineAdjustmentsHorizontal,
    problems: HiOutlineShieldCheck,
    dashboard: HiOutlineViewColumns,
    projects: HiOutlineRectangleStack,
    search: HiOutlineSparkles,
    about: HiOutlineSparkles,
    admin: HiOutlineAdjustmentsHorizontal,
    'file-manager': HiOutlineSquares2X2,
    content: HiOutlineSparkles,
    default: HiOutlineSquares2X2,
});

const APP_ACCENTS = Object.freeze({
    home: 'linear-gradient(135deg, rgba(14,116,244,0.85), rgba(56,189,248,0.65))',
    tutorials: 'linear-gradient(135deg, rgba(236,72,153,0.85), rgba(168,85,247,0.6))',
    quizzes: 'linear-gradient(135deg, rgba(251,191,36,0.85), rgba(249,115,22,0.7))',
    tools: 'linear-gradient(135deg, rgba(59,130,246,0.8), rgba(14,165,233,0.65))',
    problems: 'linear-gradient(135deg, rgba(45,212,191,0.85), rgba(45,197,253,0.6))',
    dashboard: 'linear-gradient(135deg, rgba(147,197,253,0.85), rgba(59,130,246,0.6))',
    projects: 'linear-gradient(135deg, rgba(251,113,133,0.85), rgba(248,113,113,0.6))',
    search: 'linear-gradient(135deg, rgba(190,242,100,0.85), rgba(59,130,246,0.55))',
    about: 'linear-gradient(135deg, rgba(251,191,36,0.8), rgba(249,115,22,0.6))',
    admin: 'linear-gradient(135deg, rgba(214,158,46,0.85), rgba(249,115,22,0.6))',
    'file-manager': 'linear-gradient(135deg, rgba(96,165,250,0.85), rgba(56,189,248,0.6))',
    content: 'linear-gradient(135deg, rgba(165,180,252,0.85), rgba(99,102,241,0.6))',
    default: 'linear-gradient(135deg, rgba(148,163,184,0.75), rgba(203,213,225,0.55))',
});

const APP_ROUTE_CONFIG = Object.freeze([
    { key: 'home', label: 'Home', match: (path) => path === '/' || path === '' },
    { key: 'tutorials', label: 'Tutorials', match: (path) => path.startsWith('/tutorials') },
    { key: 'quizzes', label: 'Quizzes', match: (path) => path.startsWith('/quizzes') },
    { key: 'tools', label: 'Tools', match: (path) => path.startsWith('/tools') || path.startsWith('/algorithm-') || path.startsWith('/code-') },
    { key: 'problems', label: 'Problems', match: (path) => path.startsWith('/problems') },
    { key: 'projects', label: 'Projects', match: (path) => path.startsWith('/projects') },
    { key: 'search', label: 'Search', match: (path) => path.startsWith('/search') },
    { key: 'content', label: 'Content', match: (path) => path.startsWith('/content') },
    { key: 'dashboard', label: 'Dashboard', match: (path) => path.startsWith('/dashboard') },
    { key: 'admin', label: 'Admin', match: (path) => path.startsWith('/admin') || path.startsWith('/create-') || path.startsWith('/update-') },
    { key: 'file-manager', label: 'File Manager', match: (path) => path.startsWith('/file-manager') },
    { key: 'about', label: 'About', match: (path) => path.startsWith('/about') },
    { key: 'default', label: 'Stage', match: () => true },
]);

const APP_WINDOW_ID_PREFIX = 'app';
const PRIMARY_INSTANCE_ID = 'primary';

function buildAppWindowId(routeKey, instanceId = PRIMARY_INSTANCE_ID) {
    const safeKey =
        typeof routeKey === 'string' && routeKey.trim().length > 0 ? routeKey.trim() : 'workspace';
    const suffix = instanceId && instanceId !== PRIMARY_INSTANCE_ID ? `--${instanceId}` : '';
    return `${APP_WINDOW_ID_PREFIX}-${safeKey}${suffix}`;
}

function iconForAppKey(key) {
    return APP_ICON_MAP[key] || APP_ICON_MAP.default;
}

const readReduceMotionPreference = () => {
    if (typeof window === 'undefined') {
        return false;
    }
    let reduce = false;
    try {
        reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
        reduce = false;
    }
    try {
        const stored = JSON.parse(localStorage.getItem(UI_EFFECTS_STORAGE_KEY) || '{}');
        reduce = reduce || Boolean(stored.reduceMotion);
    } catch {
        // ignore parse issues
    }
    return reduce;
};

function appAccentForKey(key) {
    return APP_ACCENTS[key] || APP_ACCENTS.default;
}

function appLabelForKey(key) {
    if (!key) {
        return 'Stage';
    }
    const normalizedKey = key === 'default' ? 'stage' : key;
    const match = APP_ROUTE_CONFIG.find((entry) => entry.key === key);
    if (match && match.label) {
        return match.label;
    }
    return normalizedKey
        .replace(/[-_]/g, ' ')
        .split(' ')
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
}

function createInstanceId() {
    return `inst-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const WINDOW_INSTANCE_TITLE_PATTERN = /\s·\sWindow\s(\d+)$/i;

function stripWindowInstanceTitle(title, fallback) {
    const base =
        typeof title === 'string' && title.trim().length > 0
            ? title.trim()
            : fallback;
    return base.replace(WINDOW_INSTANCE_TITLE_PATTERN, '').trim();
}

function buildWindowInstanceTitle(baseTitle, ordinal) {
    if (!Number.isFinite(ordinal) || ordinal <= 1) {
        return baseTitle;
    }
    return `${baseTitle} · Window ${Math.round(ordinal)}`;
}

function getWindowInstanceOrdinal(title) {
    if (typeof title !== 'string') {
        return null;
    }
    const match = title.trim().match(WINDOW_INSTANCE_TITLE_PATTERN);
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) && value > 1 ? value : null;
}

function routeLocationSignature(location, fallbackPath = '/') {
    const parsed = parseStoredLocation(location, fallbackPath);
    if (!parsed) {
        return null;
    }
    return `${normalizePathname(parsed.pathname)}${normalizeSearch(parsed.search)}${normalizeHash(parsed.hash)}`;
}

function snapshotLocation(location) {
    if (!location) return null;
    const { pathname, search, hash, state, key } = location;
    const normalizedPathname = normalizePathname(pathname);
    const normalizedSearch = normalizeSearch(search);
    const normalizedHash = normalizeHash(hash);
    return {
        pathname: normalizedPathname,
        search: normalizedSearch,
        hash: normalizedHash,
        state: state ?? null,
        key: key || `${normalizedPathname}${normalizedSearch}${normalizedHash}`,
    };
}

function normalizePathname(value) {
    if (typeof value !== 'string') {
        return '/';
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return '/';
    }
    const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return withLeadingSlash.replace(/\/{2,}/g, '/');
}

function normalizeSearch(value) {
    if (typeof value !== 'string') {
        return '';
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return '';
    }
    const withoutPrefix = trimmed.replace(/^\?+/, '');
    return withoutPrefix.length > 0 ? `?${withoutPrefix}` : '';
}

function normalizeHash(value) {
    if (typeof value !== 'string') {
        return '';
    }
    const trimmed = value.trim();
    if (trimmed.length === 0) {
        return '';
    }
    const withoutPrefix = trimmed.replace(/^#+/, '');
    return withoutPrefix.length > 0 ? `#${withoutPrefix}` : '';
}

function parseStoredLocation(storedLocation, fallbackPath) {
    if (storedLocation && typeof storedLocation === 'object') {
        return {
            pathname: normalizePathname(storedLocation.pathname),
            search: normalizeSearch(storedLocation.search),
            hash: normalizeHash(storedLocation.hash),
            state:
                storedLocation.state !== undefined
                    ? storedLocation.state
                    : null,
            key: typeof storedLocation.key === 'string' ? storedLocation.key : null,
        };
    }
    if (typeof fallbackPath === 'string') {
        const trimmedFallback = fallbackPath.trim();
        if (trimmedFallback.length === 0) {
            return null;
        }
        try {
            const url = new URL(trimmedFallback, 'http://localhost');
            return {
                pathname: normalizePathname(url.pathname),
                search: normalizeSearch(url.search),
                hash: normalizeHash(url.hash),
                state: null,
                key: null,
            };
        } catch {
            return {
                pathname: normalizePathname(trimmedFallback),
                search: normalizeSearch(''),
                hash: normalizeHash(''),
                state: null,
                key: null,
            };
        }
    }
    return null;
}

function serializeRouteLocation(location, fallbackPath) {
    if (location && typeof location === 'object') {
        let serializedState = null;
        if (location.state !== undefined) {
            try {
                serializedState = JSON.parse(JSON.stringify(location.state));
            } catch {
                serializedState = null;
            }
        }
        return {
            pathname: normalizePathname(location.pathname),
            search: normalizeSearch(location.search),
            hash: normalizeHash(location.hash),
            state: serializedState,
            key: location.key || null,
        };
    }
    return parseStoredLocation(null, fallbackPath);
}

function normaliseAppTitle(windowTitle, fallbackLabel) {
    if (!windowTitle) return fallbackLabel;
    const cleaned = windowTitle.replace(/^Scientist Shield\s*·\s*/i, '').trim();
    return cleaned.length > 0 ? cleaned : fallbackLabel;
}

function resolveAppRouteMeta(activeLocation, windowTitle) {
    const pathname = activeLocation?.pathname ?? '/';
    const search = activeLocation?.search ?? '';
    const hash = activeLocation?.hash ?? '';
    const fullPath = `${pathname}${search}${hash}`;
    const normalizedPath = normalizePathname(pathname) || '/';
    const config =
        APP_ROUTE_CONFIG.find((entry) => entry.match(pathname)) ||
        APP_ROUTE_CONFIG[APP_ROUTE_CONFIG.length - 1];
    const id = buildAppWindowId(config.key, PRIMARY_INSTANCE_ID);
    const routesTitle = normaliseAppTitle(windowTitle, config.label);
    return {
        id,
        type: id,
        instanceId: PRIMARY_INSTANCE_ID,
        routeKey: config.key,
        pathname: normalizedPath,
        label: config.label,
        title: routesTitle,
        fullPath,
        iconKey: config.key in APP_ICON_MAP ? config.key : 'default',
        accent: appAccentForKey(config.key),
    };
}

function dedupeAppWindows(windows) {
    if (!Array.isArray(windows) || windows.length === 0) {
        return windows || [];
    }
    const seen = new Set();
    const ordered = [...windows].sort((a, b) => (b.z || 0) - (a.z || 0));
    const kept = [];
    for (const win of ordered) {
        if (!win.isAppWindow) {
            kept.push(win);
            continue;
        }
        // Deduplicate application windows by their logical route + instance id to
        // allow multiple windows per app while still collapsing accidental dupes.
        const instanceId =
            typeof win.instanceId === 'string' && win.instanceId.trim().length > 0
                ? win.instanceId.trim()
                : PRIMARY_INSTANCE_ID;
        const logicalKey = win.appRouteKey || win.id || win.type;
        const key = `${logicalKey}::${instanceId}`;
        if (!logicalKey || seen.has(key)) {
            continue;
        }
        seen.add(key);
        kept.push(win);
    }
    return kept.sort((a, b) => (a.z || 0) - (b.z || 0));
}

function applyWindowLimit(windows, limit = MAX_OPEN_WINDOWS) {
    if (!Array.isArray(windows) || windows.length <= limit) {
        return windows || [];
    }
    const mainWindow =
        windows.find((win) => win.id === MAIN_WINDOW_ID || win.type === WINDOW_TYPES.MAIN || win.isMain) || null;
    const others = mainWindow ? windows.filter((win) => win.id !== mainWindow.id) : windows.slice();
    const ordered = others
        .slice()
        .sort((a, b) => (b.z || 0) - (a.z || 0));
    const remainingSlots = Math.max(limit - (mainWindow ? 1 : 0), 0);
    const keepIds = new Set(
        [
            ...(mainWindow ? [mainWindow] : []),
            ...ordered.slice(0, remainingSlots),
        ].map((win) => win.id)
    );
    return windows.filter((win) => keepIds.has(win.id));
}

const DEFAULT_TODOS = [
    { id: 'todo-1', label: 'Review latest tutorial drafts', done: false },
    { id: 'todo-2', label: 'Ship UI polish branch', done: true },
    { id: 'todo-3', label: 'Prep upcoming webinar outline', done: false },
];

export default function MacWindowManager({ windowTitle, renderMainContent, activeLocation }) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const theme = useSelector((state) => state.theme.theme);
    const { currentUser } = useSelector((state) => state.user);
    const [activeAppId, setActiveAppId] = useState(null);
    const activeAppIdRef = useRef(null);
    const handleThemeToggle = useCallback(() => {
        dispatch(toggleTheme());
    }, [dispatch]);
    const profileDetails = useMemo(
        () => ({
            name: currentUser?.username || currentUser?.displayName || currentUser?.email || 'Guest',
            email: currentUser?.email || 'Not signed in',
            avatar: currentUser?.profilePicture || '',
            isAdmin: Boolean(currentUser?.isAdmin),
            isAuthenticated: Boolean(currentUser),
        }),
        [currentUser]
    );
    const handleSignOut = useCallback(async () => {
        try {
            await apiFetch('/api/v1/user/signout', { method: 'POST' });
        } catch (error) {
            console.error('Failed to sign out', error);
        } finally {
            dispatch(signoutSuccess());
            navigate('/');
        }
    }, [dispatch, navigate]);
    const handleProfileMenuAction = useCallback(
        (action) => {
            switch (action) {
                case 'profile':
                    navigate('/dashboard?tab=profile');
                    return;
                case 'dashboard':
                    navigate('/dashboard');
                    return;
                case 'admin':
                    navigate('/admin');
                    return;
                case 'sign-in':
                    navigate('/sign-in');
                    return;
                case 'sign-up':
                    navigate('/sign-up');
                    return;
                case 'sign-out':
                    handleSignOut();
                    return;
                default:
                    return;
            }
        },
        [handleSignOut, navigate]
    );
    const [windows, setWindows] = useState([]);
    const activePath = activeLocation?.pathname || '/';
    const [closedTypes, setClosedTypes] = useState([]);
    const [scratchpadText, setScratchpadText] = useState(() => {
        if (typeof window === 'undefined') return '';
        return localStorage.getItem('scientistshield.desktop.scratchpad') ?? '';
    });
    const [currentTrackTime, setCurrentTrackTime] = useState(() => ({
        elapsed: 72,
        total: 245,
    }));
    const [todos, setTodos] = useState(DEFAULT_TODOS);
    const [isCompact, setIsCompact] = useState(
        typeof window === 'undefined' ? true : window.innerWidth < 1024
    );
    const [missionControlOpen, setMissionControlOpen] = useState(false);
    const [missionControlFilter, setMissionControlFilter] = useState('all');
    const [reduceMotion, setReduceMotion] = useState(() => readReduceMotionPreference());
    const [effects, setEffects] = useState(() => {
        if (typeof window === 'undefined') return sanitizeEffects(DEFAULT_EFFECTS);
        try {
            const stored = JSON.parse(window.localStorage.getItem(UI_EFFECTS_STORAGE_KEY) || 'null');
            if (stored && typeof stored === 'object') {
                return sanitizeEffects(stored);
            }
        } catch {
            // ignore parse errors and fall back to defaults
        }
        return sanitizeEffects(DEFAULT_EFFECTS);
    });
    const [controlCenterOpen, setControlCenterOpen] = useState(false);
    const [focusMode, setFocusMode] = useState(false);
    const [quickLookWindowId, setQuickLookWindowId] = useState(null);
    const [snapPreview, setSnapPreview] = useState(null);
    const [liveAnnouncement, setLiveAnnouncement] = useState('');
    const announce = useCallback((message) => {
        if (!message) {
            return;
        }
        setLiveAnnouncement((prev) => (prev === message ? `${message} ` : message));
    }, []);
    const [hotCorners, setHotCorners] = useState(() => {
        if (typeof window === 'undefined') return createDefaultHotCornerState();
        try {
            const raw = window.localStorage.getItem(HOT_CORNER_STORAGE_KEY);
            if (!raw) return createDefaultHotCornerState();
            const parsed = JSON.parse(raw);
            return sanitizeHotCornerState(parsed);
        } catch {
            return createDefaultHotCornerState();
        }
    });
    const [activeHotCorner, setActiveHotCorner] = useState(null);
    const [draggingWindow, setDraggingWindow] = useState(null);
    const [dragPointer, setDragPointer] = useState(null);
    const [focusHighlight, setFocusHighlight] = useState(null);
    const windowSwitcherRef = useRef({ open: false, items: [], highlightIndex: 0 });
    const [windowSwitcher, setWindowSwitcher] = useState(windowSwitcherRef.current);
    const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
    const [commandPaletteQuery, setCommandPaletteQuery] = useState('');
    const [clockTime, setClockTime] = useState(() => new Date());
    const controlCenterRef = useRef(null);

    const keySymbols = useMemo(() => {
        if (typeof navigator !== 'undefined' && /(Mac|iPhone|iPad|iPod)/i.test(navigator.platform)) {
            return { meta: '⌘', alt: '⌥', shift: '⇧' };
        }
        return { meta: 'Ctrl', alt: 'Alt', shift: 'Shift' };
    }, []);
    const metaKeyLabel = keySymbols.meta;
    const altKeyLabel = keySymbols.alt;
    const shiftKeyLabel = keySymbols.shift;

    // Present the full window stack ordered by z-index (macOS-style overlapping windows)
    const windowsForUI = useMemo(
        () => [...windows].sort((a, b) => a.z - b.z),
        [windows]
    );

    const stagedWindows = useMemo(
        () => windowsForUI.filter((win) => !win.minimized),
        [windowsForUI]
    );

    const closeCommandPalette = useCallback(() => {
        setCommandPaletteOpen(false);
        setCommandPaletteQuery('');
    }, []);

    const openCommandPalette = useCallback(() => {
        setCommandPaletteQuery('');
        setCommandPaletteOpen(true);
    }, []);

    const toggleControlCenter = useCallback(() => {
        setControlCenterOpen((open) => !open);
    }, []);

    const closeControlCenter = useCallback(() => setControlCenterOpen(false), []);

    const toggleQuickLook = useCallback(() => {
        if (SINGLE_WINDOW_MODE) return;
        setQuickLookWindowId((current) => {
            if (current) {
                return null;
            }
            const visible = windowsRef.current
                .filter((win) => !win.minimized)
                .sort((a, b) => b.z - a.z);
            const candidate = visible[0];
            return candidate ? candidate.id : current;
        });
    }, []);

    const zRef = useRef(20);
    const dragRef = useRef(null);
    const resizeRef = useRef(null);
    const windowsRef = useRef([]);
    const focusedWindowRef = useRef(null);
    const hydrationRef = useRef(false);
    const persistedClosedTypesRef = useRef(null);
    const snapPreviewRef = useRef(null);
    const dragPendingRef = useRef(null);
    const dragFrameRef = useRef(null);
    const resizePendingRef = useRef(null);
    const resizeFrameRef = useRef(null);
    const hotCornerTimersRef = useRef({});
    const lastHotCornerRef = useRef(null);
    const draggingWindowRef = useRef(null);
    const dragVelocityRef = useRef({});
    const dragPointerPendingRef = useRef(null);
    const dragPointerFrameRef = useRef(null);
    const momentumAnimationsRef = useRef({});
    const focusHighlightTimeoutRef = useRef(null);
    const lastFocusIdRef = useRef(null);
    const bringToFrontRef = useRef(null);
    const navigateToWindowRouteRef = useRef(null);
    const windowPersistTimeoutRef = useRef(null);
    const windowChannelRef = useRef(null);
    const snapshotCounterRef = useRef(0);

    const menuBarAutoHide = effects?.autoHideMenuBar !== false;
    const layoutOptions = useMemo(
        () => ({ autoHideMenuBar: menuBarAutoHide }),
        [menuBarAutoHide]
    );

    const updateWindowSwitcher = useCallback((updater) => {
        setWindowSwitcher((prev) => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            windowSwitcherRef.current = next;
            return next;
        });
    }, []);

    const buildWindowSwitcherItems = useCallback(() => {
        const orderedWindows = windowsRef.current
            .slice()
            .sort((a, b) => b.z - a.z);
        return orderedWindows.map((win) => {
            const appKey = win.appRouteKey || win.appIconKey || 'default';
            const isPrimaryInstance = !win.instanceId || win.instanceId === PRIMARY_INSTANCE_ID;
            const accent = win.isAppWindow
                ? win.appAccent || appAccentForKey(appKey)
                : stagePreviewAccent(win.type, true);
            const IconComponent = win.isAppWindow ? iconForAppKey(appKey) : iconComponentForType(win.type);
            const status = win.minimized ? 'Minimized' : win.isZoomed ? 'Zoomed' : 'Active';
            const appContextLabel = win.isAppWindow ? appLabelForKey(appKey) : null;
            return {
                id: win.id,
                type: win.type,
                title: win.title || typeToTitle(win.type),
                context: win.minimized
                    ? 'Minimized'
                    : win.isAppWindow
                        ? isPrimaryInstance
                            ? appContextLabel
                            : `${appContextLabel} · Extra window`
                        : typeToTitle(win.type),
                accent,
                iconComponent: IconComponent,
                isAppWindow: Boolean(win.isAppWindow),
                status,
                minimized: Boolean(win.minimized),
            };
        });
    }, [stagePreviewAccent]);

    const openWindowSwitcher = useCallback(
        (direction = 1) => {
            if (SINGLE_WINDOW_MODE) return false;
            const items = buildWindowSwitcherItems();
            if (items.length === 0) {
                updateWindowSwitcher({ open: false, items: [], highlightIndex: 0 });
                return false;
            }
            const focusedId = focusedWindowRef.current?.id;
            let baseIndex = items.findIndex((item) => item.id === focusedId);
            if (baseIndex === -1) {
                baseIndex = 0;
            }
            const normalizedDirection = direction >= 0 ? 1 : -1;
            let highlightIndex = (baseIndex + normalizedDirection + items.length) % items.length;
            updateWindowSwitcher({ open: true, items, highlightIndex });
            return true;
        },
        [buildWindowSwitcherItems, updateWindowSwitcher]
    );

    const cycleWindowSwitcher = useCallback(
        (direction = 1) => {
            updateWindowSwitcher((prev) => {
                if (!prev.open || prev.items.length === 0) {
                    return prev;
                }
                const length = prev.items.length;
                const nextIndex = (prev.highlightIndex + direction + length) % length;
                return { ...prev, highlightIndex: nextIndex };
            });
        },
        [updateWindowSwitcher]
    );

    const closeWindowSwitcher = useCallback(
        (commit = true) => {
            const current = windowSwitcherRef.current;
            if (!current.open) {
                return;
            }
            if (commit && current.items.length > 0) {
                const target = current.items[current.highlightIndex];
                if (target && bringToFrontRef.current) {
                    requestAnimationFrame(() => bringToFrontRef.current?.(target.id));
                }
            }
            updateWindowSwitcher({ open: false, items: [], highlightIndex: 0 });
        },
        [updateWindowSwitcher]
    );

    const handleWindowSwitcherItemHover = useCallback(
        (index) => {
            updateWindowSwitcher((prev) => {
                if (!prev.open || index === prev.highlightIndex || index < 0 || index >= prev.items.length) {
                    return prev;
                }
                return { ...prev, highlightIndex: index };
            });
        },
        [updateWindowSwitcher]
    );

    const handleWindowSwitcherItemClick = useCallback(
        (id) => {
            updateWindowSwitcher({ open: false, items: [], highlightIndex: 0 });
            const bringToFrontFn = bringToFrontRef.current;
            if (bringToFrontFn) {
                requestAnimationFrame(() => bringToFrontFn(id));
            }
        },
        [updateWindowSwitcher]
    );

    const upsertAppWindow = useCallback((meta, location) => {
        if (!meta || typeof window === 'undefined') {
            return;
        }
        const instanceId = meta.instanceId || PRIMARY_INSTANCE_ID;
        const metaId =
            typeof meta.id === 'string' && meta.id.trim().length > 0
                ? meta.id.trim()
                : buildAppWindowId(meta.routeKey, instanceId);
        const baseMetaTitle = stripWindowInstanceTitle(
            meta.title,
            appLabelForKey(meta.routeKey || 'default')
        );
        if (SINGLE_WINDOW_MODE) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const autoHideMenuBar = effects?.autoHideMenuBar !== false;
            const singleLayoutOptions = { autoHideMenuBar };
            const iconComponent = iconForAppKey(meta.iconKey || meta.routeKey);
            const routeLocation =
                snapshotLocation(location) || parseStoredLocation(null, meta.fullPath);
            setWindows(() => {
                const base = createMainWindow(meta.title, viewportWidth, viewportHeight, zRef.current + 1);
                const mainWindow = expandWindowToViewport(
                    {
                        ...base,
                        id: MAIN_WINDOW_ID,
                        type: WINDOW_TYPES.MAIN,
                        title: baseMetaTitle,
                        instanceId,
                        isAppWindow: true,
                        appRoutePath: meta.fullPath,
                        appRouteKey: meta.routeKey,
                        appIconKey: meta.iconKey || meta.routeKey,
                        appAccent: meta.accent,
                        routeLocation,
                        allowClose: false,
                        allowZoom: false,
                        allowMinimize: false,
                        minimized: false,
                        minimizedByUser: false,
                        iconComponent,
                    },
                    viewportWidth,
                    viewportHeight,
                    singleLayoutOptions
                );
                return [mainWindow];
            });
            const nextZ = zRef.current + 1;
            zRef.current = nextZ;
            setActiveAppId(MAIN_WINDOW_ID);
            activeAppIdRef.current = MAIN_WINDOW_ID;
            return;
        }

        let blockedByLimit = false;
        setWindows((wins) => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const iconComponent = iconForAppKey(meta.iconKey || meta.routeKey);
            const routeLocation =
                snapshotLocation(location) || parseStoredLocation(null, meta.fullPath);

            const matchesAppWindow = (win) => {
                if (!win?.isAppWindow) {
                    return false;
                }
                const winInstanceId = win.instanceId || PRIMARY_INSTANCE_ID;
                if (metaId && win.id === metaId) {
                    return true;
                }
                if (instanceId && winInstanceId === instanceId) {
                    return true;
                }
                return Boolean(
                    win.appRouteKey === meta.routeKey &&
                        winInstanceId === instanceId
                );
            };

            const templateAppWindow =
                wins.find(matchesAppWindow) ||
                wins.find((win) => win.isAppWindow && win.appRouteKey === meta.routeKey) ||
                wins.find((win) => win.isAppWindow && win.isMain) ||
                wins.find((win) => win.isAppWindow && !win.minimized) ||
                wins.find((win) => win.isAppWindow) ||
                null;

            let updated = wins.map((win) => {
                if (win.isAppWindow && !matchesAppWindow(win)) {
                    return { ...win, isMain: false };
                }
                return win;
            });

            const siblingAppWindows = updated.filter(
                (win) => win.isAppWindow && win.appRouteKey === meta.routeKey
            );
            const existingIndex = updated.findIndex(matchesAppWindow);
            if (existingIndex >= 0) {
                const existing = updated[existingIndex];
                const nextZ = zRef.current + 1;
                zRef.current = nextZ;
                const existingOrdinal = getWindowInstanceOrdinal(existing.title);
                const nextTitle =
                    instanceId !== PRIMARY_INSTANCE_ID && existingOrdinal
                        ? buildWindowInstanceTitle(baseMetaTitle, existingOrdinal)
                        : instanceId !== PRIMARY_INSTANCE_ID && !existingOrdinal
                            ? buildWindowInstanceTitle(baseMetaTitle, siblingAppWindows.length + 1)
                            : baseMetaTitle;
                updated[existingIndex] = {
                    ...existing,
                    id: metaId,
                    type: metaId,
                    title: nextTitle,
                    instanceId,
                    isMain: true,
                    minimized: false,
                    minimizedByUser: false,
                    z: nextZ,
                    isAppWindow: true,
                    appRoutePath: meta.fullPath,
                    appRouteKey: meta.routeKey,
                    appIconKey: meta.iconKey || meta.routeKey,
                    appAccent: meta.accent,
                    routeLocation: routeLocation || parseStoredLocation(null, meta.fullPath),
                    iconComponent,
                };
                // Remove any stale duplicates of the same app key
                updated = updated.filter(
                    (win, index) =>
                        !(
                            win.isAppWindow &&
                            (win.appRouteKey === meta.routeKey || win.id === metaId) &&
                            (win.instanceId || PRIMARY_INSTANCE_ID) === instanceId &&
                            index !== existingIndex
                        )
                );
            } else {
                if (wins.length >= MAX_OPEN_WINDOWS) {
                    blockedByLimit = true;
                    return updated;
                }
                const shouldZoomPrimary = instanceId === PRIMARY_INSTANCE_ID;
                const nextZ = zRef.current + 1;
                zRef.current = nextZ;
                const offsetIndex = siblingAppWindows.length;
                const baseWidth = Math.min(980, viewportWidth - 80);
                const baseHeight = Math.min(700, viewportHeight - 150);
                const templateBounds = templateAppWindow?.snapshot
                    ? {
                          x: templateAppWindow.snapshot.x,
                          y: templateAppWindow.snapshot.y,
                          width: templateAppWindow.snapshot.width,
                          height: templateAppWindow.snapshot.height,
                      }
                    : templateAppWindow && !templateAppWindow.isZoomed
                        ? {
                              x: templateAppWindow.x,
                              y: templateAppWindow.y,
                              width: templateAppWindow.width,
                              height: templateAppWindow.height,
                          }
                        : null;
                const preferredWidth = clampNumber(
                    templateBounds?.width ?? baseWidth,
                    360,
                    Math.max(viewportWidth - 80, 360)
                );
                const preferredHeight = clampNumber(
                    templateBounds?.height ?? baseHeight,
                    260,
                    Math.max(viewportHeight - 150, 260)
                );
                const baseX = (templateBounds?.x ?? Math.max((viewportWidth - 900) / 2, 36)) + 36;
                const baseY = (templateBounds?.y ?? Math.max((viewportHeight - 640) / 2 + 20, MAC_HEADER_HEIGHT + 12)) + 28;
                const windowTitle =
                    instanceId === PRIMARY_INSTANCE_ID
                        ? baseMetaTitle
                        : buildWindowInstanceTitle(baseMetaTitle, offsetIndex + 1);
                const baseWindow = {
                    id: metaId,
                    type: metaId,
                    title: windowTitle,
                    instanceId,
                    width: preferredWidth,
                    height: preferredHeight,
                    x: baseX,
                    y: baseY,
                    z: nextZ,
                    minimized: false,
                    minimizedByUser: false,
                    isZoomed: shouldZoomPrimary,
                    snapshot: {
                        x: baseX,
                        y: baseY,
                        width: preferredWidth,
                        height: preferredHeight,
                    },
                    allowClose: true,
                    allowMinimize: true,
                    allowZoom: true,
                    isMain: meta.isMain !== undefined ? meta.isMain : true,
                    isAppWindow: true,
                    appRoutePath: meta.fullPath,
                    appRouteKey: meta.routeKey,
                    appIconKey: meta.iconKey || meta.routeKey,
                    appAccent: meta.accent,
                    routeLocation,
                    iconComponent,
                };

                const created = clampWindowToViewport(
                    templateBounds
                        ? {
                              ...baseWindow,
                              x: templateBounds.x + 36,
                              y: templateBounds.y + 28,
                              width: templateBounds.width,
                              height: templateBounds.height,
                              isZoomed: shouldZoomPrimary,
                              snapshot: {
                                  x: templateBounds.x + 36,
                                  y: templateBounds.y + 28,
                                  width: templateBounds.width,
                                  height: templateBounds.height,
                              },
                          }
                        : baseWindow,
                    viewportWidth,
                    viewportHeight,
                    layoutOptions
                );
                updated = [...updated, created];
            }

            updated = updated.map((win) => {
                if (win.id === MAIN_WINDOW_ID) {
                    return {
                        ...win,
                        isMain: false,
                        minimized: true,
                        minimizedByUser: false,
                        title: 'Desktop Overview',
                    };
                }
                return win;
            });

            return updated;
        });
        if (blockedByLimit) {
            announce(WINDOW_LIMIT_MESSAGE);
        }
    }, [announce, effects?.autoHideMenuBar, layoutOptions]);

    useEffect(() => {
        windowsRef.current = windows;
    }, [windows]);

    useEffect(() => {
        if (SINGLE_WINDOW_MODE) {
            return;
        }
        const appWindows = windowsRef.current.filter((win) => win.isAppWindow);
        if (appWindows.length === 0) {
            if (activeAppIdRef.current !== null) {
                activeAppIdRef.current = null;
                setActiveAppId(null);
            }
            return;
        }
        const currentActiveId = activeAppIdRef.current;
        const stillExists = currentActiveId
            ? appWindows.some((win) => win.id === currentActiveId)
            : false;
        if (stillExists) {
            return;
        }
        const fallback = appWindows
            .slice()
            .sort((a, b) => Number(a.minimized) - Number(b.minimized) || b.z - a.z)[0] || null;
        if (!fallback) {
            return;
        }
        activeAppIdRef.current = fallback.id;
        setActiveAppId(fallback.id);
        const activeSignature = routeLocationSignature(activeLocation, activePath);
        const fallbackSignature = routeLocationSignature(
            fallback.routeLocation,
            fallback.appRoutePath || '/'
        );
        if (activeSignature !== fallbackSignature) {
            navigateToWindowRouteRef.current?.(fallback);
        }
    }, [activeLocation, activePath, windows]);

    useEffect(() => {
        const timer = setInterval(() => setClockTime(new Date()), 30000);
        return () => clearInterval(timer);
    }, []);

    // Diagnostics builder for telemetry + snapshots
    const buildWindowDiagnostics = useCallback(
        (windowEntries) => {
            const total = windowEntries.length;
            const minimized = windowEntries.filter((win) => win.minimized).length;
            const staged = windowEntries.filter((win) => !win.minimized && !win.isMain).length;
            const activeAppWindow = windowEntries.find((win) => win.id === activeAppId);
            return {
                total,
                minimized,
                staged,
                activeAppId,
                activePath,
                focusMode,
                timestamp: Date.now(),
                sessionId: WINDOW_SESSION_ID,
                snapshotId: snapshotCounterRef.current,
                activeAppTitle: activeAppWindow?.title || null,
            };
        },
        [activeAppId, activePath, focusMode]
    );

    // Keep latest snapshot inputs in refs to avoid stale closures during throttling
    const windowsForUIRef = useRef(windowsForUI);
    const closedTypesRef = useRef(closedTypes);
    const focusModeRef = useRef(focusMode);
    const activePathRef = useRef(activePath);
    const buildWindowDiagnosticsRef = useRef(buildWindowDiagnostics);

    useEffect(() => {
        windowsForUIRef.current = windowsForUI;
    }, [windowsForUI]);
    useEffect(() => {
        closedTypesRef.current = closedTypes;
    }, [closedTypes]);
    useEffect(() => {
        focusModeRef.current = focusMode;
    }, [focusMode]);
    useEffect(() => {
        activePathRef.current = activePath;
    }, [activePath]);
    useEffect(() => {
        buildWindowDiagnosticsRef.current = buildWindowDiagnostics;
    }, [buildWindowDiagnostics]);

    const snapshotTimerRef = useRef(null);
    const pendingSnapshotRef = useRef(null);

    const flushWindowSnapshot = useCallback(
        (source = 'local') => {
            const windowEntries = (windowsForUIRef.current || []).map(serializeWindowEntry);
            snapshotCounterRef.current += 1;

            const statsBuilder = buildWindowDiagnosticsRef.current || buildWindowDiagnostics;
            const activePathSnapshot = activePathRef.current || '/';
            const payload = {
                updatedAt: Date.now(),
                focusMode: Boolean(focusModeRef.current),
                closedTypes: closedTypesRef.current || [],
                activePath: activePathSnapshot,
                windows: windowEntries,
                stats: statsBuilder(windowEntries),
                source,
            };

            queryClient.setQueryData(['desktop-windows'], payload);
            const scopedWindows = windowEntries.filter((win) => {
                if (!win.appRoutePath) return true;
                return (
                    win.appRoutePath === activePathSnapshot ||
                    win.appRoutePath.startsWith(`${activePathSnapshot}/`)
                );
            });
            const pathScopedPayload = { ...payload, windows: scopedWindows };

            queryClient.setQueryData(['desktop-windows', activePathSnapshot], pathScopedPayload);
            queryClient.setQueryData(['desktop-windows', 'meta'], payload);

            if (typeof window !== 'undefined') {
                try {
                    window.dispatchEvent(
                        new CustomEvent(WINDOW_EVENT_NAME, { detail: payload })
                    );
                } catch {
                    // Ignore event dispatch issues
                }
            }

            if (windowChannelRef.current) {
                try {
                    windowChannelRef.current.postMessage({
                        type: 'windows-sync',
                        payload: {
                            ...payload,
                            sessionId: WINDOW_SESSION_ID,
                        },
                    });
                } catch {
                    // ignore broadcast failures
                }
            }
        },
        [buildWindowDiagnostics, queryClient]
    );

    const publishWindowSnapshot = useCallback(
        (source = 'local') => {
            pendingSnapshotRef.current = source || pendingSnapshotRef.current || 'local';
            if (snapshotTimerRef.current) {
                return;
            }
            if (typeof window === 'undefined') {
                flushWindowSnapshot(pendingSnapshotRef.current);
                pendingSnapshotRef.current = null;
                return;
            }
            snapshotTimerRef.current = window.setTimeout(() => {
                snapshotTimerRef.current = null;
                const nextSource = pendingSnapshotRef.current || 'local';
                pendingSnapshotRef.current = null;
                flushWindowSnapshot(nextSource);
            }, 96);
        },
        [flushWindowSnapshot]
    );

    const processExternalWindowState = useCallback(
        (payload, source = 'storage') => {
            if (typeof window === 'undefined') {
                return;
            }
            if (!payload || payload.version !== WINDOW_STORAGE_VERSION) {
                return;
            }
            if (payload.sessionId && payload.sessionId === WINDOW_SESSION_ID) {
                return;
            }

            const focusFromPayload = Boolean(payload.focusMode);
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const sanitizedEntries = Array.isArray(payload.windows)
                ? payload.windows
                      .map((entry) => sanitizeWindowEntry(entry, viewportWidth, viewportHeight, { autoHideMenuBar: menuBarAutoHide }))
                      .filter(Boolean)
                : [];

            if (sanitizedEntries.length === 0) {
                return;
            }

            const normalized = ensureMainWindow(
                sanitizedEntries,
                windowTitle,
                viewportWidth,
                viewportHeight,
                { autoHideMenuBar: menuBarAutoHide }
            ).map((win) => {
                let next = win.isZoomed
                    ? expandWindowToViewport(win, viewportWidth, viewportHeight, { autoHideMenuBar: menuBarAutoHide })
                    : clampWindowToViewport(win, viewportWidth, viewportHeight, { autoHideMenuBar: menuBarAutoHide });

                let minimized = next.minimized;
                let minimizedByUser = Boolean(next.minimizedByUser);

                if (focusFromPayload && !next.isMain) {
                    minimized = true;
                    minimizedByUser = false;
                } else if (
                    !focusFromPayload &&
                    !next.isMain &&
                    !minimizedByUser
                ) {
                    minimized = false;
                }

                return {
                    ...next,
                    minimized,
                    minimizedByUser,
                };
            });

            const deduped = applyWindowLimit(dedupeAppWindows(normalized));

            const currentSignature = JSON.stringify(
                windowsRef.current.map(serializeWindowEntry)
            );
            const nextSignature = JSON.stringify(deduped.map(serializeWindowEntry));
            const closedSignature = JSON.stringify(closedTypes);
            const nextClosedSignature = JSON.stringify(
                Array.isArray(payload.closedTypes)
                    ? payload.closedTypes.filter((type) => typeof type === 'string')
                    : []
            );

            if (
                currentSignature === nextSignature &&
                closedSignature === nextClosedSignature &&
                focusMode === focusFromPayload
            ) {
                return;
            }

            const maxZ = deduped.reduce((acc, win) => Math.max(acc, win.z || 0), 20);
            zRef.current = Math.max(maxZ, 20);

            const sanitizedClosedTypes = Array.isArray(payload.closedTypes)
                ? payload.closedTypes.filter((type) => typeof type === 'string')
                : [];

            setFocusMode((prev) => (prev === focusFromPayload ? prev : focusFromPayload));
            setClosedTypes((prev) => {
                const prevSignature = JSON.stringify(prev);
                const nextSignature = JSON.stringify(sanitizedClosedTypes);
                return prevSignature === nextSignature ? prev : sanitizedClosedTypes;
            });
            setWindows(deduped);
            if (source === 'channel') {
                setLiveAnnouncement('Window state synced in real time.');
            }
            publishWindowSnapshot('external-sync');
        },
        [windowTitle, closedTypes, focusMode, publishWindowSnapshot]
    );

    useEffect(() => {
        publishWindowSnapshot('local');
    }, [windowsForUI, closedTypes, focusMode, activePath, publishWindowSnapshot]);

    useEffect(() => {
        if (!activeLocation || typeof window === 'undefined') return;
        const baseMeta = resolveAppRouteMeta(activeLocation, windowTitle);
        const appWindows = windowsRef.current.filter((win) => win.isAppWindow);
        const activeCandidate =
            appWindows.find((win) => win.id === activeAppIdRef.current) || null;
        const locationSignature = routeLocationSignature(activeLocation, baseMeta.fullPath);
        const matchingPathCandidate =
            appWindows.find((win) => {
                const routeSig = routeLocationSignature(win.routeLocation, win.appRoutePath || '/');
                if (routeSig && locationSignature && routeSig === locationSignature) {
                    return true;
                }
                const fallbackSig = routeLocationSignature(null, win.appRoutePath || '/');
                return Boolean(fallbackSig && locationSignature && fallbackSig === locationSignature);
            }) || null;
        const routeKeyCandidate =
            appWindows
                .filter((win) => win.appRouteKey === baseMeta.routeKey)
                .sort((a, b) => Number(a.minimized) - Number(b.minimized) || b.z - a.z)[0] || null;
        const topVisibleCandidate =
            appWindows
                .slice()
                .sort((a, b) => Number(a.minimized) - Number(b.minimized) || b.z - a.z)[0] || null;
        const matchingWindow =
            activeCandidate ||
            matchingPathCandidate ||
            routeKeyCandidate ||
            topVisibleCandidate;
        const instanceId = matchingWindow?.instanceId || PRIMARY_INSTANCE_ID;
        const targetId = matchingWindow?.id || buildAppWindowId(baseMeta.routeKey, instanceId);
        const meta = { ...baseMeta, id: targetId, type: targetId, instanceId };
        setActiveAppId((prev) => (prev === targetId ? prev : targetId));
        activeAppIdRef.current = targetId;
        upsertAppWindow(meta, activeLocation);
    }, [activeLocation, windowTitle, upsertAppWindow]);

    useEffect(
        () => () => {
            if (snapshotTimerRef.current) {
                if (typeof window !== 'undefined') {
                    window.clearTimeout(snapshotTimerRef.current);
                } else {
                    clearTimeout(snapshotTimerRef.current);
                }
            }
            snapshotTimerRef.current = null;
            pendingSnapshotRef.current = null;
        },
        []
    );

    useEffect(() => {
        // Keep reduce motion in sync with Control Center state
        setReduceMotion(Boolean(effects.reduceMotion));
    }, [effects.reduceMotion]);

    const persistEffects = useCallback((next) => {
        setEffects((prev) => {
            const merged = sanitizeEffects({ ...prev, ...next });
            if (typeof window !== 'undefined') {
                try {
                    window.localStorage.setItem(UI_EFFECTS_STORAGE_KEY, JSON.stringify(merged));
                    window.dispatchEvent(new Event('ui-effects-changed'));
                } catch {
                    // ignore storage errors
                }
            }
            return merged;
        });
    }, []);

    const accentPresetKey = effects?.accentPreset || DEFAULT_EFFECTS.accentPreset;
    const surfacePresetKey = effects?.surfacePreset || DEFAULT_EFFECTS.surfacePreset;
    const accentPreset = useMemo(
        () => ACCENT_PRESET_MAP[accentPresetKey] || ACCENT_PRESET_MAP.system,
        [accentPresetKey]
    );
    const accentPresetGradient = accentPreset?.gradient || null;
    const wallpaperMode = effects?.wallpaperMode || DEFAULT_EFFECTS.wallpaperMode;

    useEffect(() => {
        if (typeof document === 'undefined') return undefined;
        const root = document.documentElement;
        const accentColor = accentPreset?.color || '#0A84FF';
        const accentStrong = accentPreset?.strong || accentColor;
        root.setAttribute('data-accent-preset', accentPresetKey);

        if (accentPresetKey === 'system') {
            root.style.removeProperty('--color-accent');
            root.style.removeProperty('--color-accent-strong');
            root.style.removeProperty('--color-accent-gradient');
        } else {
            root.style.setProperty('--color-accent', accentColor);
            root.style.setProperty('--color-accent-strong', accentStrong);
            if (accentPresetGradient) {
                root.style.setProperty('--color-accent-gradient', accentPresetGradient);
            } else {
                root.style.removeProperty('--color-accent-gradient');
            }
        }

        return undefined;
    }, [accentPreset?.color, accentPreset?.strong, accentPresetGradient, accentPresetKey]);

    const appWindowSummaries = useMemo(
        () =>
            windows
                .filter((win) => win.isAppWindow)
                .map((win) => ({
                    id: win.id,
                    title: win.title,
                    routePath: win.appRoutePath,
                    routeKey: win.appRouteKey,
                    iconKey: win.appIconKey,
                    accent: win.appAccent,
                    minimized: Boolean(win.minimized),
                    isActive: activeAppId === win.id,
                })),
        [windows, activeAppId]
    );

    const activeAppWindow = useMemo(
        () => appWindowSummaries.find((win) => win.isActive) ?? appWindowSummaries[0] ?? null,
        [appWindowSummaries]
    );

    const windowTelemetry = useMemo(
        () => buildWindowDiagnostics(windowsForUI),
        [windowsForUI, buildWindowDiagnostics]
    );

    const formattedClock = useMemo(() => {
        const formatter =
            typeof Intl !== 'undefined'
                ? new Intl.DateTimeFormat(undefined, {
                      hour: '2-digit',
                      minute: '2-digit',
                  })
                : null;
        return formatter ? formatter.format(clockTime) : clockTime.toLocaleTimeString();
    }, [clockTime]);

    const formattedPath = useMemo(() => {
        if (!activePath || activePath === '/') return 'Home';
        return activePath
            .replace(/^\//, '')
            .split('/')
            .filter(Boolean)
            .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
            .join(' / ');
    }, [activePath]);

    useEffect(() => {
        draggingWindowRef.current = draggingWindow;
    }, [draggingWindow]);

    useEffect(() => {
        snapPreviewRef.current = snapPreview;
    }, [snapPreview]);

    useEffect(() => {
        if (!windowSwitcherRef.current.open) {
            return;
        }
        const items = buildWindowSwitcherItems();
        if (items.length === 0) {
            updateWindowSwitcher({ open: false, items: [], highlightIndex: 0 });
            return;
        }
        const currentIndex = Math.min(
            Math.max(windowSwitcherRef.current.highlightIndex, 0),
            items.length - 1
        );
        updateWindowSwitcher({ open: true, items, highlightIndex: currentIndex });
    }, [windows, buildWindowSwitcherItems, updateWindowSwitcher]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const handleKeyUp = (event) => {
            if (!windowSwitcherRef.current.open) {
                return;
            }
            if (!event.metaKey && !event.ctrlKey) {
                closeWindowSwitcher(true);
            }
        };
        window.addEventListener('keyup', handleKeyUp);
        return () => window.removeEventListener('keyup', handleKeyUp);
    }, [closeWindowSwitcher]);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        try {
            const payload = {
                enabled: Boolean(hotCorners.enabled),
                corners: sanitizeHotCornerMapping(hotCorners.corners),
            };
            window.localStorage.setItem(HOT_CORNER_STORAGE_KEY, JSON.stringify(payload));
        } catch {
            // ignore persistence errors
        }
    }, [hotCorners]);

    useEffect(() => {
        if (!activeHotCorner) return undefined;
        if (typeof window === 'undefined') return undefined;
        const timer = window.setTimeout(() => setActiveHotCorner(null), 1400);
        return () => window.clearTimeout(timer);
    }, [activeHotCorner]);

    useEffect(() => () => {
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }
        if (resizeFrameRef.current) {
            cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
        }
        if (dragPointerFrameRef.current) {
            cancelAnimationFrame(dragPointerFrameRef.current);
            dragPointerFrameRef.current = null;
        }
        dragPointerPendingRef.current = null;
        Object.values(momentumAnimationsRef.current).forEach((animation) => {
            if (animation?.frame) {
                cancelAnimationFrame(animation.frame);
            }
        });
        momentumAnimationsRef.current = {};
    }, []);

    const clampPosition = useCallback((x, y, width, height) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }
        return clampWindowCoords(x, y, width, height, window.innerWidth, window.innerHeight);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        const handleResize = () => {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const compact = viewportWidth < 1024;
            setIsCompact(compact);
            setWindows((wins) =>
                wins.map((win) => {
                    if (win.isZoomed) {
                        return expandWindowToViewport(win, viewportWidth, viewportHeight, layoutOptions);
                    }
                    if (compact) {
                        return win;
                    }
                    const maxWidth = Math.max(viewportWidth - 64, 360);
                    const maxHeight = Math.max(viewportHeight - 140, 260);
                    const width = clampNumber(win.width ?? 420, 320, maxWidth);
                    const height = clampNumber(win.height ?? 320, 260, maxHeight);
                    const { x, y } = clampPosition(win.x, win.y, width, height);
                    return clampWindowToViewport({ ...win, width, height, x, y }, viewportWidth, viewportHeight, layoutOptions);
                })
            );
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [clampPosition, layoutOptions]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTrackTime((time) => {
                if (time.elapsed >= time.total) {
                    return { ...time, elapsed: 0 };
                }
                return { ...time, elapsed: Math.min(time.total, time.elapsed + 4) };
            });
        }, 4000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        const sync = () => setReduceMotion(readReduceMotionPreference());
        sync();
        if (mediaQuery.addEventListener) {
            mediaQuery.addEventListener('change', sync);
        } else if (mediaQuery.addListener) {
            mediaQuery.addListener(sync);
        }
        window.addEventListener('ui-effects-changed', sync);
        window.addEventListener('storage', sync);
        return () => {
            if (mediaQuery.removeEventListener) {
                mediaQuery.removeEventListener('change', sync);
            } else if (mediaQuery.removeListener) {
                mediaQuery.removeListener(sync);
            }
            window.removeEventListener('ui-effects-changed', sync);
            window.removeEventListener('storage', sync);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const syncEffects = () => {
            try {
                const parsed = JSON.parse(window.localStorage.getItem(UI_EFFECTS_STORAGE_KEY) || 'null');
                if (parsed && typeof parsed === 'object') {
                    setEffects((prev) => sanitizeEffects({ ...prev, ...parsed }));
                }
            } catch {
                // ignore parse errors
            }
        };
        window.addEventListener('ui-effects-changed', syncEffects);
        window.addEventListener('storage', syncEffects);
        return () => {
            window.removeEventListener('ui-effects-changed', syncEffects);
            window.removeEventListener('storage', syncEffects);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return;
        localStorage.setItem('scientistshield.desktop.scratchpad', scratchpadText);
    }, [scratchpadText]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleToggleControlCenter = () => setControlCenterOpen((open) => !open);
        const handleOpenControlCenter = () => setControlCenterOpen(true);
        const handleCloseControlCenter = () => setControlCenterOpen(false);

        window.addEventListener('control-center:toggle', handleToggleControlCenter);
        window.addEventListener('control-center:open', handleOpenControlCenter);
        window.addEventListener('control-center:close', handleCloseControlCenter);

        return () => {
            window.removeEventListener('control-center:toggle', handleToggleControlCenter);
            window.removeEventListener('control-center:open', handleOpenControlCenter);
            window.removeEventListener('control-center:close', handleCloseControlCenter);
        };
    }, []);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        window.dispatchEvent(
            new CustomEvent('control-center:state', { detail: { open: controlCenterOpen } })
        );
        return undefined;
    }, [controlCenterOpen]);

    useEffect(() => {
        if (!controlCenterOpen) return undefined;
        const handleClickAway = (event) => {
            if (controlCenterRef.current && !controlCenterRef.current.contains(event.target)) {
                setControlCenterOpen(false);
            }
        };
        const handleEsc = (event) => {
            if (event.key === 'Escape') {
                setControlCenterOpen(false);
            }
        };
        window.addEventListener('mousedown', handleClickAway);
        window.addEventListener('keydown', handleEsc);
        return () => {
            window.removeEventListener('mousedown', handleClickAway);
            window.removeEventListener('keydown', handleEsc);
        };
    }, [controlCenterOpen]);

    useEffect(() => {
        if (typeof window === 'undefined') return;

        if (SINGLE_WINDOW_MODE) {
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const routeMeta = resolveAppRouteMeta(activeLocation, windowTitle);
            const autoHideMenuBar = effects?.autoHideMenuBar !== false;
            const singleLayoutOptions = { autoHideMenuBar };
            setFocusMode(false);
            setClosedTypes([]);
            const mainWindow = expandWindowToViewport(
                {
                    ...createMainWindow(windowTitle, viewportWidth, viewportHeight, zRef.current + 1),
                    id: MAIN_WINDOW_ID,
                    type: WINDOW_TYPES.MAIN,
                    allowMinimize: false,
                    isAppWindow: true,
                    appRoutePath: activePath,
                    appRouteKey: routeMeta.routeKey,
                    appIconKey: routeMeta.iconKey || routeMeta.routeKey,
                    appAccent: routeMeta.accent,
                    routeLocation: snapshotLocation(activeLocation) || parseStoredLocation(null, activePath),
                    minimized: false,
                    minimizedByUser: false,
                },
                viewportWidth,
                viewportHeight,
                singleLayoutOptions
            );
            setWindows([mainWindow]);
            setActiveAppId(MAIN_WINDOW_ID);
            activeAppIdRef.current = MAIN_WINDOW_ID;
            zRef.current = Math.max(zRef.current, mainWindow.z || 20);
            return;
        }

        let persistedPayload = null;
        let storedFocusMode = null;
        if (!hydrationRef.current) {
            try {
                persistedPayload = JSON.parse(localStorage.getItem(WINDOW_STORAGE_KEY) || 'null');
            } catch {
                persistedPayload = null;
            }
            if (
                persistedPayload &&
                typeof persistedPayload === 'object' &&
                persistedPayload.version === WINDOW_STORAGE_VERSION
            ) {
                persistedClosedTypesRef.current = Array.isArray(persistedPayload.closedTypes)
                    ? persistedPayload.closedTypes
                    : [];
                storedFocusMode = Boolean(persistedPayload.focusMode);
                setFocusMode((prev) => (prev === storedFocusMode ? prev : storedFocusMode));
            } else {
                persistedPayload = null;
                persistedClosedTypesRef.current = null;
            }
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const shouldRestoreClosedTypes =
            !hydrationRef.current && Array.isArray(persistedClosedTypesRef.current);
        const closedTypesSnapshot = shouldRestoreClosedTypes
            ? [...persistedClosedTypesRef.current]
            : null;
        const focusModeForHydration =
            !hydrationRef.current && storedFocusMode !== null ? storedFocusMode : focusMode;

        setWindows((prev) => {
            if (prev.length > 0) {
                return prev.map((win) =>
                    win.type === WINDOW_TYPES.MAIN ? { ...win, title: windowTitle } : win
                );
            }

            let initialWindows;
            if (
                !hydrationRef.current &&
                persistedPayload &&
                Array.isArray(persistedPayload.windows) &&
                persistedPayload.windows.length > 0
            ) {
                initialWindows = persistedPayload.windows
                    .map((entry) => sanitizeWindowEntry(entry, viewportWidth, viewportHeight, layoutOptions))
                    .filter(Boolean);
            } else {
                initialWindows = createDefaultWindows(windowTitle, viewportWidth, viewportHeight);
            }

            const normalized = ensureMainWindow(
                initialWindows,
                windowTitle,
                viewportWidth,
                viewportHeight,
                layoutOptions
            ).map((win) => {
                const baseMinimized =
                    win.isMain || !focusModeForHydration ? win.minimized : true;
                const baseMinimizedByUser =
                    win.isMain || !focusModeForHydration ? Boolean(win.minimizedByUser) : false;
                const shouldForceVisible =
                    !focusModeForHydration && !win.isMain && !baseMinimizedByUser;
                return {
                    ...win,
                    minimized: shouldForceVisible ? false : baseMinimized,
                    minimizedByUser: shouldForceVisible ? false : baseMinimizedByUser,
                };
            });

            const deduped = applyWindowLimit(dedupeAppWindows(normalized));

            hydrationRef.current = true;

            const maxZ = deduped.reduce((acc, win) => Math.max(acc, win.z || 0), 20);
            zRef.current = Math.max(maxZ, 20);

            return deduped;
        });

        if (closedTypesSnapshot) {
            setClosedTypes(closedTypesSnapshot);
            persistedClosedTypesRef.current = null;
        }
    }, [activeLocation, activePath, effects?.autoHideMenuBar, focusMode, layoutOptions, windowTitle]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        if (windowPersistTimeoutRef.current) {
            window.clearTimeout(windowPersistTimeoutRef.current);
        }
        windowPersistTimeoutRef.current = window.setTimeout(() => {
            if (windowsForUI.length === 0) {
                windowPersistTimeoutRef.current = null;
                return;
            }
            const payload = {
                version: WINDOW_STORAGE_VERSION,
                focusMode,
                closedTypes,
                windows: windowsForUI.map(serializeWindowEntry),
            };
            try {
                localStorage.setItem(WINDOW_STORAGE_KEY, JSON.stringify(payload));
            } catch {
                // ignore persistence errors
            }
            windowPersistTimeoutRef.current = null;
        }, 120);
        return () => {
            if (windowPersistTimeoutRef.current) {
                window.clearTimeout(windowPersistTimeoutRef.current);
                windowPersistTimeoutRef.current = null;
            }
        };
    }, [windowsForUI, closedTypes, focusMode]);

    useEffect(() => {
        if (!quickLookWindowId) return;
        if (!windowsRef.current.some((win) => win.id === quickLookWindowId)) {
            setQuickLookWindowId(null);
        }
    }, [quickLookWindowId]);

    const focusMemoryRef = useRef(null);

    const commitDragMutation = useCallback(
        (payload) => {
            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    if (win.id !== payload.id) return win;
                    const xChanged = win.x !== payload.x;
                    const yChanged = win.y !== payload.y;
                    const zoomChanged = win.isZoomed;
                    if (!xChanged && !yChanged && !zoomChanged) {
                        return win;
                    }
                    changed = true;
                    return {
                        ...win,
                        x: payload.x,
                        y: payload.y,
                        isZoomed: false,
                    };
                });
                return changed ? next : wins;
            });
            setSnapPreview((prev) =>
                reconcileSnapPreview(prev, payload.snapCandidate ?? null, payload.id)
            );
        },
        [setSnapPreview, setWindows]
    );

    const applyDragMutation = useCallback(() => {
        dragFrameRef.current = null;
        const payload = dragPendingRef.current;
        if (!payload) return;
        dragPendingRef.current = null;
        commitDragMutation(payload);
    }, [commitDragMutation]);

    const queueDragMutation = useCallback(
        (payload) => {
            dragPendingRef.current = payload;
            if (!dragFrameRef.current) {
                dragFrameRef.current = requestAnimationFrame(applyDragMutation);
            }
        },
        [applyDragMutation]
    );

    const flushDragMutation = useCallback(() => {
        if (!dragPendingRef.current) return;
        const payload = dragPendingRef.current;
        dragPendingRef.current = null;
        if (dragFrameRef.current) {
            cancelAnimationFrame(dragFrameRef.current);
            dragFrameRef.current = null;
        }
        commitDragMutation(payload);
    }, [commitDragMutation]);

    const commitDragPointerPosition = useCallback(() => {
        dragPointerFrameRef.current = null;
        if (!dragPointerPendingRef.current) return;
        setDragPointer(dragPointerPendingRef.current);
        dragPointerPendingRef.current = null;
    }, []);

    const queueDragPointerPosition = useCallback(
        (payload) => {
            dragPointerPendingRef.current = payload;
            if (!dragPointerFrameRef.current) {
                dragPointerFrameRef.current = requestAnimationFrame(commitDragPointerPosition);
            }
        },
        [commitDragPointerPosition]
    );

    const clearDragPointerOverlay = useCallback(() => {
        if (dragPointerFrameRef.current) {
            cancelAnimationFrame(dragPointerFrameRef.current);
            dragPointerFrameRef.current = null;
        }
        dragPointerPendingRef.current = null;
        setDragPointer(null);
    }, []);

    const commitResizeMutation = useCallback(
        (payload) => {
            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    if (win.id !== payload.id) return win;
                    const { x, y, width, height } = payload.metrics;
                    if (
                        win.x === x &&
                        win.y === y &&
                        win.width === width &&
                        win.height === height &&
                        !win.isZoomed
                    ) {
                        return win;
                    }
                    changed = true;
                    return {
                        ...win,
                        x,
                        y,
                        width,
                        height,
                        isZoomed: false,
                        snapshot: null,
                    };
                });
                return changed ? next : wins;
            });
        },
        [setWindows]
    );

    const applyResizeMutation = useCallback(() => {
        resizeFrameRef.current = null;
        const payload = resizePendingRef.current;
        if (!payload) return;
        resizePendingRef.current = null;
        commitResizeMutation(payload);
    }, [commitResizeMutation]);

    const queueResizeMutation = useCallback(
        (payload) => {
            resizePendingRef.current = payload;
            if (!resizeFrameRef.current) {
                resizeFrameRef.current = requestAnimationFrame(applyResizeMutation);
            }
        },
        [applyResizeMutation]
    );

    const flushResizeMutation = useCallback(() => {
        if (!resizePendingRef.current) return;
        const payload = resizePendingRef.current;
        resizePendingRef.current = null;
        if (resizeFrameRef.current) {
            cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
        }
        commitResizeMutation(payload);
    }, [commitResizeMutation]);

    const stopMomentumAnimation = useCallback((id) => {
        const animation = momentumAnimationsRef.current[id];
        if (!animation) {
            return;
        }
        if (animation.frame) {
            cancelAnimationFrame(animation.frame);
        }
        delete momentumAnimationsRef.current[id];
    }, []);

    const applyDragMomentum = useCallback(
        (id, velocitySample) => {
            if (reduceMotion) {
                return false;
            }
            stopMomentumAnimation(id);
            const sampleTimestamp = typeof performance !== 'undefined' ? performance.now() : Date.now();
            if (
                !velocitySample ||
                typeof velocitySample.vx !== 'number' ||
                typeof velocitySample.vy !== 'number'
            ) {
                return false;
            }
            if (typeof window === 'undefined') {
                return false;
            }
            const sampleAge = sampleTimestamp - (velocitySample.time || sampleTimestamp);
            if (sampleAge > DRAG_MOMENTUM_SAMPLE_MS) {
                return false;
            }
            const distanceTravelled = Number(velocitySample.distance) || 0;
            if (distanceTravelled < DRAG_MOMENTUM_MIN_DISTANCE) {
                return false;
            }
            const speed = Math.hypot(velocitySample.vx, velocitySample.vy);
            if (speed < DRAG_MOMENTUM_THRESHOLD) {
                return false;
            }
            const animation = {
                id,
                vx: clampNumber(velocitySample.vx, -2.4, 2.4),
                vy: clampNumber(velocitySample.vy, -2.4, 2.4),
                travelX: 0,
                travelY: 0,
                elapsed: 0,
                lastTime: sampleTimestamp,
                frame: null,
            };

            const step = (now) => {
                const win = windowsRef.current.find((entry) => entry.id === id);
                if (!win) {
                    stopMomentumAnimation(id);
                    return;
                }
                const delta = Math.min(now - animation.lastTime, DRAG_MOMENTUM_FRAME_CLAMP);
                animation.lastTime = now;
                animation.elapsed += delta;

                const applyDelta = (key, velocity) => {
                    if (velocity === 0) return 0;
                    const raw = velocity * delta;
                    if (raw === 0) return 0;
                    const remaining = Math.max(DRAG_MOMENTUM_MAX_TRAVEL - animation[key], 0);
                    if (remaining <= 0.25) {
                        return 0;
                    }
                    const applied = Math.sign(raw) * Math.min(Math.abs(raw), remaining);
                    animation[key] += Math.abs(applied);
                    return applied;
                };

                const deltaX = applyDelta('travelX', animation.vx);
                const deltaY = applyDelta('travelY', animation.vy);

                if (deltaX === 0 && deltaY === 0) {
                    stopMomentumAnimation(id);
                    return;
                }

                const coords = clampWindowCoords(
                    win.x + deltaX,
                    win.y + deltaY,
                    win.width,
                    win.height,
                    window.innerWidth,
                    window.innerHeight
                );

                setWindows((wins) =>
                    wins.map((entry) =>
                        entry.id === id
                            ? {
                                  ...entry,
                                  x: coords.x,
                                  y: coords.y,
                                  isZoomed: false,
                                  snapshot: null,
                              }
                            : entry
                    )
                );

                const damping = Math.pow(DRAG_MOMENTUM_DECAY, delta / 16);
                animation.vx *= damping;
                animation.vy *= damping;

                const nextSpeed = Math.hypot(animation.vx, animation.vy);
                const fullyTravelled =
                    animation.travelX >= DRAG_MOMENTUM_MAX_TRAVEL &&
                    animation.travelY >= DRAG_MOMENTUM_MAX_TRAVEL;

                if (
                    nextSpeed < DRAG_MOMENTUM_MIN_SPEED ||
                    animation.elapsed >= DRAG_MOMENTUM_MAX_DURATION ||
                    fullyTravelled
                ) {
                    stopMomentumAnimation(id);
                    return;
                }

                animation.frame = requestAnimationFrame(step);
                momentumAnimationsRef.current[id] = animation;
            };

            animation.frame = requestAnimationFrame(step);
            momentumAnimationsRef.current[id] = animation;
            return true;
        },
        [reduceMotion, setWindows, stopMomentumAnimation]
    );

    const bringToFront = useCallback(
        (id) => {
            let focusedTitle = null;
            let focusedWindow = null;
            setWindows((prev) => {
                const target = prev.find((win) => win.id === id);
                if (!target) return prev;
                const newZ = zRef.current + 1;
                zRef.current = newZ;
                focusedTitle = target.title || typeToTitle(target.type);
                focusedWindow = target;
                return prev.map((win) =>
                    win.id === id
                        ? { ...win, z: newZ, minimized: false, minimizedByUser: false }
                        : win
                );
            });
            if (focusedWindow?.isAppWindow && activeAppIdRef.current !== focusedWindow.id) {
                activeAppIdRef.current = focusedWindow.id;
                setActiveAppId(focusedWindow.id);
            }
            if (focusedWindow?.isAppWindow) {
                const activeSignature = routeLocationSignature(activeLocation, activePath);
                const targetSignature = routeLocationSignature(
                    focusedWindow.routeLocation,
                    focusedWindow.appRoutePath || '/'
                );
                if (activeSignature !== targetSignature) {
                    navigateToWindowRouteRef.current?.(focusedWindow);
                }
            }
            if (focusedTitle) {
                announce(`${focusedTitle} focused`);
            }
        },
        [activeLocation, activePath, announce, setActiveAppId]
    );

    useEffect(() => {
        bringToFrontRef.current = bringToFront;
    }, [bringToFront]);

    const applyLayoutPreset = useCallback(
        (id, preset) => {
            if (typeof window === 'undefined' || !id || !preset) {
                return false;
            }
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            const base = windowsRef.current.find((win) => win.id === id);
            if (!base) return false;

            const presetMeta = LAYOUT_PRESET_MAP[preset];
            const target = presetMeta?.target || preset;
            const nextRect = getSnapRect(target, viewportWidth, viewportHeight);
            if (!nextRect) {
                return false;
            }

            const clampedCoords = clampWindowCoords(
                nextRect.x,
                nextRect.y,
                nextRect.width,
                nextRect.height,
                viewportWidth,
                viewportHeight
            );

            setWindows((wins) =>
                wins.map((win) =>
                    win.id === id
                        ? {
                              ...win,
                              x: clampedCoords.x,
                              y: clampedCoords.y,
                              width: nextRect.width,
                              height: nextRect.height,
                              isZoomed: false,
                              snapshot: null,
                              minimized: false,
                              minimizedByUser: false,
                          }
                        : win
                )
            );

            bringToFront(id);
            return true;
        },
        [bringToFront, setWindows]
    );

    const resolveTopWindow = useCallback((options = {}) => {
        const includeMinimized = Boolean(options.includeMinimized);
        const candidates = windowsRef.current.filter((win) => includeMinimized || !win.minimized);
        if (!candidates.length) {
            return null;
        }
        return candidates.reduce((top, win) => (!top || win.z > top.z ? win : top), null);
    }, []);

    const applyLayoutPresetToTopWindow = useCallback(
        (presetId, options = {}) => {
            const target = resolveTopWindow();
            if (!target) {
                if (options.announce !== false) {
                    announce('No active window to arrange');
                }
                return false;
            }
            const applied = applyLayoutPreset(target.id, presetId);
            if (applied && options.announce !== false) {
                const presetLabel = LAYOUT_PRESET_MAP[presetId]?.label || labelForSnapTarget(presetId);
                announce(`${target.title || 'Window'} moved to ${presetLabel}`);
            }
            return applied;
        },
        [announce, applyLayoutPreset, resolveTopWindow]
    );

    const handlePointerDown = useCallback(
        (event, id) => {
            if (
                event.target?.closest &&
                event.target.closest('[data-window-control]')
            ) {
                return;
            }
            event.preventDefault();
            event.stopPropagation();

            bringToFront(id);

            const windowData = windowsRef.current.find((win) => win.id === id);
            if (!windowData) return;

            stopMomentumAnimation(id);

            setDraggingWindow({
                id,
                type: windowData.type,
                title: windowData.title,
                isMain: Boolean(windowData.isMain),
            });
            setDragPointer({
                x: event.clientX,
                y: event.clientY,
            });

            const offsetX = event.clientX - windowData.x;
            const offsetY = event.clientY - windowData.y;

            dragRef.current = {
                id,
                pointerId: event.pointerId,
                target: event.currentTarget,
                offsetX,
                offsetY,
            };
            const startTime = typeof performance !== 'undefined' ? performance.now() : Date.now();
            dragVelocityRef.current[id] = {
                x: windowData.x,
                y: windowData.y,
                vx: 0,
                vy: 0,
                time: startTime,
                distance: 0,
            };
            setSnapPreview(null);

            event.currentTarget.setPointerCapture(event.pointerId);

            const handleMove = (moveEvent) => {
                if (!dragRef.current || dragRef.current.id !== id) return;
                const { offsetX: oX, offsetY: oY } = dragRef.current;
                const desiredX = moveEvent.clientX - oX;
                const desiredY = moveEvent.clientY - oY;
                const windowMeta = windowsRef.current.find((win) => win.id === id);
                if (!windowMeta) return;
                const { x: clampedX, y: clampedY } = clampPosition(
                    desiredX,
                    desiredY,
                    windowMeta.width,
                    windowMeta.height
                );
                let snapCandidate = null;
                if (typeof window !== 'undefined') {
                    snapCandidate = computeSnapCandidate({
                        pointerX: moveEvent.clientX,
                        pointerY: moveEvent.clientY,
                        viewportWidth: window.innerWidth,
                        viewportHeight: window.innerHeight,
                        disable: moveEvent.altKey || moveEvent.metaKey,
                    });
                }
                queueDragPointerPosition({
                    x: moveEvent.clientX,
                    y: moveEvent.clientY,
                });
                queueDragMutation({
                    id,
                    x: clampedX,
                    y: clampedY,
                    snapCandidate,
                });
                const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
                const previous = dragVelocityRef.current[id];
                if (previous) {
                    const deltaTime = Math.max(now - previous.time, 1);
                    const deltaX = clampedX - previous.x;
                    const deltaY = clampedY - previous.y;
                    const instantVx = deltaX / deltaTime;
                    const instantVy = deltaY / deltaTime;
                    const distance = Math.min(
                        (previous.distance || 0) + Math.hypot(deltaX, deltaY),
                        DRAG_MOMENTUM_MAX_TRAVEL
                    );
                    dragVelocityRef.current[id] = {
                        x: clampedX,
                        y: clampedY,
                        time: now,
                        vx:
                            previous.vx * (1 - DRAG_VELOCITY_SMOOTHING) +
                            instantVx * DRAG_VELOCITY_SMOOTHING,
                        vy:
                            previous.vy * (1 - DRAG_VELOCITY_SMOOTHING) +
                            instantVy * DRAG_VELOCITY_SMOOTHING,
                        distance,
                    };
                } else {
                    dragVelocityRef.current[id] = {
                        x: clampedX,
                        y: clampedY,
                        vx: 0,
                        vy: 0,
                        time: now,
                        distance: 0,
                    };
                }
            };

            const stopDrag = () => {
                if (!dragRef.current) return;
                flushDragMutation();
                const velocitySample = dragVelocityRef.current[id];
                delete dragVelocityRef.current[id];
                setDraggingWindow(null);
                const target = dragRef.current.target;
                const activePreview = snapPreviewRef.current;
                let snapApplied = false;
                if (activePreview && activePreview.id === id && typeof window !== 'undefined') {
                    const { target: snapTarget } = activePreview;
                    setWindows((wins) =>
                        wins.map((win) =>
                            win.id === id
                                ? applySnapLayout(
                                      win,
                                      snapTarget,
                                      window.innerWidth,
                                      window.innerHeight,
                                      layoutOptions
                                  )
                                : win
                        )
                    );
                    snapApplied = true;
                }
                if (!snapApplied) {
                    applyDragMomentum(id, velocitySample);
                }
                setSnapPreview((prev) => (prev && prev.id === id ? null : prev));
                clearDragPointerOverlay();
                try {
                    target.releasePointerCapture(dragRef.current.pointerId);
                } catch {
                    // ignore
                }
                target.removeEventListener('pointermove', handleMove);
                target.removeEventListener('pointerup', stopDrag);
                target.removeEventListener('pointercancel', stopDrag);
                dragRef.current = null;
            };

            event.currentTarget.addEventListener('pointermove', handleMove);
            event.currentTarget.addEventListener('pointerup', stopDrag);
            event.currentTarget.addEventListener('pointercancel', stopDrag);
        },
        [
            bringToFront,
            clampPosition,
            flushDragMutation,
            queueDragMutation,
            applyDragMomentum,
            queueDragPointerPosition,
            clearDragPointerOverlay,
            stopMomentumAnimation,
            layoutOptions,
        ]
    );

    const handleResizeStart = useCallback(
        (event, id, edge) => {
            if (typeof window === 'undefined') return;
            event.preventDefault();
            event.stopPropagation();

            bringToFront(id);

            const windowData = windowsRef.current.find((win) => win.id === id);
            if (!windowData) return;

            const pointerId = event.pointerId;
            const target = event.currentTarget;

            resizeRef.current = {
                id,
                edge,
                pointerId,
                target,
                startX: event.clientX,
                startY: event.clientY,
                initial: {
                    x: windowData.x,
                    y: windowData.y,
                    width: windowData.width,
                    height: windowData.height,
                },
            };

            if (typeof target.setPointerCapture === 'function') {
                try {
                    target.setPointerCapture(pointerId);
                } catch {
                    // ignore pointer capture issues
                }
            }

            const handleMove = (moveEvent) => {
                if (!resizeRef.current || resizeRef.current.id !== id) return;
                const deltaX = moveEvent.clientX - resizeRef.current.startX;
                const deltaY = moveEvent.clientY - resizeRef.current.startY;
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const next = resizeWindowByEdge(
                    resizeRef.current.initial,
                    resizeRef.current.edge,
                    deltaX,
                    deltaY,
                    viewportWidth,
                    viewportHeight
                );
                queueResizeMutation({
                    id,
                    metrics: next,
                });
            };

            const stopResize = () => {
                if (!resizeRef.current) return;
                flushResizeMutation();
                if (typeof target.releasePointerCapture === 'function') {
                    try {
                        target.releasePointerCapture(pointerId);
                    } catch {
                        // ignore release issues
                    }
                }
                target.removeEventListener('pointermove', handleMove);
                target.removeEventListener('pointerup', stopResize);
                target.removeEventListener('pointercancel', stopResize);
                resizeRef.current = null;
            };

            target.addEventListener('pointermove', handleMove);
            target.addEventListener('pointerup', stopResize);
            target.addEventListener('pointercancel', stopResize);
        },
        [bringToFront, flushResizeMutation, queueResizeMutation]
    );

    const navigateToWindowRoute = useCallback(
        (win) => {
            if (!win) return;
            if (win.routeLocation) {
                navigate(
                    {
                        pathname: win.routeLocation.pathname || '/',
                        search: win.routeLocation.search || '',
                        hash: win.routeLocation.hash || '',
                    },
                    { state: win.routeLocation.state ?? null }
                );
                return;
            }
            if (win.appRoutePath) {
                navigate(win.appRoutePath);
                return;
            }
            navigate('/');
        },
        [navigate]
    );
    navigateToWindowRouteRef.current = navigateToWindowRoute;

    const handleFocus = useCallback(
        (id) => {
            bringToFront(id);
        },
        [bringToFront]
    );


    const handleClose = useCallback((id, options = {}) => {
        const snapshot = windowsRef.current;
        const primary = snapshot.find((win) => win.id === id);
        if (!primary || (primary.isMain && !primary.isAppWindow) || primary.allowClose === false) {
            return;
        }

        const windowsToClose = options.altKey
            ? snapshot.filter((win) => {
                  if (win.id === id) {
                      return true;
                  }
                  if (win.isMain || win.isAppWindow) {
                      return false;
                  }
                  if (win.allowClose === false) {
                      return false;
                  }
                  return true;
              })
            : [primary];

        if (windowsToClose.length === 0) {
            return;
        }

        const idsToClose = new Set(windowsToClose.map((win) => win.id));
        const announcement =
            windowsToClose.length > 1
                ? 'Utility windows closed'
                : `${primary.title || typeToTitle(primary.type)} closed`;

        setClosedTypes((prev) => {
            const unique = new Set(prev);
            windowsToClose.forEach((win) => {
                if (!win.isMain && !win.isAppWindow) {
                    unique.add(win.type);
                }
            });
            return Array.from(unique);
        });

        const closingAppIds = windowsToClose.filter((win) => win.isAppWindow).map((win) => win.id);
        const closingActiveApp = closingAppIds.includes(activeAppIdRef.current);

        setWindows((wins) => wins.filter((win) => !idsToClose.has(win.id)));

        if (closingAppIds.length > 0) {
            setTimeout(() => {
                if (!closingActiveApp) return;
                const remainingApps = windowsRef.current.filter(
                    (win) => win.isAppWindow && !closingAppIds.includes(win.id)
                );
                if (remainingApps.length > 0) {
                    const fallback = remainingApps
                        .slice()
                        .sort((a, b) => Number(a.minimized) - Number(b.minimized) || b.z - a.z)[0];
                    if (fallback) {
                        setActiveAppId(fallback.id);
                        activeAppIdRef.current = fallback.id;
                        if (fallback.minimized) {
                            setWindows((wins) =>
                                wins.map((win) =>
                                    win.id === fallback.id
                                        ? { ...win, minimized: false, minimizedByUser: false }
                                        : win
                                )
                            );
                        }
                        requestAnimationFrame(() =>
                            bringToFrontRef.current?.(fallback.id)
                        );
                    }
                } else {
                    setActiveAppId(null);
                    activeAppIdRef.current = null;
                    navigate('/');
                }
            }, 0);
        }

        announce(announcement);
    }, [announce, navigate]);

    const handleMinimize = useCallback((id, options = {}) => {
        const snapshot = windowsRef.current;
        const target = snapshot.find((win) => win.id === id);
        if (!target || target.allowMinimize === false) {
            return;
        }

        let announcement = null;

        if (options.altKey) {
            setFocusMode(false);
            setWindows((wins) =>
                wins.map((win) => {
                    if (win.isMain) {
                        return { ...win, minimized: false, minimizedByUser: false };
                    }
                    if (win.id === id) {
                        return { ...win, minimized: true, minimizedByUser: true };
                    }
                    if (win.allowMinimize === false) {
                        return win;
                    }
                    return { ...win, minimized: true, minimizedByUser: true };
                })
            );
            announcement = 'All secondary windows minimized';
        } else {
            setWindows((wins) =>
                wins.map((win) =>
                    win.id === id
                        ? { ...win, minimized: true, minimizedByUser: true }
                        : win
                )
            );
            announcement = `${target.title || typeToTitle(target.type)} minimized`;
        }

        announce(announcement);
    }, [announce]);

    const duplicateActiveAppWindow = useCallback(() => {
        if (SINGLE_WINDOW_MODE || typeof window === 'undefined') return false;
        const snapshot = windowsRef.current;
        if (snapshot.length >= MAX_OPEN_WINDOWS) {
            announce(WINDOW_LIMIT_MESSAGE);
            return false;
        }
        const activeId = activeAppIdRef.current;
        const source =
            snapshot.find((win) => win.id === activeId && win.isAppWindow) ||
            snapshot.find((win) => win.isAppWindow && !win.minimized) ||
            snapshot.find((win) => win.isAppWindow) ||
            null;
        if (!source) {
            return false;
        }

        const routeKey = source.appRouteKey || 'default';
        const baseTitle = stripWindowInstanceTitle(
            source.title,
            appLabelForKey(routeKey)
        );
        const meta = {
            routeKey,
            iconKey: source.appIconKey || routeKey,
            accent: source.appAccent || appAccentForKey(routeKey),
            fullPath: source.appRoutePath || '/',
            title: baseTitle,
        };

        const instanceId = createInstanceId();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const siblings = snapshot.filter((win) => win.isAppWindow && win.appRouteKey === routeKey);
        const offsetIndex = siblings.length;
        const sourceBounds = source.snapshot
            ? {
                  x: source.snapshot.x,
                  y: source.snapshot.y,
                  width: source.snapshot.width,
                  height: source.snapshot.height,
              }
            : source && !source.isZoomed
                ? {
                      x: source.x,
                      y: source.y,
                      width: source.width,
                      height: source.height,
                  }
                : null;
        const baseWidth = clampNumber(
            sourceBounds?.width ?? Math.min(980, viewportWidth - 80),
            360,
            Math.max(viewportWidth - 80, 360)
        );
        const baseHeight = clampNumber(
            sourceBounds?.height ?? Math.min(700, viewportHeight - 150),
            260,
            Math.max(viewportHeight - 150, 260)
        );
        const baseX = (sourceBounds?.x ?? Math.max((viewportWidth - baseWidth) / 2, 36)) + 32;
        const baseY = (sourceBounds?.y ?? Math.max((viewportHeight - baseHeight) / 2 + 20, MAC_HEADER_HEIGHT + 12)) + 24;
        const id = buildAppWindowId(routeKey, instanceId);
        const iconComponent = iconForAppKey(meta.iconKey);
        const routeLocation =
            snapshotLocation(source.routeLocation) || parseStoredLocation(null, meta.fullPath);
        const windowLabel = buildWindowInstanceTitle(meta.title, offsetIndex + 1);
        const nextZ = zRef.current + 1;
        zRef.current = nextZ;

        const entry = clampWindowToViewport(
            {
                id,
                type: id,
                title: windowLabel,
                instanceId,
                width: baseWidth,
                height: baseHeight,
                x: baseX,
                y: baseY,
                z: nextZ,
                minimized: false,
                minimizedByUser: false,
                isZoomed: false,
                snapshot: {
                    x: baseX,
                    y: baseY,
                    width: baseWidth,
                    height: baseHeight,
                },
                allowClose: true,
                allowMinimize: true,
                allowZoom: true,
                isMain: true,
                isAppWindow: true,
                appRoutePath: meta.fullPath,
                appRouteKey: meta.routeKey,
                appIconKey: meta.iconKey,
                appAccent: meta.accent,
                routeLocation,
                iconComponent,
            },
            viewportWidth,
            viewportHeight,
            layoutOptions
        );

        setWindows((wins) => [
            ...wins.map((win) =>
                win.isAppWindow && win.appRouteKey === meta.routeKey ? { ...win, isMain: false } : win
            ),
            entry,
        ]);
        setActiveAppId(id);
        activeAppIdRef.current = id;
        if (routeLocation) {
            navigate(
                {
                    pathname: routeLocation.pathname || meta.fullPath,
                    search: routeLocation.search || '',
                    hash: routeLocation.hash || '',
                },
                { state: routeLocation.state ?? null }
            );
        } else {
            navigate(meta.fullPath);
        }
        announce(`${windowLabel} opened`);
        return true;
    }, [announce, layoutOptions, navigate]);


    const reopenWindow = useCallback(
        (type) => {
            if (typeof window === 'undefined') return;
            const snapshot = windowsRef.current;
            if (snapshot.some((win) => win.type === type)) {
                return;
            }
            if (snapshot.length >= MAX_OPEN_WINDOWS) {
                announce(WINDOW_LIMIT_MESSAGE);
                return;
            }
            setClosedTypes((prev) => prev.filter((item) => item !== type));
            setWindows((wins) => {
                if (wins.some((win) => win.type === type)) return wins;

                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;
                const nextZ = zRef.current + 1;
                zRef.current = nextZ;

                const base = {
                    type,
                    z: nextZ,
                    minimized: focusMode,
                    minimizedByUser: false,
                    isZoomed: false,
                    snapshot: null,
                    allowClose: true,
                    allowMinimize: true,
                    allowZoom: true,
                    isMain: false,
                };

                if (type === WINDOW_TYPES.SCRATCHPAD) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                id: WINDOW_TYPES.SCRATCHPAD,
                                title: 'Scratchpad',
                                width: Math.min(380, viewportWidth - 120),
                                height: Math.min(320, viewportHeight - 180),
                                x: Math.max(36, viewportWidth / 2 - 420),
                                y: Math.max(MAC_STAGE_MARGIN + 32, viewportHeight / 2 - 160),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.NOW_PLAYING) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                allowZoom: false,
                                id: WINDOW_TYPES.NOW_PLAYING,
                                title: 'Now Playing',
                                width: Math.min(320, viewportWidth - 120),
                                height: Math.min(280, viewportHeight - 200),
                                x: Math.min(viewportWidth - 360, viewportWidth / 2 + 260),
                                y: Math.max(MAC_STAGE_MARGIN + 24, viewportHeight / 2 - 200),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.STATUS) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                id: WINDOW_TYPES.STATUS,
                                title: 'System Status',
                                width: Math.min(420, viewportWidth - 140),
                                height: Math.min(360, viewportHeight - 200),
                                x: Math.max(40, viewportWidth / 2 - 520),
                                y: MAC_STAGE_MARGIN + 24,
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                if (type === WINDOW_TYPES.QUEUE) {
                    return [
                        ...wins,
                        clampWindowToViewport(
                            {
                                ...base,
                                allowZoom: false,
                                id: WINDOW_TYPES.QUEUE,
                                title: 'Action Queue',
                                width: Math.min(320, viewportWidth - 120),
                                height: Math.min(300, viewportHeight - 180),
                                x: Math.min(viewportWidth - 360, viewportWidth / 2 + 260),
                                y: Math.min(viewportHeight - 360, MAC_STAGE_MARGIN + 320),
                            },
                            viewportWidth,
                            viewportHeight
                        ),
                    ];
                }
                return wins;
            });
        },
        [announce, focusMode]
    );
    const restoreWindow = useCallback(
        (identifier) => {
            setFocusMode(false);
            let restoredWindow = null;
            let didRestore = false;

            setWindows((wins) => {
                let changed = false;
                const next = wins.map((win) => {
                    if (win.id !== identifier && win.type !== identifier) {
                        return win;
                    }
                    didRestore = true;
                    if (!win.minimized && !win.minimizedByUser) {
                        restoredWindow = win;
                        return win;
                    }
                    const nextWin = {
                        ...win,
                        minimized: false,
                        minimizedByUser: false,
                    };
                    restoredWindow = nextWin;
                    changed = true;
                    return nextWin;
                });
                return changed ? next : wins;
            });

            const match =
                restoredWindow ??
                windowsRef.current.find((win) => win.id === identifier || win.type === identifier);

            if (!match) {
                return false;
            }

            bringToFront(match.id);

            if (match.isAppWindow) {
                if (typeof window !== 'undefined') {
                    window.dispatchEvent(
                        new CustomEvent(APP_WINDOW_ACTIVATED_EVENT, {
                            detail: {
                                id: match.id,
                                routeKey: match.appRouteKey ?? null,
                                routePath: match.appRoutePath ?? null,
                            },
                        })
                    );
                }
                queryClient.invalidateQueries({
                    predicate: (query) => Boolean(query.meta?.refreshOnActivate),
                });
            }
            return didRestore || Boolean(match);
        },
        [bringToFront]
    );

    const focusNextWindow = useCallback(
        (direction = 1) => {
            const orderedWindows = windowsRef.current.slice().sort((a, b) => a.z - b.z);
            if (orderedWindows.length <= 1) {
                return;
            }

            const current = focusedWindowRef.current;
            const currentIndex = current
                ? orderedWindows.findIndex((win) => win.id === current.id)
                : orderedWindows.length - 1;

            const nextIndex = (currentIndex + direction + orderedWindows.length) % orderedWindows.length;
            const nextWindow = orderedWindows[nextIndex];
            if (nextWindow) {
                if (nextWindow.minimized) {
                    restoreWindow(nextWindow.id);
                } else {
                    bringToFront(nextWindow.id);
                }
            }
        },
        [bringToFront, restoreWindow]
    );

    const handleMissionControlSelect = useCallback(
        (win) => {
            if (win.minimized) {
                restoreWindow(win.id);
            } else {
                bringToFront(win.id);
            }
            setMissionControlOpen(false);
        },
        [bringToFront, restoreWindow]
    );

    const toggleFocusMode = useCallback(() => {
        const enteringFocus = !focusMode;
        setWindows((wins) => {
            if (!focusMode) {
                focusMemoryRef.current = wins
                    .filter((win) => !win.isMain)
                    .map((win) => ({
                        id: win.id,
                        minimized: win.minimized,
                        minimizedByUser: win.minimizedByUser,
                    }));
                return wins.map((win) =>
                    win.isMain
                        ? { ...win, minimized: false, minimizedByUser: false }
                        : { ...win, minimized: true, minimizedByUser: false }
                );
            }
            const memory = focusMemoryRef.current ?? [];
            focusMemoryRef.current = null;
            return wins.map((win) => {
                if (win.isMain) {
                    return { ...win, minimized: false, minimizedByUser: false };
                }
                const record = memory.find((entry) => entry.id === win.id);
                return {
                    ...win,
                    minimized: record ? record.minimized : false,
                    minimizedByUser: record ? Boolean(record.minimizedByUser) : false,
                };
            });
        });
        setFocusMode((value) => !value);
        announce(
            enteringFocus
                ? 'Focus mode on. Only the main window remains.'
                : 'Focus mode off. Restoring window layout.'
        );
    }, [announce, focusMode]);

    const openMissionControl = useCallback(() => {
        if (SINGLE_WINDOW_MODE) return;
        setMissionControlFilter('all');
        setMissionControlOpen(true);
    }, []);

    const handleZoom = useCallback(
        (id, options = {}) => {
            if (options.altKey) {
                toggleFocusMode();
                return;
            }

            if (typeof window === 'undefined') return;

            const currentWindow = windowsRef.current.find((win) => win.id === id);
            if (!currentWindow) return;

            const enteringFullScreen = !currentWindow.isZoomed;

            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;

            setWindows((wins) =>
                wins.map((win) => {
                    if (win.id !== id) {
                        return win;
                    }

                    if (!win.isZoomed) {
                        const snapshot = {
                            x: win.x,
                            y: win.y,
                            width: win.width,
                            height: win.height,
                        };
                        return expandWindowToViewport(
                            {
                                ...win,
                                snapshot,
                            },
                            viewportWidth,
                            viewportHeight,
                            layoutOptions
                        );
                    }

                    if (win.snapshot) {
                        return clampWindowToViewport(
                            {
                                ...win,
                                ...win.snapshot,
                                isZoomed: false,
                                snapshot: null,
                            },
                            viewportWidth,
                            viewportHeight,
                            layoutOptions
                        );
                    }

                    return clampWindowToViewport(
                        {
                            ...win,
                            isZoomed: false,
                            snapshot: null,
                        },
                        viewportWidth,
                        viewportHeight,
                        layoutOptions
                    );
                })
            );

            const windowTitle = currentWindow.title || typeToTitle(currentWindow.type);
            announce(
                enteringFullScreen
                    ? `${windowTitle} expanded to full view`
                    : `${windowTitle} restored`
            );

            if (enteringFullScreen) {
                bringToFront(id);
                setFocusMode(false);
            }
        },
        [announce, bringToFront, toggleFocusMode, layoutOptions]
    );

    const triggerHotCorner = useCallback(
        (cornerKey) => {
            if (!hotCorners.enabled) {
                return;
            }
            const action = hotCorners.corners?.[cornerKey];
            if (!isValidCornerAction(action)) {
                return;
            }

            let performed = false;
            let announcement = null;

            switch (action) {
                case 'mission-control':
                    openMissionControl();
                    announcement = HOT_CORNER_ACTION_LABELS[action];
                    performed = true;
                    break;
                case 'quick-look': {
                    const ranked = windowsRef.current
                        .filter((win) => !win.minimized)
                        .sort((a, b) => b.z - a.z);
                    const fallback = windowsRef.current
                        .slice()
                        .sort((a, b) => b.z - a.z)[0] ?? null;
                    const target = ranked[0] ?? fallback;
                    if (!target) {
                        break;
                    }
                    setQuickLookWindowId((prev) => (prev === target.id ? null : target.id));
                    announcement = HOT_CORNER_ACTION_LABELS[action];
                    performed = true;
                    break;
                }
                case 'focus-mode':
                    toggleFocusMode();
                    performed = true;
                    break;
                default:
                    break;
            }

            if (performed) {
                lastHotCornerRef.current = cornerKey;
                setActiveHotCorner({ action, corner: cornerKey });
                if (announcement) {
                    announce(`${announcement} via hot corner`);
                }
            }
        },
        [announce, hotCorners, openMissionControl, toggleFocusMode]
    );

    const handleHotCornerToggle = useCallback(() => {
        setHotCorners((prev) => {
            const nextEnabled = !prev.enabled;
            const sanitizedCorners = sanitizeHotCornerMapping(prev.corners);
            announce(nextEnabled ? 'Hot corners enabled' : 'Hot corners disabled');
            return {
                enabled: nextEnabled,
                corners: sanitizedCorners,
            };
        });
    }, [announce]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;
        const timers = hotCornerTimersRef.current;
        const clearTimers = () => {
            Object.keys(timers).forEach((key) => {
                if (timers[key]) {
                    window.clearTimeout(timers[key]);
                    timers[key] = null;
                }
            });
        };

        if (!hotCorners.enabled || isCompact) {
            clearTimers();
            lastHotCornerRef.current = null;
            return undefined;
        }

        const handleMouseMove = (event) => {
            const { clientX, clientY } = event;
            const { innerWidth, innerHeight } = window;
            let corner = null;

            if (clientX <= HOT_CORNER_THRESHOLD_PX && clientY <= HOT_CORNER_THRESHOLD_PX) {
                corner = 'topLeft';
            } else if (
                clientX >= innerWidth - HOT_CORNER_THRESHOLD_PX &&
                clientY <= HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'topRight';
            } else if (
                clientX <= HOT_CORNER_THRESHOLD_PX &&
                clientY >= innerHeight - HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'bottomLeft';
            } else if (
                clientX >= innerWidth - HOT_CORNER_THRESHOLD_PX &&
                clientY >= innerHeight - HOT_CORNER_THRESHOLD_PX
            ) {
                corner = 'bottomRight';
            }

            if (!corner) {
                clearTimers();
                lastHotCornerRef.current = null;
                return;
            }

            if (lastHotCornerRef.current === corner || timers[corner]) {
                return;
            }

            timers[corner] = window.setTimeout(() => {
                timers[corner] = null;
                triggerHotCorner(corner);
            }, HOT_CORNER_DELAY_MS);
        };

        const handleMouseLeave = () => {
            clearTimers();
            lastHotCornerRef.current = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseleave', handleMouseLeave);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseleave', handleMouseLeave);
            clearTimers();
        };
    }, [hotCorners.enabled, isCompact, triggerHotCorner]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            const metaOrCtrl = event.metaKey || event.ctrlKey;
            const activeElement = document.activeElement;
            const isEditable =
                activeElement &&
                (activeElement.isContentEditable ||
                    ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName));

            if (metaOrCtrl && event.key.toLowerCase() === 'k' && !event.shiftKey) {
                if (isEditable) {
                    return;
                }
                event.preventDefault();
                if (commandPaletteOpen) {
                    closeCommandPalette();
                } else {
                    openCommandPalette();
                }
                return;
            }

            if (commandPaletteOpen) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeCommandPalette();
                }
                return;
            }

            if (metaOrCtrl && event.shiftKey && event.key.toLowerCase() === 'n') {
                event.preventDefault();
                duplicateActiveAppWindow();
                return;
            }

            if (metaOrCtrl && event.key === 'Tab') {
                event.preventDefault();
                const direction = event.shiftKey ? -1 : 1;
                if (windowSwitcherRef.current.open) {
                    cycleWindowSwitcher(direction);
                } else {
                    openWindowSwitcher(direction);
                }
                return;
            }

            if (windowSwitcherRef.current.open) {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    closeWindowSwitcher(false);
                }
                return;
            }

            if (metaOrCtrl && event.key === 'ArrowUp') {
                event.preventDefault();
                openMissionControl();
                return;
            }

            if (metaOrCtrl && event.key === 'ArrowDown') {
                event.preventDefault();
                setMissionControlOpen(false);
                return;
            }

            if (metaOrCtrl && (event.key === '`' || event.key === '~')) {
                event.preventDefault();
                focusNextWindow(event.shiftKey ? -1 : 1);
                return;
            }

            if (metaOrCtrl && event.ctrlKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target) {
                    handleZoom(target.id);
                }
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'f') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target) {
                    handleZoom(target.id, { altKey: true });
                } else {
                    toggleFocusMode();
                }
                return;
            }

            if (metaOrCtrl && event.altKey && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
                event.preventDefault();
                const preset =
                    event.shiftKey
                        ? event.key === 'ArrowUp'
                            ? LAYOUT_PRESETS.full.id
                            : event.key === 'ArrowDown'
                                ? LAYOUT_PRESETS.center.id
                                : event.key === 'ArrowLeft'
                                    ? LAYOUT_PRESETS.tl.id
                                    : LAYOUT_PRESETS.tr.id
                        : event.key === 'ArrowLeft'
                            ? LAYOUT_PRESETS.left.id
                            : event.key === 'ArrowRight'
                                ? LAYOUT_PRESETS.right.id
                                : event.key === 'ArrowUp'
                                    ? LAYOUT_PRESETS.top.id
                                    : LAYOUT_PRESETS.bottom.id;
                applyLayoutPresetToTopWindow(preset);
                return;
            }

            if (metaOrCtrl && event.altKey) {
                const layoutHotkeyMap = {
                    1: LAYOUT_PRESETS.tl.id,
                    2: LAYOUT_PRESETS.tr.id,
                    3: LAYOUT_PRESETS.bl.id,
                    4: LAYOUT_PRESETS.br.id,
                    5: LAYOUT_PRESETS.center.id,
                    0: LAYOUT_PRESETS.full.id,
                };
                const mappedPreset = layoutHotkeyMap[event.key];
                if (mappedPreset) {
                    event.preventDefault();
                    applyLayoutPresetToTopWindow(mappedPreset);
                    return;
                }
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'm') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowMinimize) {
                    handleMinimize(target.id, { altKey: true });
                }
                return;
            }

            if (metaOrCtrl && event.key.toLowerCase() === 'm') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowMinimize) {
                    handleMinimize(target.id);
                }
                return;
            }

            if (metaOrCtrl && event.altKey && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowClose) {
                    handleClose(target.id, { altKey: true });
                }
                return;
            }

            if (metaOrCtrl && event.key.toLowerCase() === 'w') {
                event.preventDefault();
                const target = resolveTopWindow();
                if (target && target.allowClose && !target.isMain) {
                    handleClose(target.id);
                }
                return;
            }

            if (!metaOrCtrl && event.key === ' ' && !event.repeat && !isEditable) {
                event.preventDefault();
                toggleQuickLook();
                return;
            }

            if (event.key === 'Escape') {
                setMissionControlOpen(false);
                setQuickLookWindowId(null);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        closeCommandPalette,
        commandPaletteOpen,
        focusNextWindow,
        handleClose,
        handleMinimize,
        handleZoom,
        openCommandPalette,
        toggleFocusMode,
        toggleQuickLook,
        openWindowSwitcher,
        cycleWindowSwitcher,
        closeWindowSwitcher,
        duplicateActiveAppWindow,
        applyLayoutPresetToTopWindow,
        openMissionControl,
        resolveTopWindow,
    ]);

    useEffect(() => {
        if (typeof window === 'undefined') return undefined;

        const handleStorage = (event) => {
            if (event.storageArea !== window.localStorage) return;

            if (event.key === 'scientistshield.desktop.scratchpad') {
                setScratchpadText((prev) => {
                    const nextValue = event.newValue ?? '';
                    return prev === nextValue ? prev : nextValue;
                });
                return;
            }

            if (event.key === WINDOW_STORAGE_KEY) {
                if (!event.newValue) return;
                let payload;
                try {
                    payload = JSON.parse(event.newValue);
                } catch {
                    return;
                }
                if (!payload || payload.version !== WINDOW_STORAGE_VERSION) {
                    return;
                }

                const focusFromPayload = Boolean(payload.focusMode);
                const viewportWidth = window.innerWidth;
                const viewportHeight = window.innerHeight;

                const sanitizedEntries = Array.isArray(payload.windows)
                    ? payload.windows
                          .map((entry) => sanitizeWindowEntry(entry, viewportWidth, viewportHeight, layoutOptions))
                          .filter(Boolean)
                    : [];

                processExternalWindowState(payload, 'storage');
                return;
            }
        };

        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [windowTitle, processExternalWindowState]);

    useEffect(() => {
        if (typeof BroadcastChannel === 'undefined') return undefined;
        const channel = new BroadcastChannel(WINDOW_CHANNEL_NAME);
        windowChannelRef.current = channel;

        const handleMessage = (event) => {
            if (!event || !event.data || event.data.type !== 'windows-sync') {
                return;
            }
            processExternalWindowState(event.data.payload, 'channel');
        };

        channel.addEventListener('message', handleMessage);
        return () => {
            channel.removeEventListener('message', handleMessage);
            channel.close();
            if (windowChannelRef.current === channel) {
                windowChannelRef.current = null;
            }
        };
    }, [processExternalWindowState]);

    useEffect(() => {
        if (!windowChannelRef.current) {
            return;
        }
        publishWindowSnapshot('local');
    }, [windows, closedTypes, focusMode, activePath, publishWindowSnapshot]);

    const renderMainContentMemo = useCallback(() => renderMainContent(), [renderMainContent]);

    const renderWindowContent = useCallback(
        (win, options = {}) => {
            if (win.isAppWindow) {
                const Icon = iconForAppKey(win.appIconKey);
                const routeLabel = win.appRouteKey
                    ? win.appRouteKey.replace(/[-_]/g, ' ')
                    : 'Workspace';
                const statusLabel = win.minimized ? 'Minimized' : 'Background';
                const forceLive = options.forceLive === true;
                const shouldRenderLiveRoute = forceLive || (win.id === activeAppId && !win.minimized);

                if (!shouldRenderLiveRoute) {
                    return (
                        <div className="flex h-full flex-col justify-center gap-3 rounded-[26px] border border-dashed border-white/60 bg-white/70 p-6 text-center text-sm text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                            <div className="mx-auto inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900/5 text-slate-500 dark:bg-white/10 dark:text-slate-200">
                                {Icon ? <Icon className="h-5 w-5" /> : <HiOutlineSparkles className="h-5 w-5" />}
                            </div>
                            <p className="font-semibold text-slate-700 dark:text-slate-100">{routeLabel}</p>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                Paused · Activate window to load
                            </p>
                        </div>
                    );
                }

                if (win.id === activeAppId && win.appRoutePath) {
                    return renderMainContentMemo();
                }

                if (win.routeLocation) {
                    const locationKey =
                        (win.routeLocation.key &&
                            `${win.id}-${win.routeLocation.key}`) ||
                            `${win.id}-${win.routeLocation.pathname || ''}${win.routeLocation.search || ''}${win.routeLocation.hash || ''}`;
                    return (
                        <div className="flex h-full flex-col overflow-hidden rounded-[26px] border border-white/40 bg-white/80 shadow-inner dark:border-white/10 dark:bg-slate-900/60">
                            <div className="flex-1 overflow-auto">
                                <WindowRouteRenderer
                                    key={locationKey}
                                    location={win.routeLocation}
                                />
                            </div>
                            <div className="flex items-center justify-between gap-3 border-t border-white/40 bg-white/70 px-4 py-2 text-[0.58rem] uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-400">
                                <span className="inline-flex items-center gap-2">
                                    <span
                                        className="flex h-6 w-6 items-center justify-center rounded-lg text-white shadow-inner shadow-brand-500/25"
                                        style={{ backgroundImage: win.appAccent || APP_ACCENTS.default }}
                                    >
                                        {Icon ? (
                                            <Icon className="h-4 w-4" />
                                        ) : (
                                            <HiOutlineSparkles className="h-4 w-4" />
                                        )}
                                    </span>
                                    <span className="font-semibold uppercase tracking-[0.32em] text-slate-500 dark:text-slate-300">
                                        {routeLabel}
                                    </span>
                                </span>
                                <span className="truncate text-[0.55rem] uppercase tracking-[0.28em] text-slate-400 dark:text-slate-500">
                                    {statusLabel}
                                </span>
                            </div>
                        </div>
                    );
                }
                return (
                    <div className="flex h-full flex-col justify-between rounded-[26px] bg-gradient-to-br from-white/85 via-white/75 to-white/60 p-6 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/45">
                        <div>
                            <div className="flex items-start gap-4">
                                <div
                                    className="flex h-14 w-14 items-center justify-center rounded-2xl text-white shadow-xl shadow-brand-500/30"
                                    style={{ backgroundImage: win.appAccent || APP_ACCENTS.default }}
                                >
                                    {Icon ? (
                                        <Icon className="h-7 w-7" />
                                    ) : (
                                        <HiOutlineSparkles className="h-7 w-7" />
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                        {routeLabel}
                                    </p>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
                                        {win.title}
                                    </h3>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        {win.minimized
                                            ? 'Currently minimized. Open it to pick up where you left off.'
                                            : 'Another workspace is active. Activate this window to continue here.'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 rounded-2xl border border-white/50 bg-white/60 p-4 text-sm text-slate-500 shadow-inner dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300">
                                Manage open apps from Mission Control. Click below to focus this workspace instantly.
                            </div>
                        </div>
                        <div className="flex flex-wrap justify-end gap-3 pt-4">
                            <button
                                type="button"
                                onClick={() => restoreWindow(win.id)}
                                className="inline-flex items-center gap-2 rounded-full border border-brand-300 bg-brand-500/10 px-4 py-2 text-sm font-semibold text-brand-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:bg-brand-500/20 dark:border-brand-400/40 dark:text-brand-200 dark:hover:border-brand-300/60"
                            >
                                Go to Workspace
                            </button>
                        </div>
                    </div>
                );
            }

            if (win.id === MAIN_WINDOW_ID && appWindowSummaries.length > 0) {
                return (
                    <div className="flex h-full flex-col justify-between rounded-[26px] bg-gradient-to-br from-white/85 via-white/75 to-white/60 p-6 dark:from-slate-900/70 dark:via-slate-900/60 dark:to-slate-900/45">
                        <div>
                                <div className="flex items-baseline justify-between gap-3">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                            Mission Control
                                        </p>
                                        <h2 className="text-2xl font-semibold text-slate-800 dark:text-slate-100">
                                            Desktop Overview
                                        </h2>
                                    </div>
                                    <span className="inline-flex items-center gap-2 rounded-full border border-white/50 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.32em] text-slate-500 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300">
                                        {appWindowSummaries.length} windows
                                    </span>
                                </div>
                            <div className="mt-6 grid gap-4 sm:grid-cols-2">
                                {appWindowSummaries.map((app) => {
                                    const Icon = iconForAppKey(app.iconKey);
                                    return (
                                        <button
                                            type="button"
                                            key={app.id}
                                            onClick={() => restoreWindow(app.id)}
                                            className="group flex flex-col items-start rounded-2xl border border-white/40 bg-white/70 p-4 text-left shadow-sm transition hover:-translate-y-1 hover:border-brand-300/60 hover:shadow-xl dark:border-white/10 dark:bg-slate-900/60"
                                        >
                                            <span
                                                className="flex h-12 w-12 items-center justify-center rounded-xl text-white shadow-lg shadow-brand-500/20"
                                                style={{ backgroundImage: app.accent || APP_ACCENTS.default }}
                                            >
                                                {Icon ? (
                                                    <Icon className="h-6 w-6" />
                                                ) : (
                                                    <HiOutlineSparkles className="h-6 w-6" />
                                                )}
                                            </span>
                                            <span className="mt-4 text-sm font-semibold text-slate-700 dark:text-slate-100">
                                                {app.title}
                                            </span>
                                            <span className="text-[0.58rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                                {app.isActive ? 'Active' : app.minimized ? 'Minimized' : 'On Deck'}
                                            </span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                            <span>Switcher · Launch / switch apps</span>
                            <span>Mission Control · Organize utilities</span>
                        </div>
                    </div>
                );
            }

            switch (win.type) {
                case WINDOW_TYPES.MAIN:
                    return renderMainContentMemo();
                case WINDOW_TYPES.SCRATCHPAD:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">Quick ideas</h3>
                                <span className="text-xs uppercase tracking-[0.4em] text-slate-400">Draft</span>
                            </div>
                            <textarea
                                value={scratchpadText}
                                onChange={(event) => setScratchpadText(event.target.value)}
                                placeholder="Jot down thoughts, todos, or snippets..."
                                className="h-full min-h-[160px] resize-none rounded-xl border border-slate-200 bg-white/70 p-4 text-sm text-slate-700 shadow-inner focus:border-brand-300 focus:outline-none focus:ring-2 focus:ring-brand-300/50 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100 dark:focus:border-brand-500 dark:focus:ring-brand-500/40"
                            />
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                Auto-saved locally while you type.
                            </p>
                        </div>
                    );
                case WINDOW_TYPES.NOW_PLAYING: {
                    const { elapsed, total } = currentTrackTime;
                    const progress = Math.min(1, Math.max(0, elapsed / total));
                    return (
                        <div className="flex h-full flex-col gap-5">
                            <div className="flex items-center gap-3">
                                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-brand-500/80 to-purple-500/80 shadow-[0_20px_45px_-25px_rgba(10,132,255,0.45)]" />
                                <div>
                                    <p className="text-sm uppercase tracking-[0.4em] text-slate-400">Now Playing</p>
                                    <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Ambient Beats · Focus Mode</h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">Scientist Shield Radio</p>
                                </div>
                            </div>
                            <div>
                                <div className="relative h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                                    <div
                                        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 via-brand-500 to-accent-teal"
                                        style={{ width: `${progress * 100}%` }}
                                    />
                                </div>
                                <div className="mt-2 flex justify-between text-[0.68rem] font-mono text-slate-500 dark:text-slate-400">
                                    <span>{formatDuration(elapsed)}</span>
                                    <span>-{formatDuration(total - elapsed)}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-center gap-4">
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-400"
                                    aria-label="Previous track"
                                >
                                    <HiOutlinePlay className="h-4 w-4 rotate-180" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 via-brand-600 to-purple-500 text-white shadow-[0_25px_55px_-30px_rgba(10,132,255,0.55)] transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                                    aria-label="Play or pause"
                                >
                                    <HiOutlinePlay className="h-5 w-5 translate-x-0.5" />
                                </button>
                                <button
                                    type="button"
                                    className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-600 transition hover:-translate-y-0.5 hover:border-brand-400 hover:text-brand-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400 dark:hover:text-brand-400"
                                    aria-label="Next track"
                                >
                                    <HiOutlinePlay className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="rounded-xl border border-slate-200 bg-white/70 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                                <h4 className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400 mb-2">Listening mode</h4>
                                <div className="flex items-center justify-between text-sm text-slate-600 dark:text-slate-300">
                                    <span>Deep focus</span>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 px-2 py-0.5 text-[0.65rem] font-semibold text-brand-600 dark:text-brand-300">
                                        <HiOutlineSparkles className="h-3.5 w-3.5" />
                                        Adaptive
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                }
                case WINDOW_TYPES.STATUS:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div>
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Studio Status</h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400">Live metrics across your Scientist Shield workspace.</p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <StatusCard label="Active sessions" value="128" trend="+12%" />
                                <StatusCard label="Build pipeline" value="Green" trend="96% pass" emphasize />
                                <StatusCard label="Realtime collabs" value="18" trend="+6 open" />
                                <StatusCard label="Support response" value="12m" trend="SLA met" />
                            </div>
                            <div className="rounded-xl border border-slate-200/60 bg-white/70 p-4 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
                                <h4 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">Highlights</h4>
                                <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                                    <li>• Tutorials ship pipeline clear.</li>
                                    <li>• Quiz analytics syncing to dashboard.</li>
                                    <li>• Community engagement up 18% week over week.</li>
                                </ul>
                            </div>
                        </div>
                    );
                case WINDOW_TYPES.QUEUE:
                    return (
                        <div className="flex h-full flex-col gap-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Action Queue</h3>
                                <button
                                    type="button"
                                    className="text-xs uppercase tracking-[0.4em] text-brand-500 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60"
                                    onClick={() => setTodos((items) => items.map((item) => ({ ...item, done: true })))}
                                >
                                    Complete all
                                </button>
                            </div>
                            <ul className="space-y-2">
                                {todos.map((todo) => (
                                    <li key={todo.id}>
                                        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200/60 bg-white/70 p-3 text-sm text-slate-600 shadow-sm transition hover:border-brand-300/60 hover:bg-white/90 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-300/50 dark:border-slate-700/60 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400/60">
                                            <input
                                                type="checkbox"
                                                checked={todo.done}
                                                onChange={() => {
                                                    setTodos((items) =>
                                                        items.map((item) =>
                                                            item.id === todo.id ? { ...item, done: !item.done } : item
                                                        )
                                                    );
                                                }}
                                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-brand-500 focus:ring-brand-400 dark:border-slate-600"
                                            />
                                            <span className={`flex-1 ${todo.done ? 'text-slate-400 line-through' : ''}`}>
                                                {todo.label}
                                            </span>
                                        </label>
                                    </li>
                                ))}
                            </ul>
                            <button
                                type="button"
                                className="inline-flex items-center justify-center rounded-full border border-dashed border-brand-300 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-brand-500 transition hover:border-brand-400 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-brand-400/40 dark:text-brand-300"
                                onClick={() => {
                                    const suffix = todos.length + 1;
                                    setTodos((items) => [
                                        ...items,
                                        { id: `todo-${suffix}`, label: `New reminder ${suffix}`, done: false },
                                    ]);
                                }}
                            >
                                Add Action
                            </button>
                        </div>
                    );
                default:
                    return null;
            }
        },
        [activeAppId, appWindowSummaries, currentTrackTime, renderMainContentMemo, restoreWindow, scratchpadText, todos]
    );


    const minimisedWindows = useMemo(
        () => windowsForUI.filter((win) => win.minimized),
        [windowsForUI]
    );

    const reopenableWindowTypes = useMemo(
        () => closedTypes.filter((type) => !windowsForUI.some((win) => win.type === type)),
        [closedTypes, windowsForUI]
    );

    const missionControlFilteredWindows = useMemo(() => {
        switch (missionControlFilter) {
            case 'visible':
                return windowsForUI.filter((win) => !win.minimized);
            case 'minimized':
                return minimisedWindows;
            case 'closed':
                return [];
            case 'all':
            default:
                return windowsForUI;
        }
    }, [missionControlFilter, windowsForUI, minimisedWindows]);

    const missionControlFilterCounts = useMemo(
        () => ({
            all: windowsForUI.length,
            visible: windowsForUI.length - minimisedWindows.length,
            minimized: minimisedWindows.length,
            closed: reopenableWindowTypes.length,
        }),
        [windowsForUI.length, minimisedWindows.length, reopenableWindowTypes.length]
    );

    const minimisedWindowSummary = useMemo(() => {
        if (minimisedWindows.length === 0) {
            return '';
        }
        return minimisedWindows
            .map((win) =>
                win.isAppWindow ? win.title || typeToTitle(win.type) : typeToTitle(win.type)
            )
            .join(', ');
    }, [minimisedWindows]);

    const fullscreenWindowActive = useMemo(
        () => windowsForUI.some((win) => win.isZoomed && !win.minimized),
        [windowsForUI]
    );

    const focusedWindow = useMemo(() => {
        if (windowsForUI.length === 0) return null;
        return windowsForUI.reduce(
            (top, current) => (!top || current.z > top.z ? current : top),
            null
        );
    }, [windowsForUI]);

    const missionControlSummaryCards = useMemo(
        () => [
            { key: 'open', label: 'Open Now', value: missionControlFilterCounts.all, Icon: HiOutlineSquares2X2 },
            { key: 'visible', label: 'Visible Stage', value: missionControlFilterCounts.visible, Icon: HiOutlineViewColumns },
            { key: 'minimized', label: 'Minimized', value: missionControlFilterCounts.minimized, Icon: HiOutlineRectangleStack },
            { key: 'closed', label: 'Closed Tools', value: missionControlFilterCounts.closed, Icon: HiOutlineSparkles },
        ],
        [missionControlFilterCounts]
    );

    const activeStageAccent = useMemo(() => {
        if (focusedWindow?.isAppWindow) {
            const appKey = focusedWindow.appRouteKey || focusedWindow.appIconKey || 'default';
            return focusedWindow.appAccent || appAccentForKey(appKey);
        }
        if (focusedWindow) {
            return stagePreviewAccent(focusedWindow.type, Boolean(focusedWindow.isMain));
        }
        if (activeAppWindow) {
            const appKey = activeAppWindow.routeKey || activeAppWindow.iconKey || 'default';
            return activeAppWindow.accent || appAccentForKey(appKey);
        }
        return null;
    }, [activeAppWindow, focusedWindow]);

    useEffect(() => {
        focusedWindowRef.current = focusedWindow;
    }, [focusedWindow]);

    useEffect(() => {
        if (!focusedWindow) {
            lastFocusIdRef.current = null;
            setFocusHighlight(null);
            return;
        }
        if (lastFocusIdRef.current === focusedWindow.id) {
            return;
        }
        lastFocusIdRef.current = focusedWindow.id;
        const appKey = focusedWindow.appRouteKey || focusedWindow.appIconKey || 'default';
        const contextLabel = focusedWindow.isAppWindow
            ? appLabelForKey(appKey)
            : typeToTitle(focusedWindow.type);
        const accent = focusedWindow.isAppWindow
            ? focusedWindow.appAccent || appAccentForKey(appKey)
            : stagePreviewAccent(focusedWindow.type, true);
        const label = focusedWindow.title || contextLabel;
        setFocusHighlight({
            id: focusedWindow.id,
            label,
            context: contextLabel,
            accent,
            isAppWindow: Boolean(focusedWindow.isAppWindow),
            iconKey: focusedWindow.isAppWindow ? appKey : focusedWindow.type,
            timestamp: Date.now(),
        });
    }, [focusedWindow]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        if (!focusHighlight) {
            if (focusHighlightTimeoutRef.current) {
                window.clearTimeout(focusHighlightTimeoutRef.current);
                focusHighlightTimeoutRef.current = null;
            }
            return undefined;
        }
        if (focusHighlightTimeoutRef.current) {
            window.clearTimeout(focusHighlightTimeoutRef.current);
        }
        const timeoutId = window.setTimeout(() => {
            setFocusHighlight((current) =>
                current && current.timestamp === focusHighlight.timestamp ? null : current
            );
        }, 2400);
        focusHighlightTimeoutRef.current = timeoutId;
        return () => {
            window.clearTimeout(timeoutId);
            if (focusHighlightTimeoutRef.current === timeoutId) {
                focusHighlightTimeoutRef.current = null;
            }
        };
    }, [focusHighlight]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }
        return () => {
            if (focusHighlightTimeoutRef.current) {
                window.clearTimeout(focusHighlightTimeoutRef.current);
                focusHighlightTimeoutRef.current = null;
            }
        };
    }, []);

    const activeHotCornerDetails = useMemo(() => {
        if (!activeHotCorner || !isValidCornerAction(activeHotCorner.action)) {
            return null;
        }
        const { action, corner } = activeHotCorner;
        return {
            action,
            corner,
            label: HOT_CORNER_ACTION_LABELS[action],
            symbol: HOT_CORNER_SYMBOLS[corner] || '',
            Icon: HOT_CORNER_ICONS[action] || null,
        };
    }, [activeHotCorner]);
    const HotCornerIcon = activeHotCornerDetails?.Icon || null;

    const dragFlyoutPosition = useMemo(() => {
        if (!dragPointer) {
            return null;
        }
        const baseX = dragPointer.x + DRAG_POINTER_OFFSET_X;
        const baseY = dragPointer.y + DRAG_POINTER_OFFSET_Y;
        if (typeof window === 'undefined') {
            return { left: baseX, top: baseY };
        }
        const maxLeft = window.innerWidth - 220;
        const maxTop = window.innerHeight - 120;
        const minTop = MAC_STAGE_MARGIN * 0.25;
        return {
            left: clampNumber(baseX, 12, maxLeft),
            top: clampNumber(baseY, minTop, maxTop),
        };
    }, [dragPointer]);

    const motionFast = reduceMotion ? { duration: 0 } : { duration: 0.16, ease: 'easeOut' };
    const motionFlyoutInitial = reduceMotion ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.92, y: 6 };
    const motionFlyoutExit = reduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 4 };

    const accentGradient = useMemo(() => {
        const presetAccent = accentPresetKey !== 'system' ? accentPresetGradient : null;
        if (focusMode) {
            return (
                presetAccent ||
                'radial-gradient(circle at 24% 26%, rgba(148,163,184,0.45), rgba(15,23,42,0.94))'
            );
        }
        const activeAccent = activeAppWindow?.accent || activeAppWindow?.appAccent;
        return presetAccent || activeAccent || 'linear-gradient(135deg, rgba(15,23,42,0.92), rgba(37,99,235,0.7))';
    }, [accentPresetGradient, accentPresetKey, activeAppWindow, focusMode]);

    const wallpaperSecondary = useMemo(
        () => {
            if (focusMode) {
                return 'radial-gradient(circle at 78% 20%, rgba(14,116,144,0.28), transparent 60%)';
            }
            if (accentPresetKey !== 'system' && accentPresetGradient) {
                return accentPresetGradient;
            }
            return 'radial-gradient(circle at 82% 18%, rgba(14,165,233,0.28), transparent 62%)';
        },
        [accentPresetGradient, accentPresetKey, focusMode]
    );

    const FocusHighlightIcon = focusHighlight
        ? focusHighlight.isAppWindow
            ? iconForAppKey(focusHighlight.iconKey)
            : iconComponentForType(focusHighlight.iconKey)
        : null;

    const quickLookTarget = useMemo(
        () =>
            quickLookWindowId
                ? windowsForUI.find((win) => win.id === quickLookWindowId) || null
                : null,
        [quickLookWindowId, windowsForUI]
    );

    const quickLookAvailable = useMemo(() => stagedWindows.length > 0, [stagedWindows]);

    const commandPaletteItems = useMemo(() => {
        const defaultAccent =
            activeStageAccent ||
            'linear-gradient(135deg, rgba(14,116,244,0.6), rgba(56,189,248,0.45))';
        const usingGlyphs = metaKeyLabel === '⌘';
        const joinKeys = (...keys) =>
            usingGlyphs
                ? keys.filter(Boolean).join('')
                : keys
                      .filter(Boolean)
                      .map((key) => key.trim())
                      .join('+');

        const itemsList = [];

        const pushAction = (entry) => {
            itemsList.push({
                group: 'Quick Actions',
                groupPriority: entry.groupPriority ?? 0,
                icon: entry.icon ?? <HiOutlineSparkles className="h-5 w-5" />,
                accent: entry.accent ?? defaultAccent,
                ...entry,
            });
        };

        pushAction({
            id: 'action:new-window',
            label: 'New Window',
            description: activeAppWindow
                ? 'Duplicate the current workspace into a fresh window'
                : 'Open another workspace window',
            shortcut: joinKeys(shiftKeyLabel, metaKeyLabel, 'N'),
            icon: <HiOutlineSquares2X2 className="h-5 w-5" />,
            disabled: SINGLE_WINDOW_MODE || !activeAppWindow,
            onSelect: () => duplicateActiveAppWindow(),
            groupPriority: -1,
        });

        pushAction({
            id: 'action:focus-mode',
            label: focusMode ? 'Exit Focus Mode' : 'Enter Focus Mode',
            description: focusMode
                ? 'Restore staged companion tools'
                : 'Isolate the primary workspace window',
            shortcut: joinKeys(metaKeyLabel, altKeyLabel, 'F'),
            badge: focusMode ? 'Active' : undefined,
            icon: <HiOutlineSparkles className="h-5 w-5" />,
            onSelect: () => toggleFocusMode(),
        });

        pushAction({
            id: 'action:mission-control',
            label: 'Open Mission Control',
            description: 'Overview every staged window at once',
            shortcut: usingGlyphs ? `${metaKeyLabel}↑` : `${metaKeyLabel}+ArrowUp`,
            icon: <HiOutlineArrowsPointingOut className="h-5 w-5" />,
            onSelect: () => openMissionControl(),
        });

        pushAction({
            id: 'action:quick-look',
            label: quickLookWindowId ? 'Close Quick Look' : 'Toggle Quick Look',
            description: 'Preview the highlighted window',
            shortcut: usingGlyphs ? 'Space' : 'Space',
            icon: <HiOutlineSparkles className="h-5 w-5" />,
            disabled: !quickLookAvailable && !quickLookWindowId,
            onSelect: () => toggleQuickLook(),
        });

        windows
            .filter((win) => !win.isAppWindow)
            .forEach((win) => {
                const label = win.title || typeToTitle(win.type);
                const status = win.isMain
                    ? 'Primary workspace'
                    : win.minimized
                    ? 'Minimized'
                    : win.isZoomed
                    ? 'Zoomed'
                    : 'Visible';
                const accent = stagePreviewAccent(win.type, Boolean(win.isMain));
                const iconNode =
                    renderWindowIcon(win.type, 'h-5 w-5') || (
                        <HiOutlineSquares2X2 className="h-5 w-5" />
                    );
                const badge = win.isMain ? 'Main' : win.minimized ? 'Minimized' : undefined;

                itemsList.push({
                    id: `window:${win.id}`,
                    group: 'Windows',
                    groupPriority: 3,
                    label,
                    description: status,
                    badge,
                    icon: iconNode,
                    accent,
                    onSelect: () => {
                        if (win.minimized) {
                            restoreWindow(win.id);
                        } else {
                            bringToFront(win.id);
                        }
                    },
                });
            });

        const activeTileableWindow =
            focusedWindowRef.current && !focusedWindowRef.current.minimized
                ? focusedWindowRef.current
                : windowsRef.current.find((win) => !win.minimized) || null;

        const layoutShortcutByPreset = {
            [LAYOUT_PRESETS.full.id]: joinKeys(metaKeyLabel, altKeyLabel, shiftKeyLabel, usingGlyphs ? '↑' : 'ArrowUp'),
            [LAYOUT_PRESETS.left.id]: joinKeys(metaKeyLabel, altKeyLabel, usingGlyphs ? '←' : 'ArrowLeft'),
            [LAYOUT_PRESETS.right.id]: joinKeys(metaKeyLabel, altKeyLabel, usingGlyphs ? '→' : 'ArrowRight'),
            [LAYOUT_PRESETS.top.id]: joinKeys(metaKeyLabel, altKeyLabel, usingGlyphs ? '↑' : 'ArrowUp'),
            [LAYOUT_PRESETS.bottom.id]: joinKeys(metaKeyLabel, altKeyLabel, usingGlyphs ? '↓' : 'ArrowDown'),
            [LAYOUT_PRESETS.tl.id]: joinKeys(metaKeyLabel, altKeyLabel, '1'),
            [LAYOUT_PRESETS.tr.id]: joinKeys(metaKeyLabel, altKeyLabel, '2'),
            [LAYOUT_PRESETS.bl.id]: joinKeys(metaKeyLabel, altKeyLabel, '3'),
            [LAYOUT_PRESETS.br.id]: joinKeys(metaKeyLabel, altKeyLabel, '4'),
            [LAYOUT_PRESETS.center.id]: joinKeys(metaKeyLabel, altKeyLabel, shiftKeyLabel, usingGlyphs ? '↓' : 'ArrowDown'),
        };

        Object.values(LAYOUT_PRESETS).forEach((preset) => {
            itemsList.push({
                id: `layout:${preset.id}`,
                group: 'Layouts',
                groupPriority: 4,
                label: preset.label,
                description: activeTileableWindow
                    ? `Apply to ${activeTileableWindow.title}`
                    : 'Arrange the top-most window',
                shortcut: layoutShortcutByPreset[preset.id],
                icon: <HiOutlineViewColumns className="h-5 w-5" />,
                accent: activeStageAccent,
                disabled: !activeTileableWindow,
                onSelect: () => {
                    applyLayoutPresetToTopWindow(preset.id);
                },
            });
        });

        return itemsList;
    }, [
        activeStageAccent,
        altKeyLabel,
        bringToFront,
        focusMode,
        metaKeyLabel,
        openMissionControl,
        quickLookAvailable,
        quickLookWindowId,
        renderWindowIcon,
        restoreWindow,
        applyLayoutPresetToTopWindow,
        shiftKeyLabel,
        stagePreviewAccent,
        toggleFocusMode,
        toggleQuickLook,
        windows,
        duplicateActiveAppWindow,
        activeAppWindow,
    ]);

    if (isCompact) {
        return (
            <div className="macos-typography container max-w-5xl">
                <div className="macos-window">
                    <div className="macos-window__titlebar">
                        <div className="macos-traffic-lights" aria-hidden="true">
                            <span className="macos-traffic-light macos-traffic-light--close opacity-40" />
                            <span className="macos-traffic-light macos-traffic-light--minimize opacity-40" />
                            <span className="macos-traffic-light macos-traffic-light--zoom opacity-40" />
                        </div>
                        <div className="macos-window__titlebar-center">
                            <span className="macos-window__titlebar-icon" aria-hidden="true">
                                <HiOutlineShieldCheck className="h-3.5 w-3.5" />
                            </span>
                            <span className="macos-window__titletext">{windowTitle}</span>
                        </div>
                    </div>
                    <div className="macos-window__content">
                        <div className="macos-window__body">
                            {renderMainContentMemo()}
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="macos-typography">
            <DesktopWallpaper
                className="pointer-events-none fixed inset-0 -z-20"
                accentGradient={accentGradient}
                focusMode={focusMode}
                theme={theme}
                wallpaperMode={wallpaperMode}
            >
                <div
                    className="absolute inset-0 opacity-45 mix-blend-soft-light"
                    style={{ background: wallpaperSecondary }}
                />
                <div
                    className="absolute inset-0 opacity-35"
                    style={{ background: 'radial-gradient(circle at 14% 82%, rgba(255,255,255,0.18), transparent 58%)' }}
                />
                <div className="absolute inset-0 bg-slate-900/55 mix-blend-multiply" />
            </DesktopWallpaper>

            <DesktopMenuBar
                activeAppTitle={activeAppWindow?.title || windowTitle || ''}
                activePath={formattedPath}
                clock={formattedClock}
                focusMode={focusMode}
                theme={theme}
                windowTelemetry={windowTelemetry}
                onNavigateHome={() => navigate('/')}
                onNavigateSearch={() => navigate('/search')}
                onOpenCommandPalette={openCommandPalette}
                onOpenMissionControl={openMissionControl}
                onOpenQuickLook={toggleQuickLook}
                onOpenWindowSwitcher={openWindowSwitcher}
                onDuplicateWindow={duplicateActiveAppWindow}
                onApplyWindowLayout={applyLayoutPresetToTopWindow}
                onToggleFocusMode={toggleFocusMode}
                onToggleTheme={handleThemeToggle}
                onToggleControlCenter={toggleControlCenter}
                controlCenterOpen={controlCenterOpen}
                profile={profileDetails}
                onProfileMenuAction={handleProfileMenuAction}
                autoHide={menuBarAutoHide}
            />

            <div ref={controlCenterRef} className="pointer-events-auto">
                <ControlCenter
                    open={controlCenterOpen}
                    effects={effects}
                    focusMode={focusMode}
                    theme={theme}
                    surfacePreset={surfacePresetKey}
                    accentPreset={accentPresetKey}
                    wallpaperMode={wallpaperMode}
                    surfacePresets={SURFACE_PRESETS}
                    accentPresets={ACCENT_PRESETS}
                    wallpaperOptions={WALLPAPER_OPTIONS}
                    onSelectSurfacePreset={(presetKey) => persistEffects({ ...effects, surfacePreset: presetKey })}
                    onSelectAccentPreset={(presetKey) => persistEffects({ ...effects, accentPreset: presetKey })}
                    onSelectWallpaperMode={(mode) => persistEffects({ ...effects, wallpaperMode: mode })}
                    onClose={closeControlCenter}
                    onChangeEffects={persistEffects}
                    onToggleFocusMode={toggleFocusMode}
                    onToggleTheme={handleThemeToggle}
                    onOpenMissionControl={() => {
                        closeControlCenter();
                        openMissionControl();
                    }}
                    onOpenQuickLook={() => {
                        closeControlCenter();
                        toggleQuickLook();
                    }}
                    onOpenWindowSwitcher={(direction) => {
                        closeControlCenter();
                        openWindowSwitcher(direction);
                    }}
                    onDuplicateWindow={() => duplicateActiveAppWindow()}
                    onApplyWindowLayout={(presetId) => applyLayoutPresetToTopWindow(presetId)}
                />
            </div>

            {/* MacDock overlay removed per request */}

            <div aria-live="polite" className="sr-only">
                {liveAnnouncement}
            </div>
            <AnimatePresence initial={!reduceMotion}>
                {missionControlOpen ? (
                    <motion.div
                        key="mission-control"
                        className="fixed inset-0 z-[65] overflow-y-auto bg-slate-900/45 backdrop-blur-2xl dark:bg-slate-950/70"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={motionFast}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Mission Control"
                    >
                        <div className="pointer-events-none absolute inset-0 overflow-hidden">
                            <div className="absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
                            <div className="absolute right-0 top-1/3 h-80 w-80 rounded-full bg-blue-400/20 blur-3xl" />
                            <div className="absolute bottom-0 left-0 h-64 w-64 rounded-full bg-brand-400/20 blur-3xl" />
                        </div>
                        <div className="relative mx-auto flex min-h-full w-full max-w-7xl flex-col gap-5 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
                            <section className="rounded-3xl border border-white/20 bg-white/12 p-5 shadow-[0_26px_90px_-45px_rgba(8,47,73,0.85)] backdrop-blur-xl sm:p-6">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.34em] text-slate-200/80">Mission Control</p>
                                        <h2 className="mt-2 text-2xl font-semibold text-white sm:text-3xl">Window command deck</h2>
                                        <p className="mt-2 max-w-2xl text-sm text-slate-100/80">
                                            Scan every workspace, recover hidden tools, and jump to the exact window you need.
                                        </p>
                                        <p className="mt-2 text-xs text-slate-200/75">
                                            Top window:{' '}
                                            <span className="font-semibold text-white">
                                                {focusedWindow ? focusedWindow.title || typeToTitle(focusedWindow.type) : 'None'}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="hidden rounded-full border border-white/25 bg-white/10 px-3 py-2 text-xs text-slate-100/85 sm:inline-flex">
                                            {metaKeyLabel}+↑ to open · Esc to exit
                                        </span>
                                        <button
                                            type="button"
                                            onClick={() => setMissionControlOpen(false)}
                                            className="inline-flex items-center gap-2 rounded-full border border-white/45 bg-white/25 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/70 hover:bg-white/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                                        >
                                            <HiOutlineXMark className="h-4 w-4" />
                                            Close
                                        </button>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                                    {missionControlSummaryCards.map((item) => (
                                        <div
                                            key={item.key}
                                            className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/20 px-4 py-3"
                                        >
                                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                                                <item.Icon className="h-5 w-5" />
                                            </span>
                                            <div>
                                                <p className="text-[0.65rem] uppercase tracking-[0.26em] text-slate-200/80">{item.label}</p>
                                                <p className="text-xl font-semibold text-white">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 flex flex-wrap gap-2">
                                    {MISSION_CONTROL_FILTERS.map((filter) => {
                                        const active = missionControlFilter === filter.key;
                                        const count = missionControlFilterCounts[filter.key] ?? 0;
                                        return (
                                            <button
                                                key={filter.key}
                                                type="button"
                                                onClick={() => setMissionControlFilter(filter.key)}
                                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.24em] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                                                    active
                                                        ? 'border-cyan-200/75 bg-cyan-300/20 text-cyan-100'
                                                        : 'border-white/30 bg-white/10 text-slate-100/85 hover:border-white/50 hover:bg-white/15'
                                                }`}
                                            >
                                                <span>{filter.label}</span>
                                                <span className="rounded-full border border-white/25 px-2 py-0.5 text-[0.62rem] tracking-[0.18em]">
                                                    {count}
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {missionControlFilter !== 'closed' ? (
                                <section className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:p-5">
                                    <div className="flex flex-wrap items-end justify-between gap-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-200/75">Open windows</p>
                                            <h3 className="text-lg font-semibold text-white">Live workspace stack</h3>
                                        </div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-200/75">
                                            {missionControlFilteredWindows.length} shown
                                        </p>
                                    </div>
                                    <div className="mt-4 grid gap-4 pb-2 md:grid-cols-2 xl:grid-cols-3">
                                        {missionControlFilteredWindows.length > 0 ? (
                                            missionControlFilteredWindows.map((win) => {
                                                const isFocused = focusedWindow?.id === win.id;
                                                const statusLabel = win.minimized ? 'Minimized' : isFocused ? 'Focused' : 'Active';
                                                const statusClass = win.minimized
                                                    ? 'border-amber-200/55 bg-amber-300/20 text-amber-100'
                                                    : isFocused
                                                        ? 'border-cyan-200/65 bg-cyan-300/20 text-cyan-100'
                                                        : 'border-emerald-200/55 bg-emerald-300/20 text-emerald-100';
                                                return (
                                                    <motion.div
                                                        key={`mission-${win.id}`}
                                                        role="button"
                                                        tabIndex={0}
                                                        onClick={() => handleMissionControlSelect(win)}
                                                        onKeyDown={(event) => {
                                                            if (event.key === 'Enter' || event.key === ' ') {
                                                                event.preventDefault();
                                                                handleMissionControlSelect(win);
                                                            }
                                                        }}
                                                        className={`relative flex h-56 cursor-pointer flex-col overflow-hidden rounded-3xl border p-4 text-left text-white shadow-xl transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/80 ${
                                                            isFocused
                                                                ? 'border-cyan-200/60 bg-white/20'
                                                                : 'border-white/20 bg-white/12 hover:border-white/45 hover:bg-white/16'
                                                        } ${win.minimized ? 'opacity-75' : 'opacity-100'}`}
                                                        whileHover={{ translateY: -4, scale: 1.01 }}
                                                    >
                                                        <div className="flex items-center justify-between gap-3">
                                                            <div className="flex items-center gap-3">
                                                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-lg">
                                                                    {win.iconComponent ? (
                                                                        <win.iconComponent className="h-5 w-5" />
                                                                    ) : (
                                                                        renderWindowIcon(win.type, 'h-5 w-5') || (
                                                                            <HiOutlineSparkles className="h-5 w-5" />
                                                                        )
                                                                    )}
                                                                </span>
                                                                <div>
                                                                    <p className="text-xs uppercase tracking-[0.3em] text-white/75">
                                                                        {win.isMain ? 'Primary' : 'Utility'}
                                                                    </p>
                                                                    <p className="text-sm font-semibold leading-tight text-white">{win.title}</p>
                                                                </div>
                                                            </div>
                                                            <span
                                                                className={`rounded-full border px-2 py-1 text-[0.62rem] uppercase tracking-[0.22em] ${statusClass}`}
                                                            >
                                                                {statusLabel}
                                                            </span>
                                                        </div>
                                                        <div className="relative mt-4 flex-1 overflow-hidden rounded-2xl border border-white/25 p-3">
                                                            <div
                                                                className="pointer-events-none absolute inset-0 opacity-70"
                                                                style={{ backgroundImage: stagePreviewAccent(win.type, Boolean(win.isMain)) }}
                                                            />
                                                            <div className="relative text-xs text-white/85">{missionControlPreview(win)}</div>
                                                        </div>
                                                        <div className="mt-4 flex items-center justify-between gap-2 text-[0.68rem] text-white/75">
                                                            <span>
                                                                {Number.isFinite(win.width) ? Math.round(win.width) : '--'} ×{' '}
                                                                {Number.isFinite(win.height) ? Math.round(win.height) : '--'}
                                                            </span>
                                                            <div className="flex items-center gap-2">
                                                                {!win.isMain ? (
                                                                    <button
                                                                        type="button"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation();
                                                                            handleClose(win.id);
                                                                            setMissionControlOpen(false);
                                                                        }}
                                                                        className="rounded-full border border-white/35 px-2 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/85 transition hover:border-red-300/70 hover:text-red-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65"
                                                                    >
                                                                        Close
                                                                    </button>
                                                                ) : null}
                                                                <button
                                                                    type="button"
                                                                    onClick={(event) => {
                                                                        event.stopPropagation();
                                                                        setMissionControlOpen(false);
                                                                        if (win.minimized) {
                                                                            restoreWindow(win.id);
                                                                        } else {
                                                                            handleMinimize(win.id);
                                                                        }
                                                                    }}
                                                                    className="rounded-full border border-white/35 px-2 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-white/85 transition hover:border-cyan-200/70 hover:text-cyan-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/65"
                                                                >
                                                                    {win.minimized ? 'Show' : 'Hide'}
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })
                                        ) : (
                                            <div className="col-span-full rounded-2xl border border-dashed border-white/35 bg-white/8 px-4 py-6 text-center text-sm text-slate-200/80">
                                                No windows match this segment.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            ) : null}

                            {missionControlFilter === 'all' || missionControlFilter === 'closed' ? (
                                <section className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur-xl sm:p-5">
                                    <div className="flex items-end justify-between gap-2">
                                        <div>
                                            <p className="text-xs uppercase tracking-[0.3em] text-slate-200/75">Closed tools</p>
                                            <h3 className="text-lg font-semibold text-white">Restore utility windows</h3>
                                        </div>
                                        <p className="text-xs uppercase tracking-[0.24em] text-slate-200/75">
                                            {reopenableWindowTypes.length} available
                                        </p>
                                    </div>
                                    <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {reopenableWindowTypes.length > 0 ? (
                                            reopenableWindowTypes.map((type) => (
                                                <motion.button
                                                    key={`mission-closed-${type}`}
                                                    type="button"
                                                    onClick={() => {
                                                        reopenWindow(type);
                                                        setMissionControlOpen(false);
                                                    }}
                                                    className="flex h-44 flex-col items-center justify-center rounded-3xl border border-dashed border-white/40 bg-white/12 text-white transition hover:border-cyan-200/70 hover:bg-white/18 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200/70"
                                                    whileHover={{ translateY: -3, scale: 1.02 }}
                                                >
                                                    <span className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-xl">
                                                        {renderWindowIcon(type)}
                                                    </span>
                                                    <p className="text-sm font-semibold">{typeToTitle(type)}</p>
                                                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-white/75">Reopen</p>
                                                </motion.button>
                                            ))
                                        ) : (
                                            <div className="col-span-full rounded-2xl border border-dashed border-white/35 bg-white/8 px-4 py-6 text-center text-sm text-slate-200/80">
                                                No closed utility windows right now.
                                            </div>
                                        )}
                                    </div>
                                </section>
                            ) : null}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {quickLookTarget ? (
                    <motion.div
                        key="quick-look"
                        className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/40 backdrop-blur-xl dark:bg-slate-950/55"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={motionFast}
                        onClick={() => setQuickLookWindowId(null)}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Quick Look"
                    >
                        <motion.div
                            className="relative w-[min(90vw,900px)] max-h-[80vh] rounded-3xl border border-white/25 bg-white/90 p-6 text-slate-700 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-slate-900/85 dark:text-slate-100"
                            initial={reduceMotion ? { scale: 1, y: 0 } : { scale: 0.96, y: 12 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={reduceMotion ? { opacity: 0 } : { scale: 0.95, y: 12 }}
                            transition={motionFast}
                            onClick={(event) => event.stopPropagation()}
                        >
                            <div className="mb-4 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-white/60 text-brand-600 shadow-inner dark:bg-slate-800/70 dark:text-brand-300">
                                        {quickLookTarget.iconComponent ? (
                                            <quickLookTarget.iconComponent className="h-5 w-5" />
                                        ) : (
                                            renderWindowIcon(quickLookTarget.type, 'h-5 w-5') || (
                                                <HiOutlineSparkles className="h-5 w-5" />
                                            )
                                        )}
                                    </span>
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">Quick Look</p>
                                        <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-100">
                                            {quickLookTarget.title}
                                        </h3>
                                    </div>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => setQuickLookWindowId(null)}
                                    className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/60 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-slate-600 transition hover:border-brand-200/60 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/15 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:border-brand-300/60"
                                >
                                    <HiOutlineXMark className="h-4 w-4" />
                                    Close
                                </button>
                            </div>
                            <div className="max-h-[60vh] overflow-auto rounded-2xl border border-white/30 bg-white/80 p-4 shadow-inner dark:border-white/10 dark:bg-slate-900/70">
                                {renderWindowContent(quickLookTarget, { forceLive: true })}
                            </div>
                            <p className="mt-4 text-[0.65rem] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                                Press Space to toggle · {Math.round(quickLookTarget.width)} × {Math.round(quickLookTarget.height)}
                            </p>
                        </motion.div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {activeHotCornerDetails ? (
                    <motion.div
                        key="hot-corner-toast"
                        className="pointer-events-none fixed bottom-8 left-1/2 z-[70] -translate-x-1/2"
                        initial={reduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 12 }}
                        transition={motionFast}
                        aria-hidden="true"
                    >
                        <div className="flex items-center gap-3 rounded-full border border-white/45 bg-white/80 px-4 py-2 text-sm font-medium text-slate-600 shadow-lg backdrop-blur dark:border-white/15 dark:bg-slate-900/75 dark:text-slate-200">
                            {HotCornerIcon ? (
                                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand-500/20 text-brand-600 dark:text-brand-200">
                                    <HotCornerIcon className="h-4 w-4" />
                                </span>
                            ) : null}
                            <span className="text-[0.65rem] uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                Hot Corner
                            </span>
                            <span className="text-sm font-semibold text-slate-700 dark:text-slate-100">
                                {activeHotCornerDetails.symbol}{' '}{activeHotCornerDetails.label}
                            </span>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {snapPreview ? (
                    <motion.div
                        key="snap-preview"
                        className="pointer-events-none fixed inset-0 z-[44] hidden lg:block"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={motionFast}
                        aria-hidden="true"
                    >
                        <div
                            className="absolute overflow-hidden"
                            style={{
                                left: snapPreview.rect.x,
                                top: snapPreview.rect.y,
                                width: snapPreview.rect.width,
                                height: snapPreview.rect.height,
                                borderRadius: 'var(--macos-window-radius)',
                            }}
                        >
                            <div className="absolute inset-0 rounded-[inherit] border border-brand-300/60 bg-gradient-to-br from-brand-400/18 via-brand-500/14 to-brand-600/20 shadow-[0_48px_120px_-50px_rgba(14,116,244,0.6)] backdrop-blur-2xl dark:border-brand-400/50 dark:from-brand-400/16 dark:via-brand-500/12 dark:to-brand-500/18" />
                            <div className="absolute inset-0 rounded-[inherit] bg-brand-400/10 dark:bg-brand-300/10 mix-blend-screen" />
                        </div>
                        <div
                            className="absolute left-1/2 -translate-x-1/2 rounded-full border border-white/45 bg-white/85 px-4 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-brand-600 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-brand-200"
                            style={{
                                top: Math.max(snapPreview.rect.y - 48, MAC_STAGE_MARGIN + 12),
                            }}
                        >
                            Snap: {labelForSnapTarget(snapPreview.target)}
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {focusHighlight ? (
                    <motion.div
                        key={`${focusHighlight.id}-${focusHighlight.timestamp}`}
                        className="pointer-events-none fixed right-6 top-6 z-[64] hidden lg:block"
                        initial={reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: -12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: reduceMotion ? 0 : -10, scale: reduceMotion ? 1 : 0.94 }}
                        transition={motionFast}
                        aria-live="polite"
                    >
                        <div className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/85 px-4 py-3 text-sm shadow-[0_30px_80px_-48px_rgba(14,116,244,0.58)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/80">
                            {focusHighlight.accent ? (
                                <>
                                    <span
                                        className="absolute inset-0 -z-[2] rounded-[inherit] opacity-90"
                                        style={{ background: focusHighlight.accent }}
                                        aria-hidden="true"
                                    />
                                    <span className="absolute inset-0 -z-[1] rounded-[inherit] bg-white/60 mix-blend-screen dark:bg-slate-900/55" aria-hidden="true" />
                                </>
                            ) : null}
                            <div className="relative flex items-center gap-3">
                                <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl bg-white/80 text-brand-600 shadow-inner dark:bg-white/10 dark:text-brand-200">
                                    {FocusHighlightIcon ? (
                                        <FocusHighlightIcon className="h-5 w-5" />
                                    ) : (
                                        renderWindowIcon(focusHighlight.iconKey, 'h-5 w-5') || (
                                            <HiOutlineSparkles className="h-5 w-5" />
                                        )
                                    )}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-[0.52rem] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                                        Focused window
                                    </p>
                                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {focusHighlight.label}
                                    </p>
                                    <p className="text-[0.52rem] uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">
                                        {focusHighlight.context}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {windowSwitcher.open ? (
                    <motion.div
                        key="window-switcher"
                        className="fixed inset-0 z-[66] hidden items-center justify-center md:flex"
                        initial={reduceMotion ? { opacity: 1 } : { opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={motionFast}
                    >
                        <div className="pointer-events-auto flex max-w-4xl flex-wrap justify-center gap-4 rounded-[36px] border border-white/45 bg-white/85 px-6 py-5 shadow-[0_42px_120px_-48px_rgba(14,116,244,0.65)] backdrop-blur-2xl dark:border-white/15 dark:bg-slate-900/85 dark:shadow-[0_42px_120px_-48px_rgba(30,64,175,0.55)]">
                            {windowSwitcher.items.map((item, index) => {
                                const IconComponent = item.iconComponent;
                                const isActive = index === windowSwitcher.highlightIndex;
                                return (
                                    <button
                                        key={`window-switcher-${item.id}`}
                                        type="button"
                                        onClick={() => handleWindowSwitcherItemClick(item.id)}
                                        onMouseEnter={() => handleWindowSwitcherItemHover(index)}
                                        onFocus={() => handleWindowSwitcherItemHover(index)}
                                        className={`relative flex w-[200px] flex-col gap-2 rounded-3xl border px-4 py-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 ${
                                            isActive
                                                ? 'border-brand-300/80 bg-white/85 text-slate-800 shadow-[0_28px_80px_-46px_rgba(14,116,244,0.55)] dark:border-brand-400/70 dark:bg-slate-900/80 dark:text-slate-100 dark:shadow-[0_28px_80px_-46px_rgba(30,64,175,0.55)]'
                                                : 'border-white/35 bg-white/70 text-slate-600 hover:border-brand-200/70 hover:text-brand-600 dark:border-white/10 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-brand-400/50 dark:hover:text-brand-200'
                                        }`}
                                        style={isActive ? { boxShadow: '0 28px 80px -46px rgba(14,116,244,0.45)' } : undefined}
                                    >
                                        {isActive ? (
                                            <span
                                                className="pointer-events-none absolute inset-0 -z-[1] rounded-[inherit] opacity-90"
                                                style={{ background: item.accent }}
                                                aria-hidden="true"
                                            />
                                        ) : null}
                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/40 bg-white/75 text-brand-600 shadow-inner dark:border-white/15 dark:bg-white/10 dark:text-brand-200">
                                            {IconComponent ? (
                                                <IconComponent className="h-5 w-5" />
                                            ) : (
                                                renderWindowIcon(item.type, 'h-5 w-5') || (
                                                    <HiOutlineSparkles className="h-5 w-5" />
                                                )
                                            )}
                                        </span>
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold text-inherit">
                                                {item.title}
                                            </p>
                                            <p className="text-[0.6rem] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                                                {item.context}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            <div className="basis-full text-center text-[0.55rem] uppercase tracking-[0.28em] text-slate-500 dark:text-slate-400">
                                Hold Meta ⌘ or Ctrl and tap Tab to cycle windows
                            </div>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <AnimatePresence>
                {draggingWindow && dragFlyoutPosition ? (
                    <motion.div
                        key="window-drag-flyout"
                        className="pointer-events-none fixed z-[62] hidden lg:block"
                        initial={motionFlyoutInitial}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={motionFlyoutExit}
                        transition={motionFast}
                        style={dragFlyoutPosition}
                        aria-hidden="true"
                    >
                        <div className="rounded-2xl border border-white/60 bg-white/90 px-3 py-2 text-[0.65rem] text-slate-700 shadow-2xl backdrop-blur dark:border-white/15 dark:bg-slate-900/85 dark:text-slate-100">
                            <p className="text-[0.72rem] font-semibold leading-tight">
                                {draggingWindow.title || typeToTitle(draggingWindow.type)}
                            </p>
                            <p className="text-[0.55rem] uppercase tracking-[0.32em] text-slate-500 dark:text-slate-400">
                                Drag to snap · Stage · Arrange
                            </p>
                        </div>
                    </motion.div>
                ) : null}
            </AnimatePresence>

            <div
                className={`pointer-events-none fixed inset-0 hidden lg:block ${fullscreenWindowActive ? 'z-[56]' : 'z-[45]'}`}
            >
            <AnimatePresence initial={!reduceMotion}>
                {stagedWindows.map((win) => (
                    <MacWindow
                        key={win.id}
                        windowData={win}
                        isFocused={focusedWindow ? focusedWindow.id === win.id : false}
                        isDragging={draggingWindow ? draggingWindow.id === win.id : false}
                        renderContent={renderWindowContent}
                        onPointerDown={handlePointerDown}
                        onClose={handleClose}
                        onMinimize={handleMinimize}
                        onZoom={handleZoom}
                            onResizeStart={handleResizeStart}
                            onFocus={handleFocus}
                            reduceMotion={reduceMotion}
                        />
                    ))}
                </AnimatePresence>
            </div>

            <Suspense fallback={null}>
                <WindowCommandPalette
                    open={commandPaletteOpen}
                    query={commandPaletteQuery}
                    onQueryChange={setCommandPaletteQuery}
                    items={commandPaletteItems}
                    onSelect={(item) => {
                        if (typeof item.onSelect === 'function') {
                            item.onSelect();
                        }
                        closeCommandPalette();
                    }}
                    onClose={closeCommandPalette}
                    accentFallback={activeStageAccent || accentGradient}
                    metaKeyLabel={metaKeyLabel}
                    altKeyLabel={altKeyLabel}
                    shiftKeyLabel={shiftKeyLabel}
                />
            </Suspense>
        </div>
    );
}

MacWindowManager.propTypes = {
    windowTitle: PropTypes.string.isRequired,
    renderMainContent: PropTypes.func.isRequired,
    activeLocation: PropTypes.shape({
        pathname: PropTypes.string.isRequired,
        key: PropTypes.string,
        search: PropTypes.string,
        hash: PropTypes.string,
    }).isRequired,
};

function stagePreviewAccent(type, isPrimary) {
    const palette = {
        [WINDOW_TYPES.MAIN]: 'linear-gradient(135deg, rgba(14,116,244,0.75), rgba(59,130,246,0.65))',
        [WINDOW_TYPES.SCRATCHPAD]: 'linear-gradient(135deg, rgba(249,115,22,0.7), rgba(251,191,36,0.6))',
        [WINDOW_TYPES.NOW_PLAYING]: 'linear-gradient(135deg, rgba(236,72,153,0.7), rgba(165,180,252,0.6))',
        [WINDOW_TYPES.STATUS]: 'linear-gradient(135deg, rgba(34,211,238,0.75), rgba(14,165,233,0.6))',
        [WINDOW_TYPES.QUEUE]: 'linear-gradient(135deg, rgba(74,222,128,0.7), rgba(125,211,252,0.55))',
    };
    if (palette[type]) {
        return palette[type];
    }
    return isPrimary
        ? 'linear-gradient(135deg, rgba(148,163,184,0.7), rgba(148,163,184,0.55))'
        : 'linear-gradient(135deg, rgba(148,163,184,0.55), rgba(203,213,225,0.45))';
}

function typeToTitle(type) {
    switch (type) {
        case WINDOW_TYPES.SCRATCHPAD:
            return 'Scratchpad';
        case WINDOW_TYPES.NOW_PLAYING:
            return 'Now Playing';
        case WINDOW_TYPES.STATUS:
            return 'System Status';
        case WINDOW_TYPES.QUEUE:
            return 'Action Queue';
        default:
            return 'Window';
    }
}

function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${minutes}:${String(remainder).padStart(2, '0')}`;
}

function missionControlPreview(win) {
    if (win.isMain) {
        return (
            <span>
                Primary workspace window hosting the current page. Use Focus Mode to isolate this surface.
            </span>
        );
    }
    switch (win.type) {
        case WINDOW_TYPES.SCRATCHPAD:
            return <span>Quick notes and ideas, saved locally for later.</span>;
        case WINDOW_TYPES.NOW_PLAYING:
            return <span>Ambient beats controller to keep you in the zone.</span>;
        case WINDOW_TYPES.STATUS:
            return <span>Live pulse of your platform health at a glance.</span>;
        case WINDOW_TYPES.QUEUE:
            return <span>Actionable reminders and tasks queued for today.</span>;
        default:
            return <span>Utility window.</span>;
    }
}

function sanitizeHotCornerMapping(value) {
    const base = { ...HOT_CORNER_DEFAULTS };
    if (!value || typeof value !== 'object') {
        return base;
    }
    HOT_CORNER_KEYS.forEach((key) => {
        if (isValidCornerAction(value[key])) {
            base[key] = value[key];
        }
    });
    return base;
}

function sanitizeHotCornerState(raw) {
    if (!raw || typeof raw !== 'object') {
        return createDefaultHotCornerState();
    }
    const enabled = typeof raw.enabled === 'boolean' ? raw.enabled : true;
    const corners = sanitizeHotCornerMapping(raw.corners);
    return {
        enabled,
        corners,
    };
}

function isValidCornerAction(action) {
    return (
        typeof action === 'string' &&
        Object.prototype.hasOwnProperty.call(HOT_CORNER_ACTION_LABELS, action)
    );
}

function hotCornerActionLabel(action) {
    return isValidCornerAction(action) ? HOT_CORNER_ACTION_LABELS[action] : 'None';
}

function formatHotCornerName(key) {
    switch (key) {
        case 'topLeft':
            return 'Top Left';
        case 'topRight':
            return 'Top Right';
        case 'bottomLeft':
            return 'Bottom Left';
        case 'bottomRight':
            return 'Bottom Right';
        default:
            return 'Corner';
    }
}

function resizeWindowByEdge(initial, edge, deltaX, deltaY, viewportWidth, viewportHeight) {
    const minWidth = 320;
    const minHeight = 260;
    const maxWidth = Math.max(viewportWidth - 48, 360);
    const maxHeight = Math.max(viewportHeight - 120, 260);

    let left = initial.x;
    let right = initial.x + initial.width;
    let top = initial.y;
    let bottom = initial.y + initial.height;

    if (edge.includes('e')) {
        const desiredRight = right + deltaX;
        const maxRight = viewportWidth - 12;
        right = clampNumber(desiredRight, left + minWidth, maxRight);
    }
    if (edge.includes('s')) {
        const desiredBottom = bottom + deltaY;
        const maxBottom = viewportHeight - 12;
        bottom = clampNumber(desiredBottom, top + minHeight, maxBottom);
    }
    if (edge.includes('w')) {
        const desiredLeft = left + deltaX;
        const minLeft = 12;
        left = clampNumber(desiredLeft, minLeft, right - minWidth);
    }
    if (edge.includes('n')) {
        const desiredTop = top + deltaY;
        const minTop = MAC_STAGE_MARGIN;
        top = clampNumber(desiredTop, minTop, bottom - minHeight);
    }

    let width = clampNumber(right - left, minWidth, maxWidth);
    let height = clampNumber(bottom - top, minHeight, maxHeight);

    if (width !== right - left) {
        if (edge.includes('w')) {
            left = right - width;
        } else {
            right = left + width;
        }
    }

    if (height !== bottom - top) {
        if (edge.includes('n')) {
            top = bottom - height;
        } else {
            bottom = top + height;
        }
    }

    const coords = clampWindowCoords(left, top, width, height, viewportWidth, viewportHeight);

    return {
        x: coords.x,
        y: coords.y,
        width,
        height,
    };
}

function sanitizeWindowEntry(entry, viewportWidth, viewportHeight, options = {}) {
    if (!entry || typeof entry !== 'object') return null;
    const width = clampNumber(entry.width ?? 420, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(entry.height ?? 320, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(
        entry.x ?? 48,
        entry.y ?? MAC_STAGE_MARGIN,
        width,
        height,
        viewportWidth,
        viewportHeight
    );

    let snapshot = null;
    if (entry.snapshot && typeof entry.snapshot === 'object') {
        const snapshotWidth = clampNumber(
            entry.snapshot.width ?? width,
            320,
            viewportWidth
        );
        const snapshotHeight = clampNumber(
            entry.snapshot.height ?? height,
            260,
            viewportHeight
        );
        const snapshotCoords = clampWindowCoords(
            entry.snapshot.x ?? coords.x,
            entry.snapshot.y ?? MAC_STAGE_MARGIN,
            snapshotWidth,
            snapshotHeight,
            viewportWidth,
            viewportHeight
        );
        snapshot = {
            x: snapshotCoords.x,
            y: snapshotCoords.y,
            width: snapshotWidth,
            height: snapshotHeight,
        };
    }

    const instanceId =
        typeof entry.instanceId === 'string' && entry.instanceId.trim().length > 0
            ? entry.instanceId.trim()
            : entry.isAppWindow
                ? PRIMARY_INSTANCE_ID
                : null;

    const sanitized = {
        id: typeof entry.id === 'string' ? entry.id : `${entry.type}-${Math.random().toString(36).slice(2, 8)}`,
        type: entry.type ?? WINDOW_TYPES.SCRATCHPAD,
        title: typeof entry.title === 'string' ? entry.title : typeToTitle(entry.type),
        instanceId,
        width,
        height,
        x: coords.x,
        y: coords.y,
        z: typeof entry.z === 'number' ? entry.z : 21,
        minimized: Boolean(entry.minimized),
        minimizedByUser: Boolean(entry.minimizedByUser),
        isZoomed: Boolean(entry.isZoomed),
        snapshot,
        allowClose: entry.allowClose !== false,
        allowMinimize: entry.allowMinimize !== false,
        allowZoom: entry.allowZoom !== false,
        isMain: Boolean(entry.isMain),
        isAppWindow: Boolean(entry.isAppWindow),
        appRoutePath: typeof entry.appRoutePath === 'string' ? entry.appRoutePath : null,
        appRouteKey: typeof entry.appRouteKey === 'string' ? entry.appRouteKey : null,
        appIconKey: typeof entry.appIconKey === 'string' ? entry.appIconKey : null,
        appAccent: typeof entry.appAccent === 'string' ? entry.appAccent : null,
        routeLocation: parseStoredLocation(entry.routeLocation, entry.appRoutePath),
    };

    if (sanitized.isAppWindow && sanitized.appIconKey) {
        sanitized.iconComponent = iconForAppKey(sanitized.appIconKey);
    }

    if (sanitized.isZoomed) {
        return expandWindowToViewport(sanitized, viewportWidth, viewportHeight, options);
    }

    return sanitized;
}

function ensureMainWindow(windows, windowTitle, viewportWidth, viewportHeight, options = {}) {
    if (SINGLE_WINDOW_MODE) {
        const main = expandWindowToViewport(
            createMainWindow(windowTitle, viewportWidth, viewportHeight),
            viewportWidth,
            viewportHeight,
            options
        );
        return [
            {
                ...main,
                id: MAIN_WINDOW_ID,
                type: WINDOW_TYPES.MAIN,
                minimized: false,
                minimizedByUser: false,
                allowMinimize: false,
                isAppWindow: true,
                appRoutePath: '/',
                appRouteKey: 'home',
                appIconKey: 'home',
                appAccent: appAccentForKey('home'),
                routeLocation: parseStoredLocation(null, '/'),
            },
        ];
    }
    const existingMain = windows.find((win) => win.type === WINDOW_TYPES.MAIN);
    if (existingMain) {
        return windows.map((win) =>
            win.type === WINDOW_TYPES.MAIN
                ? {
                      ...clampWindowToViewport(
                          {
                              ...win,
                              title: windowTitle,
                              allowClose: false,
                              allowMinimize: true,
                              allowZoom: true,
                              isMain: true,
                          },
                          viewportWidth,
                          viewportHeight,
                          options
                      ),
                      minimizedByUser: Boolean(win.minimizedByUser),
                  }
                : {
                      ...clampWindowToViewport(win, viewportWidth, viewportHeight, options),
                      minimizedByUser: Boolean(win.minimizedByUser),
                  }
        );
    }
    return [
        createMainWindow(windowTitle, viewportWidth, viewportHeight),
        ...windows.map((win) => ({
            ...clampWindowToViewport(win, viewportWidth, viewportHeight, options),
            minimizedByUser: Boolean(win.minimizedByUser),
        })),
    ];
}

function createDefaultWindows(windowTitle, viewportWidth, viewportHeight) {
    const nextZ = (() => {
        let current = 20;
        return () => {
            current += 1;
            return current;
        };
    })();

    const main = createMainWindow(windowTitle, viewportWidth, viewportHeight, nextZ());

    if (SINGLE_WINDOW_MODE) {
        return [main];
    }
    const scratchpad = clampWindowToViewport(
        {
            id: WINDOW_TYPES.SCRATCHPAD,
            type: WINDOW_TYPES.SCRATCHPAD,
            title: 'Scratchpad',
            width: Math.min(380, viewportWidth - 120),
            height: Math.min(320, viewportHeight - 180),
            x: Math.max(main.x - 420, 36),
            y: Math.min(main.y + 60, viewportHeight - 360),
            z: nextZ(),
            minimized: false,
            minimizedByUser: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: true,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const status = clampWindowToViewport(
        {
            id: WINDOW_TYPES.STATUS,
            type: WINDOW_TYPES.STATUS,
            title: 'System Status',
            width: Math.min(420, viewportWidth - 140),
            height: Math.min(360, viewportHeight - 200),
            x: Math.min(main.x + 40, viewportWidth - 460),
            y: Math.max(main.y - 340, MAC_STAGE_MARGIN),
            z: nextZ(),
            minimized: false,
            minimizedByUser: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: true,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const nowPlaying = clampWindowToViewport(
        {
            id: WINDOW_TYPES.NOW_PLAYING,
            type: WINDOW_TYPES.NOW_PLAYING,
            title: 'Now Playing',
            width: Math.min(320, viewportWidth - 120),
            height: Math.min(280, viewportHeight - 200),
            x: Math.min(main.x + main.width + 32, viewportWidth - 360),
            y: Math.max(main.y + 12, MAC_HEADER_HEIGHT + 24),
            z: nextZ(),
            minimized: false,
            minimizedByUser: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: false,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );
    const queue = clampWindowToViewport(
        {
            id: WINDOW_TYPES.QUEUE,
            type: WINDOW_TYPES.QUEUE,
            title: 'Action Queue',
            width: Math.min(320, viewportWidth - 120),
            height: Math.min(300, viewportHeight - 180),
            x: Math.min(nowPlaying.x, viewportWidth - 340),
            y: Math.min(nowPlaying.y + nowPlaying.height + 24, viewportHeight - 340),
            z: nextZ(),
            minimized: false,
            minimizedByUser: false,
            isZoomed: false,
            snapshot: null,
            allowClose: true,
            allowMinimize: true,
            allowZoom: false,
            isMain: false,
        },
        viewportWidth,
        viewportHeight
    );

    return [main, scratchpad, status, nowPlaying, queue];
}

const SNAP_THRESHOLD = 84;
const SNAP_CENTER_THRESHOLD = 140;
const SNAP_GAP = 24;

const SNAP_LABELS = {
    full: 'Fill Stage',
    left: 'Left Split',
    right: 'Right Split',
    top: 'Top Half',
    bottom: 'Bottom Half',
    tl: 'Top Left',
    tr: 'Top Right',
    bl: 'Bottom Left',
    br: 'Bottom Right',
    center: 'Centered',
};

function labelForSnapTarget(target) {
    return SNAP_LABELS[target] ?? 'Snap Layout';
}

function computeStageArea(viewportWidth, viewportHeight) {
    const horizontalMargin = 24;
    const topMargin = MAC_STAGE_MARGIN;
    const bottomMargin = 24;
    const width = Math.max(360, viewportWidth - horizontalMargin * 2);
    const height = Math.max(320, viewportHeight - topMargin - bottomMargin);
    return {
        x: horizontalMargin,
        y: topMargin,
        width,
        height,
    };
}

function getSnapRect(target, viewportWidth, viewportHeight) {
    const stage = computeStageArea(viewportWidth, viewportHeight);
    const halfWidth = Math.max(stage.width / 2 - SNAP_GAP / 2, 320);
    const halfHeight = Math.max(stage.height / 2 - SNAP_GAP / 2, 260);

    switch (target) {
        case 'full':
            return {
                x: stage.x,
                y: stage.y,
                width: stage.width,
                height: stage.height,
            };
        case 'left':
            return {
                x: stage.x,
                y: stage.y,
                width: halfWidth,
                height: stage.height,
            };
        case 'right':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y,
                width: halfWidth,
                height: stage.height,
            };
        case 'top':
            return {
                x: stage.x,
                y: stage.y,
                width: stage.width,
                height: halfHeight,
            };
        case 'bottom':
            return {
                x: stage.x,
                y: stage.y + stage.height - halfHeight,
                width: stage.width,
                height: halfHeight,
            };
        case 'tl':
            return {
                x: stage.x,
                y: stage.y,
                width: halfWidth,
                height: halfHeight,
            };
        case 'tr':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y,
                width: halfWidth,
                height: halfHeight,
            };
        case 'bl':
            return {
                x: stage.x,
                y: stage.y + stage.height - halfHeight,
                width: halfWidth,
                height: halfHeight,
            };
        case 'br':
            return {
                x: stage.x + stage.width - halfWidth,
                y: stage.y + stage.height - halfHeight,
                width: halfWidth,
                height: halfHeight,
            };
        case 'center': {
            const width = Math.max(Math.min(stage.width * 0.7, 980), 420);
            const height = Math.max(Math.min(stage.height * 0.72, 680), 320);
            return {
                x: stage.x + (stage.width - width) / 2,
                y: stage.y + (stage.height - height) / 2,
                width,
                height,
            };
        }
        default:
            return null;
    }
}

function computeSnapCandidate({ pointerX, pointerY, viewportWidth, viewportHeight, disable }) {
    if (disable) return null;
    const stage = computeStageArea(viewportWidth, viewportHeight);
    if (
        pointerX < stage.x - SNAP_THRESHOLD ||
        pointerX > stage.x + stage.width + SNAP_THRESHOLD ||
        pointerY < stage.y - SNAP_THRESHOLD ||
        pointerY > stage.y + stage.height + SNAP_THRESHOLD
    ) {
        return null;
    }

    const distLeft = pointerX - stage.x;
    const distRight = stage.x + stage.width - pointerX;
    const distTop = pointerY - stage.y;
    const distBottom = stage.y + stage.height - pointerY;

    let target = null;

    if (distLeft < SNAP_THRESHOLD && distTop < SNAP_THRESHOLD) {
        target = 'tl';
    } else if (distRight < SNAP_THRESHOLD && distTop < SNAP_THRESHOLD) {
        target = 'tr';
    } else if (distLeft < SNAP_THRESHOLD && distBottom < SNAP_THRESHOLD) {
        target = 'bl';
    } else if (distRight < SNAP_THRESHOLD && distBottom < SNAP_THRESHOLD) {
        target = 'br';
    } else if (distLeft < SNAP_THRESHOLD) {
        target = 'left';
    } else if (distRight < SNAP_THRESHOLD) {
        target = 'right';
    } else if (distTop < SNAP_THRESHOLD) {
        const centerX = stage.x + stage.width / 2;
        const centerRange = Math.max(stage.width * 0.24, 220);
        target = Math.abs(pointerX - centerX) < centerRange ? 'full' : 'top';
    } else if (distBottom < SNAP_THRESHOLD) {
        target = 'bottom';
    } else {
        const centerX = stage.x + stage.width / 2;
        const centerY = stage.y + stage.height / 2;
        const withinCenterX = Math.abs(pointerX - centerX) < SNAP_CENTER_THRESHOLD;
        const withinCenterY = Math.abs(pointerY - centerY) < SNAP_CENTER_THRESHOLD;
        if (withinCenterX && withinCenterY) {
            target = 'center';
        }
    }

    if (!target) return null;
    const rect = getSnapRect(target, viewportWidth, viewportHeight);
    if (!rect) return null;
    return { target, rect };
}

function rectsEqual(a, b, tolerance = 0.5) {
    return (
        Math.abs(a.x - b.x) <= tolerance &&
        Math.abs(a.y - b.y) <= tolerance &&
        Math.abs(a.width - b.width) <= tolerance &&
        Math.abs(a.height - b.height) <= tolerance
    );
}

function reconcileSnapPreview(previous, candidate, id) {
    if (!candidate) {
        if (previous && previous.id === id) {
            return null;
        }
        return previous;
    }
    const next = { ...candidate, id };
    if (previous && previous.id === id && previous.target === next.target && rectsEqual(previous.rect, next.rect)) {
        return previous;
    }
    return next;
}

function applySnapLayout(win, target, viewportWidth, viewportHeight, options = {}) {
    const rect = getSnapRect(target, viewportWidth, viewportHeight);
    if (!rect) return win;
    if (target === 'full') {
        const snapshot = {
            x: win.x,
            y: win.y,
            width: win.width,
            height: win.height,
        };
        return expandWindowToViewport(
            {
                ...win,
                snapshot,
            },
            viewportWidth,
            viewportHeight,
            options
        );
    }

    const width = clampNumber(rect.width, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(rect.height, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(rect.x, rect.y, width, height, viewportWidth, viewportHeight);

    return {
        ...win,
        x: coords.x,
        y: coords.y,
        width,
        height,
        isZoomed: false,
        snapshot: null,
    };
}

function createMainWindow(windowTitle, viewportWidth, viewportHeight, z = 21) {
    const width = clampNumber(940, 360, viewportWidth - 96);
    const height = clampNumber(640, 320, viewportHeight - 180);
    const x = Math.max((viewportWidth - width) / 2, 24);
    const y = Math.max((viewportHeight - height) / 2 + 12, MAC_HEADER_HEIGHT);
    const snapshot = { x, y, width, height };
    return {
        id: MAIN_WINDOW_ID,
        type: WINDOW_TYPES.MAIN,
        title: windowTitle,
        width,
        height,
        x,
        y,
        z,
        minimized: false,
        minimizedByUser: false,
        isZoomed: true,
        snapshot,
        allowClose: false,
        allowMinimize: true,
        allowZoom: true,
        isMain: true,
    };
}

function expandWindowToViewport(win, viewportWidth, viewportHeight, options = {}) {
    // Fill the available viewport like macOS fullscreen while keeping the menu bar visible
    // when it is pinned. If the menu bar is set to auto-hide, allow the window to rise
    // closer to the top for a truer immersive feel.
    const visualViewport = typeof window !== 'undefined' ? window.visualViewport : null;
    const insetTop = Math.max(visualViewport?.offsetTop ?? 0, 0);
    const insetLeft = Math.max(visualViewport?.offsetLeft ?? 0, 0);
    const insetRight = Math.max(visualViewport ? viewportWidth - visualViewport.width - visualViewport.offsetLeft : 0, 0);
    const insetBottom = Math.max(visualViewport ? viewportHeight - visualViewport.height - visualViewport.offsetTop : 0, 0);
    const padding = 6; // tiny breathing room to avoid clipping shadows
    const autoHideMenuBar = Boolean(options.autoHideMenuBar);
    const reservedTop = autoHideMenuBar ? Math.max(insetTop + padding, padding) : Math.max(MAC_HEADER_HEIGHT, insetTop + 12);
    const reservedBottom = Math.max(18, insetBottom + 8);
    const x = insetLeft + padding;
    const y = reservedTop;
    const width = Math.max(viewportWidth - insetLeft - insetRight - padding * 2, 360);
    const height = Math.max(viewportHeight - reservedTop - reservedBottom - padding, 260);

    return {
        ...win,
        x,
        y,
        width,
        height,
        isZoomed: true,
    };
}

function clampWindowToViewport(win, viewportWidth, viewportHeight, options = {}) {
    if (win.isZoomed) {
        return expandWindowToViewport(win, viewportWidth, viewportHeight, options);
    }
    const width = clampNumber(win.width ?? 420, 320, Math.max(viewportWidth - 48, 360));
    const height = clampNumber(win.height ?? 320, 260, Math.max(viewportHeight - 120, 260));
    const coords = clampWindowCoords(
        win.x ?? 48,
        win.y ?? MAC_STAGE_MARGIN,
        width,
        height,
        viewportWidth,
        viewportHeight
    );
    return {
        ...win,
        width,
        height,
        x: coords.x,
        y: coords.y,
    };
}

function serializeWindowEntry(win) {
    return {
        id: win.id,
        type: win.type,
        title: win.title,
        instanceId: win.instanceId || null,
        width: win.width,
        height: win.height,
        x: win.x,
        y: win.y,
        z: win.z,
        minimized: win.minimized,
        minimizedByUser: Boolean(win.minimizedByUser),
        isZoomed: win.isZoomed,
        snapshot: win.snapshot,
        allowClose: win.allowClose,
        allowMinimize: win.allowMinimize,
        allowZoom: win.allowZoom,
        isMain: win.isMain,
        isAppWindow: Boolean(win.isAppWindow),
        appRoutePath: win.appRoutePath || null,
        appRouteKey: win.appRouteKey || null,
        appIconKey: win.appIconKey || null,
        appAccent: win.appAccent || null,
        routeLocation: serializeRouteLocation(win.routeLocation, win.appRoutePath),
    };
}

function parseFiniteNumber(value) {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function clampNumber(value, min, max) {
    const numericValue = Number(value);
    const numericMin = Number(min);
    const numericMax = Number(max);

    const safeMin = Number.isFinite(numericMin) ? numericMin : 0;
    const safeMaxCandidate = Number.isFinite(numericMax) ? numericMax : safeMin;
    const upperBound = Math.max(safeMin, safeMaxCandidate);

    if (!Number.isFinite(numericValue)) {
        return safeMin;
    }

    return Math.min(Math.max(numericValue, safeMin), upperBound);
}

function clampWindowCoords(x, y, width, height, viewportWidth, viewportHeight) {
    const maxX = Math.max(viewportWidth - width - 24, 12);
    const maxY = Math.max(viewportHeight - height - 24, MAC_STAGE_MARGIN);
    const clampedX = clampNumber(x, 12, maxX);
    const clampedY = clampNumber(y, MAC_STAGE_MARGIN, maxY);
    return { x: clampedX, y: clampedY };
}

function StatusCard({ label, value, trend, emphasize }) {
    return (
        <div className={`rounded-2xl border border-slate-200/60 bg-white/70 p-4 shadow-sm transition hover:border-brand-300/60 hover:bg-white/80 dark:border-slate-700/60 dark:bg-slate-900/70 ${emphasize ? 'shadow-[0_22px_55px_-30px_rgba(10,132,255,0.55)] ring-1 ring-brand-300/50 dark:ring-brand-400/40' : ''}`}>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">{label}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-800 dark:text-slate-100">{value}</p>
            <p className="text-xs font-medium text-brand-500 dark:text-brand-300">{trend}</p>
        </div>
    );
}

StatusCard.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.string.isRequired,
    trend: PropTypes.string.isRequired,
    emphasize: PropTypes.bool,
};

StatusCard.defaultProps = {
    emphasize: false,
};
