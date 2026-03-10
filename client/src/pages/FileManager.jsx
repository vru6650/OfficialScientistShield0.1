import { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMutation, useQuery, useQueryClient, useQueries } from '@tanstack/react-query';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import {
    HiOutlineFolder,
    HiOutlineDocumentText,
    HiOutlineTrash,
    HiOutlinePencilSquare,
    HiOutlineSparkles,
    HiOutlineMagnifyingGlass,
    HiOutlineChevronRight,
    HiOutlineChevronDown,
    HiOutlineArrowUpOnSquare,
    HiOutlinePlus,
    HiOutlineSquare2Stack,
    HiOutlineListBullet,
    HiOutlineArrowsUpDown,
    HiOutlineArrowPath,
    HiOutlineEye,
    HiOutlineEllipsisHorizontal,
    HiOutlineSquares2X2,
    HiOutlineViewColumns,
    HiOutlinePhoto,
    HiOutlinePlayCircle,
    HiOutlineClock,
} from 'react-icons/hi2';
import {
    createFolder,
    deleteFileNode,
    getDirectory,
    getFolderTree,
    updateFileNode,
    uploadFile,
} from '../services/fileManagerService.js';
import folderIcon from '../assets/finder/folder.svg';
import imageIcon from '../assets/finder/image.svg';
import videoIcon from '../assets/finder/video.svg';
import audioIcon from '../assets/finder/audio.svg';
import documentIcon from '../assets/finder/document.svg';
import codeIcon from '../assets/finder/code.svg';
import archiveIcon from '../assets/finder/archive.svg';
import defaultIcon from '../assets/finder/default.svg';
import pdfIcon from '../assets/finder/pdf.svg';
import wordIcon from '../assets/finder/word.svg';
import excelIcon from '../assets/finder/excel.svg';
import powerpointIcon from '../assets/finder/powerpoint.svg';
import textIcon from '../assets/finder/text.svg';
import designIcon from '../assets/finder/design.svg';
import fontIcon from '../assets/finder/font.svg';

const DND_TYPE = 'FILE_NODE';

const FINDER_ICON_MAP = {
    folder: {
        key: 'finder/folder',
        fallback: folderIcon,
    },
    image: {
        key: 'finder/image',
        fallback: imageIcon,
    },
    video: {
        key: 'finder/video',
        fallback: videoIcon,
    },
    audio: {
        key: 'finder/audio',
        fallback: audioIcon,
    },
    document: {
        key: 'finder/document',
        fallback: documentIcon,
    },
    code: {
        key: 'finder/code',
        fallback: codeIcon,
    },
    archive: {
        key: 'finder/archive',
        fallback: archiveIcon,
    },
    pdf: {
        key: 'finder/pdf',
        fallback: pdfIcon,
    },
    word: {
        key: 'finder/word',
        fallback: wordIcon,
    },
    excel: {
        key: 'finder/excel',
        fallback: excelIcon,
    },
    powerpoint: {
        key: 'finder/powerpoint',
        fallback: powerpointIcon,
    },
    text: {
        key: 'finder/text',
        fallback: textIcon,
    },
    design: {
        key: 'finder/design',
        fallback: designIcon,
    },
    font: {
        key: 'finder/font',
        fallback: fontIcon,
    },
    default: {
        key: 'finder/default',
        fallback: defaultIcon,
    },
};

const FILE_EXTENSION_GROUPS = {
    image: new Set(['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'ico', 'heic', 'heif', 'raw']),
    audio: new Set(['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma']),
    video: new Set(['mp4', 'mov', 'avi', 'mkv', 'webm', 'mpeg', 'mpg', 'm4v']),
    code: new Set(['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'rb', 'php', 'go', 'rs', 'swift', 'kt', 'json', 'yaml', 'yml', 'html', 'css', 'scss', 'md']),
    document: new Set(['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'rtf', 'odt', 'key', 'pages', 'numbers']),
    archive: new Set(['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz']),
    design: new Set(['psd', 'ai', 'xd', 'sketch', 'fig', 'blend', 'figma']),
    font: new Set(['ttf', 'otf', 'woff', 'woff2', 'eot']),
};

const EXTENSION_ICON_OVERRIDES = new Map([
    ['pdf', 'pdf'],
    ['doc', 'word'],
    ['docx', 'word'],
    ['dot', 'word'],
    ['dotx', 'word'],
    ['rtf', 'word'],
    ['pages', 'word'],
    ['xls', 'excel'],
    ['xlsx', 'excel'],
    ['xlsm', 'excel'],
    ['csv', 'excel'],
    ['numbers', 'excel'],
    ['ppt', 'powerpoint'],
    ['pptx', 'powerpoint'],
    ['key', 'powerpoint'],
    ['txt', 'text'],
    ['md', 'text'],
    ['markdown', 'text'],
    ['log', 'text'],
    ['psd', 'design'],
    ['ai', 'design'],
    ['sketch', 'design'],
    ['fig', 'design'],
    ['xd', 'design'],
    ['blend', 'design'],
    ['ttf', 'font'],
    ['otf', 'font'],
    ['woff', 'font'],
    ['woff2', 'font'],
]);

const MIME_ICON_OVERRIDES = new Map([
    ['application/pdf', 'pdf'],
    ['application/msword', 'word'],
    ['application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'word'],
    ['application/vnd.ms-excel', 'excel'],
    ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'excel'],
    ['application/vnd.ms-powerpoint', 'powerpoint'],
    ['application/vnd.openxmlformats-officedocument.presentationml.presentation', 'powerpoint'],
    ['text/plain', 'text'],
]);

const getIconPack = () => {
    if (typeof window === 'undefined') return 'default';
    try {
        return localStorage.getItem('iconPack') || 'default';
    } catch (error) {
        return 'default';
    }
};

const buildFinderIconSrc = (key, fallback) => {
    const pack = getIconPack();
    if (pack === 'whitesur') {
        return `/icons/whitesur/${key}.svg`;
    }
    return fallback;
};

const FINDER_QUICK_FILTERS = [
    {
        value: 'all',
        label: 'All',
        description: 'Everything in view',
        icon: HiOutlineSquares2X2,
    },
    {
        value: 'folders',
        label: 'Folders',
        description: 'Only folders',
        icon: HiOutlineFolder,
    },
    {
        value: 'images',
        label: 'Images',
        description: 'Photos & graphics',
        icon: HiOutlinePhoto,
    },
    {
        value: 'documents',
        label: 'Documents',
        description: 'Docs & PDFs',
        icon: HiOutlineDocumentText,
    },
    {
        value: 'media',
        label: 'Media',
        description: 'Video & audio',
        icon: HiOutlinePlayCircle,
    },
    {
        value: 'recent',
        label: 'Recents',
        description: 'Updated last 7 days',
        icon: HiOutlineClock,
    },
];

const FINDER_SPACES = [
    {
        id: 'workspace',
        label: 'Workspace',
        description: 'Design handoffs & briefs',
        previewLayout: 'grid',
        accent: 'from-sky-200/60 via-white/90 to-slate-100/80',
        preferences: {
            viewMode: 'grid',
            sortOption: 'date-desc',
            filterCategory: 'documents',
            searchTerm: '',
        },
    },
    {
        id: 'media',
        label: 'Media Lab',
        description: 'Raw visuals & edits',
        previewLayout: 'column',
        accent: 'from-indigo-200/60 via-white/85 to-slate-100/75',
        preferences: {
            viewMode: 'column',
            sortOption: 'name-asc',
            filterCategory: 'images',
            searchTerm: '',
        },
    },
    {
        id: 'archive',
        label: 'Archive',
        description: 'Long-term storage',
        previewLayout: 'list',
        accent: 'from-amber-200/60 via-white/85 to-slate-100/80',
        preferences: {
            viewMode: 'list',
            sortOption: 'size-desc',
            filterCategory: 'all',
            searchTerm: '',
        },
    },
    {
        id: 'shared',
        label: 'Shared Space',
        description: 'Team dropbox',
        previewLayout: 'grid',
        accent: 'from-emerald-200/55 via-white/85 to-slate-100/70',
        preferences: {
            viewMode: 'grid',
            sortOption: 'name-asc',
            filterCategory: 'media',
            searchTerm: '',
        },
    },
];

const RECENT_THRESHOLD_MS = 1000 * 60 * 60 * 24 * 7;

const getItemExtension = (item) => {
    if (!item) return '';
    if (item.extension) return item.extension.toLowerCase();
    const segments = (item.name || '').split('.');
    if (segments.length <= 1) return '';
    return segments.pop().toLowerCase();
};

const formatBytes = (value) => {
    if (!value || Number.isNaN(value)) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = value;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
        size /= 1024;
        unitIndex += 1;
    }
    const precision = size >= 10 || unitIndex === 0 ? 0 : 1;
    return `${size.toFixed(precision)} ${units[unitIndex]}`;
};

const matchesFilterCategory = (item, category) => {
    if (!item || category === 'all') return true;

    if (category === 'folders') {
        return item.type === 'folder';
    }

    if (category === 'recent') {
        if (!item.updatedAt) return false;
        const updatedAt = new Date(item.updatedAt).getTime();
        if (Number.isNaN(updatedAt)) return false;
        return Date.now() - updatedAt <= RECENT_THRESHOLD_MS;
    }

    if (item.type !== 'file') return false;

    const extension = getItemExtension(item);
    const mime = item.mimeType || '';

    if (category === 'images') {
        return FILE_EXTENSION_GROUPS.image.has(extension) || mime.startsWith('image/');
    }

    if (category === 'documents') {
        return (
            FILE_EXTENSION_GROUPS.document.has(extension) ||
            MIME_ICON_OVERRIDES.get(mime) === 'pdf' ||
            MIME_ICON_OVERRIDES.get(mime) === 'word' ||
            MIME_ICON_OVERRIDES.get(mime) === 'excel' ||
            MIME_ICON_OVERRIDES.get(mime) === 'powerpoint' ||
            MIME_ICON_OVERRIDES.get(mime) === 'text'
        );
    }

    if (category === 'media') {
        return (
            FILE_EXTENSION_GROUPS.video.has(extension) ||
            FILE_EXTENSION_GROUPS.audio.has(extension) ||
            mime.startsWith('video/') ||
            mime.startsWith('audio/')
        );
    }

    return true;
};

const sortItemsByOption = (items, option) => {
    const clone = [...items];
    const parseDate = (value) => new Date(value || Date.now()).getTime();
    const comparators = {
        'name-asc': (a, b) => a.name.localeCompare(b.name),
        'name-desc': (a, b) => b.name.localeCompare(a.name),
        'date-desc': (a, b) => parseDate(b.updatedAt) - parseDate(a.updatedAt),
        'date-asc': (a, b) => parseDate(a.updatedAt) - parseDate(b.updatedAt),
        'size-desc': (a, b) => (b.size || 0) - (a.size || 0),
        'size-asc': (a, b) => (a.size || 0) - (b.size || 0),
    };
    const compare = comparators[option] ?? comparators['name-asc'];
    clone.sort(compare);
    return clone;
};

export default function FileManager() {
    const queryClient = useQueryClient();
    const [currentFolder, setCurrentFolder] = useState(null);
    const [breadcrumbTrail, setBreadcrumbTrail] = useState([{ id: null, name: 'All Files' }]);
    const [expandedFolders, setExpandedFolders] = useState(() => new Set([null]));
    const [selectedItemId, setSelectedItemId] = useState(null);
    const [viewMode, setViewMode] = useState('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortOption, setSortOption] = useState('name-asc');
    const [quickLookItem, setQuickLookItem] = useState(null);
    const [filterCategory, setFilterCategory] = useState('all');
    const [activeSpaceId, setActiveSpaceId] = useState(FINDER_SPACES[0].id);

    const { data: directoryData, isFetching: isDirectoryLoading } = useQuery({
        queryKey: ['file-directory', currentFolder],
        queryFn: () => getDirectory(currentFolder),
    });

    const { data: treeData } = useQuery({
        queryKey: ['file-tree'],
        queryFn: getFolderTree,
    });

    const createFolderMutation = useMutation({
        mutationFn: createFolder,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['file-directory', variables.parentId ?? null] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const uploadFileMutation = useMutation({
        mutationFn: uploadFile,
        onSuccess: (_, variables) => {
            queryClient.invalidateQueries({ queryKey: ['file-directory', variables.parentId ?? null] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const updateNodeMutation = useMutation({
        mutationFn: updateFileNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-directory'] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
        },
    });

    const deleteNodeMutation = useMutation({
        mutationFn: deleteFileNode,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['file-directory'] });
            queryClient.invalidateQueries({ queryKey: ['file-tree'] });
            setSelectedItemId(null);
        },
    });

    const items = useMemo(() => directoryData?.items ?? [], [directoryData]);
    const breadcrumbs = breadcrumbTrail;
    const activeSpace = useMemo(
        () => FINDER_SPACES.find((space) => space.id === activeSpaceId) ?? FINDER_SPACES[0],
        [activeSpaceId]
    );

    const filteredItems = useMemo(() => {
        const lowered = searchTerm.trim().toLowerCase();
        return items.filter((item) => {
            const matchesSearch = !lowered || item.name.toLowerCase().includes(lowered);
            const matchesFilter = matchesFilterCategory(item, filterCategory);
            return matchesSearch && matchesFilter;
        });
    }, [items, searchTerm, filterCategory]);

    const sortedItems = useMemo(() => sortItemsByOption(filteredItems, sortOption), [filteredItems, sortOption]);

    const columnQueries = useQueries({
        queries: breadcrumbs.map((crumb, index) => ({
            queryKey: ['file-directory', crumb.id ?? null],
            queryFn: () => getDirectory(crumb.id ?? null),
            enabled: viewMode === 'column' && index !== breadcrumbs.length - 1,
        })),
    });

    const columnData = useMemo(() => {
        if (viewMode !== 'column') return [];
        return breadcrumbs.map((crumb, index) => {
            if (index === breadcrumbs.length - 1) {
                return {
                    breadcrumb: crumb,
                    items: sortedItems,
                    isLoading: isDirectoryLoading,
                };
            }
            const query = columnQueries[index];
            const queryItems = query?.data?.items ?? [];
            return {
                breadcrumb: crumb,
                items: sortItemsByOption(queryItems, sortOption),
                isLoading: query?.isFetching ?? query?.isLoading ?? false,
            };
        });
    }, [viewMode, breadcrumbs, columnQueries, sortedItems, isDirectoryLoading, sortOption]);

    useEffect(() => {
        if (directoryData?.breadcrumbs) {
            setBreadcrumbTrail(directoryData.breadcrumbs);
        }
    }, [directoryData]);

    const selectedItem = useMemo(
        () => sortedItems.find((item) => item.id === selectedItemId) ?? items.find((item) => item.id === selectedItemId) ?? null,
        [sortedItems, items, selectedItemId]
    );

    useEffect(() => {
        setSelectedItemId((prev) => {
            if (!prev) return prev;
            const exists = sortedItems.some((item) => item.id === prev);
            return exists ? prev : null;
        });
    }, [sortedItems]);

    useEffect(() => {
        if (selectedItem && selectedItem.parentId && selectedItem.parentId.toString() !== (currentFolder ?? '').toString()) {
            setSelectedItemId(null);
        }
    }, [selectedItem, currentFolder]);

    const handleNavigate = useCallback(
        (folderId, nextBreadcrumbs = null) => {
            setCurrentFolder(folderId);
            setSelectedItemId(null);
            if (nextBreadcrumbs) {
                setBreadcrumbTrail(nextBreadcrumbs);
            }
        },
        [setBreadcrumbTrail]
    );

    const handleFolderToggle = useCallback((folderId) => {
        setExpandedFolders((prev) => {
            const next = new Set(prev);
            if (next.has(folderId)) {
                next.delete(folderId);
            } else {
                next.add(folderId);
            }
            return next;
        });
    }, []);

    const handleSpaceChange = useCallback(
        (spaceId) => {
            const space = FINDER_SPACES.find((entry) => entry.id === spaceId);
            if (!space) return;
            setActiveSpaceId(spaceId);
            if (space.preferences?.viewMode && space.preferences.viewMode !== viewMode) {
                setViewMode(space.preferences.viewMode);
            }
            if (space.preferences?.sortOption && space.preferences.sortOption !== sortOption) {
                setSortOption(space.preferences.sortOption);
            }
            if (space.preferences?.filterCategory && space.preferences.filterCategory !== filterCategory) {
                setFilterCategory(space.preferences.filterCategory);
            }
            if (space.preferences?.searchTerm !== undefined && space.preferences.searchTerm !== searchTerm) {
                setSearchTerm(space.preferences.searchTerm);
            }
        },
        [viewMode, sortOption, filterCategory, searchTerm]
    );

    const requestCreateFolder = useCallback(() => {
        const name = window.prompt('New folder name');
        if (!name) return;
        createFolderMutation.mutate({ name, parentId: currentFolder });
    }, [createFolderMutation, currentFolder]);

    const requestUpload = useCallback(
        (files) => {
            if (!files?.length) return;
            Array.from(files).forEach((file) => {
                uploadFileMutation.mutate({ file, parentId: currentFolder });
            });
        },
        [uploadFileMutation, currentFolder]
    );

    const requestRename = useCallback(
        (item) => {
            const name = window.prompt('Rename item', item.name);
            if (!name || name === item.name) return;
            updateNodeMutation.mutate({ id: item.id, payload: { name } });
        },
        [updateNodeMutation]
    );

    const requestDelete = useCallback(
        (item) => {
            const confirmed = window.confirm(`Delete "${item.name}"?`);
            if (!confirmed) return;
            deleteNodeMutation.mutate(item.id);
        },
        [deleteNodeMutation]
    );

    const requestMove = useCallback(
        (itemId, targetFolderId) => {
            updateNodeMutation.mutate({ id: itemId, payload: { newParentId: targetFolderId } });
        },
        [updateNodeMutation]
    );

    const handleItemOpen = useCallback(
        (item, options = {}) => {
            if (item.type === 'folder') {
                const { depth } = options;
                if (typeof depth === 'number') {
                    const nextTrail = breadcrumbs.slice(0, depth + 1).concat({ id: item.id, name: item.name });
                    handleNavigate(item.id, nextTrail);
                } else {
                    const nextTrail = breadcrumbs.concat({ id: item.id, name: item.name });
                    handleNavigate(item.id, nextTrail);
                }
                setExpandedFolders((prev) => new Set(prev).add(item.id));
            } else if (item.previewUrl) {
                window.open(item.previewUrl, '_blank', 'noopener,noreferrer');
            }
        },
        [breadcrumbs, handleNavigate]
    );

    const openQuickLook = useCallback(
        (item) => {
            if (item?.type === 'file') {
                setQuickLookItem(item);
            }
        },
        []
    );

    const closeQuickLook = useCallback(() => setQuickLookItem(null), []);

    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({
            queryKey: ['file-directory', currentFolder ?? null],
        });
        queryClient.invalidateQueries({
            queryKey: ['file-tree'],
        });
    }, [queryClient, currentFolder]);

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (!selectedItem) return;
            if (event.code === 'Space' && selectedItem.type === 'file') {
                event.preventDefault();
                openQuickLook(selectedItem);
            }
            if (event.key === 'Enter') {
                handleItemOpen(selectedItem);
            }
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'r') {
                event.preventDefault();
                requestRename(selectedItem);
            }
            if (event.key === 'Delete' || event.key === 'Backspace') {
                event.preventDefault();
                requestDelete(selectedItem);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedItem, handleItemOpen, requestRename, requestDelete, openQuickLook]);

    const originalItemsCount = items.length;
    const filteredCount = sortedItems.length;
    const aggregateSize = sortedItems.reduce((acc, item) => acc + (item.size || 0), 0);
    const activeFilter = FINDER_QUICK_FILTERS.find((option) => option.value === filterCategory) ?? FINDER_QUICK_FILTERS[0];

    return (
        <section className="relative mx-auto flex max-w-7xl flex-col gap-6 px-6 py-10 lg:px-4">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[40px] bg-gradient-to-br from-sky-200/30 via-white/40 to-indigo-200/25 blur-[2px]"
            />
            <div aria-hidden className="pointer-events-none absolute -left-24 top-16 -z-10 h-64 w-64 rounded-full bg-sky-400/30 blur-[120px]" />
            <div aria-hidden className="pointer-events-none absolute -right-16 top-52 -z-10 h-72 w-72 rounded-full bg-cyan-300/25 blur-[120px]" />
            <FinderHero
                totalItems={originalItemsCount}
                visibleItems={filteredCount}
                totalSize={aggregateSize}
                activeSpace={activeSpace}
                onSpaceChange={handleSpaceChange}
            />
            <header className="flex flex-col gap-4 rounded-[28px] border border-white/40 bg-white/60 p-0.5 shadow-[0_30px_90px_-50px_rgba(15,23,42,0.7)] backdrop-blur-xl">
                <div className="rounded-[26px] bg-gradient-to-br from-white/95 via-white/85 to-slate-50/80 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]">
                    <FinderToolbar
                        breadcrumbs={breadcrumbs}
                        onNavigate={handleNavigate}
                        onCreateFolder={requestCreateFolder}
                        onUpload={requestUpload}
                        viewMode={viewMode}
                        onViewModeChange={setViewMode}
                        searchTerm={searchTerm}
                        onSearchChange={setSearchTerm}
                        sortOption={sortOption}
                        onSortChange={setSortOption}
                        isCreating={createFolderMutation.isPending}
                        isUploading={uploadFileMutation.isPending}
                        onQuickLook={() => openQuickLook(selectedItem)}
                        onRefresh={handleRefresh}
                        hasSelection={Boolean(selectedItem)}
                        filterCategory={filterCategory}
                        onFilterChange={setFilterCategory}
                    />
                </div>
            </header>
            <DndProvider backend={HTML5Backend}>
                <div className="flex w-full flex-col gap-4 lg:flex-row">
                    <FinderSidebar
                        tree={treeData}
                        activeId={currentFolder}
                        expandedFolders={expandedFolders}
                        onToggle={handleFolderToggle}
                        onNavigate={handleNavigate}
                        onMove={requestMove}
                    />
                    <FinderContentArea
                        items={sortedItems}
                        originalItems={items}
                        isLoading={isDirectoryLoading}
                        viewMode={viewMode}
                        selectedItemId={selectedItemId}
                        selectedItem={selectedItem}
                        onSelect={setSelectedItemId}
                        onOpen={handleItemOpen}
                        onRename={requestRename}
                        onDelete={requestDelete}
                        onMove={requestMove}
                        activeFolderId={currentFolder}
                        onQuickLook={openQuickLook}
                        columnData={columnData}
                        filterCategory={filterCategory}
                        filterLabel={activeFilter?.label}
                        filterDescription={activeFilter?.description}
                    />
                    {viewMode !== 'column' ? (
                        <FinderPreviewPane
                            item={selectedItem}
                            onRename={requestRename}
                            onDelete={requestDelete}
                            onQuickLook={openQuickLook}
                        />
                    ) : null}
                </div>
                <FinderStatusBar
                    totalItems={originalItemsCount}
                    visibleItems={filteredCount}
                    totalSize={aggregateSize}
                    selection={selectedItem}
                    filterLabel={activeFilter?.label}
                    searchTerm={searchTerm.trim()}
                />
                <QuickLookModal item={quickLookItem} onClose={closeQuickLook} />
            </DndProvider>
        </section>
    );
}

function FinderHero({ totalItems, visibleItems, totalSize, activeSpace, onSpaceChange }) {
    const stats = [
        { label: 'Visible now', value: visibleItems.toLocaleString() },
        { label: 'Library', value: totalItems.toLocaleString() },
        { label: 'Footprint', value: formatBytes(totalSize) },
    ];

    return (
        <div className="relative overflow-hidden rounded-[32px] border border-white/60 bg-gradient-to-br from-white/80 via-slate-50/70 to-sky-50/60 p-6 shadow-[0_32px_90px_-52px_rgba(15,23,42,0.7)] backdrop-blur-2xl">
            <div aria-hidden className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(59,130,246,0.20),transparent_36%),radial-gradient(circle_at_80%_20%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_60%_90%,rgba(16,185,129,0.16),transparent_34%)]" />
            <div className="relative z-10 flex flex-col gap-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-1">
                        <span className="inline-flex items-center gap-2 rounded-full bg-white/70 px-3 py-1 text-[0.7rem] font-semibold uppercase tracking-[0.22em] text-slate-500 shadow-inner shadow-white/80">
                            <HiOutlineSparkles className="text-sky-500" />
                            Liquid Glass · File Manager
                        </span>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Glassmorphism 2.0 workspace</h1>
                        <p className="text-sm text-slate-500 dark:text-slate-300">
                            Browse, sort, and quick-peek files with a tactile glass shell tuned for focus and speed.
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {stats.map((stat) => (
                            <div
                                key={stat.label}
                                className="min-w-[120px] rounded-2xl border border-white/70 bg-white/70 px-4 py-3 text-left shadow-inner shadow-white/80"
                            >
                                <p className="text-[0.7rem] font-semibold uppercase tracking-wide text-slate-400">{stat.label}</p>
                                <p className="text-lg font-bold text-slate-800 dark:text-white">{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="flex flex-wrap gap-3">
                    {FINDER_SPACES.map((space) => {
                        const isActive = activeSpace?.id === space.id;
                        return (
                            <button
                                key={space.id}
                                type="button"
                                onClick={() => onSpaceChange(space.id)}
                                className={`group relative overflow-hidden rounded-2xl border bg-gradient-to-br ${space.accent} px-4 py-3 text-left shadow-[0_16px_40px_-30px_rgba(15,23,42,0.7)] transition ${
                                    isActive
                                        ? 'border-sky-200/80 bg-gradient-to-br from-white/90 to-sky-50/70'
                                        : 'border-white/60 bg-white/70 hover:border-sky-200/70'
                                }`}
                            >
                                <div className="absolute inset-0 opacity-70 mix-blend-screen blur-xl" />
                                <div className="relative flex flex-col gap-1">
                                    <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-wide text-slate-500">
                                        {space.previewLayout} view
                                    </span>
                                    <p className="text-sm font-semibold text-slate-800 dark:text-white">{space.label}</p>
                                    <p className="text-xs text-slate-500 dark:text-slate-300">{space.description}</p>
                                </div>
                                {isActive ? (
                                    <span className="absolute right-3 top-3 rounded-full bg-sky-500/90 px-2 py-0.5 text-[0.65rem] font-semibold uppercase tracking-wide text-white">
                                        Active
                                    </span>
                                ) : null}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

FinderHero.propTypes = {
    totalItems: PropTypes.number.isRequired,
    visibleItems: PropTypes.number.isRequired,
    totalSize: PropTypes.number.isRequired,
    activeSpace: PropTypes.shape({
        id: PropTypes.string,
    }),
    onSpaceChange: PropTypes.func.isRequired,
};

FinderHero.defaultProps = {
    activeSpace: FINDER_SPACES[0],
};

function FinderWindowControls() {
    const controls = [
        { color: 'bg-[#ff5f57]', label: 'Close' },
        { color: 'bg-[#febc2e]', label: 'Minimize' },
        { color: 'bg-[#28c840]', label: 'Full screen' },
    ];
    return (
        <span className="flex items-center gap-2 rounded-full border border-white/70 bg-white/80 px-2.5 py-1 shadow-inner shadow-white/80">
            {controls.map((control) => (
                <span
                    key={control.label}
                    className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${control.color} shadow-[0_0_0_1px_rgba(15,23,42,0.12)]`}
                    aria-hidden="true"
                >
                    <span className="sr-only">{control.label}</span>
                </span>
            ))}
        </span>
    );
}

function FinderToolbar({
                           breadcrumbs,
                           onNavigate,
                           onCreateFolder,
                           onUpload,
                           viewMode,
                           onViewModeChange,
                           searchTerm,
                           onSearchChange,
                           sortOption,
                           onSortChange,
                           isCreating,
                           isUploading,
                           onQuickLook,
                           onRefresh,
                           hasSelection,
                           filterCategory,
                           onFilterChange,
                       }) {
    const fileInputRef = useRef(null);
    const activeBreadcrumb = breadcrumbs[breadcrumbs.length - 1] ?? { name: 'All Files' };
    const quickFilters = FINDER_QUICK_FILTERS;

    const handleUploadClick = () => fileInputRef.current?.click();
    const handleFileChange = (event) => {
        const files = event.target.files;
        onUpload(files);
        event.target.value = '';
    };

    return (
        <div className="flex flex-col gap-6 text-slate-700">
            <div className="flex flex-col gap-4 rounded-[28px] border border-slate-200/70 bg-gradient-to-br from-white/95 via-slate-50/85 to-slate-100/75 p-5 shadow-[0_32px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3">
                        <FinderWindowControls />
                        <div className="flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 shadow-inner shadow-white/80">
                            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Finder</span>
                            <span className="text-sm font-medium text-slate-600">{activeBreadcrumb.name}</span>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                        <button
                            type="button"
                            className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/80 px-3 py-1.5 text-slate-500 shadow-sm transition hover:border-slate-300 hover:text-slate-700"
                            onClick={onRefresh}
                        >
                            <HiOutlineArrowPath className="text-sm" />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                        <button
                            type="button"
                            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 transition ${
                                hasSelection
                                    ? 'border-sky-200 bg-sky-50 text-sky-700 shadow-sm hover:border-sky-300 hover:bg-sky-100'
                                    : 'cursor-not-allowed border-slate-100 bg-slate-100 text-slate-300'
                            }`}
                            onClick={onQuickLook}
                            disabled={!hasSelection}
                        >
                            <HiOutlineEye className="text-sm" />
                            <span className="hidden sm:inline">Quick Look</span>
                        </button>
                    </div>
            </div>
                <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200/70 bg-white/75 p-2 shadow-inner shadow-white/70">
                    {quickFilters.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = filterCategory === filter.value;
                        return (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => onFilterChange(filter.value)}
                                className={`group flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium transition ${
                                    isActive
                                        ? 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-200'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                                aria-pressed={isActive}
                            >
                                <span
                                    className={`flex h-6 w-6 items-center justify-center rounded-full border text-base ${
                                        isActive ? 'border-sky-200 bg-white text-sky-600' : 'border-slate-200 bg-slate-50 text-slate-400 group-hover:border-slate-300'
                                    }`}
                                >
                                    <Icon />
                                </span>
                                <span className="leading-tight">
                                    <span className="block text-xs font-semibold">{filter.label}</span>
                                    <span className="hidden text-[0.65rem] text-slate-400 sm:block">{filter.description}</span>
                                </span>
                            </button>
                        );
                    })}
                </div>
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center overflow-hidden rounded-full border border-slate-200/80 bg-white/80 text-xs shadow-inner shadow-white/70">
                            <button
                                type="button"
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
                                    viewMode === 'grid'
                                        ? 'bg-sky-500/20 text-sky-700 shadow-inner shadow-white/90'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                                onClick={() => onViewModeChange('grid')}
                                aria-pressed={viewMode === 'grid'}
                            >
                                <HiOutlineSquare2Stack className="text-sm" />
                                <span className="hidden sm:inline">Grid</span>
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
                                    viewMode === 'list'
                                        ? 'bg-sky-500/20 text-sky-700 shadow-inner shadow-white/90'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                                onClick={() => onViewModeChange('list')}
                                aria-pressed={viewMode === 'list'}
                            >
                                <HiOutlineListBullet className="text-sm" />
                                <span className="hidden sm:inline">List</span>
                            </button>
                            <button
                                type="button"
                                className={`flex items-center gap-1 px-3 py-1.5 text-xs font-medium transition ${
                                    viewMode === 'column'
                                        ? 'bg-sky-500/20 text-sky-700 shadow-inner shadow-white/90'
                                        : 'text-slate-500 hover:bg-white hover:text-slate-700'
                                }`}
                                onClick={() => onViewModeChange('column')}
                                aria-pressed={viewMode === 'column'}
                            >
                                <HiOutlineViewColumns className="text-sm" />
                                <span className="hidden sm:inline">Column</span>
                            </button>
                        </div>
                        <label className="flex items-center gap-2 rounded-full border border-slate-200/80 bg-white/85 px-3 py-1.5 text-xs font-semibold text-slate-500 shadow-inner shadow-white/70">
                            <HiOutlineArrowsUpDown className="text-sm text-slate-400" />
                            <span>Sort</span>
                            <select
                                value={sortOption}
                                onChange={(event) => onSortChange(event.target.value)}
                                className="rounded-md border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 outline-none transition focus:border-sky-300 focus:ring-0"
                            >
                                <option value="name-asc">Name · A–Z</option>
                                <option value="name-desc">Name · Z–A</option>
                                <option value="date-desc">Date · Newest</option>
                                <option value="date-asc">Date · Oldest</option>
                                <option value="size-desc">Size · Largest</option>
                                <option value="size-asc">Size · Smallest</option>
                            </select>
                        </label>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-1 sm:items-center sm:justify-end">
                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                type="button"
                                onClick={onCreateFolder}
                                disabled={isCreating}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-700 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-300"
                            >
                                <HiOutlinePlus className="text-sm" />
                                <span>New Folder</span>
                            </button>
                            <button
                                type="button"
                                onClick={handleUploadClick}
                                disabled={isUploading}
                                className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-gradient-to-r from-sky-100/80 via-white to-sky-50/80 px-3 py-1.5 text-xs font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:from-sky-200 hover:text-sky-800 disabled:cursor-not-allowed disabled:border-slate-100 disabled:bg-slate-100 disabled:text-slate-300"
                            >
                                <HiOutlineArrowUpOnSquare className="text-sm" />
                                <span>Upload</span>
                            </button>
                            <input
                                ref={fileInputRef}
                                type="file"
                                className="hidden"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="relative w-full sm:flex-1 sm:max-w-xs md:max-w-sm">
                            <HiOutlineMagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                            <input
                                type="search"
                                placeholder="Search current folder"
                                value={searchTerm}
                                onChange={(event) => onSearchChange(event.target.value)}
                                className="h-10 w-full rounded-full border border-slate-200/80 bg-white/90 pl-11 pr-3 text-sm text-slate-600 shadow-inner shadow-white/80 outline-none transition focus:border-sky-300 focus:ring-2 focus:ring-sky-100"
                            />
                        </div>
                    </div>
                </div>
                <nav className="flex flex-wrap items-center gap-1 overflow-x-auto rounded-[20px] border border-slate-200/80 bg-white/80 px-3 py-2 text-sm text-slate-600 shadow-inner shadow-white/80">
                    {breadcrumbs.map((crumb, index) => {
                        const isLast = index === breadcrumbs.length - 1;
                        return (
                            <span key={`${crumb.id ?? 'root'}-${index}`} className="flex items-center gap-1">
                                <button
                                    type="button"
                                    onClick={() => onNavigate(crumb.id ?? null, breadcrumbs.slice(0, index + 1))}
                                    className={`rounded-full border px-3 py-1.5 transition ${
                                        isLast
                                            ? 'cursor-default border-sky-200 bg-sky-50 text-sky-700 shadow-inner shadow-white/80'
                                            : 'border-transparent bg-transparent text-slate-500 hover:border-slate-200 hover:bg-white hover:text-slate-700'
                                    }`}
                                    disabled={isLast}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {crumb.name}
                                </button>
                                {!isLast && <HiOutlineChevronRight className="text-slate-300" />}
                            </span>
                        );
                    })}
                </nav>
            </div>
        </div>
    );
}

FinderToolbar.propTypes = {
    breadcrumbs: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
            name: PropTypes.string,
        })
    ).isRequired,
    onNavigate: PropTypes.func.isRequired,
    onCreateFolder: PropTypes.func.isRequired,
    onUpload: PropTypes.func.isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list', 'column']).isRequired,
    onViewModeChange: PropTypes.func.isRequired,
    searchTerm: PropTypes.string.isRequired,
    onSearchChange: PropTypes.func.isRequired,
    sortOption: PropTypes.string.isRequired,
    onSortChange: PropTypes.func.isRequired,
    isCreating: PropTypes.bool.isRequired,
    isUploading: PropTypes.bool.isRequired,
    onQuickLook: PropTypes.func.isRequired,
    onRefresh: PropTypes.func.isRequired,
    hasSelection: PropTypes.bool.isRequired,
    filterCategory: PropTypes.string.isRequired,
    onFilterChange: PropTypes.func.isRequired,
};

function FinderSidebar({ tree, activeId, expandedFolders, onToggle, onNavigate, onMove }) {
    const [, drop] = useDrop({
        accept: DND_TYPE,
        drop: (item) => {
            onMove(item.id, null);
        },
    });

    const folders = tree?.folders ?? [];

    return (
        <aside
            ref={drop}
            className="h-[32rem] w-full rounded-[26px] border border-slate-200/60 bg-gradient-to-br from-white/92 via-[#f4f6fb] to-[#e9edf7] p-5 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:h-[36rem] lg:w-64"
        >
            <h2 className="mb-5 flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                <span className="inline-flex h-2 w-2 rounded-full bg-sky-300/80" />
                Locations
            </h2>
            <div className="space-y-1.5">
                <SidebarNode
                    node={{ id: null, name: 'All Files', children: folders }}
                    depth={0}
                    activeId={activeId}
                    expandedFolders={expandedFolders}
                    onToggle={onToggle}
                    onNavigate={onNavigate}
                    onMove={onMove}
                    path={[{ id: null, name: 'All Files' }]}
                />
            </div>
        </aside>
    );
}

FinderSidebar.propTypes = {
    tree: PropTypes.shape({
        folders: PropTypes.array,
    }),
    activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    expandedFolders: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
};

FinderSidebar.defaultProps = {
    tree: null,
    activeId: null,
};

function SidebarNode({ node, depth, activeId, expandedFolders, onToggle, onNavigate, onMove, path }) {
    const isActive = (activeId ?? null)?.toString() === (node.id ?? null)?.toString();
    const isExpanded = expandedFolders.has(node.id ?? null);

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (item) => node.id !== item.id,
        drop: (item) => onMove(item.id, node.id ?? null),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const nodePath = path ?? [];

    const handleClick = () => {
        onNavigate(node.id ?? null, nodePath);
        onToggle(node.id ?? null);
    };

    return (
        <div ref={drop} style={{ marginLeft: depth * 12 }}>
            <button
                type="button"
                onClick={handleClick}
                className={`group flex w-full items-center gap-2 rounded-[18px] px-3 py-2 text-left text-sm transition ${
                    isActive ? 'bg-sky-500/15 text-sky-700 ring-1 ring-sky-300' : 'text-slate-600 hover:bg-white/70 hover:text-slate-800'
                } ${isOver && canDrop ? 'border border-dashed border-sky-300 bg-sky-100/60' : ''}`}
            >
                {node.children?.length ? (
                    <span
                        onClick={(event) => {
                            event.stopPropagation();
                            onToggle(node.id ?? null);
                        }}
                        className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border bg-white/80 text-slate-500 shadow-sm transition ${
                            isExpanded ? 'border-sky-200 text-sky-500' : 'border-slate-200 group-hover:border-slate-300'
                        }`}
                    >
                        {isExpanded ? (
                            <HiOutlineChevronDown className="text-[0.65rem]" />
                        ) : (
                            <HiOutlineChevronRight className="text-[0.65rem]" />
                        )}
                    </span>
                ) : (
                    <span className="h-6 w-6 flex-shrink-0" />
                )}
                <HiOutlineFolder className={`${isActive ? 'text-sky-500' : 'text-slate-400'} transition group-hover:text-sky-500`} />
                <span className="truncate text-sm font-medium">{node.name}</span>
            </button>
            {isExpanded &&
                node.children?.map((child) => (
                    <SidebarNode
                        key={child.id}
                        node={child}
                        depth={depth + 1}
                        activeId={activeId}
                        expandedFolders={expandedFolders}
                        onToggle={onToggle}
                        onNavigate={onNavigate}
                        onMove={onMove}
                        path={nodePath.concat({ id: child.id, name: child.name })}
                    />
                ))}
        </div>
    );
}

SidebarNode.propTypes = {
    node: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string.isRequired,
        children: PropTypes.array,
    }).isRequired,
    depth: PropTypes.number.isRequired,
    activeId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    expandedFolders: PropTypes.instanceOf(Set).isRequired,
    onToggle: PropTypes.func.isRequired,
    onNavigate: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    path: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
            name: PropTypes.string,
        })
    ).isRequired,
};

SidebarNode.defaultProps = {
    activeId: null,
};

function FinderContentArea({
                               items,
                               originalItems,
                               isLoading,
                               viewMode,
                               selectedItemId,
                               selectedItem,
                               onSelect,
                               onOpen,
                               onRename,
                               onDelete,
                               onMove,
                               activeFolderId,
                               onQuickLook,
                               columnData,
                               filterCategory,
                               filterLabel,
                               filterDescription,
                           }) {
    const [{ isOver: isRootOver, canDrop: canDropRoot }, drop] = useDrop({
        accept: DND_TYPE,
        drop: (item) => {
            onMove(item.id, activeFolderId ?? null);
        },
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const isColumnView = viewMode === 'column';
    const emptyState =
        !isColumnView && !isLoading && originalItems.length === 0
            ? 'This folder is empty.'
            : !isColumnView && !isLoading && items.length === 0
                ? 'No items match your search.'
                : null;

    const selectedMeta = selectedItem
        ? {
            name: selectedItem.name,
            kind: selectedItem.type === 'folder' ? 'Folder' : 'File',
            size: selectedItem.type === 'file' ? formatBytes(selectedItem.size) : '—',
            updated:
                selectedItem.updatedAt && !Number.isNaN(new Date(selectedItem.updatedAt).getTime())
                    ? new Date(selectedItem.updatedAt).toLocaleString()
                    : '—',
        }
        : null;

    return (
        <div
            ref={drop}
            className={`relative flex h-[32rem] flex-1 flex-col gap-4 rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-[#f1f4fb] to-[#e7ecf9] p-6 shadow-[0_28px_80px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl transition lg:h-[36rem] ${
                isRootOver && canDropRoot ? 'ring-2 ring-sky-300' : ''
            }`}
        >
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border border-white/70 bg-white/75 px-4 py-2.5 shadow-inner shadow-white/80">
                <div className="flex items-center gap-2 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                    <span className="inline-flex h-2 w-2 rounded-full bg-sky-300/80" />
                    Contents
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    {filterCategory !== 'all' ? (
                        <span className="inline-flex items-center gap-1 rounded-full border border-slate-200/70 bg-white/70 px-3 py-1 font-medium text-slate-500 shadow-inner shadow-white/80">
                            <span className="text-slate-400">Filter:</span>
                            <span className="font-semibold text-slate-600">{filterLabel}</span>
                        </span>
                    ) : null}
                    {filterCategory !== 'all' && filterDescription ? (
                        <span className="hidden text-[0.7rem] text-slate-400 sm:inline">{filterDescription}</span>
                    ) : null}
                    {isLoading ? <span className="text-slate-400">Refreshing…</span> : null}
                    <button
                        type="button"
                        className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[0.7rem] transition ${
                            selectedItem
                                ? 'border-sky-200 bg-sky-50 text-sky-700 hover:border-sky-300 hover:bg-sky-100 hover:text-sky-800'
                                : 'cursor-not-allowed border-slate-200 bg-white/70 text-slate-300'
                        }`}
                        onClick={() => selectedItem && onQuickLook(selectedItem)}
                        disabled={!selectedItem}
                    >
                        <HiOutlineEye className="text-sm" />
                        Quick Look
                    </button>
                </div>
            </div>
            <div className="flex flex-col gap-2 rounded-[18px] border border-white/70 bg-white/80 px-4 py-3 shadow-inner shadow-white/80">
                {selectedMeta ? (
                    <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600">
                        <div className="flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                            <span className="h-2 w-2 rounded-full bg-sky-400" />
                            {selectedMeta.kind}
                        </div>
                        <span className="font-semibold text-slate-800">{selectedMeta.name}</span>
                        <span className="text-xs text-slate-400">•</span>
                        <span className="text-xs text-slate-500">Updated {selectedMeta.updated}</span>
                        {selectedMeta.kind === 'File' ? (
                            <>
                                <span className="text-xs text-slate-400">•</span>
                                <span className="text-xs text-slate-500">{selectedMeta.size}</span>
                            </>
                        ) : null}
                        <div className="ml-auto flex flex-wrap items-center gap-2 text-xs">
                            <button
                                type="button"
                                onClick={() => onOpen(selectedItem)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                            >
                                <HiOutlineChevronRight className="text-sm" />
                                Open
                            </button>
                            <button
                                type="button"
                                onClick={() => onQuickLook(selectedItem)}
                                className="inline-flex items-center gap-1 rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 font-semibold text-sky-700 shadow-sm transition hover:border-sky-300 hover:bg-sky-100"
                            >
                                <HiOutlineEye className="text-sm" />
                                Quick Look
                            </button>
                            <button
                                type="button"
                                onClick={() => onRename(selectedItem)}
                                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white px-3 py-1.5 font-semibold text-slate-600 shadow-sm transition hover:border-slate-300 hover:text-slate-800"
                            >
                                <HiOutlinePencilSquare className="text-sm" />
                                Rename
                            </button>
                            <button
                                type="button"
                                onClick={() => onDelete(selectedItem)}
                                className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-3 py-1.5 font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:bg-rose-100"
                            >
                                <HiOutlineTrash className="text-sm" />
                                Delete
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-600">
                            <HiOutlineEye className="text-sm text-slate-400" />
                            Space = Quick Look
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-600">
                            <HiOutlineChevronRight className="text-sm text-slate-400" />
                            Enter = Open
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-600">
                            <HiOutlinePencilSquare className="text-sm text-slate-400" />
                            Cmd/Ctrl + R = Rename
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-3 py-1 font-semibold text-slate-600">
                            <HiOutlineTrash className="text-sm text-slate-400" />
                            Del = Delete
                        </span>
                        <span className="text-[0.75rem] text-slate-400">
                            Tip: Drag files between folders or into the sidebar to move them.
                        </span>
                    </div>
                )}
            </div>
            {emptyState ? (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-slate-200/70 bg-white/70 text-sm text-slate-500 shadow-inner shadow-white/70">
                    {emptyState}
                </div>
            ) : (
                <FinderItemsView
                    items={items}
                    viewMode={viewMode}
                    selectedItemId={selectedItemId}
                    onSelect={onSelect}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onMove={onMove}
                    onQuickLook={onQuickLook}
                    columnData={columnData}
                />
            )}
            {isRootOver && canDropRoot && (
                <div className="pointer-events-none absolute inset-0 rounded-[26px] border-2 border-dashed border-sky-300 bg-sky-100/40" />
            )}
        </div>
    );
}

FinderContentArea.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    originalItems: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLoading: PropTypes.bool.isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list', 'column']).isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    selectedItem: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        type: PropTypes.string,
    }),
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    activeFolderId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    onQuickLook: PropTypes.func.isRequired,
    columnData: PropTypes.arrayOf(
        PropTypes.shape({
            breadcrumb: PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
                name: PropTypes.string,
            }),
            items: PropTypes.arrayOf(PropTypes.object),
            isLoading: PropTypes.bool,
        })
    ),
    filterCategory: PropTypes.string.isRequired,
    filterLabel: PropTypes.string,
    filterDescription: PropTypes.string,
};

FinderContentArea.defaultProps = {
    selectedItemId: null,
    selectedItem: null,
    activeFolderId: null,
    columnData: [],
    filterLabel: 'All',
    filterDescription: '',
};

function FinderColumnView({ columns, selectedItemId, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    if (!columns?.length) {
        return (
            <div className="flex flex-1 items-center justify-center rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 via-[#f3f5fb] to-[#e9edf9] text-sm text-slate-500 shadow-inner shadow-white/80">
                Loading column view…
            </div>
        );
    }

    return (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-2xl border border-white/70 bg-gradient-to-br from-white/95 via-[#f3f5fb] to-[#e9edf9] shadow-inner shadow-white/80">
            <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto p-2">
                {columns.map((column, index) => (
                    <FinderColumn
                        key={`${column.breadcrumb?.id ?? 'root'}-${index}`}
                        breadcrumb={column.breadcrumb}
                        items={column.items}
                        isLast={index === columns.length - 1}
                        highlightId={index < columns.length - 1 ? columns[index + 1]?.breadcrumb?.id ?? null : selectedItemId}
                        selectedItemId={selectedItemId}
                        isLoading={column.isLoading}
                        columnIndex={index}
                        onSelect={onSelect}
                        onOpen={onOpen}
                        onRename={onRename}
                        onDelete={onDelete}
                        onMove={onMove}
                        onQuickLook={onQuickLook}
                    />
                ))}
            </div>
        </div>
    );
}

FinderColumnView.propTypes = {
    columns: PropTypes.arrayOf(
        PropTypes.shape({
            breadcrumb: PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
                name: PropTypes.string,
            }),
            items: PropTypes.arrayOf(PropTypes.object).isRequired,
            isLoading: PropTypes.bool,
        })
    ).isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderColumnView.defaultProps = {
    selectedItemId: null,
};

function FinderColumn({
                          breadcrumb,
                          items,
                          isLast,
                          highlightId,
                          isLoading,
                          onSelect,
                          onOpen,
                          onRename,
                          onDelete,
                          onMove,
                          onQuickLook,
                          selectedItemId,
                          columnIndex,
                      }) {
    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => (breadcrumb?.id ?? null) !== dragged.id,
        drop: (dragged) => onMove(dragged.id, breadcrumb?.id ?? null),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const highlightTarget = isLast ? selectedItemId : highlightId;
    const resolvedName = breadcrumb?.name ?? 'Items';

    return (
        <div
            ref={drop}
            className={`flex min-w-[16rem] max-w-[22rem] flex-1 flex-col rounded-[1.5rem] border border-white/40 bg-white/45 px-3 py-3 backdrop-blur-lg shadow-[0_18px_44px_-28px_rgba(15,23,42,0.35)] transition ${
                isOver && canDrop ? 'ring-2 ring-sky-300' : ''
            }`}
        >
            <div className="px-2 pb-3">
                <p className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{resolvedName}</p>
            </div>
            <div className="flex-1 space-y-1 overflow-auto pr-1">
                {isLoading ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/70 bg-white/80 text-xs text-slate-400">
                        Loading…
                    </div>
                ) : items.length === 0 ? (
                    <div className="flex h-full items-center justify-center rounded-xl border border-dashed border-white/70 bg-white/75 text-xs text-slate-400">
                        {isLast ? 'This folder is empty.' : 'Select a folder to continue'}
                    </div>
                ) : (
                    items.map((item) => (
                        <FinderColumnRow
                            key={item.id}
                            item={item}
                            isHighlighted={(highlightTarget ?? null)?.toString() === (item.id ?? '').toString()}
                            isLastColumn={isLast}
                            columnIndex={columnIndex}
                            onSelect={onSelect}
                            onOpen={onOpen}
                            onRename={onRename}
                            onDelete={onDelete}
                            onMove={onMove}
                            onQuickLook={onQuickLook}
                        />
                    ))
                )}
            </div>
        </div>
    );
}

FinderColumn.propTypes = {
    breadcrumb: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
    }),
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    isLast: PropTypes.bool.isRequired,
    highlightId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    isLoading: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    columnIndex: PropTypes.number.isRequired,
};

FinderColumn.defaultProps = {
    breadcrumb: null,
    highlightId: null,
    isLoading: false,
    selectedItemId: null,
};

function FinderColumnRow({ item, isHighlighted, isLastColumn, columnIndex, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => item.type === 'folder' && dragged.id !== item.id,
        drop: (dragged) => onMove(dragged.id, item.id),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const ref = useRef(null);
    drag(drop(ref));

    const handleSelect = useCallback(() => {
        onSelect((prev) => {
            if (prev === item.id && item.type !== 'folder') {
                return null;
            }
            return item.id;
        });
        if (item.type === 'folder') {
            onOpen(item, { depth: columnIndex });
        }
    }, [item, onSelect, onOpen, columnIndex]);

    const handleKeyDown = useCallback(
        (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                handleSelect();
            }
        },
        [handleSelect]
    );

    const actionBase = isHighlighted
        ? 'rounded-lg bg-white/10 px-2 py-1 text-[0.7rem] font-semibold text-white transition hover:bg-white/20'
        : 'rounded-lg bg-white px-2 py-1 text-[0.7rem] font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700';

    return (
        <div
            ref={ref}
            role="button"
            tabIndex={0}
            onClick={handleSelect}
            onDoubleClick={() => onOpen(item, { depth: columnIndex })}
            onKeyDown={handleKeyDown}
            className={`group relative flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2 text-sm transition ${
                isHighlighted
                    ? 'bg-sky-500 text-white shadow-[0_18px_36px_-18px_rgba(56,189,248,0.55)]'
                    : 'text-slate-600 hover:bg-white/80 hover:shadow-[0_18px_36px_-24px_rgba(15,23,42,0.35)]'
            } ${isDragging ? 'opacity-70' : ''} ${isOver && canDrop ? 'ring-2 ring-sky-300' : ''}`}
        >
            <FinderItemIcon item={item} size="sm" />
            <div className="min-w-0 flex-1">
                <p className={`truncate text-sm font-medium ${isHighlighted ? 'text-white' : 'text-slate-600'}`}>{item.name}</p>
                <p className={`truncate text-[0.7rem] ${isHighlighted ? 'text-white/70' : 'text-slate-400'}`}>
                    {item.type === 'file' ? formatBytes(item.size) : 'Folder'}
                </p>
            </div>
            {isLastColumn ? (
                <div
                    className={`ml-auto flex items-center gap-1 text-xs transition ${
                        isHighlighted ? 'text-white' : 'text-slate-400 opacity-0 group-hover:opacity-100'
                    }`}
                >
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRename(item);
                        }}
                        className={actionBase}
                    >
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item);
                        }}
                        className={`${actionBase} ${isHighlighted ? 'text-white' : 'text-rose-500 hover:text-rose-600'}`}
                    >
                        Delete
                    </button>
                    {item.type === 'file' ? (
                        <button
                            type="button"
                            onClick={(event) => {
                                event.stopPropagation();
                                onQuickLook(item);
                            }}
                            className={`${actionBase} ${isHighlighted ? 'text-white' : 'text-sky-600 hover:text-sky-700'}`}
                        >
                            View
                        </button>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}

FinderColumnRow.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
    }).isRequired,
    isHighlighted: PropTypes.bool,
    isLastColumn: PropTypes.bool.isRequired,
    columnIndex: PropTypes.number.isRequired,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderColumnRow.defaultProps = {
    isHighlighted: false,
};

function FinderItemsView({ items, viewMode, selectedItemId, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook, columnData }) {
    if (viewMode === 'column') {
        return (
            <FinderColumnView
                columns={columnData}
                selectedItemId={selectedItemId}
                onSelect={onSelect}
                onOpen={onOpen}
                onRename={onRename}
                onDelete={onDelete}
                onMove={onMove}
                onQuickLook={onQuickLook}
            />
        );
    }

    if (viewMode === 'list') {
        return (
            <div className="flex-1 overflow-auto rounded-2xl border border-white/70 bg-white/85 shadow-inner shadow-white/80">
                <table className="min-w-full text-sm text-slate-600">
                    <thead className="sticky top-0 bg-[#eef1fb]/90 text-left text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 backdrop-blur">
                        <tr>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Type</th>
                            <th className="px-4 py-3">Size</th>
                            <th className="px-4 py-3">Updated</th>
                            <th className="px-4 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100/70">
                        {items.map((item) => (
                            <FinderListRow
                                key={item.id}
                                item={item}
                                isSelected={selectedItemId === item.id}
                                onSelect={onSelect}
                                onOpen={onOpen}
                                onRename={onRename}
                                onDelete={onDelete}
                                onMove={onMove}
                                onQuickLook={onQuickLook}
                            />
                        ))}
                    </tbody>
                </table>
            </div>
        );
    }

    return (
        <div className="grid flex-1 grid-cols-2 gap-4 overflow-auto rounded-2xl border border-white/70 bg-white/85 p-5 shadow-inner shadow-white/80 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
                <FinderGridCard
                    key={item.id}
                    item={item}
                    isSelected={selectedItemId === item.id}
                    onSelect={onSelect}
                    onOpen={onOpen}
                    onRename={onRename}
                    onDelete={onDelete}
                    onMove={onMove}
                    onQuickLook={onQuickLook}
                />
            ))}
        </div>
    );
}

FinderItemsView.propTypes = {
    items: PropTypes.arrayOf(PropTypes.object).isRequired,
    viewMode: PropTypes.oneOf(['grid', 'list', 'column']).isRequired,
    selectedItemId: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
    columnData: PropTypes.arrayOf(
        PropTypes.shape({
            breadcrumb: PropTypes.shape({
                id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
                name: PropTypes.string,
            }),
            items: PropTypes.arrayOf(PropTypes.object),
            isLoading: PropTypes.bool,
        })
    ),
};

FinderItemsView.defaultProps = {
    selectedItemId: null,
    columnData: [],
};

const resolveFinderIconKey = (item) => {
    if (!item) return 'default';
    if (item.type === 'folder') return 'folder';

    const extension = (item.extension || '').toLowerCase();
    const mimeType = (item.mimeType || '').split(';')[0];

    if (EXTENSION_ICON_OVERRIDES.has(extension)) {
        return EXTENSION_ICON_OVERRIDES.get(extension);
    }
    if (MIME_ICON_OVERRIDES.has(mimeType)) {
        return MIME_ICON_OVERRIDES.get(mimeType);
    }

    if (mimeType.startsWith('image/') || FILE_EXTENSION_GROUPS.image.has(extension)) {
        return 'image';
    }
    if (mimeType.startsWith('audio/') || FILE_EXTENSION_GROUPS.audio.has(extension)) {
        return 'audio';
    }
    if (mimeType.startsWith('video/') || FILE_EXTENSION_GROUPS.video.has(extension)) {
        return 'video';
    }
    if (FILE_EXTENSION_GROUPS.design.has(extension)) {
        return 'design';
    }
    if (FILE_EXTENSION_GROUPS.font.has(extension)) {
        return 'font';
    }
    if (FILE_EXTENSION_GROUPS.code.has(extension)) {
        return 'code';
    }
    if (FILE_EXTENSION_GROUPS.document.has(extension)) {
        return 'document';
    }
    if (FILE_EXTENSION_GROUPS.archive.has(extension)) {
        return 'archive';
    }
    return 'default';
};

const ICON_SIZE_STYLES = {
    sm: {
        container: 'h-12 w-12',
        radius: 'rounded-xl',
    },
    md: {
        container: 'h-20 w-20',
        radius: 'rounded-2xl',
    },
    lg: {
        container: 'h-28 w-28',
        radius: 'rounded-[1.75rem]',
    },
};

function FinderItemIcon({ item, size = 'md' }) {
    const iconKey = resolveFinderIconKey(item);
    const mapping = FINDER_ICON_MAP[iconKey] ?? FINDER_ICON_MAP.default;
    const sizeStyle = ICON_SIZE_STYLES[size] || ICON_SIZE_STYLES.md;
    const iconSrc = buildFinderIconSrc(mapping.key, mapping.fallback);

    return (
        <div
            className={`pointer-events-none select-none ${sizeStyle.container} ${sizeStyle.radius} overflow-hidden border border-slate-200/70 bg-gradient-to-br from-white via-slate-50 to-slate-100 shadow-[0_18px_36px_rgba(15,23,42,0.18)]`}
        >
            <img
                src={iconSrc}
                alt={`${iconKey} icon`}
                className="h-full w-full object-contain"
                draggable={false}
            />
        </div>
    );
}

FinderItemIcon.propTypes = {
    item: PropTypes.shape({
        type: PropTypes.string,
        extension: PropTypes.string,
        mimeType: PropTypes.string,
    }).isRequired,
    size: PropTypes.oneOf(['sm', 'md', 'lg']),
};

FinderItemIcon.defaultProps = {
    size: 'md',
};

function FinderGridCard({ item, isSelected, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => item.type === 'folder' && dragged.id !== item.id,
        drop: (dragged) => onMove(dragged.id, item.id),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const ref = useRef(null);
    drag(drop(ref));

    return (
        <div
            ref={ref}
            onClick={() => onSelect((prev) => (prev === item.id ? null : item.id))}
            onDoubleClick={() => onOpen(item)}
            className={`relative flex cursor-pointer flex-col items-center gap-3 rounded-2xl border px-4 py-5 text-center transition ${
                isSelected
                    ? 'border-sky-200 bg-white/95 text-sky-700 ring-2 ring-sky-300 shadow-[0_22px_48px_-24px_rgba(37,99,235,0.45)]'
                    : 'border-transparent bg-white/80 text-slate-600 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.22)] hover:border-slate-200/80 hover:bg-white/90 hover:shadow-[0_22px_52px_-28px_rgba(15,23,42,0.28)]'
            } ${isDragging ? 'opacity-60' : ''} ${isOver && canDrop ? 'ring-2 ring-sky-300' : ''}`}
        >
            <FinderItemIcon item={item} size="md" />
            <span className="line-clamp-2 text-sm font-medium leading-tight">{item.name}</span>
            <div className="flex items-center gap-2 text-xs text-slate-500">
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onRename(item);
                    }}
                    className="rounded-lg border border-white/70 bg-white/90 px-2 py-1 transition hover:border-slate-300 hover:text-slate-700"
                >
                    Rename
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onDelete(item);
                    }}
                    className="rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                    Delete
                </button>
                <button
                    type="button"
                    onClick={(event) => {
                        event.stopPropagation();
                        onQuickLook(item);
                    }}
                    className="rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                >
                    View
                </button>
            </div>
        </div>
    );
}

FinderGridCard.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
    }).isRequired,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderGridCard.defaultProps = {
    isSelected: false,
};

function FinderListRow({ item, isSelected, onSelect, onOpen, onRename, onDelete, onMove, onQuickLook }) {
    const [{ isDragging }, drag] = useDrag({
        type: DND_TYPE,
        item: { id: item.id, type: item.type },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver, canDrop }, drop] = useDrop({
        accept: DND_TYPE,
        canDrop: (dragged) => item.type === 'folder' && dragged.id !== item.id,
        drop: (dragged) => onMove(dragged.id, item.id),
        collect: (monitor) => ({
            isOver: monitor.isOver({ shallow: true }),
            canDrop: monitor.canDrop(),
        }),
    });

    const ref = useRef(null);
    drag(drop(ref));

    return (
        <tr
            ref={ref}
            onClick={() => onSelect((prev) => (prev === item.id ? null : item.id))}
            onDoubleClick={() => onOpen(item)}
            className={`cursor-pointer text-sm transition ${
                isSelected ? 'bg-sky-500/10 text-sky-800 ring-1 ring-inset ring-sky-200' : 'hover:bg-white/70'
            } ${isDragging ? 'opacity-60' : ''} ${isOver && canDrop ? 'outline outline-2 outline-sky-300' : ''}`}
        >
            <td className="flex items-center gap-3 px-4 py-3">
                <FinderItemIcon item={item} size="sm" />
                <span className="truncate text-slate-600">{item.name}</span>
            </td>
            <td className="px-4 py-3 capitalize text-slate-500">{item.type}</td>
            <td className="px-4 py-3 text-slate-500">{item.type === 'file' ? formatBytes(item.size) : '—'}</td>
            <td className="px-4 py-3 text-slate-500">{new Date(item.updatedAt).toLocaleString()}</td>
            <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-2 text-xs">
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRename(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-1 transition hover:border-slate-300 hover:text-slate-700"
                    >
                        <HiOutlinePencilSquare />
                        Rename
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onDelete(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                    >
                        <HiOutlineTrash />
                        Delete
                    </button>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onQuickLook(item);
                        }}
                        className="flex items-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-1 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                    >
                        <HiOutlineEye />
                        View
                    </button>
                </div>
            </td>
        </tr>
    );
}

FinderListRow.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
    }).isRequired,
    isSelected: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
    onOpen: PropTypes.func.isRequired,
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onMove: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderListRow.defaultProps = {
    isSelected: false,
};

function FinderPreviewPane({ item, onRename, onDelete, onQuickLook }) {
    const [textPreview, setTextPreview] = useState('');
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    useEffect(() => {
        let cancelled = false;
        setTextPreview('');
        if (!item || item.type !== 'file') {
            setIsLoadingPreview(false);
            return () => {
                cancelled = true;
            };
        }

        const supportsText = item.mimeType?.startsWith('text/') || ['json', 'md', 'txt', 'js', 'ts', 'css', 'html'].includes(item.extension);
        if (!supportsText || !item.previewUrl) {
            setIsLoadingPreview(false);
            return () => {
                cancelled = true;
            };
        }

        setIsLoadingPreview(true);
        fetch(item.previewUrl)
            .then((res) => res.text())
            .then((content) => {
                if (!cancelled) {
                    setTextPreview(content.slice(0, 2000));
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setTextPreview('Unable to load preview.');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setIsLoadingPreview(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [item]);

    if (!item) {
        return (
            <aside className="hidden h-[32rem] w-full flex-col items-center justify-center rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-[#f3f5fb] to-[#e8ecf9] p-5 text-center text-sm text-slate-500 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:flex lg:h-[36rem] lg:w-72">
                Select a file or folder to see details.
            </aside>
        );
    }

    const isImage = item.mimeType?.startsWith('image/');

    return (
        <aside className="hidden h-[32rem] w-full flex-col gap-4 rounded-[26px] border border-white/60 bg-gradient-to-br from-white/95 via-[#f3f5fb] to-[#e8ecf9] p-5 text-sm text-slate-600 shadow-[0_24px_70px_-48px_rgba(15,23,42,0.55)] backdrop-blur-xl lg:flex lg:h-[36rem] lg:w-72">
            <div className="flex items-start justify-between gap-2">
                <h3 className="line-clamp-2 text-sm font-semibold text-slate-700">{item.name}</h3>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[0.65rem] uppercase tracking-[0.16em] text-slate-500">
                    {item.type}
                </span>
            </div>
            <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100">
                {item.type === 'file' && isImage && item.previewUrl ? (
                    <img src={item.previewUrl} alt={item.name} className="h-full w-full rounded-[18px] object-cover" />
                ) : (
                    <FinderItemIcon item={item} size="lg" />
                )}
            </div>
            <dl className="space-y-3 text-xs text-slate-500">
                <div className="flex justify-between border-b border-slate-200 pb-2">
                    <dt className="uppercase tracking-[0.18em] text-slate-400">Modified</dt>
                    <dd className="text-slate-600">{new Date(item.updatedAt).toLocaleString()}</dd>
                </div>
            </dl>
            {item.type === 'file' && (
                <>
                    <dl className="space-y-3 text-xs text-slate-500">
                        <div className="flex justify-between">
                            <dt className="uppercase tracking-[0.18em] text-slate-400">Size</dt>
                            <dd className="text-slate-600">{formatBytes(item.size)}</dd>
                        </div>
                        <div className="flex justify-between border-b border-slate-200 pb-2">
                            <dt className="uppercase tracking-[0.18em] text-slate-400">Type</dt>
                            <dd className="text-slate-600">{item.mimeType || 'Unknown'}</dd>
                        </div>
                    </dl>
                    <div className="flex flex-1 flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/95">
                        <div className="border-b border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                            Preview
                        </div>
                        <div className="flex-1 overflow-auto px-3 py-3 text-xs leading-relaxed text-slate-600">
                            {isImage ? (
                                <p className="text-center text-slate-400">Image preview shown above.</p>
                            ) : isLoadingPreview ? (
                                <p className="text-center text-slate-400">Loading preview…</p>
                            ) : textPreview ? (
                                <pre className="whitespace-pre-wrap break-words">{textPreview}</pre>
                            ) : (
                                <p className="text-center text-slate-400">Preview unavailable.</p>
                            )}
                        </div>
                    </div>
                </>
            )}
            <div className="mt-auto flex items-center justify-between gap-2 text-xs">
                <button
                    type="button"
                    onClick={() => onRename(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-2 transition hover:border-slate-300 hover:text-slate-700"
                >
                    <HiOutlinePencilSquare />
                    Rename
                </button>
                <button
                    type="button"
                    onClick={() => onDelete(item)}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-2 text-rose-500 transition hover:border-rose-300 hover:text-rose-600"
                >
                    <HiOutlineTrash />
                    Delete
                </button>
                {item.type === 'file' ? (
                    <button
                        type="button"
                        onClick={() => onQuickLook(item)}
                        className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-white/70 bg-white/90 px-2 py-2 text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                    >
                        <HiOutlineEye />
                        Quick Look
                    </button>
                ) : null}
            </div>
        </aside>
    );
}

FinderPreviewPane.propTypes = {
    item: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])]),
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
        mimeType: PropTypes.string,
        extension: PropTypes.string,
        previewUrl: PropTypes.string,
    }),
    onRename: PropTypes.func.isRequired,
    onDelete: PropTypes.func.isRequired,
    onQuickLook: PropTypes.func.isRequired,
};

FinderPreviewPane.defaultProps = {
    item: null,
};

function FinderStatusBar({ totalItems, visibleItems, totalSize, selection, filterLabel, searchTerm }) {
    const info = selection
        ? `${selection.name} · ${selection.type === 'file' ? formatBytes(selection.size) : 'Folder'}`
        : `${visibleItems} item${visibleItems === 1 ? '' : 's'} shown${visibleItems !== totalItems ? ` · ${totalItems} total` : ''}`;
    const sizeInfo = selection
        ? `Updated ${selection.updatedAt ? new Date(selection.updatedAt).toLocaleString() : '—'}`
        : `Combined size ${formatBytes(totalSize)}`;
    const isFiltering = !selection && (Boolean(searchTerm) || (filterLabel && filterLabel !== 'All'));

    return (
        <footer className="mt-6 flex flex-col gap-3 rounded-[24px] border border-white/60 bg-gradient-to-r from-white/92 via-[#eef2fb] to-[#e7eefc] px-6 py-4 text-xs text-slate-500 shadow-[0_18px_46px_-32px_rgba(15,23,42,0.45)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-900/5 px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-slate-500">
                    <HiOutlineSparkles className="text-sky-500" />
                    Glass 2.0
                </span>
                <HiOutlineEllipsisHorizontal className="text-lg text-slate-400" />
                <span className="font-medium text-slate-700">{info}</span>
                {filterLabel && filterLabel !== 'All' ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        {filterLabel}
                    </span>
                ) : null}
                {searchTerm ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/70 bg-white/80 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Search "{searchTerm}"
                    </span>
                ) : null}
            </div>
            <span className={`text-slate-400 ${isFiltering ? 'font-medium text-slate-500' : ''}`}>{sizeInfo}</span>
        </footer>
    );
}

FinderStatusBar.propTypes = {
    totalItems: PropTypes.number.isRequired,
    visibleItems: PropTypes.number.isRequired,
    totalSize: PropTypes.number.isRequired,
    selection: PropTypes.shape({
        name: PropTypes.string,
        type: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
    }),
    filterLabel: PropTypes.string,
    searchTerm: PropTypes.string,
};

FinderStatusBar.defaultProps = {
    selection: null,
    filterLabel: 'All',
    searchTerm: '',
};

function QuickLookModal({ item, onClose }) {
    const dialogRef = useRef(null);
    const [previewContent, setPreviewContent] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!item || item.type !== 'file' || !item.previewUrl) {
            setPreviewContent('');
            return;
        }

        let cancelled = false;
        const supportsText = item.mimeType?.startsWith('text/') || ['json', 'md', 'txt', 'js', 'ts', 'css', 'html', 'svg'].includes(item.extension);
        const supportsImage = item.mimeType?.startsWith('image/');

        if (!supportsText || supportsImage) {
            setPreviewContent('');
            return;
        }

        setLoading(true);
        fetch(item.previewUrl)
            .then((res) => res.text())
            .then((content) => {
                if (!cancelled) {
                    setPreviewContent(content.slice(0, 5000));
                }
            })
            .catch(() => {
                if (!cancelled) setPreviewContent('');
            })
            .finally(() => {
                if (!cancelled) setLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [item]);

    useEffect(() => {
        if (!item) return undefined;
        const handleKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [item, onClose]);

    if (!item) return null;

    const isImage = item.mimeType?.startsWith('image/');

    return (
        <div
            ref={dialogRef}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/60 px-4 py-8 backdrop-blur-sm"
            role="dialog"
            aria-modal="true"
            aria-label={`${item.name} quick look`}
            onClick={onClose}
        >
            <div
                className="relative flex max-h-full w-full max-w-3xl flex-col gap-5 rounded-[30px] border border-white/60 bg-gradient-to-br from-white/97 via-[#f5f7fd] to-[#e7ebf9] p-6 shadow-[0_48px_120px_-40px_rgba(15,23,42,0.6)] backdrop-blur-xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-700">{item.name}</h2>
                        <p className="text-xs text-slate-400">
                            {item.mimeType || 'Unknown'} · {formatBytes(item.size)} · {new Date(item.updatedAt).toLocaleString()}
                        </p>
                    </div>
                    <button
                        type="button"
                        className="rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-medium text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                        onClick={onClose}
                    >
                        Close
                    </button>
                </div>
                <div className="flex flex-1 items-center justify-center overflow-hidden rounded-3xl border border-white/70 bg-white/85 p-4">
                    {isImage && item.previewUrl ? (
                        <img src={item.previewUrl} alt={item.name} className="max-h-full max-w-full rounded-2xl object-contain" />
                    ) : loading ? (
                        <p className="text-sm text-slate-500">Loading preview…</p>
                    ) : previewContent ? (
                        <div className="flex max-h-[26rem] w-full flex-col gap-4 overflow-hidden">
                            <div className="flex items-center gap-3">
                                <FinderItemIcon item={item} size="sm" />
                                <span className="text-xs uppercase tracking-[0.18em] text-slate-400">Quick Look</span>
                            </div>
                            <pre className="flex-1 overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-white/70 bg-white/95 p-4 text-sm leading-relaxed text-slate-600 shadow-inner shadow-white/80">
                                {previewContent}
                            </pre>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center gap-4 text-sm text-slate-500">
                            <FinderItemIcon item={item} size="md" />
                            <p>Quick Look preview unavailable for this file type.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

QuickLookModal.propTypes = {
    item: PropTypes.shape({
        name: PropTypes.string,
        mimeType: PropTypes.string,
        size: PropTypes.number,
        updatedAt: PropTypes.string,
        previewUrl: PropTypes.string,
        type: PropTypes.string,
    }),
    onClose: PropTypes.func.isRequired,
};

QuickLookModal.defaultProps = {
    item: null,
};
