// client/src/pages/PostPage.jsx
import { Button, Alert, Tooltip, Modal } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { useEffect, useState, useMemo, useCallback } from 'react';
import hljs from 'highlight.js';
import ImageViewer from 'react-simple-image-viewer';
import { Helmet } from 'react-helmet-async';
import { FaClock, FaBookOpen, FaCalendarAlt, FaArrowRight, FaCommentDots, FaChevronUp, FaChevronLeft, FaChevronRight, FaLink, FaPrint, FaQuestionCircle, FaTimes } from 'react-icons/fa';
import { HiOutlineSparkles } from 'react-icons/hi';
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
import PagedReader from '../components/PagedReader.jsx';
import GalleryCarousel from '../components/media/GalleryCarousel.jsx';
import EmbeddedSnippetPreview from '../components/EmbeddedSnippetPreview.jsx';
import {
    getPostIllustrationGalleryItems,
    getPrimaryPostAsset,
    getSortedPostMediaAssets,
} from '../utils/postMedia.js';
import '../Tiptap.css';

// --- API fetching functions ---
const fetchPostBySlug = async (postSlug) => {
    const res = await apiFetch(`/api/v1/post/getposts?slug=${postSlug}`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to fetch post.');
    if (data.posts.length === 0) throw new Error('Post not found.');
    return data.posts[0];
};

const fetchRelatedPosts = async (category) => {
    if (!category) return [];
    try {
        const res = await apiFetch(`/api/v1/post/getposts?category=${category}&limit=3`);
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

export default function PostPage() {
    const { postSlug } = useParams();

    const { data: post, isLoading: isLoadingPost, error: postError } = useQuery({
        queryKey: ['post', postSlug],
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
        if (!sanitizedContent) return [];
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
        if (!sanitizedContent) return [];
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
        contentPadding,
    } = useReadingSettings();

    const sharedContentStyle = useMemo(
        () => ({
            maxWidth: contentMaxWidth,
            paddingInline: contentPadding,
        }),
        [contentMaxWidth, contentPadding]
    );

    const openImageViewer = (index) => {
        setCurrentImage(index);
        setIsViewerOpen(true);
    };
    const closeImageViewer = () => {
        setCurrentImage(0);
        setIsViewerOpen(false);
    };

    useEffect(() => {
        if (!headings.length) return;
        const contentRoot = document.querySelector('.post-content');
        if (!contentRoot) return;

        const renderedHeadings = contentRoot.querySelectorAll('h2, h3');
        if (!renderedHeadings.length) return;

        headings.forEach((heading, index) => {
            const node = renderedHeadings[index];
            if (node && node.id !== heading.id) {
                node.id = heading.id;
            }
        });
    }, [headings]);

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
                    const fromTop = headings
                        .filter((el) => el.getBoundingClientRect().top < window.innerHeight * 0.25)
                        .pop();
                    if (fromTop && fromTop.id) setActiveHeadingId(fromTop.id);
                }
            },
            { rootMargin: '0px 0px -70% 0px', threshold: [0, 1] }
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

    const createMetaDescription = (htmlContent) => {
        if (!htmlContent) return '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        return `${tempDiv.textContent.trim().slice(0, 155)}...`;
    };

    const metaDescription = useMemo(() => createMetaDescription(post?.content), [post?.content]);

    const sortedMedia = useMemo(() => getSortedPostMediaAssets(post), [post]);
    const primaryAsset = useMemo(() => getPrimaryPostAsset(post), [post]);

    const readingStats = useMemo(() => {
        if (!sanitizedContent) return { wordCount: 0, readingMinutes: 0 };
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

    const heroDescriptionText = metaDescription;

    const scrollToElement = useCallback((elementId) => {
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, []);

    const handleStartReading = useCallback(() => {
        scrollToElement('article-start');
    }, [scrollToElement]);

    const handleDiscuss = useCallback(() => {
        scrollToElement('comments-section');
    }, [scrollToElement]);

    const handleScrollTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const handleCopyLink = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(window.location.href);
            // noop feedback: rely on subtle title change via tooltip
        } catch (_) {
            // ignore
        }
    }, []);

    const handleShare = useCallback(async () => {
        try {
            if (navigator.share) {
                await navigator.share({ title: document.title, url: window.location.href, text: post?.title });
            } else {
                await navigator.clipboard.writeText(window.location.href);
            }
        } catch (_) {
            // ignore cancellation/errors
        }
    }, [post?.title]);

    const [pagedMode, setPagedMode] = useState(false);
    const [showShortcuts, setShowShortcuts] = useState(false);
    const [resumeProgress, setResumeProgress] = useState(null);
    const [showCompactHeader, setShowCompactHeader] = useState(false);
    const [showMobileToc, setShowMobileToc] = useState(false);

    // Load any saved reading progress for this post
    useEffect(() => {
        if (!post?._id) return;
        try {
            const raw = localStorage.getItem(`reading-progress:${post._id}`);
            const v = raw ? parseFloat(raw) : 0;
            if (Number.isFinite(v)) setResumeProgress(v);
        } catch (_) {
            // ignore
        }
    }, [post?._id]);

    // Global keyboard shortcuts for page-level actions
    useEffect(() => {
        const onKey = (e) => {
            const tag = (e.target?.tagName || '').toLowerCase();
            if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;
            if (e.key === '?') {
                setShowShortcuts((s) => !s);
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
    }, [handleDiscuss, handleScrollTop]);

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

    const parserOptions = {
        replace: domNode => {
            if (domNode.type === 'tag' && (domNode.name === 'h2' || domNode.name === 'h3')) {
                const textContent = getTextFromNode(domNode);
                const id = generateSlug(textContent);
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
        }
    };

    return (
        <>
            <Helmet>
                <title>{post.title}</title>
                <meta name="description" content={metaDescription} />
                <meta property="og:title" content={post.title} />
                <meta property="og:description" content={metaDescription} />
                <meta property="og:image" content={heroImage || post.image} />
                <meta property="og:url" content={window.location.href} />
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
                            '@id': typeof window !== 'undefined' ? window.location.href : ''
                        },
                        url: typeof window !== 'undefined' ? window.location.href : '',
                        author: post.authorName || post.username || undefined,
                    })}
                </script>
            </Helmet>

            {!pagedMode && (
                <ReadingControlCenter
                    settings={readingSettings}
                    onChange={updateReadingSetting}
                    onReset={resetReadingSettings}
                />
            )}

            <ReadingProgressBar />
            <div className='liquid-stage' data-theme='liquid-glass'>
                <div className='liquid-stage__backdrop' aria-hidden='true'>
                    <div className='liquid-stage__blob liquid-stage__blob--cyan' />
                    <div className='liquid-stage__blob liquid-stage__blob--violet' />
                    <div className='liquid-stage__blob liquid-stage__blob--amber' />
                    <div className='liquid-stage__mesh' />
                    <div className='liquid-stage__glint' />
                    <div className='liquid-stage__noise' />
                </div>
                <div className='relative z-10 min-h-screen pb-16'>
                    {/* Compact sticky header when reading */}
                    {showCompactHeader && (
                        <div className='fixed inset-x-0 top-0 z-40 px-3 pt-2'>
                            <div className='glass-navbar glass-panel mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-2xl border border-white/20 bg-white/60 px-3 py-2 shadow-xl backdrop-blur supports-[backdrop-filter]:bg-white/50 dark:border-white/10 dark:bg-slate-900/70'>
                                <div className='flex min-w-0 items-center gap-3'>
                                    <span className='inline-flex h-2.5 w-2.5 flex-none rounded-full bg-sky-500 ring-2 ring-sky-500/20' aria-hidden='true' />
                                    <span className='truncate text-sm font-medium text-slate-700 dark:text-slate-200'>{post.title}</span>
                                </div>
                                <div className='flex items-center gap-2'>
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
                        <div className='absolute inset-0 bg-slate-900/82 backdrop-blur-lg dark:bg-slate-950/86' />
                        <div className='absolute inset-x-0 -bottom-44 h-[460px] bg-gradient-to-t from-slate-900 via-slate-900/80 to-transparent opacity-80 blur-3xl dark:from-slate-950 dark:via-slate-950/80' aria-hidden='true' />
                        <div className='absolute -left-24 top-20 h-72 w-72 rounded-full bg-gradient-to-br from-sky-400/50 via-cyan-300/40 to-emerald-400/50 blur-3xl' aria-hidden='true' />
                        <div className='absolute -right-28 bottom-10 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/45 via-violet-400/38 to-amber-300/42 blur-3xl' aria-hidden='true' />
                        <div className='absolute inset-x-10 top-16 h-40 rounded-full bg-white/10 blur-3xl mix-blend-screen' aria-hidden='true' />
                        <div className='relative mx-auto flex max-w-6xl flex-col gap-8 px-4 py-20 sm:px-8 sm:py-24 lg:px-0'>
                            {/* Breadcrumbs */}
                            <div className='glass-panel liquid-hybrid-band lg-glass-strong mx-auto flex w-full max-w-5xl flex-col gap-6 rounded-[28px] border border-white/25 bg-white/10 p-6 shadow-2xl backdrop-blur-xl dark:border-white/10 dark:bg-white/5 sm:p-10'>
                                <nav aria-label='Breadcrumb' className='mx-auto -mb-2 flex items-center gap-2 text-xs text-slate-200/90'>
                                    <Link to='/' className='link-premium'>Home</Link>
                                    <span aria-hidden='true'>/</span>
                                    <Link to={`/search?category=${categoryQuery}`} className='link-premium'>{formatCategory(post.category)}</Link>
                                    <span aria-hidden='true'>/</span>
                                    <span className='truncate max-w-[40ch]' title={post.title}>{post.title}</span>
                                </nav>
                                <div className='inline-flex flex-wrap items-center justify-center gap-3 self-center text-[11px] uppercase tracking-[0.28em] text-slate-100'>
                                    <span className='inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1 font-semibold backdrop-blur'>
                                        <HiOutlineSparkles className='h-4 w-4 text-amber-300' aria-hidden='true' />
                                        Liquid Glass Feature
                                    </span>
                                    <Link
                                        to={`/search?category=${categoryQuery}`}
                                        className='inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-1 font-medium backdrop-blur transition hover:border-white/50 hover:bg-white/20'
                                    >
                                        {formatCategory(post.category)}
                                    </Link>
                                </div>
                                <h1 className='text-balance text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl'>
                                    {post.title}
                                </h1>
                                {heroDescriptionText && (
                                    <p className='mx-auto max-w-3xl text-base text-slate-100/90 sm:text-lg'>
                                        {heroDescriptionText}
                                    </p>
                                )}
                                <div className='flex flex-wrap items-center justify-center gap-3 sm:gap-4'>
                                    <Button
                                        gradientDuoTone='purpleToBlue'
                                        className='group flex items-center gap-2 rounded-full px-6 py-2 text-sm font-semibold shadow-lg shadow-sky-500/35 backdrop-blur'
                                        onClick={handleStartReading}
                                    >
                                        Start reading
                                        <FaArrowRight className='h-4 w-4 transition-transform duration-300 group-hover:translate-x-1' />
                                    </Button>
                                    <Button
                                        color='light'
                                        className='group flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white transition hover:border-white/50 hover:bg-white/20'
                                        onClick={handleDiscuss}
                                    >
                                        Join the discussion
                                        <FaCommentDots className='h-4 w-4 text-slate-200 transition-transform duration-300 group-hover:-translate-y-0.5' />
                                    </Button>
                                    <Button color='light' className='rounded-full border border-white/30 bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:border-white/50 hover:bg-white/20' onClick={handleShare}>
                                        Share
                                    </Button>
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
                                </div>
                            </div>
                        </div>
                    </section>

                    <main className='mx-auto flex max-w-6xl flex-col gap-10 px-4 py-10 lg:flex-row lg:px-10'>
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

                        <div
                            className='glass-panel liquid-hybrid-panel overflow-hidden'
                            style={sharedContentStyle}
                        >
                            <div className='flex items-center justify-between border-b border-white/20 bg-white/30 px-6 py-3 text-xs text-slate-600 backdrop-blur dark:border-white/10 dark:bg-slate-900/60 dark:text-slate-300 sm:px-8'>
                                <span>Reading mode</span>
                                <div className='inline-flex items-center gap-2'>
                                    <button
                                        type='button'
                                        onClick={() => setPagedMode(false)}
                                        className={`rounded-md px-2 py-1 ${!pagedMode ? 'bg-white/70 text-slate-800 shadow-sm backdrop-blur dark:bg-slate-800/70 dark:text-slate-100' : 'hover:bg-white/60 dark:hover:bg-slate-800/60'}`}
                                    >Scroll</button>
                                    <button
                                        type='button'
                                        onClick={() => setPagedMode(true)}
                                        className={`rounded-md px-2 py-1 ${pagedMode ? 'bg-white/70 text-slate-800 shadow-sm backdrop-blur dark:bg-slate-800/70 dark:text-slate-100' : 'hover:bg-white/60 dark:hover:bg-slate-800/60'}`}
                                    >Pages</button>
                                </div>
                            </div>

                            {pagedMode ? (
                                <div className='px-2 py-4 sm:px-4 sm:py-6'>
                                    <PagedReader
                                        content={sanitizedContent}
                                        parserOptions={parserOptions}
                                        chapterId={post._id}
                                        readingMinutes={readingStats.readingMinutes}
                                        // Share reading settings with paged mode
                                        settings={readingSettings}
                                        onChange={updateReadingSetting}
                                        onReset={resetReadingSettings}
                                        contentStyles={contentStyles}
                                        contentMaxWidth={contentMaxWidth}
                                        surfaceClass={surfaceClass}
                                        showReadingControls={true}
                                    />
                                </div>
                            ) : (
                                <InteractiveReadingSurface
                                    content={sanitizedContent}
                                    parserOptions={parserOptions}
                                    contentStyles={contentStyles}
                                    contentMaxWidth={contentMaxWidth}
                                    surfaceClass={surfaceClass}
                                    className='post-content tiptap reading-surface w-full space-y-6 px-6 py-8 text-left text-slate-700 transition-all duration-300 dark:text-slate-200 sm:px-10 sm:py-12'
                                    chapterId={post._id}
                                    readingMinutes={readingStats.readingMinutes}
                                />
                            )}
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
                        {relatedPosts && relatedPosts.filter(p => p._id !== post._id).length > 0 && (
                            (() => {
                                const pool = relatedPosts.filter(p => p._id !== post._id);
                                const prev = pool[0];
                                const next = pool[1];
                                if (!prev && !next) return null;
                                    return (
                                        <div className='liquid-hybrid-tile flex flex-col gap-3 p-4 shadow-xl sm:flex-row sm:items-stretch sm:justify-between'>
                                            <div className='flex-1'>
                                                {prev && (
                                                    <Link to={`/post/${prev.slug}`} className='group flex items-center gap-3 rounded-xl border border-white/50 bg-white/70 p-3 backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-500'>
                                                        <FaChevronLeft className='text-slate-400 group-hover:text-sky-500' />
                                                        <div className='min-w-0'>
                                                            <div className='text-xs uppercase tracking-wide text-slate-400'>Previous</div>
                                                            <div className='truncate text-sm font-semibold text-slate-700 group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-300'>{prev.title}</div>
                                                        </div>
                                                    </Link>
                                                )}
                                            </div>
                                            <div className='flex-1'>
                                                {next && (
                                                    <Link to={`/post/${next.slug}`} className='group flex items-center justify-end gap-3 rounded-xl border border-white/50 bg-white/70 p-3 text-right backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 dark:border-white/10 dark:bg-slate-900/60 dark:hover:border-sky-500'>
                                                        <div className='min-w-0'>
                                                            <div className='text-xs uppercase tracking-wide text-slate-400'>Next</div>
                                                            <div className='truncate text-sm font-semibold text-slate-700 group-hover:text-sky-700 dark:text-slate-200 dark:group-hover:text-sky-300'>{next.title}</div>
                                                        </div>
                                                        <FaChevronRight className='text-slate-400 group-hover:text-sky-500' />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    );
                            })()
                        )}

                        {relatedPosts && relatedPosts.filter(p => p._id !== post._id).length > 0 && (
                            <section className='liquid-hybrid-panel space-y-6 p-6 shadow-xl'>
                                <div className='flex items-center justify-between'>
                                    <h2 className='text-lg font-semibold text-slate-800 dark:text-slate-100'>Related articles</h2>
                                    <span className='text-xs uppercase tracking-wide text-slate-400'>Curated for you</span>
                                </div>
                                <div className='grid gap-5 md:grid-cols-2'>
                                    {relatedPosts
                                        .filter(p => p._id !== post._id)
                                        .map((p) => (
                                            <PostCard key={p._id} post={p} />
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
                                    <TableOfContents headings={headings} activeId={activeHeadingId} />
                                </div>
                            </div>

                            <div className='liquid-hybrid-panel p-6 shadow-xl'>
                                <h3 className='text-base font-semibold text-slate-800 dark:text-slate-100'>Reading insights</h3>
                                <ul className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                                    {formattedPublishDate && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaCalendarAlt className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden="true" />
                                            Published on {formattedPublishDate}
                                        </li>
                                    )}
                                    {readingStats.readingMinutes > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaClock className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden="true" />
                                            {readingStats.readingMinutes} minute read
                                        </li>
                                    )}
                                    {readingStats.wordCount > 0 && (
                                        <li className='flex items-center gap-3 rounded-2xl bg-white/60 px-3 py-2 backdrop-blur dark:bg-slate-800/70'>
                                            <FaBookOpen className='h-4 w-4 text-slate-500 dark:text-slate-400' aria-hidden="true" />
                                            {readingStats.wordCount.toLocaleString()} words to explore
                                        </li>
                                    )}
                                </ul>
                                <div className='mt-6 rounded-2xl bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 p-[1px]'>
                                    <div className='rounded-2xl bg-white p-5 text-center dark:bg-slate-950'>
                                        <p className='text-sm font-medium text-slate-700 dark:text-slate-200'>Adjust the reading experience to match your focus preference.</p>
                                        <p className='mt-2 text-xs text-slate-500 dark:text-slate-400'>Use the Control Center in the header to toggle focus mode and fine-tune brightness or sound.</p>
                                    </div>
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
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Resume reading prompt */}
            {resumeProgress !== null && resumeProgress > 0.05 && resumeProgress < 0.98 && (
                <div className='fixed bottom-6 left-6 z-40 rounded-full border border-slate-200/70 bg-white/95 px-4 py-2 text-sm text-slate-700 shadow-lg backdrop-blur dark:border-white/10 dark:bg-slate-900/80 dark:text-slate-200 lg:hidden'>
                    <button
                        onClick={() => {
                            const c = document.querySelector('[data-reading-surface="true"]');
                            if (!c) return;
                            const rect = c.getBoundingClientRect();
                            const start = window.scrollY + rect.top;
                            const denom = Math.max(1, c.scrollHeight - window.innerHeight);
                            const target = start + denom * resumeProgress;
                            window.scrollTo({ top: target, behavior: 'smooth' });
                        }}
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
                        <p><span className='font-semibold'>/</span> Focus in-page search</p>
                        <p><span className='font-semibold'>h / H</span> Previous / Next heading</p>
                        <p><span className='font-semibold'>Enter</span> Next search hit (<span className='font-semibold'>Shift+Enter</span> previous)</p>
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}
