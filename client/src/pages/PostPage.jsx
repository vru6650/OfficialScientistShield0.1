// client/src/pages/PostPage.jsx
import { Alert, Tooltip, Modal } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useEffect, useState, useMemo, useCallback } from 'react';
import hljs from 'highlight.js';
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet-async';
import { FaClock, FaBookOpen, FaCalendarAlt, FaArrowRight, FaCommentDots, FaChevronUp, FaChevronLeft, FaChevronRight, FaLink, FaPrint, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { apiFetch } from '../utils/apiFetch';

// --- Component Imports ---
import CommentSection from '../components/CommentSection';
import PostCard from '../components/PostCard';
import TableOfContents from '../components/TableOfContents';
import ReadingProgressBar from '../components/ReadingProgressBar';
import SocialShare from '../components/SocialShare';
import ClapButton from '../components/ClapButton';
import VideoPlayer from '../components/VideoPlayer';
import LottieAnimationPlayer from '../components/LottieAnimationPlayer.jsx';
import ReadingControlCenter from '../components/ReadingControlCenter';
import useReadingSettings from '../hooks/useReadingSettings';
import InteractiveReadingSurface from '../components/InteractiveReadingSurface.jsx';
import GalleryCarousel from '../components/media/GalleryCarousel.jsx';
import EmbeddedSnippetPreview from '../components/EmbeddedSnippetPreview.jsx';
import {
    getPostIllustrationGalleryItems,
    getPrimaryPostAsset,
    getSortedPostMediaAssets,
} from '../utils/postMedia.js';
import { getPostPath } from '../utils/postPath.js';
import '../Tiptap.css';

// --- API fetching functions ---
const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

const fetchPosts = async (params) => {
    const res = await apiFetch(`/api/v1/post/getposts?${new URLSearchParams(params).toString()}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch post.');
    return data;
};

const fetchPostBySlug = async (postSlug) => {
    const data = await fetchPosts({ slug: postSlug });
    if (data.posts.length > 0) {
        return data.posts[0];
    }

    if (OBJECT_ID_PATTERN.test(String(postSlug || '').trim())) {
        const fallbackData = await fetchPosts({ postId: postSlug });
        if (fallbackData.posts.length > 0) {
            return fallbackData.posts[0];
        }
    }

    throw new Error('Post not found.');
};

const fetchRelatedPosts = async (category) => {
    if (!category) return [];
    try {
        const params = new URLSearchParams({
            category,
            limit: '3',
        });
        const res = await apiFetch(`/api/v1/post/getposts?${params.toString()}`);
        if (!res.ok) return [];
        const data = await res.json();
        return data.posts;
    } catch (error) {
        console.error('Failed to fetch related posts:', error);
        return [];
    }
};

// --- Skeleton Component (Unchanged) ---
const PostPageSkeleton = () => (
    <div className='min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
        <div className='relative isolate overflow-hidden bg-slate-900 text-white'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.2),_transparent_55%)] dark:bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.3),_transparent_55%)]' />
            <div className='mx-auto flex max-w-4xl flex-col gap-6 px-6 py-24 text-center'>
                <div className='mx-auto h-7 w-24 rounded-full bg-white/30' />
                <div className='mx-auto h-14 w-3/4 rounded-2xl bg-white/30' />
                <div className='mx-auto flex w-full max-w-xl items-center justify-center gap-4'>
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                    <div className='h-4 w-24 rounded-full bg-white/30' />
                </div>
            </div>
        </div>
        <main className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:px-10'>
            <div className='flex-1 space-y-6'>
                <div className='h-96 w-full rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5' />
                <div className='space-y-4 rounded-3xl bg-white p-8 shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5'>
                    {[...Array(5).keys()].map((key) => (
                        <div key={key} className='h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700' />
                    ))}
                </div>
            </div>
            <aside className='h-96 w-full rounded-3xl bg-white shadow-xl shadow-slate-200/60 ring-1 ring-slate-200/70 dark:bg-slate-900/80 dark:shadow-slate-900/50 dark:ring-white/5 lg:w-80' />
        </main>
    </div>
);

// --- Helper functions (Unchanged) ---
const generateSlug = (text) => {
    if (!text) return '';
    return text.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '').replace(/--+/g, '-');
};
const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const getTextFromNode = (node) => {
    if (node.type === 'text') return node.data;
    if (node.type !== 'tag' || !node.children) return '';
    return node.children.map(getTextFromNode).join('');
};

const formatCategory = (category) => {
    if (!category) return 'Uncategorized';
    return category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
};
const POST_ARTICLE_SCROLL_ROOT_ID = 'post-article-scroll-root';

export default function PostPage() {
    const { postSlug } = useParams();

    const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({
        queryKey: ['post', 'slug', postSlug],
        queryFn: () => fetchPostBySlug(postSlug),
        staleTime: 5 * 60 * 1000,
    });

    const { data: relatedPosts } = useQuery({
        queryKey: ['relatedPosts', post?.category],
        queryFn: () => fetchRelatedPosts(post.category),
        enabled: !!post,
    });

    const [currentImage, setCurrentImage] = useState(0);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [activeHeadingId, setActiveHeadingId] = useState('');

    const sanitizeWithEmbeds = useCallback((html) => {
        if (!html) return '';

        // Allow safe video iframes (YouTube / Vimeo) while keeping other sanitation in place.
        const clean = DOMPurify.sanitize(html, {
            ADD_TAGS: ['iframe'],
            ADD_ATTR: [
                'allow',
                'allowfullscreen',
                'data-snippet-id',
                'frameborder',
                'src',
                'width',
                'height',
                'title',
                'loading',
                'referrerpolicy',
                'data-lottie-autoplay',
                'data-lottie-loop',
                'data-lottie-src',
            ],
        });

        if (typeof document === 'undefined') return clean;

        const wrapper = document.createElement('div');
        wrapper.innerHTML = clean;

        const allowedEmbedHosts = /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com)\//i;

        wrapper.querySelectorAll('iframe').forEach((frame) => {
            const src = frame.getAttribute('src') || '';
            const isSafe = allowedEmbedHosts.test(src);
            if (!isSafe) {
                frame.remove();
                return;
            }
            frame.setAttribute('loading', 'lazy');
            frame.setAttribute('allowfullscreen', '');
            frame.setAttribute('referrerpolicy', frame.getAttribute('referrerpolicy') || 'strict-origin-when-cross-origin');
            if (!frame.getAttribute('allow')) {
                frame.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
            }
            if (!frame.getAttribute('title')) {
                frame.setAttribute('title', 'Embedded video');
            }
        });

        return wrapper.innerHTML;
    }, []);

    const sanitizedContent = useMemo(() => {
        return sanitizeWithEmbeds(post?.content);
    }, [post?.content, sanitizeWithEmbeds]);

    const headings = useMemo(() => {
        if (!sanitizedContent || typeof document === 'undefined') return [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const headingNodes = tempDiv.querySelectorAll('h2, h3');
        const slugCounts = {};

        return Array.from(headingNodes).map((node) => {
            const baseId = generateSlug(node.innerText);
            const count = slugCounts[baseId] || 0;
            slugCounts[baseId] = count + 1;
            const id = count === 0 ? baseId : `${baseId}-${count + 1}`;

            return {
                id,
                text: node.innerText,
                level: node.tagName.toLowerCase(),
            };
        });
    }, [sanitizedContent]);

    const imagesInPost = useMemo(() => {
        if (!sanitizedContent || typeof document === 'undefined') return [];
        const imageSources = [];
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const imageElements = tempDiv.querySelectorAll('img');
        imageElements.forEach(img => imageSources.push(img.src));
        return imageSources;
    }, [sanitizedContent]);

    const {
        settings: readingSettings,
        updateSetting: updateReadingSetting,
        resetSettings: resetReadingSettings,
        contentStyles,
        contentMaxWidth,
        surfaceClass,
    } = useReadingSettings();
    const postArticleContentStyles = useMemo(() => {
        const resolvedFontWeight = Number.parseInt(readingSettings?.fontWeight, 10);
        const postArticleFontWeight = Number.isFinite(resolvedFontWeight)
            ? Math.max(resolvedFontWeight, 500)
            : 500;

        return {
            ...contentStyles,
            fontWeight: postArticleFontWeight,
            fontFamily: readingSettings?.fontFamily === 'serif'
                ? `'Source Serif 4', 'Merriweather', 'Georgia', 'Cambria', "Times New Roman", Times, serif`
                : contentStyles.fontFamily,
        };
    }, [contentStyles, readingSettings?.fontFamily, readingSettings?.fontWeight]);
    const postArticleContentMaxWidth = useMemo(() => {
        const resolvedContentMaxWidth = Number.parseInt(contentMaxWidth, 10);
        if (!Number.isFinite(resolvedContentMaxWidth)) {
            return '680px';
        }

        return `${Math.min(resolvedContentMaxWidth, 680)}px`;
    }, [contentMaxWidth]);

    const openImageViewer = useCallback((index) => {
        setCurrentImage(index);
        setIsViewerOpen(true);
    }, []);
    const closeImageViewer = useCallback(() => {
        setCurrentImage(0);
        setIsViewerOpen(false);
    }, []);

    useEffect(() => {
        if (!post?.content) return;
        hljs.highlightAll();
        const preTags = document.querySelectorAll('.post-content pre');
        preTags.forEach(pre => {
            // Add copy button if missing
            if (!pre.querySelector('.copy-button')) {
                const button = document.createElement('button');
                button.innerText = 'Copy';
                button.className = 'copy-button';
                button.addEventListener('click', () => {
                    const code = pre.querySelector('code')?.innerText || '';
                    navigator.clipboard.writeText(code).then(() => {
                        button.innerText = 'Copied!';
                        setTimeout(() => { button.innerText = 'Copy'; }, 2000);
                    });
                });
                pre.style.position = 'relative';
                pre.appendChild(button);
            }

            // Add language badge based on code class (e.g., language-js)
            if (!pre.querySelector('.code-lang-badge')) {
                const codeEl = pre.querySelector('code');
                const cls = codeEl?.className || '';
                const match = cls.match(/language-([a-z0-9+#-]+)/i);
                const lang = match ? match[1].toUpperCase() : null;
                if (lang) {
                    const badge = document.createElement('span');
                    badge.textContent = lang;
                    badge.className = 'code-lang-badge';
                    Object.assign(badge.style, {
                        position: 'absolute',
                        top: '0.5rem',
                        left: '0.5rem',
                        padding: '0.15rem 0.5rem',
                        fontSize: '0.65rem',
                        borderRadius: '0.35rem',
                        background: 'rgba(15,23,42,0.08)',
                        color: '#334155',
                        border: '1px solid rgba(148,163,184,0.35)'
                    });
                    pre.appendChild(badge);
                }
            }
        });
    }, [post]);

    // Observe headings for active section highlighting in ToC
    useEffect(() => {
        if (!sanitizedContent) return;
        const headings = Array.from(document.querySelectorAll('.post-content h2, .post-content h3'));
        if (!headings.length) return;
        const scrollRoot = document.getElementById(POST_ARTICLE_SCROLL_ROOT_ID);

        const observer = new IntersectionObserver(
            (entries) => {
                // Pick the top-most visible heading as active
                const visible = entries
                    .filter((e) => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    const id = visible[0].target.getAttribute('id');
                    if (id) setActiveHeadingId(id);
                } else {
                    // Fallback: find the last heading above the viewport
                    const cutoff = scrollRoot
                        ? scrollRoot.getBoundingClientRect().top + scrollRoot.clientHeight * 0.25
                        : window.innerHeight * 0.25;
                    const fromTop = headings
                        .filter((el) => el.getBoundingClientRect().top < cutoff)
                        .pop();
                    if (fromTop && fromTop.id) setActiveHeadingId(fromTop.id);
                }
            },
            {
                root: scrollRoot || null,
                rootMargin: scrollRoot ? '0px 0px -72% 0px' : '0px 0px -70% 0px',
                threshold: [0, 1],
            }
        );

        headings.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [sanitizedContent]);

    useEffect(() => {
        const { classList } = document.body;
        const focusClass = 'reading-focus-active';
        const guideClass = 'reading-guide-active';
        const contrastClass = 'reading-contrast-active';
        const hideImagesClass = 'reading-hide-images';

        if (readingSettings.focusMode) {
            classList.add(focusClass);
        } else {
            classList.remove(focusClass);
        }

        if (readingSettings.readingGuide) {
            classList.add(guideClass);
        } else {
            classList.remove(guideClass);
        }

        if (readingSettings.highContrast) {
            classList.add(contrastClass);
        } else {
            classList.remove(contrastClass);
        }
        if (readingSettings.hideImages) {
            classList.add(hideImagesClass);
        } else {
            classList.remove(hideImagesClass);
        }

        return () => {
            classList.remove(focusClass, guideClass, contrastClass, hideImagesClass);
        };
    }, [readingSettings.focusMode, readingSettings.readingGuide, readingSettings.highContrast, readingSettings.hideImages]);

    const createMetaDescription = (summary, htmlContent) => {
        const base = stripHtml(summary) || stripHtml(htmlContent);
        if (!base) return '';
        if (base.length <= 155) {
            return base;
        }

        return `${base.slice(0, 155).replace(/[.,;:\s]+$/, '')}…`;
    };

    const metaDescription = useMemo(
        () => createMetaDescription(post?.summary, post?.content),
        [post?.content, post?.summary]
    );

    const sortedMedia = useMemo(() => getSortedPostMediaAssets(post), [post]);
    const primaryAsset = useMemo(() => getPrimaryPostAsset(post), [post]);

    const readingStats = useMemo(() => {
        if (!sanitizedContent || typeof document === 'undefined') {
            return { wordCount: 0, readingMinutes: 0 };
        }
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = sanitizedContent;
        const text = tempDiv.textContent || '';
        const words = text.trim().split(/\s+/).filter(Boolean);
        const wordCount = words.length;
        const readingMinutes = wordCount ? Math.max(1, Math.ceil(wordCount / 200)) : 0;
        return { wordCount, readingMinutes };
    }, [sanitizedContent]);

    const formattedPublishDate = useMemo(() => {
        if (!post?.createdAt) return '';
        try {
            return new Date(post.createdAt).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
            });
        } catch (error) {
            return '';
        }
    }, [post?.createdAt]);

    const heroImage = useMemo(() => {
        if (!primaryAsset) return null;
        if (primaryAsset.type === 'video') return post?.image || null;
        if (primaryAsset.type === 'image') return primaryAsset.url;
        return post?.image || null;
    }, [post?.image, primaryAsset]);

    const galleryItems = useMemo(
        () => sortedMedia.filter((asset) => asset?.url).slice(0, 8),
        [sortedMedia]
    );
    const illustrationItems = useMemo(
        () => getPostIllustrationGalleryItems(post),
        [post]
    );

    const heroBackgroundStyle = useMemo(() => {
        if (!heroImage) {
            return {
                backgroundImage: 'linear-gradient(135deg, rgba(15, 23, 42, 0.96), rgba(30, 41, 59, 0.88))',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
            };
        }

        return {
            backgroundImage: `linear-gradient(135deg, rgba(15, 23, 42, 0.85), rgba(15, 23, 42, 0.35)), url(${heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        };
    }, [heroImage]);

    const categoryQuery = useMemo(() => {
        if (!post?.category) return 'all';
        return encodeURIComponent(post.category);
    }, [post?.category]);

    const heroDescriptionText = post?.summary?.trim() || metaDescription;
    const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

    const scrollToElement = useCallback((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);
    const scrollToHeading = useCallback((headingId) => {
        const element = document.getElementById(headingId);
        const articleScrollRoot = document.getElementById(POST_ARTICLE_SCROLL_ROOT_ID);

        if (!element) {
            return;
        }

        if (articleScrollRoot) {
            const containerRect = articleScrollRoot.getBoundingClientRect();
            const targetRect = element.getBoundingClientRect();
            const targetTop = targetRect.top - containerRect.top + articleScrollRoot.scrollTop - 24;

            articleScrollRoot.scrollIntoView({ behavior: 'smooth', block: 'start' });
            articleScrollRoot.scrollTo({
                top: Math.max(0, targetTop),
                behavior: 'smooth',
            });
            return;
        }

        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, []);

    const handleStartReading = useCallback(() => {
        scrollToElement('article-start');
        window.requestAnimationFrame(() => {
            const articleScrollRoot = document.getElementById(POST_ARTICLE_SCROLL_ROOT_ID);
            articleScrollRoot?.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }, [scrollToElement]);

    const handleDiscuss = useCallback(() => {
        scrollToElement('comments-section');
    }, [scrollToElement]);

    const handleScrollTop = useCallback(() => {
        const articleScrollRoot = document.getElementById(POST_ARTICLE_SCROLL_ROOT_ID);
        articleScrollRoot?.scrollTo({ top: 0, behavior: 'smooth' });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);
    const copyToClipboard = useCallback(async (text) => {
        if (!text) {
            return false;
        }

        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (error) {
            console.warn('Async clipboard copy failed, falling back to execCommand.', error);
        }

        if (typeof document === 'undefined') {
            return false;
        }

        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            const copied = document.execCommand('copy');
            document.body.removeChild(textArea);
            return copied;
        } catch (error) {
            console.error('Clipboard fallback failed:', error);
            return false;
        }
    }, []);

    const [showShortcuts, setShowShortcuts] = useState(false);
    const [articleScrollProgress, setArticleScrollProgress] = useState(0);
    const [resumeProgress, setResumeProgress] = useState(null);
    const [showCompactHeader, setShowCompactHeader] = useState(false);
    const [showMobileToc, setShowMobileToc] = useState(false);

    const handleArticleProgressChange = useCallback((nextProgress) => {
        if (!nextProgress || typeof nextProgress !== 'object') {
            return;
        }

        if (Number.isFinite(nextProgress.percent)) {
            setArticleScrollProgress(Math.min(100, Math.max(0, nextProgress.percent)));
        }

        if (Number.isFinite(nextProgress.fraction)) {
            setResumeProgress(Math.min(1, Math.max(0, nextProgress.fraction)));
        }
    }, []);

    const handleResumeReading = useCallback(() => {
        const articleScrollRoot = document.getElementById(POST_ARTICLE_SCROLL_ROOT_ID);
        if (articleScrollRoot && Number.isFinite(resumeProgress)) {
            scrollToElement('article-start');
            const scrollableDistance = Math.max(1, articleScrollRoot.scrollHeight - articleScrollRoot.clientHeight);
            const target = scrollableDistance * resumeProgress;
            articleScrollRoot.scrollTo({ top: target, behavior: 'smooth' });
            return;
        }

        const c = document.querySelector('[data-reading-surface="true"]');
        if (!c || !Number.isFinite(resumeProgress)) return;
        const rect = c.getBoundingClientRect();
        const start = window.scrollY + rect.top;
        const denom = Math.max(1, c.scrollHeight - window.innerHeight);
        const target = start + denom * resumeProgress;
        window.scrollTo({ top: target, behavior: 'smooth' });
    }, [resumeProgress, scrollToElement]);
    const jumpToHeading = useCallback((direction) => {
        if (!headings.length) {
            return;
        }

        const activeIndex = headings.findIndex((heading) => heading.id === activeHeadingId);
        let nextIndex;

        if (direction > 0) {
            nextIndex = activeIndex >= 0 ? Math.min(activeIndex + 1, headings.length - 1) : 0;
        } else {
            nextIndex = activeIndex >= 0 ? Math.max(activeIndex - 1, 0) : headings.length - 1;
        }

        const nextHeading = headings[nextIndex];
        if (nextHeading?.id) {
            scrollToHeading(nextHeading.id);
        }
    }, [activeHeadingId, headings, scrollToHeading]);

    const handleCopyLink = useCallback(async () => {
        if (typeof window === 'undefined') {
            return;
        }

        await copyToClipboard(window.location.href);
    }, [copyToClipboard]);

    const handleShare = useCallback(async () => {
        if (typeof window === 'undefined') {
            return;
        }

        const shareUrl = window.location.href;

        try {
            if (typeof navigator !== 'undefined' && navigator.share) {
                await navigator.share({ title: document.title, url: shareUrl, text: post?.title });
            } else {
                await copyToClipboard(shareUrl);
            }
        } catch (_) {
            // ignore cancellation/errors
        }
    }, [copyToClipboard, post?.title]);

    // Load any saved reading progress for this post
    useEffect(() => {
        if (!post?._id) return;
        try {
            const raw = localStorage.getItem(`reading-progress:${post._id}`);
            const v = raw ? parseFloat(raw) : 0;
            if (Number.isFinite(v)) {
                setResumeProgress(v);
                setArticleScrollProgress(Math.min(100, Math.max(0, v * 100)));
            } else {
                setResumeProgress(0);
                setArticleScrollProgress(0);
            }
        } catch (_) {
            setResumeProgress(0);
            setArticleScrollProgress(0);
        }
    }, [post?._id]);

    // Global keyboard shortcuts for page-level actions
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            if (e.key === '?') {
                setShowShortcuts((s) => !s);
            } else if (e.key === 'h') {
                jumpToHeading(-1);
            } else if (e.key === 'H') {
                jumpToHeading(1);
            } else if (e.key === 't') {
                handleScrollTop();
            } else if (e.key === 'c') {
                handleDiscuss();
            } else if (e.key === 'p') {
                window.print();
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [handleDiscuss, handleScrollTop, jumpToHeading]);

    // Compact header visibility when scrolled past hero
    useEffect(() => {
        const onScroll = () => {
            const threshold = 280;
            setShowCompactHeader(window.scrollY > threshold);
        };
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    if (isLoadingPost) return <PostPageSkeleton />;
    if (postError) return (
        <div className='flex justify-center items-center min-h-screen'>
            <Alert color='failure' className='text-xl'>Error: {postError.message}</Alert>
        </div>
    );
    if (!post) return null;

    const relatedPool = Array.isArray(relatedPosts)
        ? relatedPosts.filter((candidate) => candidate._id !== post._id)
        : [];
    const previousPost = relatedPool[0] || null;
    const nextPost = relatedPool[1] || null;
    const previousPostPath = getPostPath(previousPost);
    const nextPostPath = getPostPath(nextPost);
    const hasRelatedPosts = relatedPool.length > 0;
    const readingProgressPercent = Math.round(articleScrollProgress);
    const canResumeReading = Number.isFinite(resumeProgress) && resumeProgress > 0.05 && resumeProgress < 0.98;
    const isReadingComplete = readingProgressPercent >= 98;
    const primaryReadingActionLabel = canResumeReading ? 'Resume article' : isReadingComplete ? 'Read again' : 'Start reading';
    const primaryReadingAction = canResumeReading ? handleResumeReading : handleStartReading;
    const readingProgressStatus = isReadingComplete ? 'Completed' : canResumeReading ? 'In progress' : 'Fresh start';
    const activeHeading = headings.find((heading) => heading.id === activeHeadingId) || null;
    const authorDisplayName = post.authorName || post.username || 'Scientist Shield Editorial';
    const articleFormatLabel = primaryAsset?.type === 'video'
        ? 'Video article'
        : primaryAsset?.type === 'audio'
            ? 'Audio article'
            : primaryAsset?.type === 'document'
                ? 'Document-backed article'
                : illustrationItems.length > 0
                    ? 'Illustrated article'
                    : galleryItems.length > 1
                        ? 'Media article'
                        : 'Article';

    const parserOptions = (() => {
        let renderedHeadingIndex = 0;

        return {
            replace: domNode => {
                if (domNode.type === 'tag' && (domNode.name === 'h2' || domNode.name === 'h3')) {
                    const id = headings[renderedHeadingIndex]?.id || generateSlug(getTextFromNode(domNode));
                    renderedHeadingIndex += 1;
                    if (id) domNode.attribs.id = id;
                    return;
                }
                if (domNode.type === 'tag' && domNode.name === 'img') {
                    const src = domNode.attribs.src;
                    const index = imagesInPost.indexOf(src);
                    if (index > -1) {
                        return (
                            <img
                                {...domNode.attribs}
                                onClick={() => openImageViewer(index)}
                                style={{ cursor: 'pointer' }}
                                loading="lazy"
                            />
                        );
                    }
                }
                // NEW: Render the CodeEditor component
                if (domNode.type === 'tag' && domNode.name === 'div' && domNode.attribs['data-snippet-id']) {
                    const snippetId = domNode.attribs['data-snippet-id'];
                    return (
                        <EmbeddedSnippetPreview
                            snippetId={snippetId}
                            className='my-6'
                        />
                    );
                }
                if (domNode.type === 'tag' && domNode.name === 'div' && domNode.attribs['data-lottie-src']) {
                    return (
                        <LottieAnimationPlayer
                            src={domNode.attribs['data-lottie-src']}
                            autoplay={domNode.attribs['data-lottie-autoplay'] !== 'false'}
                            loop={domNode.attribs['data-lottie-loop'] !== 'false'}
                            className='my-6'
                        />
                    );
                }
            },
        };
    })();

    return (
        <>
            <Helmet>
                <title>{post.title}</title>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={heroImage || post.image} />
                <meta property="og:url" content={pageUrl} />
                <meta property="og:type" content="article" />
                <script type="application/ld+json">
                    {JSON.stringify({
                        '@context': 'https://schema.org',
                        '@type': 'Article',
                        headline: post.title,
                        description: metaDescription,
                        wordCount: readingStats.wordCount || undefined,
                        datePublished: post.createdAt || undefined,
                        image: heroImage || undefined,
                        articleSection: post.category || undefined,
                        mainEntityOfPage: {
                            '@type': 'WebPage',
                            '@id': pageUrl,
                        },
                        url: pageUrl,
                        author: post.authorName || post.username || undefined,
                    })}
                </script>
            </Helmet>

            <ReadingControlCenter
                settings={readingSettings}
                onChange={updateReadingSetting}
                onReset={resetReadingSettings}
            />

            <ReadingProgressBar progressOverride={articleScrollProgress} />
            <div className='liquid-stage' data-theme='liquid-glass'>
                <div className='liquid-stage__backdrop' aria-hidden='true'>
                    <div className='liquid-stage__blob liquid-stage__blob--cyan' />
                    <div className='liquid-stage__blob liquid-stage__blob--violet' />
                    <div className='liquid-stage__blob liquid-stage__blob--amber' />
                    <div className='liquid-stage__mesh' />
                    <div className='liquid-stage__glint' />
                    <div className='liquid-stage__noise' />
                </div>
                <div className='relative z-10 pb-28 lg:pb-16'>
                    {/* Compact sticky header when reading */}
                    {showCompactHeader && (
                        <div className='fixed inset-x-0 top-0 z-40 px-3 pt-2'>
                            <div className='glass-navbar glass-panel mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/60 px-3 py-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-white/10 dark:bg-slate-900/70'>
                                <div className='flex min-w-0 items-center gap-3'>
                                    <span className='inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-500 ring-2 ring-sky-500/20' aria-hidden='true' />
                                    <div className='min-w-0'>
                                        <span className='block truncate text-sm font-medium text-slate-700 dark:text-slate-200'>{post.title}</span>
                                        <span className='hidden truncate text-[11px] text-slate-500 dark:text-slate-400 md:block'>
                                            {activeHeading?.text || 'Opening section'} · {readingProgressPercent}% read
                                        </span>
                                    </div>
                                </div>
                                <div className='hidden min-w-[14rem] flex-1 md:block'>
                                    <div className='flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400'>
                                        <span className='truncate'>{readingProgressStatus}</span>
                                        <span>{readingProgressPercent}%</span>
                                    </div>
                                    <div className='mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-700/80'>
                                        <div
                                            className='h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 transition-[width] duration-300'
                                            style={{ width: `${readingProgressPercent}%` }}
                                        />
                                    </div>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={primaryReadingAction}
                                        className='hidden rounded-full border border-sky-200 bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-sky-100 dark:border-sky-400/20 dark:bg-sky-400/10 dark:text-sky-200 dark:hover:border-sky-400/35 dark:hover:bg-sky-400/15 sm:inline-flex'
                                    >
                                        {canResumeReading ? 'Resume' : 'Read now'}
                                    </button>
                                    <ClapButton
                                        postId={post._id}
                                        initialClaps={post.claps ?? 0}
                                        initialClappedBy={post.clappedBy ?? []}
                                    />
                                    <Tooltip content='Copy link'>
                                        <button onClick={handleCopyLink} className='rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                            <FaLink className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Share'>
                                        <button onClick={handleShare} className='rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                            <FaArrowRight className='h-4 w-4 rotate-[-45deg]' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Print'>
                                        <button onClick={() => window.print()} className='rounded-full border border-slate-200 bg-white p-1.5 text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'>
                                            <FaPrint className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>
                        </div>
                    )}
                    <section
                        className='relative isolate overflow-hidden text-white'
                        style={heroBackgroundStyle}
                    >
                        <div className='absolute inset-0 bg-slate-900/84 backdrop-blur-lg dark:bg-slate-950/88' />
                        <div className='absolute inset-x-0 -bottom-44 h-[460px] bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent opacity-80 blur-3xl dark:from-slate-950 dark:via-slate-950/80' aria-hidden='true' />
                        <div className='absolute -left-24 top-20 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400/40 via-cyan-300/30 to-emerald-400/36 blur-3xl' aria-hidden='true' />
                        <div className='absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/36 via-violet-400/28 to-amber-300/32 blur-3xl' aria-hidden='true' />
                        <div className='relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-16 text-center sm:px-6 sm:py-20 lg:px-10'>
                            <nav aria-label='Breadcrumb' className='flex flex-wrap items-center justify-center gap-2 text-xs text-slate-200/90'>
                                <Link to='/' className='link-premium'>Home</Link>
                                <span aria-hidden='true'>/</span>
                                <Link to={`/search?category=${categoryQuery}`} className='link-premium'>{formatCategory(post.category)}</Link>
                                <span aria-hidden='true'>/</span>
                                <span className='truncate max-w-[40ch]' title={post.title}>{post.title}</span>
                            </nav>

                            <div className='flex flex-wrap items-center justify-center gap-3 text-[11px] uppercase tracking-[0.24em] text-slate-100'>
                                <span className='inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-1.5 font-semibold backdrop-blur'>
                                    {articleFormatLabel}
                                </span>
                                <Link
                                    to={`/search?category=${categoryQuery}`}
                                    className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1.5 font-medium backdrop-blur transition hover:border-white/50 hover:bg-white/20'
                                >
                                    {formatCategory(post.category)}
                                </Link>
                            </div>

                            <div className='mx-auto max-w-4xl space-y-4'>
                                <h1 className='text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl xl:text-6xl'>
                                    {post.title}
                                </h1>
                                {heroDescriptionText && (
                                    <p className='mx-auto max-w-3xl text-base leading-7 text-slate-100/90 sm:text-lg'>
                                        {heroDescriptionText}
                                    </p>
                                )}
                            </div>

                            <div className='flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm text-slate-200/85'>
                                <span className='font-semibold text-white'>{authorDisplayName}</span>
                                {formattedPublishDate && (
                                    <span>{formattedPublishDate}</span>
                                )}
                                <span>
                                    {readingStats.readingMinutes > 0 ? `${readingStats.readingMinutes} min read` : 'Quick read'}
                                </span>
                                <span>
                                    {headings.length ? `${headings.length} sections` : 'Continuous article'}
                                </span>
                            </div>

                            <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4'>
                                <button
                                    type='button'
                                    onClick={primaryReadingAction}
                                    className='group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900 shadow-lg transition hover:-translate-y-0.5 hover:bg-slate-100 hover:shadow-xl'
                                >
                                    {primaryReadingActionLabel}
                                    <FaArrowRight className='h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
                                </button>
                                <button
                                    type='button'
                                    onClick={handleDiscuss}
                                    className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/20'
                                >
                                    Join discussion
                                    <FaCommentDots className='h-4 w-4 text-slate-200' />
                                </button>
                                <button
                                    type='button'
                                    onClick={handleShare}
                                    className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-slate-950/20 px-5 py-3 text-sm font-semibold text-slate-100 transition hover:border-white/40 hover:bg-slate-950/30'
                                >
                                    <FaArrowRight className='h-4 w-4 rotate-[-45deg] text-cyan-200' />
                                    Share article
                                </button>
                            </div>

                            <div className='mx-auto flex flex-wrap items-center justify-center gap-3 text-sm text-slate-200/90 sm:gap-4'>
                                {formattedPublishDate && (
                                    <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                        <FaCalendarAlt className='h-4 w-4 text-emerald-300' aria-hidden='true' />
                                        {formattedPublishDate}
                                    </span>
                                )}
                                {readingStats.readingMinutes > 0 && (
                                    <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                        <FaClock className='h-4 w-4 text-sky-300' aria-hidden='true' />
                                        {readingStats.readingMinutes} minute read
                                    </span>
                                )}
                                {readingStats.wordCount > 0 && (
                                    <span className='inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                        <FaBookOpen className='h-4 w-4 text-indigo-300' aria-hidden='true' />
                                        {readingStats.wordCount.toLocaleString()} words
                                    </span>
                                )}
                                <span className='inline-flex items-center rounded-full bg-white/10 px-4 py-2 backdrop-blur'>
                                    {readingProgressPercent}% read
                                </span>
                            </div>
                        </div>
                    </section>

                    <main className='mx-auto flex w-full max-w-6xl flex-col gap-10 px-4 py-10 sm:px-6 lg:flex-row lg:px-10'>
                        <article id='article-start' className='relative flex-1 space-y-10'>
                            {/* Desktop action rail */}
                            <div className='pointer-events-none absolute -left-14 top-0 hidden h-full lg:block'>
                                <div className='pointer-events-auto sticky top-40 flex flex-col items-center gap-2'>
                                    <Tooltip content='Copy link'>
                                        <button onClick={handleCopyLink} className='rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'>
                                            <FaLink className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Share'>
                                        <button onClick={handleShare} className='rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'>
                                            <FaArrowRight className='h-4 w-4 rotate-[-45deg]' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Print'>
                                        <button onClick={() => window.print()} className='rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'>
                                            <FaPrint className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Keyboard shortcuts'>
                                        <button onClick={() => setShowShortcuts(true)} className='rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'>
                                            <FaQuestionCircle className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                    <Tooltip content='Comments'>
                                        <button onClick={handleDiscuss} className='rounded-full border border-white/40 bg-white/80 p-2 text-slate-600 shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:shadow-xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'>
                                            <FaCommentDots className='h-4 w-4' />
                                        </button>
                                    </Tooltip>
                                </div>
                            </div>

                        {primaryAsset && (
                            <article className='liquid-hybrid-panel overflow-hidden shadow-2xl transition duration-500 hover:-translate-y-1'>
                                {primaryAsset.type === 'video' ? (
                                    <VideoPlayer
                                        src={primaryAsset.url}
                                        poster={post.image || undefined}
                                        title={post.title}
                                        storageKey={post._id}
                                        className='rounded-3xl'
                                    />
                                ) : primaryAsset.type === 'audio' ? (
                                    <div className='flex flex-col gap-3 rounded-3xl bg-white/60 p-4 backdrop-blur dark:bg-slate-900/80'>
                                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200'>
                                            <span className='rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100'>Audio</span>
                                            {primaryAsset.caption && <span className='truncate text-slate-600 dark:text-slate-300'>{primaryAsset.caption}</span>}
                                        </div>
                                        <audio src={primaryAsset.url} controls className='w-full' />
                                    </div>
                                ) : primaryAsset.type === 'document' ? (
                                    <div className='flex flex-col gap-3 rounded-3xl bg-white/70 p-4 text-slate-800 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-900/80 dark:text-slate-100 dark:ring-slate-700'>
                                        <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-wide'>
                                            <span className='rounded-full bg-slate-200 px-3 py-1 text-[11px] font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-100'>Document</span>
                                            {primaryAsset.caption && <span className='truncate text-slate-600 dark:text-slate-300'>{primaryAsset.caption}</span>}
                                        </div>
                                        <div className='flex flex-wrap items-center gap-3'>
                                            <a
                                                href={primaryAsset.url}
                                                target='_blank'
                                                rel='noreferrer'
                                                className='rounded-md bg-slate-900 px-3 py-2 text-xs font-semibold text-white shadow hover:-translate-y-0.5 hover:shadow-lg transition dark:bg-slate-700'
                                            >
                                                Open document
                                            </a>
                                            <a
                                                href={primaryAsset.url}
                                                download
                                                className='rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'
                                            >
                                                Download
                                            </a>
                                        </div>
                                    </div>
                                ) : (
                                    <img
                                        src={heroImage}
                                        alt={post.title}
                                        className='h-full w-full object-cover'
                                        loading='lazy'
                                    />
                                )}
                            </article>
                        )}

                        {galleryItems.length > 1 && (
                            <div className='liquid-hybrid-tile space-y-4 p-5 shadow-xl'>
                                <div className='flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200'>
                                    <span>Media gallery</span>
                                    <span className='text-xs text-slate-500 dark:text-slate-400'>{galleryItems.length} items</span>
                                </div>
                                <GalleryCarousel items={galleryItems} initialIndex={Number.isInteger(post.coverAssetIndex) ? post.coverAssetIndex : 0} />
                            </div>
                        )}

                        <div className='post-article-shell glass-panel liquid-hybrid-panel overflow-hidden'>
                            <div className='post-article-shell__body'>
                                <InteractiveReadingSurface
                                    content={sanitizedContent}
                                    parserOptions={parserOptions}
                                    contentStyles={postArticleContentStyles}
                                    contentMaxWidth={postArticleContentMaxWidth}
                                    surfaceClass={surfaceClass}
                                    className='post-content tiptap reading-surface w-full px-5 py-6 text-left text-slate-700 transition-all duration-300 dark:text-slate-200 sm:px-8 sm:py-8 xl:px-8 xl:py-8'
                                    chapterId={post._id}
                                    readingMinutes={readingStats.readingMinutes}
                                    variant='post-article'
                                    scrollRootId={POST_ARTICLE_SCROLL_ROOT_ID}
                                    hideToolbar
                                    onProgressChange={handleArticleProgressChange}
                                />
                            </div>
                        </div>

                        {illustrationItems.length > 0 && (
                            <section className='liquid-hybrid-tile space-y-4 p-5 shadow-xl'>
                                <div className='flex items-center justify-between text-sm font-semibold text-slate-700 dark:text-slate-200'>
                                    <span>Illustrations</span>
                                    <span className='text-xs text-slate-500 dark:text-slate-400'>
                                        {illustrationItems.length} frames
                                    </span>
                                </div>
                                <GalleryCarousel items={illustrationItems} />
                            </section>
                        )}

                        <div className='liquid-hybrid-tile flex flex-col gap-6 p-6 shadow-xl sm:flex-row sm:items-center sm:justify-between'>
                            <div className='flex flex-1 flex-col items-start gap-4 sm:flex-row sm:items-center'>
                                <ClapButton
                                    postId={post._id}
                                    initialClaps={post.claps ?? 0}
                                    initialClappedBy={post.clappedBy ?? []}
                                />
                                <div className='max-w-sm text-left'>
                                    <p className='text-sm font-semibold text-slate-600 dark:text-slate-200'>Enjoying this insight?</p>
                                    <p className='text-sm text-slate-500 dark:text-slate-400'>Applaud the author and let them know this story resonated with you.</p>
                                </div>
                            </div>
                            <div className='flex flex-1 flex-col items-start gap-2 sm:items-end'>
                                <Tooltip content='Share this insight'>
                                    <span className='inline-flex items-center gap-3 rounded-full bg-white/70 px-4 py-2 text-slate-600 shadow-sm shadow-slate-200/60 transition hover:bg-white/80 dark:bg-slate-800/70 dark:text-slate-200 dark:shadow-slate-900/40'>
                                        <SocialShare post={post} />
                                        <span className='text-xs font-semibold uppercase tracking-widest text-slate-400 dark:text-slate-500'>Share</span>
                                    </span>
                                </Tooltip>
                                <p className='text-xs text-slate-400 dark:text-slate-500'>Spread the insight with your community.</p>
                            </div>
                        </div>

                        <div id='comments-section' className='liquid-hybrid-panel p-6 shadow-xl'>
                            <CommentSection postId={post._id} />
                        </div>

                        {/* Prev/Next quick nav based on related posts */}
                        {hasRelatedPosts && (
                            <div className='liquid-hybrid-tile flex flex-col gap-3 p-4 shadow-xl sm:flex-row sm:items-stretch sm:justify-between'>
                                <div className='flex-1'>
                                    {previousPost && previousPostPath && (
                                        <Link to={previousPostPath} className='group flex items-center gap-3 rounded-xl border border-white/50 bg-white/70 p-3 backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-500'>
                                            <FaChevronLeft className='text-slate-400 group-hover:text-sky-500' />
                                            <div className='min-w-0'>
                                                <div className='text-xs uppercase tracking-wide text-slate-400'>Previous</div>
                                                <div className='truncate text-sm font-semibold text-slate-700 group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-300'>{previousPost.title}</div>
                                            </div>
                                        </Link>
                                    )}
                                </div>
                                <div className='flex-1'>
                                    {nextPost && nextPostPath && (
                                        <Link to={nextPostPath} className='group flex items-center justify-end gap-3 rounded-xl border border-white/50 bg-white/70 p-3 text-right backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-500'>
                                            <div className='min-w-0'>
                                                <div className='text-xs uppercase tracking-wide text-slate-400'>Next</div>
                                                <div className='truncate text-sm font-semibold text-slate-700 group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-300'>{nextPost.title}</div>
                                            </div>
                                            <FaChevronRight className='text-slate-400 group-hover:text-sky-500' />
                                        </Link>
                                    )}
                                </div>
                            </div>
                        )}

                        {hasRelatedPosts && (
                            <section className='liquid-hybrid-panel space-y-6 p-6 shadow-xl'>
                                <div className='flex items-center justify-between'>
                                    <h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100'>Related articles</h2>
                                    <span className='text-xs uppercase tracking-wide text-slate-400'>Curated for you</span>
                                </div>
                                <div className='grid gap-5 md:grid-cols-2'>
                                    {relatedPool.map((candidate) => (
                                        <PostCard key={candidate._id} post={candidate} />
                                    ))}
                                </div>
                            </section>
                        )}
                    </article>

                    <aside className='w-full space-y-8 lg:w-80 lg:pt-6'>
                        <div className='sticky top-28 flex flex-col gap-8'>
                            <div id='toc' className='liquid-hybrid-tile p-6 shadow-xl'>
                                <h2 className='text-base font-semibold text-slate-800 dark:text-slate-100'>On this page</h2>
                                <p className='mt-2 text-sm text-slate-500 dark:text-slate-400'>Navigate through the key sections of this story.</p>
                                <div className='mt-4 max-h-[60vh] overflow-y-auto pr-1 text-sm'>
                                    <TableOfContents
                                        headings={headings}
                                        activeId={activeHeadingId}
                                        scrollContainerId={POST_ARTICLE_SCROLL_ROOT_ID}
                                    />
                                </div>
                            </div>

                            <div className='liquid-hybrid-panel p-6 shadow-xl'>
                                <div className='flex items-center justify-between gap-3'>
                                    <h3 className='text-base font-semibold text-slate-800 dark:text-slate-100'>Reading insights</h3>
                                    <span className='rounded-full bg-white/70 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800/70 dark:text-slate-100'>
                                        {readingProgressPercent}%
                                    </span>
                                </div>
                                <div className='mt-4 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-cyan-400 via-sky-500 to-emerald-400 transition-[width] duration-300'
                                        style={{ width: `${readingProgressPercent}%` }}
                                    />
                                </div>
                                <ul className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                                    {formattedPublishDate && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaCalendarAlt className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden='true' />
                                            Published on {formattedPublishDate}
                                        </li>
                                    )}
                                    {readingStats.readingMinutes > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaClock className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden='true' />
                                            {readingStats.readingMinutes} minute read
                                        </li>
                                    )}
                                    {readingStats.wordCount > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaBookOpen className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden='true' />
                                            {readingStats.wordCount.toLocaleString()} words to explore
                                        </li>
                                    )}
                                    <li className='rounded-2xl bg-white/60 px-3 py-2 text-slate-700 backdrop-blur dark:bg-slate-800/70 dark:text-slate-200'>
                                        Current section: {activeHeading?.text || 'Opening section'}
                                    </li>
                                </ul>
                                <div className='mt-6 grid gap-2'>
                                    <button
                                        type='button'
                                        onClick={primaryReadingAction}
                                        className='inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white'
                                    >
                                        {primaryReadingActionLabel}
                                        <FaArrowRight className='h-4 w-4' />
                                    </button>
                                    <button
                                        type='button'
                                        onClick={handleCopyLink}
                                        className='inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-sky-500 dark:hover:text-sky-300'
                                    >
                                        <FaLink className='h-4 w-4' />
                                        Copy story link
                                    </button>
                                </div>
                            </div>
                        </div>
                    </aside>
                </main>
            </div>
            </div>

            {/* Floating quick actions: Back to top, Discuss, and TOC on mobile */}
            <div className='fixed bottom-6 right-6 z-40 flex flex-col gap-3 lg:hidden'>
                <button
                    aria-label='Back to top'
                    onClick={handleScrollTop}
                    className='rounded-full border border-white/60 bg-white/80 p-3 text-slate-700 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'
                >
                    <FaChevronUp className='h-5 w-5' />
                </button>
                <button
                    aria-label='Jump to comments'
                    onClick={handleDiscuss}
                    className='rounded-full border border-white/60 bg-white/80 p-3 text-slate-700 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200'
                >
                    <FaCommentDots className='h-5 w-5' />
                </button>
                <button
                    aria-label='Open table of contents'
                    onClick={() => setShowMobileToc(true)}
                    className='rounded-full border border-white/60 bg-white/80 p-3 text-slate-700 shadow-xl backdrop-blur transition hover:-translate-y-0.5 hover:shadow-2xl dark:border-white/10 dark:bg-slate-800/80 dark:text-slate-200 lg:hidden'
                >
                    <span className='text-xs font-bold'>TOC</span>
                </button>
            </div>

            {isViewerOpen && (
                <ImageViewer
                    src={imagesInPost}
                    currentIndex={currentImage}
                    disableScroll={true}
                    closeOnClickOutside={true}
                    onClose={closeImageViewer}
                    backgroundStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.9)' }}
                />
            )}

            {/* Mobile TOC overlay */}
            {showMobileToc && (
                <div className='fixed inset-0 z-50 lg:hidden'>
                    <div className='absolute inset-0 bg-black/40 backdrop-blur-sm' onClick={() => setShowMobileToc(false)} />
                    <div className='absolute inset-y-0 right-0 w-5/6 max-w-sm overflow-y-auto border-l border-slate-200/70 bg-white p-5 shadow-2xl dark:border-white/10 dark:bg-slate-900'>
                        <div className='mb-3 flex items-center justify-between'>
                            <h3 className='text-base font-semibold text-slate-800 dark:text-slate-100'>On this page</h3>
                            <button aria-label='Close' onClick={() => setShowMobileToc(false)} className='rounded-md border border-slate-200 p-1 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800'>
                                <FaTimes />
                            </button>
                        </div>
                        <div className='pr-1 text-sm'>
                            <TableOfContents
                                headings={headings}
                                activeId={activeHeadingId}
                                onNavigate={() => setShowMobileToc(false)}
                                scrollContainerId={POST_ARTICLE_SCROLL_ROOT_ID}
                                revealContainerOnNavigate
                            />
                        </div>
                    </div>
                </div>
            )}

            {canResumeReading && (
                <div className='fixed bottom-6 left-6 z-40 rounded-full border border-slate-200/70 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 lg:hidden'>
                    <button
                        type='button'
                        onClick={handleResumeReading}
                        className='font-medium hover:underline'
                        aria-label='Resume reading from last position'
                    >
                        Resume reading
                    </button>
                </div>
            )}

            {/* Keyboard Shortcuts Modal */}
            <Modal show={showShortcuts} onClose={() => setShowShortcuts(false)} size='md'>
                <Modal.Header>Keyboard Shortcuts</Modal.Header>
                <Modal.Body>
                    <div className='space-y-2 text-sm text-slate-700 dark:text-slate-200'>
                        <p><span className='font-semibold'>?</span> Open this help</p>
                        <p><span className='font-semibold'>t</span> Back to top</p>
                        <p><span className='font-semibold'>c</span> Jump to comments</p>
                        <p><span className='font-semibold'>p</span> Print</p>
                        <p><span className='font-semibold'>h / H</span> Previous / Next heading</p>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}
