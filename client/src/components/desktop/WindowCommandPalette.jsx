import PropTypes from 'prop-types';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
    HiOutlineMagnifyingGlass,
    HiOutlineSparkles,
    HiOutlineXMark,
} from 'react-icons/hi2';

/**
 * Grouped command palette used by the desktop window manager.
 * Provides fuzzy search and keyboard navigation across actions, scenes, and windows.
 */
export default function WindowCommandPalette({
    open,
    query,
    onQueryChange,
    items,
    onSelect,
    onClose,
    accentFallback,
    metaKeyLabel,
    altKeyLabel,
    shiftKeyLabel,
}) {
    const inputRef = useRef(null);
    const itemRefs = useRef(new Map());
    const [highlightIndex, setHighlightIndex] = useState(0);

    // Prevent background scroll and focus the search input when opened.
    useEffect(() => {
        if (!open) {
            return undefined;
        }
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        const id = window.requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });
        return () => {
            window.cancelAnimationFrame(id);
            document.body.style.overflow = previousOverflow;
        };
    }, [open]);

    // Reset highlight when we close and reopen.
    useEffect(() => {
        if (open) {
            setHighlightIndex(0);
        }
    }, [open, query]);

    const normalizedQuery = query.trim().toLowerCase();

    const filteredItems = useMemo(() => {
        if (!normalizedQuery) {
            return items;
        }
        return items.filter((item) => {
            const haystack = [
                item.label,
                item.description,
                item.group,
                item.badge,
                item.shortcut,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(normalizedQuery);
        });
    }, [items, normalizedQuery]);

    useEffect(() => {
        if (!open) {
            return;
        }
        if (filteredItems.length === 0) {
            setHighlightIndex(0);
            return;
        }
        setHighlightIndex((index) =>
            Math.max(0, Math.min(index, filteredItems.length - 1))
        );
    }, [filteredItems, open]);

    useEffect(() => {
        if (!open || filteredItems.length === 0) {
            return;
        }
        const current = filteredItems[highlightIndex];
        if (!current) {
            return;
        }
        const node = itemRefs.current.get(current.id);
        if (node) {
            node.scrollIntoView({ block: 'nearest' });
        }
    }, [filteredItems, highlightIndex, open]);

    const groupedItems = useMemo(() => {
        const orderFallback = 999;
        const groups = new Map();
        filteredItems.forEach((item) => {
            const key = item.group || 'Suggestions';
            if (!groups.has(key)) {
                groups.set(key, {
                    label: key,
                    order: item.groupPriority ?? orderFallback,
                    entries: [],
                });
            }
            groups.get(key).entries.push(item);
        });
        return Array.from(groups.values()).sort((a, b) => {
            if (a.order !== b.order) {
                return a.order - b.order;
            }
            return a.label.localeCompare(b.label);
        });
    }, [filteredItems]);

    const totalResults = filteredItems.length;

    const handleKeyNavigation = (event) => {
        if (event.key === 'ArrowDown' || (!event.shiftKey && event.key === 'Tab')) {
            event.preventDefault();
            setHighlightIndex((index) =>
                Math.min(index + 1, Math.max(0, totalResults - 1))
            );
        } else if (event.key === 'ArrowUp' || (event.shiftKey && event.key === 'Tab')) {
            event.preventDefault();
            setHighlightIndex((index) => Math.max(index - 1, 0));
        } else if (event.key === 'Enter') {
            event.preventDefault();
            const item = filteredItems[highlightIndex];
            if (item && !item.disabled) {
                onSelect(item);
            }
        } else if (event.key === 'Escape') {
            event.preventDefault();
            onClose();
        }
    };

    const handleBackdropClick = (event) => {
        if (event.target === event.currentTarget) {
            onClose();
        }
    };

    return (
        <AnimatePresence>
            {open ? (
                <motion.div
                    key="command-palette"
                    className="fixed inset-0 z-[70] flex items-start justify-center bg-slate-950/45 backdrop-blur-md"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    role="dialog"
                    aria-modal="true"
                    aria-label="Window manager command palette"
                    onMouseDown={handleBackdropClick}
                >
                    <motion.div
                        className="mt-20 w-full max-w-3xl rounded-[36px] border border-white/45 bg-white/85 p-4 shadow-[0_48px_140px_-60px_rgba(14,116,244,0.55)] backdrop-blur-2xl dark:border-white/10 dark:bg-slate-900/85 dark:shadow-[0_48px_140px_-60px_rgba(30,64,175,0.55)]"
                        initial={{ opacity: 0, scale: 0.98, y: 12 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 16 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        onMouseDown={(event) => event.stopPropagation()}
                    >
                        <div className="flex items-center gap-3 rounded-[28px] border border-white/55 bg-white/80 px-4 py-3 shadow-inner dark:border-white/10 dark:bg-slate-900/70">
                            <HiOutlineMagnifyingGlass className="h-5 w-5 text-slate-400 dark:text-slate-500" aria-hidden />
                            <input
                                ref={inputRef}
                                value={query}
                                onChange={(event) => onQueryChange(event.target.value)}
                                onKeyDown={handleKeyNavigation}
                                placeholder="Search scenes, windows, or actions…"
                                className="flex-1 border-none bg-transparent text-sm font-medium text-slate-700 placeholder:text-slate-400 focus:outline-none dark:text-slate-100 dark:placeholder:text-slate-500"
                                aria-label="Search window manager commands"
                            />
                            {query ? (
                                <button
                                    type="button"
                                    onClick={() => onQueryChange('')}
                                    className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/55 bg-white/70 text-slate-500 shadow-sm transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-300/60 dark:border-white/15 dark:bg-slate-900/70 dark:text-slate-300"
                                    aria-label="Clear search"
                                >
                                    <HiOutlineXMark className="h-4 w-4" aria-hidden />
                                </button>
                            ) : (
                                <span className="text-[0.62rem] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                    {metaKeyLabel}+K
                                </span>
                            )}
                        </div>

                        <div className="mt-4 max-h-[420px] overflow-y-auto pr-1">
                            {totalResults === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200/80 bg-white/70 py-16 text-center text-sm text-slate-500 dark:border-slate-700/60 dark:bg-slate-900/60 dark:text-slate-400">
                                    <HiOutlineSparkles className="mb-3 h-6 w-6 opacity-60" aria-hidden />
                                    <p>No matching commands yet.</p>
                                    <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                                        Try searching for a scene name or a window title.
                                    </p>
                                </div>
                            ) : (
                                groupedItems.map((group) => (
                                    <div key={`group-${group.label}`} className="mb-4 last:mb-0">
                                        <p className="px-3 pb-1 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                            {group.label}
                                        </p>
                                        <div className="space-y-2">
                                            {group.entries.map((item) => {
                                                const index = filteredItems.findIndex((candidate) => candidate.id === item.id);
                                                const isActive = index === highlightIndex;
                                                const accent = item.accent || accentFallback;
                                                return (
                                                    <button
                                                        key={item.id}
                                                        ref={(node) => {
                                                            if (node) {
                                                                itemRefs.current.set(item.id, node);
                                                            } else {
                                                                itemRefs.current.delete(item.id);
                                                            }
                                                        }}
                                                        type="button"
                                                        onClick={() => {
                                                            if (!item.disabled) {
                                                                onSelect(item);
                                                            }
                                                        }}
                                                        className={`relative flex w-full items-center justify-between gap-3 rounded-3xl border px-4 py-3 text-left transition ${
                                                            item.disabled
                                                                ? 'cursor-not-allowed opacity-60'
                                                                : 'hover:-translate-y-0.5 hover:shadow-lg'
                                                        } ${
                                                            isActive
                                                                ? 'border-brand-300/70 bg-white/85 shadow-[0_32px_90px_-56px_rgba(14,116,244,0.55)] dark:border-brand-400/70 dark:bg-slate-900/80'
                                                                : 'border-white/35 bg-white/70 dark:border-white/10 dark:bg-slate-900/70'
                                                        }`}
                                                        onMouseEnter={() => setHighlightIndex(index)}
                                                        onFocus={() => setHighlightIndex(index)}
                                                        aria-disabled={item.disabled}
                                                    >
                                                        {isActive && accent ? (
                                                            <span
                                                                className="pointer-events-none absolute inset-0 -z-[1] rounded-[inherit] opacity-90"
                                                                style={{ background: accent }}
                                                                aria-hidden="true"
                                                            />
                                                        ) : null}
                                                        <span className="flex min-w-0 flex-1 items-center gap-3">
                                                            <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-2xl border border-white/40 bg-white/75 text-brand-600 shadow-inner dark:border-white/15 dark:bg-white/10 dark:text-brand-200">
                                                                {item.icon}
                                                            </span>
                                                            <span className="min-w-0">
                                                                <span className="flex items-center gap-2">
                                                                    <span className={`truncate text-sm font-semibold ${isActive ? 'text-slate-800 dark:text-slate-50' : 'text-slate-700 dark:text-slate-100'}`}>
                                                                        {item.label}
                                                                    </span>
                                                                    {item.badge ? (
                                                                        <span className="rounded-full bg-slate-900/10 px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-[0.3em] text-slate-500 dark:bg-slate-100/10 dark:text-slate-300">
                                                                            {item.badge}
                                                                        </span>
                                                                    ) : null}
                                                                </span>
                                                                {item.description ? (
                                                                    <span className="mt-1 block truncate text-xs text-slate-500 dark:text-slate-400">
                                                                        {item.description}
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                        <span className="flex flex-none items-center gap-2 text-[0.6rem] font-semibold uppercase tracking-[0.32em] text-slate-400 dark:text-slate-500">
                                                            {item.shortcut ? (
                                                                <span>{item.shortcut}</span>
                                                            ) : item.hint ? (
                                                                <span>{item.hint}</span>
                                                            ) : null}
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/40 bg-white/70 px-4 py-2 text-[0.62rem] font-semibold uppercase tracking-[0.28em] text-slate-400 shadow-inner dark:border-white/10 dark:bg-slate-900/65 dark:text-slate-500">
                            <span>
                                Enter · Activate &nbsp;|&nbsp; Esc · Close
                            </span>
                            <span>
                                {shiftKeyLabel} {metaKeyLabel} {altKeyLabel} · Scene Controls
                            </span>
                        </div>
                    </motion.div>
                </motion.div>
            ) : null}
        </AnimatePresence>
    );
}

const itemShape = PropTypes.shape({
    id: PropTypes.string.isRequired,
    group: PropTypes.string,
    groupPriority: PropTypes.number,
    label: PropTypes.string.isRequired,
    description: PropTypes.string,
    badge: PropTypes.string,
    shortcut: PropTypes.string,
    hint: PropTypes.string,
    icon: PropTypes.node,
    accent: PropTypes.string,
    disabled: PropTypes.bool,
    onSelect: PropTypes.func.isRequired,
});

WindowCommandPalette.propTypes = {
    open: PropTypes.bool.isRequired,
    query: PropTypes.string.isRequired,
    onQueryChange: PropTypes.func.isRequired,
    items: PropTypes.arrayOf(itemShape).isRequired,
    onSelect: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    accentFallback: PropTypes.string,
    metaKeyLabel: PropTypes.string.isRequired,
    altKeyLabel: PropTypes.string.isRequired,
    shiftKeyLabel: PropTypes.string.isRequired,
};

WindowCommandPalette.defaultProps = {
    accentFallback: '',
};
