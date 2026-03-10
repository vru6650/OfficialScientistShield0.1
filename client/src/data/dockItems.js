import homeIcon from '../assets/dock/home.svg';
import aboutIcon from '../assets/dock/about.svg';
import tutorialsIcon from '../assets/dock/tutorials.svg';
import quizzesIcon from '../assets/dock/quizzes.svg';
import toolsIcon from '../assets/dock/tools.svg';
import problemsIcon from '../assets/dock/problems.svg';
import dashboardIcon from '../assets/dock/dashboard.svg';
import quickAddIcon from '../assets/dock/quick-add.svg';
import themeIcon from '../assets/dock/theme.svg';
import fileManagerIcon from '../assets/dock/file-manager.svg';
import settingsIcon from '../assets/dock/settings.svg';
import communityIcon from '../assets/dock/community.svg';

const getIconPack = () => {
    if (typeof window === 'undefined') return 'default';
    try {
        return localStorage.getItem('iconPack') || 'default';
    } catch {
        return 'default';
    }
};

const buildIconSrc = (key, fallbackImport) => {
    const pack = getIconPack();
    if (pack === 'whitesur') return `/icons/whitesur/${key}.svg`;
    return fallbackImport;
};

export const resolveDockIcons = (items) =>
    items.map((item) => ({
        ...item,
        iconSrc: buildIconSrc(item.key, item.fallbackIconSrc ?? item.iconSrc),
    }));

export const baseDockItems = [
    {
        key: 'home',
        to: '/',
        label: 'Home',
        iconSrc: buildIconSrc('home', homeIcon),
        fallbackIconSrc: homeIcon,
        iconAlt: 'Home dock icon',
        match: (path) => path === '/',
    },
    {
        key: 'about',
        to: '/about',
        label: 'About',
        iconSrc: buildIconSrc('about', aboutIcon),
        fallbackIconSrc: aboutIcon,
        iconAlt: 'About dock icon',
        match: (path) => path.startsWith('/about'),
    },
    {
        key: 'community',
        to: '/community',
        label: 'Community',
        iconSrc: buildIconSrc('community', communityIcon),
        fallbackIconSrc: communityIcon,
        iconAlt: 'Community dock icon',
        match: (path) => path.startsWith('/community'),
    },
    {
        key: 'tutorials',
        to: '/tutorials',
        label: 'Tutorials',
        iconSrc: buildIconSrc('tutorials', tutorialsIcon),
        fallbackIconSrc: tutorialsIcon,
        iconAlt: 'Tutorials dock icon',
        match: (path) => path.startsWith('/tutorials'),
    },
    {
        key: 'quizzes',
        to: '/quizzes',
        label: 'Quizzes',
        iconSrc: buildIconSrc('quizzes', quizzesIcon),
        fallbackIconSrc: quizzesIcon,
        iconAlt: 'Quizzes dock icon',
        match: (path) => path.startsWith('/quizzes'),
    },
    {
        key: 'tools',
        to: '/tools',
        label: 'Tools',
        iconSrc: buildIconSrc('tools', toolsIcon),
        fallbackIconSrc: toolsIcon,
        iconAlt: 'Tools dock icon',
        match: (path) => path.startsWith('/tools'),
    },
    {
        key: 'file-manager',
        to: '/file-manager',
        label: 'Files',
        iconSrc: buildIconSrc('file-manager', fileManagerIcon),
        fallbackIconSrc: fileManagerIcon,
        iconAlt: 'File Manager dock icon',
        match: (path) => path.startsWith('/file-manager'),
    },
    {
        key: 'problems',
        to: '/problems',
        label: 'Problems',
        iconSrc: buildIconSrc('problems', problemsIcon),
        fallbackIconSrc: problemsIcon,
        iconAlt: 'Problems dock icon',
        match: (path) => path.startsWith('/problems'),
    },
];

export const dashboardDockItem = {
    key: 'dashboard',
    to: '/dashboard',
    label: 'Dashboard',
    iconSrc: buildIconSrc('dashboard', dashboardIcon),
    fallbackIconSrc: dashboardIcon,
    iconAlt: 'Dashboard dock icon',
    match: (path) => path.startsWith('/dashboard'),
    requiresAuth: true,
};

export const quickAddDockItem = {
    key: 'quick-add',
    type: 'quick-add',
    label: 'Quick Add',
    iconSrc: buildIconSrc('quick-add', quickAddIcon),
    fallbackIconSrc: quickAddIcon,
    iconAlt: 'Open quick add shortcuts',
};

export const themeDockItem = {
    key: 'theme',
    type: 'theme',
    label: 'Theme',
    iconSrc: buildIconSrc('theme', themeIcon),
    fallbackIconSrc: themeIcon,
    iconAlt: 'Toggle theme',
};

export const settingsDockItem = {
    key: 'settings',
    type: 'settings',
    label: 'Settings',
    iconSrc: buildIconSrc('settings', settingsIcon),
    fallbackIconSrc: settingsIcon,
    iconAlt: 'Open settings',
};

export const baseDockSequence = [...baseDockItems, quickAddDockItem, settingsDockItem, themeDockItem];

export const dockSequenceWithDashboard = [
    ...baseDockItems,
    dashboardDockItem,
    quickAddDockItem,
    settingsDockItem,
    themeDockItem,
];
