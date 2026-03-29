import { useState, useEffect, useMemo, useLayoutEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import parse from 'html-react-parser';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Spinner, Tooltip } from 'flowbite-react';
import {
    HiOutlineBookOpen,
    HiOutlineX,
    HiOutlineChevronLeft,
    HiOutlineChevronRight,
    HiOutlineTrash,
    HiOutlineChevronDoubleLeft,
    HiOutlineChevronDoubleRight,
    HiOutlineClipboardCopy,
    HiOutlineShare,
    HiOutlineVolumeUp,
    HiOutlineSelector,
    HiOutlineCollection,
    HiOutlineSearch,
} from 'react-icons/hi';
import { FaHighlighter } from 'react-icons/fa';

const HIGHLIGHT_STORAGE_PREFIX = 'reader-highlights:';

const highlightPalette = [
    { id: 'gold', label: 'Sunbeam', className: 'reader-highlight-gold', swatch: '#facc15' },
    { id: 'mint', label: 'Mint', className: 'reader-highlight-mint', swatch: '#34d399' },
    { id: 'rose', label: 'Blush', className: 'reader-highlight-rose', swatch: '#fb7185' },
    { id: 'violet', label: 'Iris', className: 'reader-highlight-violet', swatch: '#a855f7' },
];

const displayFontOptions = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans', label: 'Sans' },
    { id: 'mono', label: 'Mono' },
];

const createStorageKey = (chapterId) => `${HIGHLIGHT_STORAGE_PREFIX}${chapterId}`;

const getContainerRelativeTop = (container, element) => {
    if (!container || !element) return 0;

    const containerRect = container.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    return elementRect.top - containerRect.top + container.scrollTop;
};

const unwrapMarks = (container, attribute) => {
    if (!container) return;
    const marks = container.querySelectorAll(`mark[${attribute}]`);
    marks.forEach((mark) => {
        const parent = mark.parentNode;
        if (!parent) return;
        while (mark.firstChild) {
            parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
    });
};

const getTextNodes = (container) => {
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    while (walker.nextNode()) {
        nodes.push(walker.currentNode);
    }
    return nodes;
};

const isWhitespace = (char) => /\s/.test(char || '');

const normalizeOffsets = (text, start, end) => {
    let normalizedStart = Math.max(0, start);
    let normalizedEnd = Math.max(normalizedStart, end);

    while (normalizedStart < normalizedEnd && isWhitespace(text[normalizedStart])) {
        normalizedStart += 1;
    }

    while (normalizedEnd > normalizedStart && isWhitespace(text[normalizedEnd - 1])) {
        normalizedEnd -= 1;
    }

    return { start: normalizedStart, end: normalizedEnd };
};

const createRangeFromOffsets = (container, start, end) => {
    if (!container || start >= end) return null;

    const nodes = getTextNodes(container);
    if (!nodes.length) return null;

    const range = document.createRange();
    let charIndex = 0;
    let startNode = null;
    let startOffset = 0;
    let endNode = null;
    let endOffset = 0;

    for (const node of nodes) {
        const content = node.textContent || '';
        const nodeLength = content.length;
        const nodeStart = charIndex;
        const nodeEnd = nodeStart + nodeLength;

        if (!startNode && start >= nodeStart && start <= nodeEnd) {
            startNode = node;
            startOffset = Math.min(Math.max(start - nodeStart, 0), nodeLength);
        }

        if (!endNode && end >= nodeStart && end <= nodeEnd) {
            endNode = node;
            endOffset = Math.min(Math.max(end - nodeStart, 0), nodeLength);
        }

        if (startNode && endNode) {
            break;
        }

        charIndex = nodeEnd;
    }

    if (!startNode || !endNode) {
        return null;
    }

    try {
        range.setStart(startNode, startOffset);
        range.setEnd(endNode, endOffset);
        return range;
    } catch (error) {
        console.error('Failed to create range from offsets', error);
        return null;
    }
};

const getRangePosition = (range) => {
    if (typeof window === 'undefined') {
        return { x: 0, y: 0 };
    }

    const primaryRect = range.getBoundingClientRect();
    const rect = primaryRect.width === 0 && primaryRect.height === 0 ? range.getClientRects()[0] || primaryRect : primaryRect;

    return {
        x: rect.left + window.scrollX + rect.width / 2,
        y: rect.top + window.scrollY - 12,
    };
};

const expandStartOffset = (text, start) => {
    if (start <= 0) return 0;
    let cursor = Math.min(Math.max(start, 0), text.length);
    cursor = Math.max(0, cursor - 1);

    while (cursor > 0 && isWhitespace(text[cursor])) {
        cursor -= 1;
    }

    while (cursor > 0 && !isWhitespace(text[cursor - 1])) {
        cursor -= 1;
    }

    return cursor;
};

const expandEndOffset = (text, end) => {
    const length = text.length;
    let cursor = Math.min(Math.max(end, 0), length);

    while (cursor < length && isWhitespace(text[cursor])) {
        cursor += 1;
    }

    while (cursor < length && !isWhitespace(text[cursor])) {
        cursor += 1;
    }

    return cursor;
};

const shrinkStartOffset = (text, start, end) => {
    const snippet = text.slice(start, end);
    if (!snippet.trim()) return start;

    const remainder = snippet.replace(/^\s*\S+\s*/, '');
    if (!remainder.trim()) return start;

    return start + (snippet.length - remainder.length);
};

const shrinkEndOffset = (text, start, end) => {
    const snippet = text.slice(start, end);
    if (!snippet.trim()) return end;

    const remainder = snippet.replace(/\s*\S+\s*$/, '');
    if (!remainder.trim()) return end;

    return end - (snippet.length - remainder.length);
};

const expandToSentenceBoundaries = (text, start, end) => {
    const length = text.length;
    let sentenceStart = Math.min(Math.max(start, 0), length);
    let sentenceEnd = Math.min(Math.max(end, 0), length);

    while (sentenceStart > 0) {
        const prev = text[sentenceStart - 1];
        if (prev === '\n' || '.!?'.includes(prev)) {
            break;
        }
        sentenceStart -= 1;
    }

    while (sentenceStart < length && isWhitespace(text[sentenceStart])) {
        sentenceStart += 1;
    }

    while (sentenceEnd < length) {
        const current = text[sentenceEnd];
        if (!current) {
            break;
        }
        if (current === '\n' || '.!?'.includes(current)) {
            sentenceEnd += 1;
            break;
        }
        sentenceEnd += 1;
    }

    while (sentenceEnd < length && isWhitespace(text[sentenceEnd])) {
        sentenceEnd += 1;
    }

    if (sentenceEnd <= sentenceStart) {
        sentenceEnd = Math.min(length, sentenceStart + 1);
    }

    return { start: sentenceStart, end: sentenceEnd };
};

const expandToParagraphBoundaries = (text, start, end) => {
    const length = text.length;
    const delimiter = /\n\s*\n/g;
    let paragraphStart = 0;
    let paragraphEnd = length;
    let match;

    while ((match = delimiter.exec(text)) !== null) {
        const breakStart = match.index;
        const breakEnd = match.index + match[0].length;

        if (breakEnd <= start) {
            paragraphStart = breakEnd;
            continue;
        }

        if (breakStart >= end) {
            paragraphEnd = breakStart;
            break;
        }
    }

    while (paragraphStart < length && isWhitespace(text[paragraphStart])) {
        paragraphStart += 1;
    }

    while (paragraphEnd > paragraphStart && isWhitespace(text[paragraphEnd - 1])) {
        paragraphEnd -= 1;
    }

    if (paragraphEnd <= paragraphStart) {
        paragraphEnd = Math.min(length, paragraphStart + 1);
    }

    return { start: paragraphStart, end: paragraphEnd };
};

const applyHighlightRange = (container, highlight) => {
    if (!container || !highlight || highlight.start >= highlight.end) return;
    const nodes = getTextNodes(container);
    let charIndex = 0;
    const { start, end } = highlight;

    for (const node of nodes) {
        if (!node.textContent) {
            continue;
        }

        const length = node.textContent.length;
        const nodeStart = charIndex;
        const nodeEnd = charIndex + length;

        if (end <= nodeStart) {
            break;
        }

        if (start >= nodeEnd) {
            charIndex = nodeEnd;
            continue;
        }

        const localStart = Math.max(0, start - nodeStart);
        const localEnd = Math.min(length, end - nodeStart);

        if (localStart === localEnd) {
            charIndex = nodeEnd;
            continue;
        }

        const range = document.createRange();
        range.setStart(node, localStart);
        range.setEnd(node, localEnd);
        const mark = document.createElement('mark');
        mark.dataset.readerHighlight = 'true';
        mark.dataset.highlightId = highlight.id;
        mark.dataset.highlightColor = highlight.color;
        mark.className = `reader-highlight ${highlightPalette.find((c) => c.id === highlight.color)?.className || ''}`;
        mark.appendChild(range.extractContents());
        range.insertNode(mark);
        range.detach();

        if (end <= nodeEnd) {
            break;
        }

        charIndex = nodeEnd;
    }
};

const getSelectionOffsets = (container, range) => {
    const preRange = range.cloneRange();
    preRange.selectNodeContents(container);
    preRange.setEnd(range.startContainer, range.startOffset);
    const start = preRange.toString().length;
    const end = start + range.toString().length;
    preRange.detach();
    return { start, end };
};

const InteractiveReadingSurface = ({
    content,
    parserOptions,
    contentStyles,
    contentMaxWidth,
    surfaceClass,
    className,
    chapterId,
    readingMinutes,
    hideUtilityBar,
    hideToolbar,
    hideHighlightsPanel,
    variant = 'default',
    scrollRootId,
    readerSettings,
    isDisplayWindowOpen,
    onDisplaySettingsButtonClick,
    onProgressChange,
}) => {
    const containerRef = useRef(null);
    const selectionMenuRef = useRef(null);
    const speechUtteranceRef = useRef(null);
    const fullTextRef = useRef('');
    const initialStoredProgressRef = useRef(null);
    const protectedInitialProgressRef = useRef(false);
    const [highlights, setHighlights] = useState([]);
    const [selectionMenu, setSelectionMenu] = useState(null);
    const [dictionaryState, setDictionaryState] = useState({
        word: '',
        loading: false,
        entries: [],
        error: null,
        open: false,
    });
    const [selectionFeedback, setSelectionFeedback] = useState('');
    const [isSpeaking, setIsSpeaking] = useState(false);
    // NEW: In-page search state
    const [searchQuery, setSearchQuery] = useState('');
    const [searchHits, setSearchHits] = useState([]); // [{start, end}]
    const [currentHit, setCurrentHit] = useState(-1);
    const [searchCaseSensitive, setSearchCaseSensitive] = useState(false);
    const [searchWholeWord, setSearchWholeWord] = useState(false);
    const [showHighlights, setShowHighlights] = useState(true);
    const [progress, setProgress] = useState(0);
    const searchInputRef = useRef(null);
    const isPostArticleVariant = variant === 'post-article';
    const displaySettingsAvailable = Boolean(
        isPostArticleVariant &&
        readerSettings &&
        typeof onDisplaySettingsButtonClick === 'function'
    );
    const activeFontLabel = useMemo(
        () => displayFontOptions.find((option) => option.id === readerSettings?.fontFamily)?.label || 'Serif',
        [readerSettings?.fontFamily]
    );
    const remainingMinutes = useMemo(() => {
        if (!readingMinutes || readingMinutes <= 0) {
            return 0;
        }

        return Math.max(0, Math.ceil(readingMinutes * (1 - progress / 100)));
    }, [progress, readingMinutes]);
    const wrapperClassName = [
        'interactive-reading-surface',
        isPostArticleVariant ? 'interactive-reading-surface--post-article' : '',
        'space-y-6',
    ].filter(Boolean).join(' ');
    const utilityBarClassName = [
        'reader-utility-bar',
        isPostArticleVariant ? 'reader-utility-bar--post-article' : '',
    ].filter(Boolean).join(' ');
    const highlightsPanelClassName = [
        'reader-highlights-panel',
        isPostArticleVariant ? 'reader-highlights-panel--post-article' : '',
    ].filter(Boolean).join(' ');
    const dictionaryPanelClassName = [
        'reader-dictionary-panel',
        isPostArticleVariant ? 'reader-dictionary-panel--post-article' : '',
    ].filter(Boolean).join(' ');
    const selectionMenuClassName = [
        'reader-selection-menu',
        isPostArticleVariant ? 'reader-selection-menu--post-article' : '',
    ].filter(Boolean).join(' ');
    const selectionCardClassName = [
        'reader-selection-card',
        isPostArticleVariant ? 'reader-selection-card--post-article' : '',
    ].filter(Boolean).join(' ');
    const hideReaderToolbar = Boolean(hideUtilityBar || hideToolbar);
    const scrollRootAttributes = isPostArticleVariant
        ? {
            id: scrollRootId,
            'data-reading-scroll-root': 'true',
        }
        : {};

    const parsedContent = useMemo(() => parse(content || '', parserOptions), [content, parserOptions]);

    // Define early so effects can reference it safely
    const closeSelectionMenu = useCallback(() => {
        setSelectionMenu(null);
    }, []);

    useEffect(() => {
        if (!chapterId || typeof window === 'undefined') {
            setHighlights([]);
            return;
        }

        try {
            const stored = localStorage.getItem(createStorageKey(chapterId));
            if (stored) {
                const parsed = JSON.parse(stored);
                if (Array.isArray(parsed)) {
                    setHighlights(parsed);
                    return;
                }
            }
        } catch (error) {
            console.error('Failed to load highlights for chapter', error);
        }
        setHighlights([]);
    }, [chapterId, content]);

    useEffect(() => {
        if (!chapterId || typeof window === 'undefined') {
            initialStoredProgressRef.current = null;
            protectedInitialProgressRef.current = false;
            return;
        }

        try {
            const raw = localStorage.getItem(`reading-progress:${chapterId}`);
            const parsed = raw ? Number.parseFloat(raw) : NaN;
            initialStoredProgressRef.current = Number.isFinite(parsed)
                ? Math.min(Math.max(parsed, 0), 1)
                : null;
        } catch (_) {
            initialStoredProgressRef.current = null;
        }

        protectedInitialProgressRef.current = false;
    }, [chapterId, content]);

    useEffect(() => {
        if (!chapterId || typeof window === 'undefined') return;
        try {
            localStorage.setItem(createStorageKey(chapterId), JSON.stringify(highlights));
        } catch (error) {
            console.error('Failed to persist highlights', error);
        }
    }, [chapterId, highlights]);

    useEffect(() => {
        setSelectionMenu(null);
        setSelectionFeedback('');
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
        setIsSpeaking(false);
    }, [chapterId, content]);

    useEffect(() => () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    useEffect(() => {
        if (!selectionFeedback) return undefined;
        const timeout = setTimeout(() => setSelectionFeedback(''), 2500);
        return () => clearTimeout(timeout);
    }, [selectionFeedback]);

    useEffect(() => {
        if (!selectionMenu && isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        }
    }, [selectionMenu, isSpeaking]);

    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        unwrapMarks(container, 'data-reader-highlight');

        if (!showHighlights) return;

        const ordered = [...highlights].sort((a, b) => a.start - b.start);
        ordered.forEach((highlight) => applyHighlightRange(container, { ...highlight }));
    }, [content, highlights, showHighlights]);

    // Helpers to manage search wrappers
    const removeSearchMarks = useCallback((container) => {
        if (!container) return;
        const marks = container.querySelectorAll('mark[data-reader-search]');
        marks.forEach((mark) => {
            const parent = mark.parentNode;
            if (!parent) return;
            while (mark.firstChild) parent.insertBefore(mark.firstChild, mark);
            parent.removeChild(mark);
        });
    }, []);

    const applySearchMark = (container, start, end, active = false) => {
        const range = createRangeFromOffsets(container, start, end);
        if (!range) return;
        const wrap = document.createElement('mark');
        wrap.dataset.readerSearch = 'true';
        wrap.className = `reader-search-hit ${active ? 'reader-search-hit-active' : ''}`;
        wrap.appendChild(range.extractContents());
        range.insertNode(wrap);
        range.detach();
    };

    // Recompute and render search hits when content or query changes
    useLayoutEffect(() => {
        const container = containerRef.current;
        if (!container) return;
        removeSearchMarks(container);
        setSearchHits([]);
        setCurrentHit(-1);
        const q = (searchQuery || '').trim();
        if (!q || q.length < 2) return;
        const fullText = container.textContent || '';
        const hits = [];
        // Build regex based on flags
        const flags = searchCaseSensitive ? 'g' : 'gi';
        const escaped = q.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
        const pattern = searchWholeWord ? `\\b${escaped}\\b` : escaped;
        let re;
        try { re = new RegExp(pattern, flags); } catch (_) { return; }
        let m;
        while ((m = re.exec(fullText)) !== null) {
            hits.push({ start: m.index, end: m.index + m[0].length });
            if (m.index === re.lastIndex) re.lastIndex++; // avoid zero-length loops
        }
        if (hits.length === 0) return;

        // Render wrappers; mark first as active by default
        hits.forEach((h, i) => applySearchMark(container, h.start, h.end, i === 0));
        setSearchHits(hits);
        setCurrentHit(0);
        // Scroll to first
        const first = container.querySelector('mark.reader-search-hit');
        if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, [searchQuery, content, removeSearchMarks, searchCaseSensitive, searchWholeWord]);

    const jumpToHit = useCallback((direction) => {
        if (searchHits.length === 0) return;
        const container = containerRef.current;
        if (!container) return;
        // Clear active class
        container.querySelectorAll('mark.reader-search-hit-active').forEach((el) => el.classList.remove('reader-search-hit-active'));
        let next = currentHit + (direction === 'prev' ? -1 : 1);
        if (next < 0) next = searchHits.length - 1;
        if (next >= searchHits.length) next = 0;
        setCurrentHit(next);
        const mark = container.querySelectorAll('mark.reader-search-hit')[next];
        if (mark) {
            mark.classList.add('reader-search-hit-active');
            mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, [searchHits.length, currentHit]);

    const clearSearch = useCallback(() => {
        const container = containerRef.current;
        if (container) removeSearchMarks(container);
        setSearchQuery('');
        setSearchHits([]);
        setCurrentHit(-1);
    }, [removeSearchMarks]);

    const jumpToHeading = useCallback((direction) => {
        const container = containerRef.current;
        if (!container) return;

        const headings = Array.from(container.querySelectorAll('h2, h3'));
        if (!headings.length) return;

        if (isPostArticleVariant) {
            const currentTop = container.scrollTop + 16;
            const target =
                direction === 'prev'
                    ? headings
                        .filter((heading) => getContainerRelativeTop(container, heading) < currentTop - 4)
                        .pop()
                    : headings.find((heading) => getContainerRelativeTop(container, heading) > currentTop + 16);

            if (target) {
                const targetTop = Math.max(0, getContainerRelativeTop(container, target) - 24);
                container.scrollTo({ top: targetTop, behavior: 'smooth' });
            }
            return;
        }

        const y = window.scrollY + 8;
        const target =
            direction === 'prev'
                ? headings.filter((heading) => heading.getBoundingClientRect().top + window.scrollY < y).pop()
                : headings.find((heading) => heading.getBoundingClientRect().top + window.scrollY > y);

        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [isPostArticleVariant]);

    // Progress: compute relative scroll progress through the reading surface
    useEffect(() => {
        const onScroll = () => {
            const c = containerRef.current;
            if (!c) return;
            const pct = (() => {
                if (isPostArticleVariant) {
                    const scrollableDistance = c.scrollHeight - c.clientHeight;
                    if (scrollableDistance <= 1) {
                        return 100;
                    }

                    return Math.min(1, Math.max(0, c.scrollTop / scrollableDistance)) * 100;
                }

                const rect = c.getBoundingClientRect();
                const start = window.scrollY + rect.top;
                const end = start + c.scrollHeight - window.innerHeight;
                const denom = Math.max(1, end - start);
                const raw = (window.scrollY - start) / denom;
                return Math.min(1, Math.max(0, raw)) * 100;
            })();
            const fraction = Math.min(1, Math.max(0, pct / 100));
            const savedFraction = initialStoredProgressRef.current;

            if (
                !protectedInitialProgressRef.current
                && Number.isFinite(savedFraction)
                && savedFraction > fraction + 0.02
            ) {
                protectedInitialProgressRef.current = true;
                const savedPercent = savedFraction * 100;
                const savedRemainingMinutes = readingMinutes && readingMinutes > 0
                    ? Math.max(0, Math.ceil(readingMinutes * (1 - savedFraction)))
                    : 0;

                setProgress(savedPercent);
                if (typeof onProgressChange === 'function') {
                    onProgressChange({
                        percent: savedPercent,
                        fraction: savedFraction,
                        remainingMinutes: savedRemainingMinutes,
                        mode: 'article',
                    });
                }
                return;
            }

            protectedInitialProgressRef.current = true;
            setProgress(pct);
            if (typeof onProgressChange === 'function') {
                const nextRemainingMinutes = readingMinutes && readingMinutes > 0
                    ? Math.max(0, Math.ceil(readingMinutes * (1 - fraction)))
                    : 0;

                onProgressChange({
                    percent: pct,
                    fraction,
                    remainingMinutes: nextRemainingMinutes,
                    mode: 'article',
                });
            }
            // Persist reading progress per chapter for resume feature
            try {
                if (chapterId) {
                    const key = `reading-progress:${chapterId}`;
                    const value = (pct / 100).toFixed(4);
                    localStorage.setItem(key, value);
                }
            } catch (_) {
                // ignore persistence errors
            }
        };
        onScroll();
        const scrollTarget = isPostArticleVariant ? containerRef.current : window;
        scrollTarget?.addEventListener?.('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll);
        return () => {
            scrollTarget?.removeEventListener?.('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
        };
    }, [chapterId, isPostArticleVariant, onProgressChange, readingMinutes]);

    // Add anchor buttons to headings for easy permalinks
    useEffect(() => {
        const c = containerRef.current;
        if (!c) return;
        const heads = c.querySelectorAll('h2[id], h3[id]');
        heads.forEach((h) => {
            if (h.querySelector('.heading-anchor')) return;
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'heading-anchor';
            btn.setAttribute('aria-label', 'Copy link to section');
            btn.textContent = '§';
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const id = h.getAttribute('id');
                if (!id) return;
                const url = `${window.location.origin}${window.location.pathname}#${id}`;
                if (navigator?.clipboard?.writeText) {
                    navigator.clipboard.writeText(url).catch(() => {});
                }
                try {
                    h.classList.add('heading-anchor-copied');
                    setTimeout(() => h.classList.remove('heading-anchor-copied'), 1200);
                } catch (_) {
                    // Ignore transient DOM state changes while copying heading links.
                }
            });
            h.appendChild(btn);
        });
    }, [content, parserOptions]);

    // Keyboard shortcuts for navigation (active when not typing in inputs)
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            if (e.key === '/') {
                e.preventDefault();
                searchInputRef.current?.focus();
            } else if (e.key === 'Enter') {
                if (e.shiftKey) jumpToHit('prev'); else jumpToHit('next');
            } else if (e.key === 'n') {
                jumpToHit(e.shiftKey ? 'prev' : 'next');
            } else if (e.key === 'h') {
                jumpToHeading('prev');
            } else if (e.key === 'H') {
                jumpToHeading('next');
            } else if (e.key === 'e') {
                // export highlights
                navigator.clipboard.writeText(JSON.stringify(highlights, null, 2)).then(() => setSelectionFeedback('Exported highlights.')).catch(() => setSelectionFeedback('Export failed.'));
            } else if (e.key === 'i') {
                navigator.clipboard.readText().then((t) => { const d = JSON.parse(t); if (Array.isArray(d)) setHighlights(d); }).catch(() => setSelectionFeedback('Import failed.'));
            } else if (e.key === 'Escape') {
                closeSelectionMenu();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [jumpToHit, highlights, closeSelectionMenu, jumpToHeading]);


    const captureSelection = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            closeSelectionMenu();
            return;
        }

        const range = selection.getRangeAt(0);
        if (!container.contains(range.commonAncestorContainer)) {
            closeSelectionMenu();
            return;
        }

        const fullText = container.textContent || '';
        fullTextRef.current = fullText;

        const rawSelection = selection.toString();
        const text = rawSelection.trim();
        if (!text) {
            closeSelectionMenu();
            return;
        }

        const offsets = getSelectionOffsets(container, range);
        const leadingWhitespace = rawSelection.length - rawSelection.trimStart().length;
        const trailingWhitespace = rawSelection.length - rawSelection.trimEnd().length;

        let start = offsets.start + leadingWhitespace;
        let end = offsets.end - trailingWhitespace;

        ({ start, end } = normalizeOffsets(fullText, start, end));

        if (start === end) {
            closeSelectionMenu();
            return;
        }

        const normalizedRange = createRangeFromOffsets(container, start, end) || range.cloneRange();

        if (selection && normalizedRange) {
            selection.removeAllRanges();
            selection.addRange(normalizedRange);
        }

        const existing = highlights.find((item) => start >= item.start && end <= item.end);

        if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        }

        setSelectionFeedback('');

        setSelectionMenu({
            text: normalizedRange?.toString().trim() || text,
            start,
            end,
            highlightId: existing?.id || null,
            color: existing?.color || null,
            position: getRangePosition(normalizedRange),
        });
    }, [closeSelectionMenu, highlights, isSpeaking]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const handleMouseUp = () => setTimeout(captureSelection, 0);
        const handleTouchEnd = () => setTimeout(captureSelection, 0);
        const handleKeyUp = () => setTimeout(captureSelection, 0);
        const handleScroll = () => closeSelectionMenu();
        const handleDocumentClick = (event) => {
            if (!selectionMenu) return;
            const target = event.target;
            if (!target || typeof target !== 'object' || !('nodeType' in target)) {
                return;
            }
            if (selectionMenuRef.current?.contains(target)) {
                return;
            }
            if (!container.contains(target)) {
                closeSelectionMenu();
            }
        };

        container.addEventListener('mouseup', handleMouseUp);
        container.addEventListener('touchend', handleTouchEnd);
        container.addEventListener('keyup', handleKeyUp);
        document.addEventListener('scroll', handleScroll, true);
        document.addEventListener('mousedown', handleDocumentClick);

        return () => {
            container.removeEventListener('mouseup', handleMouseUp);
            container.removeEventListener('touchend', handleTouchEnd);
            container.removeEventListener('keyup', handleKeyUp);
            document.removeEventListener('scroll', handleScroll, true);
            document.removeEventListener('mousedown', handleDocumentClick);
        };
    }, [captureSelection, closeSelectionMenu, selectionMenu]);

    const handleAddHighlight = (color) => {
        if (!selectionMenu) return;
        const { start, end, text, highlightId } = selectionMenu;
        if (!text || start === end) return;

        const id = highlightId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `hl-${Date.now()}`);

        setHighlights((prev) => {
            const filtered = prev.filter((item) => item.id !== highlightId);
            return [...filtered, { id, start, end, color, text }];
        });
        setSelectionMenu(null);

        const selection = window.getSelection();
        if (selection && selection.rangeCount > 0) {
            selection.removeAllRanges();
        }
    };

    const handleRemoveHighlight = (id) => {
        setHighlights((prev) => prev.filter((item) => item.id !== id));
        setSelectionMenu(null);
    };

    const handleLookupWord = async (text) => {
        if (!text) return;
        const word = text.split(/\s+/)[0].toLowerCase();
        setDictionaryState({ word, loading: true, entries: [], error: null, open: true });
        try {
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
            if (!response.ok) {
                throw new Error('Definition not found for selected term.');
            }
            const data = await response.json();
            setDictionaryState({ word, loading: false, entries: data, error: null, open: true });
        } catch (error) {
            setDictionaryState({
                word,
                loading: false,
                entries: [],
                error: error.message || 'Unable to fetch dictionary entry.',
                open: true,
            });
        }
    };

    const adjustSelection = (edge, direction) => {
        if (!selectionMenu) return;
        const container = containerRef.current;
        if (!container) return;

        const fullText = fullTextRef.current || container.textContent || '';
        if (!fullText) return;

        let { start, end } = selectionMenu;

        if (direction === 'expand') {
            if (edge === 'start') {
                const nextStart = expandStartOffset(fullText, start);
                if (nextStart === start) {
                    setSelectionFeedback('Reached the beginning of the text.');
                    return;
                }
                start = nextStart;
            } else {
                const nextEnd = expandEndOffset(fullText, end);
                if (nextEnd === end) {
                    setSelectionFeedback('Reached the end of the text.');
                    return;
                }
                end = nextEnd;
            }
        } else {
            if (edge === 'start') {
                const nextStart = shrinkStartOffset(fullText, start, end);
                if (nextStart === start) {
                    setSelectionFeedback('Cannot trim further from the left.');
                    return;
                }
                start = nextStart;
            } else {
                const nextEnd = shrinkEndOffset(fullText, start, end);
                if (nextEnd === end) {
                    setSelectionFeedback('Cannot trim further from the right.');
                    return;
                }
                end = nextEnd;
            }
        }

        ({ start, end } = normalizeOffsets(fullText, start, end));

        if (start >= end) {
            setSelectionFeedback('Selection cannot be reduced further.');
            return;
        }

        if (start === selectionMenu.start && end === selectionMenu.end) {
            return;
        }

        const range = createRangeFromOffsets(container, start, end);
        if (!range) return;

        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        setSelectionMenu((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                start,
                end,
                text: range.toString().trim(),
                highlightId: null,
                color: null,
                position: getRangePosition(range),
            };
        });
        setSelectionFeedback(direction === 'expand' ? 'Selection expanded.' : 'Selection trimmed.');
    };

    const expandSelectionToScope = (scope) => {
        if (!selectionMenu) return;
        const container = containerRef.current;
        if (!container) return;

        const fullText = fullTextRef.current || container.textContent || '';
        if (!fullText) return;

        let { start, end } = selectionMenu;
        let boundaries = null;

        if (scope === 'sentence') {
            boundaries = expandToSentenceBoundaries(fullText, start, end);
        } else if (scope === 'paragraph') {
            boundaries = expandToParagraphBoundaries(fullText, start, end);
        }

        if (!boundaries) return;

        ({ start, end } = normalizeOffsets(fullText, boundaries.start, boundaries.end));

        if (start >= end) {
            setSelectionFeedback('Unable to expand selection.');
            return;
        }

        if (start === selectionMenu.start && end === selectionMenu.end) {
            const label = scope === 'sentence' ? 'sentence' : 'paragraph';
            setSelectionFeedback(`Already selecting the full ${label}.`);
            return;
        }

        const range = createRangeFromOffsets(container, start, end);
        if (!range) return;

        const selection = window.getSelection();
        if (selection) {
            selection.removeAllRanges();
            selection.addRange(range);
        }

        setSelectionMenu((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                start,
                end,
                text: range.toString().trim(),
                highlightId: null,
                color: null,
                position: getRangePosition(range),
            };
        });

        const label = scope === 'sentence' ? 'sentence' : 'paragraph';
        setSelectionFeedback(`Expanded to the full ${label}.`);
    };

    const handleCopySelection = async () => {
        if (!selectionMenu?.text) return;
        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
            setSelectionFeedback('Clipboard access is not available.');
            return;
        }
        try {
            await navigator.clipboard.writeText(selectionMenu.text);
            setSelectionFeedback('Selection copied to clipboard.');
        } catch (error) {
            console.error('Unable to copy selection', error);
            setSelectionFeedback('Unable to copy selection.');
        }
    };

    const handleShareSelection = async () => {
        if (!selectionMenu?.text) return;
        if (typeof navigator === 'undefined' || !navigator.share) {
            setSelectionFeedback('Sharing is not supported in this browser.');
            return;
        }
        try {
            await navigator.share({ text: selectionMenu.text });
            setSelectionFeedback('Shared selection.');
        } catch (error) {
            if (error?.name !== 'AbortError') {
                console.error('Unable to share selection', error);
                setSelectionFeedback('Unable to share selection.');
            }
        }
    };

    const handleSpeakSelection = () => {
        if (!selectionMenu?.text) return;
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setSelectionFeedback('Text-to-speech is not supported in this browser.');
            return;
        }

        if (isSpeaking) {
            window.speechSynthesis.cancel();
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
            setSelectionFeedback('Stopped reading the selection.');
            return;
        }

        const utterance = new window.SpeechSynthesisUtterance(selectionMenu.text);
        speechUtteranceRef.current = utterance;
        utterance.onend = () => {
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
        };
        utterance.onerror = () => {
            setIsSpeaking(false);
            speechUtteranceRef.current = null;
            setSelectionFeedback('Unable to read the selection aloud.');
        };

        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
        setSelectionFeedback('Reading selection aloud…');
    };

    const closeDictionary = () => {
        setDictionaryState((prev) => ({ ...prev, open: false }));
    };

    return (
        <div className={wrapperClassName} data-reader-variant={variant}>
            {!hideReaderToolbar && (
                isPostArticleVariant ? (
                    displaySettingsAvailable ? (
                        <div className={`${utilityBarClassName} reader-utility-bar--compact`} role="toolbar" aria-label="Display settings">
                            <div className="reader-toolbar-row reader-toolbar-row--display-only">
                                <div className="reader-toolbar-group reader-toolbar-group--display">
                                    <button
                                        type="button"
                                        className={`reader-display-trigger ${isDisplayWindowOpen ? 'active' : ''}`}
                                        onClick={onDisplaySettingsButtonClick}
                                        aria-haspopup="dialog"
                                        aria-expanded={Boolean(isDisplayWindowOpen)}
                                    >
                                        <span className="reader-display-trigger__glyph" aria-hidden="true">Aa</span>
                                        <span className="reader-display-trigger__body">
                                            <span className="reader-display-trigger__label">Font &amp; Display</span>
                                            <span className="reader-display-trigger__meta">{activeFontLabel} · {readerSettings.fontSize}px</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : null
                ) : (
                    <div className={utilityBarClassName} role="toolbar" aria-label="Reading tools">
                        <div className="reader-toolbar-row">
                            <div className="reader-toolbar-group reader-toolbar-group--search">
                                <div className="reader-search-field">
                                    {isPostArticleVariant && (
                                        <span className="reader-search-field__icon" aria-hidden="true">
                                            <HiOutlineSearch />
                                        </span>
                                    )}
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search in page…"
                                        ref={searchInputRef}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') { e.preventDefault(); if (e.shiftKey) jumpToHit('prev'); else jumpToHit('next'); }
                                        }}
                                        className="reader-search-field__input w-full rounded-lg border border-slate-200 bg-white py-1.5 px-2 text-sm text-slate-700 outline-none ring-brand-400 focus:border-brand-400 focus:ring-2 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    />
                                    {searchQuery && (
                                        <button
                                            type="button"
                                            className="reader-search-field__clear absolute right-1.5 top-1/2 -translate-y-1/2 text-xs text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                            onClick={clearSearch}
                                            aria-label="Clear search"
                                        >
                                            <HiOutlineX />
                                        </button>
                                    )}
                                </div>
                                <div className="reader-toolbar-pill" aria-live="polite">
                                    {searchHits.length > 0
                                        ? `${currentHit + 1}/${searchHits.length}`
                                        : searchQuery.trim()
                                            ? '0 matches'
                                            : 'Search'}
                                </div>
                                <div className="reader-toolbar-group reader-toolbar-group--filters">
                                    <button type="button" className="reader-nav-btn" onClick={() => jumpToHit('prev')} aria-label="Previous match">
                                        <HiOutlineChevronLeft />
                                    </button>
                                    <button type="button" className="reader-nav-btn" onClick={() => jumpToHit('next')} aria-label="Next match">
                                        <HiOutlineChevronRight />
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-toggle ${searchCaseSensitive ? 'active' : ''}`}
                                        onClick={() => setSearchCaseSensitive((v) => !v)}
                                        aria-pressed={searchCaseSensitive}
                                        title="Case sensitive"
                                    >
                                        {isPostArticleVariant ? 'Case' : 'Aa'}
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-toggle ${searchWholeWord ? 'active' : ''}`}
                                        onClick={() => setSearchWholeWord((v) => !v)}
                                        aria-pressed={searchWholeWord}
                                        title="Whole word"
                                    >
                                        {isPostArticleVariant ? 'Word' : 'W'}
                                    </button>
                                </div>
                            </div>

                            <div className="reader-toolbar-group reader-toolbar-group--navigation">
                                <button
                                    type="button"
                                    className="reader-nav-btn"
                                    onClick={() => jumpToHeading('prev')}
                                    aria-label="Previous heading"
                                >
                                    <HiOutlineChevronDoubleLeft />
                                </button>
                                <button
                                    type="button"
                                    className="reader-nav-btn"
                                    onClick={() => jumpToHeading('next')}
                                    aria-label="Next heading"
                                >
                                    <HiOutlineChevronDoubleRight />
                                </button>
                            </div>

                            {highlights.length > 0 && (
                                <div className="reader-toolbar-group reader-toolbar-group--highlights">
                                    <button
                                        type="button"
                                        className="reader-nav-btn"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(JSON.stringify(highlights, null, 2));
                                                setSelectionFeedback('Exported highlights to clipboard.');
                                            } catch (_) {
                                                setSelectionFeedback('Unable to copy highlights.');
                                            }
                                        }}
                                        aria-label="Export highlights"
                                        title="Export highlights"
                                    >
                                        Export
                                    </button>
                                    <button
                                        type="button"
                                        className="reader-nav-btn"
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText();
                                                const data = JSON.parse(text);
                                                if (Array.isArray(data)) {
                                                    setHighlights(data);
                                                    setSelectionFeedback('Imported highlights from clipboard.');
                                                } else {
                                                    setSelectionFeedback('Clipboard does not contain a highlight list.');
                                                }
                                            } catch (_) {
                                                setSelectionFeedback('Unable to import highlights. Copy JSON first.');
                                            }
                                        }}
                                        aria-label="Import highlights"
                                        title="Import highlights"
                                    >
                                        Import
                                    </button>
                                    <button
                                        type="button"
                                        className={`reader-toggle ${showHighlights ? 'active' : ''}`}
                                        onClick={() => setShowHighlights((v) => !v)}
                                        aria-pressed={showHighlights}
                                        title={showHighlights ? 'Hide highlights' : 'Show highlights'}
                                    >
                                        HL
                                    </button>
                                </div>
                            )}

                            {displaySettingsAvailable && (
                                <div className="reader-toolbar-group reader-toolbar-group--display">
                                    <button
                                        type="button"
                                        className={`reader-display-trigger ${isDisplayWindowOpen ? 'active' : ''}`}
                                        onClick={onDisplaySettingsButtonClick}
                                        aria-haspopup="dialog"
                                        aria-expanded={Boolean(isDisplayWindowOpen)}
                                    >
                                        <span className="reader-display-trigger__glyph" aria-hidden="true">Aa</span>
                                        <span className="reader-display-trigger__body">
                                            <span className="reader-display-trigger__label">Font &amp; Display</span>
                                            <span className="reader-display-trigger__meta">{activeFontLabel} · {readerSettings.fontSize}px</span>
                                        </span>
                                    </button>
                                </div>
                            )}
                        </div>
                        <div className="reader-progress" aria-hidden="true">
                            <div className="reader-progress-bar" style={{ width: `${progress}%` }} />
                        </div>
                    </div>
                )
            )}

            <motion.div
                ref={containerRef}
                className={[className, surfaceClass].filter(Boolean).join(' ')}
                data-reading-surface="true"
                {...scrollRootAttributes}
                style={{ ...contentStyles, maxWidth: contentMaxWidth }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                tabIndex={0}
            >
                {parsedContent}
            </motion.div>

            {/* Time-left indicator */}
            {typeof document !== 'undefined' && !hideUtilityBar && (readingMinutes || 0) > 0 &&
                createPortal(
                    <div
                        className={`fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full border border-slate-200/70 bg-white/90 px-3 py-1.5 text-xs text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 lg:hidden ${isPostArticleVariant ? 'reader-time-pill--post-article' : ''}`}
                        aria-live="polite"
                    >
                        {Math.round(progress)}% · {remainingMinutes} min left
                    </div>,
                    document.body
                )}

            {!hideHighlightsPanel && highlights.length > 0 && (
                <div className={highlightsPanelClassName}>
                    <div className="reader-highlights-header">
                        <div className="flex items-center gap-2">
                            <FaHighlighter aria-hidden="true" />
                            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200">Your Highlights</h3>
                        </div>
                        <button
                            type="button"
                            className="reader-highlight-clear"
                            onClick={() => setHighlights([])}
                        >
                            <HiOutlineTrash className="mr-1" /> Clear all
                        </button>
                    </div>
                    <ul className="space-y-3">
                        {highlights
                            .slice()
                            .sort((a, b) => a.start - b.start)
                            .map((highlight) => (
                                <li
                                    key={highlight.id}
                                    className={`reader-highlight-item ${isPostArticleVariant ? 'reader-highlight-item--post-article' : ''}`}
                                >
                                    <span className={`reader-highlight-chip ${highlightPalette.find((c) => c.id === highlight.color)?.className || ''}`}>
                                        {highlight.text.trim().slice(0, 120)}
                                        {highlight.text.length > 120 ? '…' : ''}
                                    </span>
                                    <div className="reader-highlight-actions">
                                        <Tooltip content="Reveal highlight">
                                            <button
                                                type="button"
                                                className="reader-highlight-jump"
                                                onClick={() => {
                                                    const container = containerRef.current;
                                                    if (!container) return;
                                                    const mark = container.querySelector(`mark[data-highlight-id="${highlight.id}"]`);
                                                    if (mark) {
                                                        mark.classList.add('reader-highlight-pulse');
                                                        mark.scrollIntoView({ behavior: 'smooth', block: 'center' });
                                                        setTimeout(() => mark.classList.remove('reader-highlight-pulse'), 1200);
                                                    }
                                                }}
                                            >
                                                Jump
                                            </button>
                                        </Tooltip>
                                        <Tooltip content="Edit note">
                                            <button
                                                type="button"
                                                className="reader-highlight-jump"
                                                onClick={() => {
                                                    const note = prompt('Edit note (markdown supported):', highlight.note || '');
                                                    if (note !== null) {
                                                        setHighlights((prev) => prev.map((h) => (h.id === highlight.id ? { ...h, note } : h)));
                                                    }
                                                }}
                                            >
                                                Note
                                            </button>
                                        </Tooltip>
                                        <button
                                            type="button"
                                            className="reader-highlight-delete"
                                            onClick={() => handleRemoveHighlight(highlight.id)}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                    {highlight.note && (
                                        <div className="reader-highlight-note mt-2 text-xs text-slate-600 dark:text-slate-300">
                                            {highlight.note}
                                        </div>
                                    )}
                                </li>
                            ))}
                    </ul>
                </div>
            )}

            <AnimatePresence>
                {dictionaryState.open && (
                    <motion.div
                        key="dictionary"
                        className={dictionaryPanelClassName}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                    >
                        <div className="reader-dictionary-header">
                            <div className="flex items-center gap-2">
                                <HiOutlineBookOpen aria-hidden="true" />
                                <h4 className="text-sm font-semibold">Dictionary · {dictionaryState.word}</h4>
                            </div>
                            <button type="button" onClick={closeDictionary} aria-label="Close dictionary">
                                <HiOutlineX />
                            </button>
                        </div>
                        <div className="reader-dictionary-body">
                            {dictionaryState.loading && (
                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-300">
                                    <Spinner size="sm" />
                                    <span>Looking up definition…</span>
                                </div>
                            )}
                            {!dictionaryState.loading && dictionaryState.error && (
                                <p className="text-sm text-red-500">{dictionaryState.error}</p>
                            )}
                            {!dictionaryState.loading && !dictionaryState.error && dictionaryState.entries.length > 0 && (
                                <div className="space-y-3 text-sm">
                                    {dictionaryState.entries[0]?.meanings?.slice(0, 2).map((meaning, index) => (
                                        <div key={index} className="reader-dictionary-meaning">
                                            <p className="font-semibold text-slate-700 dark:text-slate-200">
                                                {meaning.partOfSpeech}
                                            </p>
                                            <ul className="list-disc pl-5 text-slate-600 dark:text-slate-300">
                                                {meaning.definitions.slice(0, 2).map((def, defIndex) => (
                                                    <li key={defIndex}>{def.definition}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {selectionMenu && typeof document !== 'undefined' &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            ref={selectionMenuRef}
                            key="selection-menu"
                            className={selectionMenuClassName}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            style={{ top: selectionMenu.position.y, left: selectionMenu.position.x }}
                        >
                            <div className={selectionCardClassName}>
                                <p className="reader-selection-text">{selectionMenu.text.slice(0, 80)}{selectionMenu.text.length > 80 ? '…' : ''}</p>
                                <div className="reader-selection-section">
                                    <span className="reader-selection-section-title">Adjust range</span>
                                    <div className="reader-selection-range-controls">
                                        <div className="reader-selection-handle-group">
                                            <button
                                                type="button"
                                                className="reader-selection-handle"
                                                onClick={() => adjustSelection('start', 'expand')}
                                                aria-label="Expand selection to the left"
                                            >
                                                <HiOutlineChevronDoubleLeft />
                                            </button>
                                            <button
                                                type="button"
                                                className="reader-selection-handle"
                                                onClick={() => adjustSelection('start', 'shrink')}
                                                aria-label="Trim selection from the left"
                                            >
                                                <HiOutlineChevronRight />
                                            </button>
                                        </div>
                                        <div className="reader-selection-handle-group">
                                            <button
                                                type="button"
                                                className="reader-selection-handle"
                                                onClick={() => adjustSelection('end', 'shrink')}
                                                aria-label="Trim selection from the right"
                                            >
                                                <HiOutlineChevronLeft />
                                            </button>
                                            <button
                                                type="button"
                                                className="reader-selection-handle"
                                                onClick={() => adjustSelection('end', 'expand')}
                                                aria-label="Expand selection to the right"
                                            >
                                                <HiOutlineChevronDoubleRight />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <div className="reader-selection-section">
                                    <span className="reader-selection-section-title">Smart select</span>
                                    <div className="reader-selection-scope">
                                        <button type="button" onClick={() => expandSelectionToScope('sentence')}>
                                            <HiOutlineSelector /> Sentence
                                        </button>
                                        <button type="button" onClick={() => expandSelectionToScope('paragraph')}>
                                            <HiOutlineCollection /> Paragraph
                                        </button>
                                    </div>
                                </div>
                                <div className="reader-selection-section">
                                    <span className="reader-selection-section-title">Highlight & tools</span>
                                    <div className="reader-selection-actions">
                                        {highlightPalette.map((item) => (
                                            <button
                                                key={item.id}
                                                type="button"
                                                className={`reader-highlight-option ${selectionMenu.color === item.id ? 'active' : ''}`}
                                                onClick={() => handleAddHighlight(item.id)}
                                                style={{ '--highlight-swatch': item.swatch }}
                                            >
                                                <FaHighlighter aria-hidden />
                                            </button>
                                        ))}
                                        <button
                                            type="button"
                                            className="reader-selection-button"
                                            onClick={() => handleLookupWord(selectionMenu.text)}
                                            aria-label="Look up in dictionary"
                                        >
                                            <HiOutlineBookOpen />
                                        </button>
                                        {selectionMenu.highlightId && (
                                            <button
                                                type="button"
                                                className="reader-selection-button"
                                                onClick={() => handleRemoveHighlight(selectionMenu.highlightId)}
                                                aria-label="Remove highlight"
                                            >
                                                <HiOutlineTrash />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="reader-selection-section">
                                    <span className="reader-selection-section-title">Quick actions</span>
                                    <div className="reader-selection-quick">
                                        <button type="button" onClick={handleCopySelection} aria-label="Copy selection">
                                            <HiOutlineClipboardCopy />
                                            <span>Copy</span>
                                        </button>
                                        <button type="button" onClick={handleShareSelection} aria-label="Share selection">
                                            <HiOutlineShare />
                                            <span>Share</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleSpeakSelection}
                                            aria-label={isSpeaking ? 'Stop reading selection' : 'Read selection aloud'}
                                            aria-pressed={isSpeaking}
                                            className={isSpeaking ? 'active' : ''}
                                        >
                                            <HiOutlineVolumeUp />
                                            <span>{isSpeaking ? 'Stop' : 'Listen'}</span>
                                        </button>
                                    </div>
                                </div>
                                {selectionFeedback && <p className="reader-selection-feedback">{selectionFeedback}</p>}
                            </div>
                        </motion.div>
                    </AnimatePresence>,
                    document.body
                )}
        </div>
    );
};

InteractiveReadingSurface.propTypes = {
    content: PropTypes.string,
    parserOptions: PropTypes.object,
    contentStyles: PropTypes.object,
    contentMaxWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    surfaceClass: PropTypes.string,
    className: PropTypes.string,
    chapterId: PropTypes.string,
    readingMinutes: PropTypes.number,
    hideUtilityBar: PropTypes.bool,
    hideToolbar: PropTypes.bool,
    hideHighlightsPanel: PropTypes.bool,
    variant: PropTypes.string,
    scrollRootId: PropTypes.string,
    readerSettings: PropTypes.object,
    isDisplayWindowOpen: PropTypes.bool,
    onDisplaySettingsButtonClick: PropTypes.func,
    onProgressChange: PropTypes.func,
};

export default InteractiveReadingSurface;
