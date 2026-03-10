import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import PropTypes from 'prop-types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { Tooltip, Spinner } from 'flowbite-react';
import { formatRelativeTimeFromNow, isWithinPastHours } from '../utils/date.js';
import CommunityPostBadge from './CommunityPostBadge.jsx';

// --- Icon and Hook Imports ---
import {
    FaHeart,
    FaRegHeart,
    FaBookmark,
    FaRegBookmark,
    FaShareAlt,
    FaUserCircle,
    FaTag,
    FaClock,
    FaBookOpen,
    FaFire,
    FaExternalLinkAlt,
} from 'react-icons/fa';
import { HiDotsHorizontal } from 'react-icons/hi';
import { useLike } from '../hooks/useLike';
import { useBookmark } from '../hooks/useBookmark';
import useUser from '../hooks/useUser';

// --- SUB-COMPONENTS for Instagram-style Layout ---

const formatCategory = (category) => {
    if (!category) return 'Uncategorized';
    const trimmed = category.trim();
    if (!trimmed) return 'Uncategorized';
    return trimmed
        .split(/[-_\s]+/)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');
};

const stripHtml = (htmlContent) => {
    if (!htmlContent || typeof htmlContent !== 'string') return '';
    return htmlContent
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
};

const buildPostInsights = (htmlContent, fallbackTitle) => {
    const sanitizedText = stripHtml(htmlContent);
    const baseText = sanitizedText || fallbackTitle || '';
    const words = baseText ? baseText.split(/\s+/).filter(Boolean) : [];
    const wordCount = words.length;
    const readingMinutes = wordCount === 0 ? 0 : Math.max(1, Math.ceil(wordCount / 200));

    let readingLabel = 'Quick update';
    if (wordCount > 0) {
        if (readingMinutes <= 3) readingLabel = 'Quick read';
        else if (readingMinutes <= 6) readingLabel = `${readingMinutes} min read`;
        else readingLabel = 'Deep dive';
    }

    const maxPreviewLength = 180;
    let previewText = baseText;
    if (baseText.length > maxPreviewLength) {
        const truncated = baseText.slice(0, maxPreviewLength);
        previewText = `${truncated.replace(/[.,;:\s]+$/, '')}…`;
    }

    if (!previewText) {
        previewText = 'Untitled post';
    }

    return { previewText, wordCount, readingMinutes, readingLabel };
};

const CardHeader = ({ userId, fallbackUsername, category, kind }) => {
    const { user, isLoading, error } = useUser(userId);
    if (isLoading) {
        return (
            <div className="flex items-center justify-between gap-3 p-3">
                <div className="flex items-center gap-3">
                    <Skeleton circle width={40} height={40} />
                    <Skeleton width={120} />
                </div>
                <Skeleton width={24} height={24} />
            </div>
        );
    }
    const displayName = user?.username || fallbackUsername || 'Anonymous';
    const avatarSrc = user?.profilePicture;
    const showFallbackAvatar = !avatarSrc || error;

    return (
        <div className="flex items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
                {showFallbackAvatar ? (
                    <FaUserCircle className='w-10 h-10 text-gray-400 dark:text-gray-500' aria-hidden />
                ) : (
                    <img
                        src={avatarSrc}
                        alt={displayName}
                        className='w-10 h-10 rounded-full object-cover ring-2 ring-white/70 dark:ring-slate-700'
                    />
                )}
                <span className='font-bold text-sm text-gray-800 dark:text-gray-200'>{displayName}</span>
                <div className='flex items-center gap-2'>
                    {kind === 'community' && (
                        <span className='inline-flex items-center gap-1 rounded-full bg-indigo-100 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-200'>
                            Community
                        </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wide font-semibold text-professional-blue-600 dark:text-professional-blue-300 px-2.5 py-0.5 rounded-full border border-white/30 dark:border-white/10 bg-white/60 dark:bg-slate-800/50 backdrop-blur shadow-sm">
                        <FaTag aria-hidden />
                        {formatCategory(category)}
                    </span>
                </div>
            </div>
            <button
                type='button'
                aria-label='More options'
                className="text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full p-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/60"
            >
                <HiDotsHorizontal size={20} />
            </button>
        </div>
    );
};
CardHeader.propTypes = { userId: PropTypes.string, fallbackUsername: PropTypes.string, category: PropTypes.string, kind: PropTypes.string };


const CardMedia = ({
    post,
    onDoubleClick,
    showLikeHeart,
    onLikeClick,
    onBookmarkClick,
    onShareClick,
    isLiked = false,
    isBookmarked = false,
    disableLikes = false,
    disableBookmarks = false,
    disableShare = false,
    readingLabel,
    isTrending = false,
    isFresh = false,
}) => {
    const galleryAssets = Array.isArray(post.mediaAssets) ? [...post.mediaAssets].sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const coverIndex = Number.isInteger(post.coverAssetIndex) ? post.coverAssetIndex : 0;
    const primaryAsset = post.mediaUrl
        ? { url: post.mediaUrl, type: post.mediaType || 'image' }
        : galleryAssets[coverIndex] || galleryAssets[0];
    const mediaType = primaryAsset?.type || post.mediaType || 'image';
    const fallbackImage = post.image || null;
    const mediaUrl = primaryAsset?.url || fallbackImage;
    const shouldRenderVideo = mediaType === 'video' && !!mediaUrl;
    const shouldRenderAudio = mediaType === 'audio' && !!mediaUrl;

    const [mediaOrientation, setMediaOrientation] = useState('landscape');
    const [isMediaLoading, setIsMediaLoading] = useState(Boolean(mediaUrl));
    const [mediaDimensions, setMediaDimensions] = useState({ width: null, height: null });

    const handleOrientationUpdate = useCallback((width, height) => {
        if (!width || !height) return;
        const ratio = width / height;
        setMediaDimensions({ width, height });
        if (Math.abs(ratio - 1) < 0.08) {
            setMediaOrientation('square');
            return;
        }
        setMediaOrientation(ratio > 1 ? 'landscape' : 'portrait');
    }, []);

    const handleImageLoad = useCallback((event) => {
        const { naturalWidth, naturalHeight } = event.target || {};
        handleOrientationUpdate(naturalWidth, naturalHeight);
        setIsMediaLoading(false);
    }, [handleOrientationUpdate]);

    const handleVideoMetadata = useCallback((event) => {
        const { videoWidth, videoHeight } = event.target || {};
        handleOrientationUpdate(videoWidth, videoHeight);
        setIsMediaLoading(false);
    }, [handleOrientationUpdate]);

    const handleMediaError = useCallback(() => {
        setIsMediaLoading(false);
    }, []);

    useEffect(() => {
        setIsMediaLoading(Boolean(mediaUrl));
        setMediaOrientation('landscape');
        setMediaDimensions({ width: null, height: null });
    }, [mediaUrl]);

    const baseClass = 'group relative w-full overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer';

    const computedAspectRatio = useMemo(() => {
        if (!mediaUrl) return null;
        if (mediaDimensions.width && mediaDimensions.height) {
            const ratio = mediaDimensions.width / mediaDimensions.height;
            // Prevent absurd aspect ratios from breaking the layout
            const MIN_RATIO = 0.55; // ~9:16 portrait
            const MAX_RATIO = 1.85; // ~16:9 landscape
            const clampedRatio = Math.min(Math.max(ratio, MIN_RATIO), MAX_RATIO);
            return clampedRatio;
        }
        if (shouldRenderVideo) {
            return 16 / 9;
        }
        return 4 / 3;
    }, [mediaDimensions.height, mediaDimensions.width, mediaUrl, shouldRenderVideo]);

    const orientationClasses = useMemo(() => {
        if (!mediaUrl) {
            return 'flex items-center justify-center py-12 min-h-[12rem]';
        }

        if (shouldRenderVideo) {
            return 'max-h-[520px]';
        }

        if (isMediaLoading) {
            return 'max-h-[420px]';
        }

        switch (mediaOrientation) {
            case 'portrait':
                return 'max-h-[560px]';
            case 'square':
                return 'max-h-[520px]';
            default:
                return 'max-h-[460px]';
        }
    }, [isMediaLoading, mediaOrientation, mediaUrl, shouldRenderVideo]);

    const containerStyle = useMemo(() => {
        if (!mediaUrl) {
            return undefined;
        }

        if (computedAspectRatio) {
            // React supports numeric aspectRatio, but we clamp the precision to avoid noisy renders
            return { aspectRatio: Number(computedAspectRatio.toFixed(3)) };
        }

        return undefined;
    }, [computedAspectRatio, mediaUrl]);

    return (
        <div onDoubleClick={onDoubleClick} className={`${baseClass} ${orientationClasses}`} style={containerStyle}>
            {isMediaLoading && mediaUrl && (
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-700 animate-pulse">
                    <Spinner aria-hidden size="lg" />
                </div>
            )}
            {mediaUrl ? (
                shouldRenderVideo ? (
                    <video
                        src={mediaUrl}
                        className='h-full w-full object-cover'
                        loop
                        autoPlay
                        muted
                        playsInline
                        poster={fallbackImage || undefined}
                        onLoadedMetadata={handleVideoMetadata}
                        onError={handleMediaError}
                    />
                ) : shouldRenderAudio ? (
                    <div className='flex h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-800'>
                        <audio src={mediaUrl} controls className='w-full' />
                    </div>
                ) : (
                    <img
                        src={mediaUrl}
                        alt={post.title}
                        loading='lazy'
                        onLoad={handleImageLoad}
                        onError={handleMediaError}
                        className='h-full w-full object-cover transition-all duration-500 ease-out transform-gpu group-hover:scale-[1.02]'
                        style={{ opacity: isMediaLoading ? 0 : 1 }}
                    />
                )
            ) : (
                <div className='text-gray-500 dark:text-gray-300 text-sm text-center px-6'>
                    Media unavailable
                </div>
            )}

            {/* Gradient overlays for readability */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/50 via-black/20 to-transparent opacity-90 transition-opacity group-hover:opacity-100" />

            {/* Top-left status badges */}
            <div className="absolute left-3 top-3 z-10 flex flex-col gap-2">
                {isTrending && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-amber-500/90 to-rose-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-amber-500/20">
                        <FaFire aria-hidden /> Trending
                    </span>
                )}
                {galleryAssets.length > 1 && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-slate-700 shadow-sm ring-1 ring-slate-200 backdrop-blur dark:bg-slate-800/80 dark:text-slate-100 dark:ring-slate-700">
                        Gallery • {galleryAssets.length}
                    </span>
                )}
                {!isTrending && isFresh && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg shadow-emerald-500/20">
                        New
                    </span>
                )}
            </div>

            {/* Bottom-left reading label */}
            {readingLabel && (
                <div className="pointer-events-none absolute bottom-3 left-3 z-10 inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-slate-800 shadow-md backdrop-blur dark:bg-slate-900/80 dark:text-slate-100">
                    <FaClock className="text-sky-500" aria-hidden />
                    {readingLabel}
                </div>
            )}

            {/* Top-right quick actions */}
            <div className="absolute right-3 top-3 z-10 flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                    type="button"
                    aria-label={isLiked ? 'Unlike' : 'Like'}
                    disabled={disableLikes}
                    onClick={onLikeClick}
                    className={`rounded-full border border-white/30 bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500/50 dark:bg-slate-800/80 dark:text-slate-100 ${disableLikes ? 'cursor-not-allowed' : ''}`}
                >
                    {isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                </button>
                <button
                    type="button"
                    aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark'}
                    disabled={disableBookmarks}
                    onClick={onBookmarkClick}
                    className={`rounded-full border border-white/30 bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500/50 dark:bg-slate-800/80 dark:text-slate-100 ${disableBookmarks ? 'cursor-not-allowed' : ''}`}
                >
                    {isBookmarked ? <FaBookmark className="text-professional-blue-500" /> : <FaRegBookmark />}
                </button>
                <button
                    type="button"
                    aria-label="Share"
                    disabled={disableShare}
                    onClick={onShareClick}
                    className={`rounded-full border border-white/30 bg-white/80 p-2 text-slate-700 shadow-md backdrop-blur transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/60 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-500/50 dark:bg-slate-800/80 dark:text-slate-100 ${disableShare ? 'cursor-not-allowed' : ''}`}
                    title={disableShare ? 'Link unavailable' : 'Share'}
                >
                    <FaShareAlt />
                </button>
            </div>
            <AnimatePresence>
                {showLikeHeart && (
                    <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1.2, opacity: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <FaHeart className="text-white text-8xl drop-shadow-lg" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
CardMedia.propTypes = {
    post: PropTypes.object.isRequired,
    onDoubleClick: PropTypes.func,
    showLikeHeart: PropTypes.bool,
    onLikeClick: PropTypes.func,
    onBookmarkClick: PropTypes.func,
    onShareClick: PropTypes.func,
    isLiked: PropTypes.bool,
    isBookmarked: PropTypes.bool,
    disableLikes: PropTypes.bool,
    disableBookmarks: PropTypes.bool,
    disableShare: PropTypes.bool,
    readingLabel: PropTypes.string,
    isTrending: PropTypes.bool,
    isFresh: PropTypes.bool,
};


const CardActions = ({ likeProps, bookmarkProps, onActionClick, onShareClick, shareTooltip, disableLikes, disableBookmarks, disableShare }) => {
    // New state for share animation
    const [isSharing, setIsSharing] = useState(false);

    const handleShare = async (e) => {
        if (disableShare) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        setIsSharing(true);
        try {
            await onShareClick(e);
        } catch (error) {
            console.error('Share handler failed:', error);
        } finally {
            setIsSharing(false);
        }
    };

    return (
        <div className="flex justify-between items-center px-3 py-2 border-t border-gray-100/60 dark:border-slate-700/60 bg-white/60 dark:bg-slate-900/40 backdrop-blur supports-[backdrop-filter]:bg-white/40">
            <div className="flex items-center gap-4">
                <Tooltip content={disableLikes ? 'Likes unavailable' : (likeProps.isLiked ? 'Unlike' : 'Like')}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => !disableLikes && onActionClick(e, likeProps.handleLike)}
                        disabled={likeProps.isLoading || disableLikes}
                        aria-pressed={likeProps.isLiked}
                        className={`relative flex items-center gap-2 text-2xl text-gray-700 dark:text-gray-300 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/50 hover:text-professional-blue-600 dark:hover:text-professional-blue-300 ${disableLikes ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        {likeProps.isLoading ? <Spinner size="sm" /> :
                            <>
                                <AnimatePresence>
                                    {likeProps.isLiked && (
                                        <motion.div
                                            key="confetti"
                                            className="absolute inset-0"
                                            initial={{ opacity: 1 }}
                                            animate={{ opacity: [1, 0] }}
                                            transition={{ duration: 0.6, ease: "easeOut" }}
                                        >
                                            {[...Array(6)].map((_, i) => (
                                                <motion.div
                                                    key={i}
                                                    className="absolute"
                                                    initial={{ y: 0, scale: 0.5, opacity: 1 }}
                                                    animate={{
                                                        y: -40,
                                                        x: (Math.random() - 0.5) * 40,
                                                        scale: 0,
                                                        opacity: 0,
                                                        rotate: Math.random() * 360,
                                                    }}
                                                    transition={{ duration: 0.5, delay: i * 0.05, ease: "easeOut" }}
                                                >
                                                    <FaHeart className="text-red-500" />
                                                </motion.div>
                                            ))}
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                                <motion.span animate={{ scale: likeProps.isLiked ? [1, 1.3, 1] : 1 }} transition={{ duration: 0.3 }}>
                                    {likeProps.isLiked ? <FaHeart className="text-red-500" /> : <FaRegHeart />}
                                </motion.span>
                            </>
                        }
                    </motion.button>
                </Tooltip>
                <Tooltip content={shareTooltip}>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        animate={isSharing ? { rotate: [0, 15, -15, 15, 0], transition: { duration: 0.4 } } : {}}
                        onAnimationComplete={() => setIsSharing(false)}
                        onClick={handleShare}
                        disabled={disableShare}
                        aria-disabled={disableShare}
                        className={`text-2xl text-gray-700 dark:text-gray-300 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/50 hover:text-professional-blue-600 dark:hover:text-professional-blue-300 ${disableShare ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                        <FaShareAlt />
                    </motion.button>
                </Tooltip>
            </div>
            <Tooltip content={disableBookmarks ? 'Bookmarks unavailable' : (bookmarkProps.isBookmarked ? 'Remove Bookmark' : 'Bookmark')}>
                <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => !disableBookmarks && onActionClick(e, bookmarkProps.handleBookmark)}
                    disabled={bookmarkProps.isLoading || disableBookmarks}
                    aria-pressed={bookmarkProps.isBookmarked}
                    className={`text-2xl text-gray-700 dark:text-gray-300 transition-colors rounded-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-professional-blue-500/50 hover:text-professional-blue-600 dark:hover:text-professional-blue-300 ${disableBookmarks ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    {bookmarkProps.isLoading ? <Spinner size="sm" /> :
                        <motion.span
                            animate={{
                                rotateY: bookmarkProps.isBookmarked ? [0, 180, 0] : 0,
                                scale: bookmarkProps.isBookmarked ? [1, 1.2, 1] : 1
                            }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            style={{ display: 'inline-block' }}
                        >
                            {bookmarkProps.isBookmarked ? <FaBookmark className="text-professional-blue-500"/> : <FaRegBookmark />}
                        </motion.span>
                    }
                </motion.button>
            </Tooltip>
        </div>
    );
};
CardActions.propTypes = { likeProps: PropTypes.object, bookmarkProps: PropTypes.object, onActionClick: PropTypes.func, onShareClick: PropTypes.func, shareTooltip: PropTypes.string, disableLikes: PropTypes.bool, disableBookmarks: PropTypes.bool, disableShare: PropTypes.bool };



const CardInsightPanel = ({ readingMinutes, readingLabel, wordCount, likeTotal, isTrending, isFresh, formattedCategory }) => {
    const progressValue = useMemo(() => {
        if (readingMinutes <= 0) {
            const base = likeTotal > 0 ? 30 + Math.min(30, likeTotal) : 24;
            return Math.min(100, base);
        }
        const readingContribution = Math.min(80, Math.round((readingMinutes / 8) * 100));
        const applauseBoost = Math.min(20, Math.round(likeTotal / 5));
        return Math.min(100, readingContribution + applauseBoost);
    }, [likeTotal, readingMinutes]);

    const accentGradient = isTrending
        ? 'from-amber-400 via-rose-400 to-professional-blue-500'
        : 'from-professional-blue-500 via-indigo-500 to-purple-500';

    const wordsLabel = wordCount > 0 ? `${wordCount.toLocaleString()} words` : 'Bite-sized update';
    const clapsLabel = likeTotal === 1 ? '1 clap' : `${likeTotal.toLocaleString()} claps`;

    return (
        <div className="rounded-xl border border-gray-200/70 dark:border-slate-700/70 bg-white/70 dark:bg-slate-900/60 shadow-inner backdrop-blur-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 px-3 py-2">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-600 dark:text-gray-300">
                    <span className="inline-flex items-center gap-1 text-professional-blue-600 dark:text-professional-blue-300">
                        <FaTag aria-hidden className="text-[10px]" />
                        {formattedCategory}
                    </span>
                    {isTrending && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-amber-100/70 px-2 py-0.5 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
                            <FaFire aria-hidden className="text-[12px]" />
                            Trending
                        </span>
                    )}
                    {isFresh && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 px-2 py-0.5 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300">
                            <FaClock aria-hidden className="text-[12px]" />
                            Fresh
                        </span>
                    )}
                </div>
                <span className="text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    {readingLabel}
                    {readingMinutes > 0 ? ` · ${readingMinutes} min` : ''}
                </span>
            </div>
            <div className="px-3 pb-3">
                <div className="flex items-center justify-between text-[11px] font-medium text-gray-500 dark:text-gray-400">
                    <span>{wordsLabel}</span>
                    <span>{clapsLabel}</span>
                </div>
                <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                    <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${Math.max(18, progressValue)}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                        className={`h-full rounded-full bg-gradient-to-r ${accentGradient}`}
                    />
                </div>
            </div>
        </div>
    );
};
CardInsightPanel.propTypes = {
    readingMinutes: PropTypes.number.isRequired,
    readingLabel: PropTypes.string.isRequired,
    wordCount: PropTypes.number.isRequired,
    likeTotal: PropTypes.number.isRequired,
    isTrending: PropTypes.bool.isRequired,
    isFresh: PropTypes.bool.isRequired,
    formattedCategory: PropTypes.string.isRequired,
};

const CardBody = ({
    post,
    authorUsername,
    insights,
    likeTotal,
    publishedLabel,
    isTrending,
    isFresh,
    formattedCategory,
}) => {
    const safeCaption = insights.previewText || 'Untitled post';
    const hasSlug = Boolean(post?.slug);
    const showMoreLink = (safeCaption.endsWith('…') || safeCaption.endsWith('...')) && hasSlug;

    return (
        <div className="px-3 pb-3 text-sm text-gray-800 dark:text-gray-200">
            <div className="flex flex-col gap-3">
                <div>
                    <h3 className="text-base font-semibold leading-snug text-gray-900 transition-colors hover:text-professional-blue-500 dark:text-gray-100 dark:hover:text-professional-blue-300">
                        {hasSlug ? (
                            <Link to={`/post/${post.slug}`}>
                                {post.title}
                            </Link>
                        ) : (
                            post.title
                        )}
                    </h3>
                    <p className="mt-1 text-[13px] uppercase tracking-wider text-gray-500 dark:text-gray-400">
                        Published {publishedLabel}
                    </p>
                </div>

                <CardInsightPanel
                    readingMinutes={insights.readingMinutes}
                    readingLabel={insights.readingLabel}
                    wordCount={insights.wordCount}
                    likeTotal={likeTotal}
                    isTrending={isTrending}
                    isFresh={isFresh}
                    formattedCategory={formattedCategory}
                />

                <div className="rounded-xl border border-gray-200/70 bg-white/70 px-4 py-3 text-[15px] leading-relaxed text-gray-700 shadow-sm transition-all hover:border-professional-blue-300/60 hover:shadow-md group-hover:bg-white/75 dark:border-slate-700/70 dark:bg-slate-900/60 dark:text-gray-300 dark:group-hover:bg-slate-900/70">
                    <p className="line-clamp-4">{safeCaption}</p>
                    {showMoreLink ? (
                        <Link
                            to={`/post/${post.slug}`}
                            className="group mt-3 inline-flex items-center gap-2 text-sm font-semibold text-professional-blue-600 transition-colors hover:text-professional-blue-500 dark:text-professional-blue-300 dark:hover:text-professional-blue-200"
                        >
                            Continue reading
                            <FaExternalLinkAlt className="text-xs transition-transform group-hover:translate-x-1" aria-hidden />
                        </Link>
                    ) : (
                        <span className="mt-3 block text-xs font-medium uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500">
                            End of preview
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">
                    <span className="inline-flex items-center gap-2">
                        <FaUserCircle aria-hidden className="text-base" />
                        {authorUsername}
                    </span>
                    <span className="inline-flex items-center gap-2">
                        <FaBookOpen aria-hidden className="text-base" />
                        {insights.readingMinutes > 0 ? `${insights.readingMinutes} min journey` : 'Skim friendly'}
                    </span>
                </div>
            </div>
        </div>
    );
};
CardBody.propTypes = {
    post: PropTypes.object.isRequired,
    authorUsername: PropTypes.string,
    insights: PropTypes.shape({
        previewText: PropTypes.string.isRequired,
        wordCount: PropTypes.number.isRequired,
        readingMinutes: PropTypes.number.isRequired,
        readingLabel: PropTypes.string.isRequired,
    }).isRequired,
    likeTotal: PropTypes.number.isRequired,
    publishedLabel: PropTypes.string.isRequired,
    isTrending: PropTypes.bool.isRequired,
    isFresh: PropTypes.bool.isRequired,
    formattedCategory: PropTypes.string.isRequired,
};

CardBody.defaultProps = {
    authorUsername: '...'
};



// --- Main PostCard Component ---
export default function PostCard({ post }) {
    const { currentUser } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const { user: author } = useUser(post.userId);

    const [showLikeHeart, setShowLikeHeart] = useState(false);
    const hasShareTarget = Boolean(post?.slug);
    const [shareTooltip, setShareTooltip] = useState(hasShareTarget ? 'Share' : 'Link unavailable');
    const shareResetTimeoutRef = useRef(null);

    const navigationTimeoutRef = useRef(null);

    useEffect(() => {
        return () => {
            if (shareResetTimeoutRef.current) {
                clearTimeout(shareResetTimeoutRef.current);
            }
            if (navigationTimeoutRef.current) {
                clearTimeout(navigationTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setShareTooltip(post?.slug ? 'Share' : 'Link unavailable');
    }, [post?.slug]);

    const postSlug = post?.slug ?? null;
    const shareResetLabel = postSlug ? 'Share' : 'Link unavailable';

    const scheduleShareTooltipReset = useCallback(() => {
        if (shareResetTimeoutRef.current) {
            clearTimeout(shareResetTimeoutRef.current);
        }
        shareResetTimeoutRef.current = setTimeout(() => setShareTooltip(shareResetLabel), 2000);
    }, [shareResetLabel]);

    const updateShareTooltip = useCallback((message) => {
        setShareTooltip(message);
        scheduleShareTooltipReset();
    }, [scheduleShareTooltipReset]);

    const copyToClipboard = useCallback(async (text) => {
        if (!text) return false;
        try {
            if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(text);
                return true;
            }
        } catch (error) {
            console.warn('Async clipboard copy failed, falling back to execCommand.', error);
        }

        if (typeof document === 'undefined') return false;

        try {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.setAttribute('readonly', '');
            textArea.style.position = 'absolute';
            textArea.style.left = '-9999px';
            document.body.appendChild(textArea);
            textArea.select();
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            return successful;
        } catch (error) {
            console.error('Clipboard copy via execCommand failed:', error);
            return false;
        }
    }, []);

    const postId = post?._id;
    const canInteractWithPost = Boolean(postId);
    const { likeCount, isLiked, isLoading: isLikeLoading, handleLike } = useLike({
        postId,
        initialClaps: post?.claps ?? 0,
        initialClappedBy: post?.clappedBy ?? [],
    });
    const { isBookmarked, isLoading: isBookmarkLoading, handleBookmark } = useBookmark(post.bookmarkedBy?.includes(currentUser?._id), postId);

    const handleActionClick = useCallback((e, actionHandler) => {
        e.preventDefault();
        e.stopPropagation();
        if (!canInteractWithPost) { return; }
        if (!currentUser) { navigate('/sign-in'); return; }
        actionHandler();
    }, [canInteractWithPost, currentUser, navigate]);

    const handleCardClick = useCallback((event) => {
        if (event?.defaultPrevented) return;

        const interactiveElement = event?.target?.closest('button, a, input, textarea, select, label');
        if (interactiveElement) return;

        if (!postSlug) return;

        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
        }

        navigationTimeoutRef.current = setTimeout(() => {
            navigationTimeoutRef.current = null;
            if (postSlug) {
                navigate(`/post/${postSlug}`);
            }
        }, 180);
    }, [navigate, postSlug]);

    const handleMediaDoubleClick = useCallback((e) => {
        e.preventDefault();
        e.stopPropagation();

        if (navigationTimeoutRef.current) {
            clearTimeout(navigationTimeoutRef.current);
            navigationTimeoutRef.current = null;
        }

        if (!canInteractWithPost) { return; }
        if (!currentUser) { navigate('/sign-in'); return; }
        if (!isLiked) { // Only trigger like action, not unlike
            handleLike();
            setShowLikeHeart(true);
            setTimeout(() => setShowLikeHeart(false), 800);
        }
    }, [canInteractWithPost, currentUser, handleLike, isLiked, navigate]);

    const shareUrl = useMemo(() => {
        if (!postSlug || typeof window === 'undefined') {
            return '';
        }
        return `${window.location.origin}/post/${postSlug}`;
    }, [postSlug]);

    const shareData = useMemo(() => ({
        title: post.title,
        text: post.title,
        url: shareUrl,
    }), [post.title, shareUrl]);

    const handleShareClick = useCallback(async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!postSlug || !shareData.url) {
            updateShareTooltip('Link unavailable');
            return;
        }

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share(shareData);
                updateShareTooltip('Shared!');
                return;
            } catch (error) {
                if (error?.name === 'AbortError') {
                    // User cancelled the native share sheet; keep tooltip as-is.
                    return;
                }
                console.warn('Native share failed; falling back to clipboard copy.', error);
            }
        }

        const copied = await copyToClipboard(shareData.url);
        updateShareTooltip(copied ? 'Link copied!' : 'Copy failed');
    }, [copyToClipboard, shareData, postSlug, updateShareTooltip]);

    const insights = useMemo(
        () => buildPostInsights(post.content, post.title),
        [post.content, post.title],
    );
    const likeTotal = useMemo(() => (Number.isFinite(likeCount) ? likeCount : 0), [likeCount]);
    const isTrending = useMemo(() => likeTotal >= 50, [likeTotal]);
    const createdAtValue = post?.createdAt ?? null;
    const publishedLabel = useMemo(
        () => formatRelativeTimeFromNow(createdAtValue),
        [createdAtValue],
    );
    const isFresh = useMemo(
        () => isWithinPastHours(createdAtValue, 48),
        [createdAtValue],
    );
    const formattedCategory = useMemo(
        () => formatCategory(post?.category),
        [post?.category],
    );

    return (
        <motion.div
            layoutId={`post-card-${post.slug || post._id || 'unknown'}`}
            className='group relative rounded-2xl p-[1px] bg-gradient-to-br from-professional-blue-500/20 via-indigo-500/10 to-rose-500/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl'
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
        >
            <div
                onClick={handleCardClick}
                className='w-full rounded-2xl border border-gray-200/60 dark:border-slate-700/60 bg-white/80 dark:bg-slate-900/50 backdrop-blur shadow-md flex flex-col overflow-hidden'
            >
                <CardHeader
                    userId={post.userId}
                    fallbackUsername={post?.authorName || post?.username || post?.author}
                    category={post?.category}
                    kind={post?.kind}
                />

                <CardMedia
                    post={post}
                    onDoubleClick={canInteractWithPost ? handleMediaDoubleClick : undefined}
                    showLikeHeart={showLikeHeart}
                    // Overlay quick actions
                    onLikeClick={(e) => !isLikeLoading && handleActionClick(e, handleLike)}
                    onBookmarkClick={(e) => !isBookmarkLoading && handleActionClick(e, handleBookmark)}
                    onShareClick={handleShareClick}
                    isLiked={isLiked}
                    isBookmarked={isBookmarked}
                    disableLikes={!canInteractWithPost || isLikeLoading}
                    disableBookmarks={!canInteractWithPost || isBookmarkLoading}
                    disableShare={!post?.slug}
                    // Badges
                    readingLabel={insights.readingMinutes > 0 ? insights.readingLabel : undefined}
                    isTrending={isTrending}
                    isFresh={isFresh}
                />

                <CardActions
                    likeProps={{ isLiked, isLoading: isLikeLoading, handleLike }}
                    bookmarkProps={{ isBookmarked, isLoading: isBookmarkLoading, handleBookmark }}
                    onActionClick={handleActionClick}
                    onShareClick={handleShareClick}
                    shareTooltip={shareTooltip}
                    disableLikes={!canInteractWithPost}
                    disableBookmarks={!canInteractWithPost}
                    disableShare={!post?.slug}
                />

                <CardBody
                    post={post}
                    authorUsername={author?.username || '...'}
                    insights={insights}
                    likeTotal={likeTotal}
                    publishedLabel={publishedLabel}
                    isTrending={isTrending}
                    isFresh={isFresh}
                    formattedCategory={formattedCategory}
                />
            </div>
        </motion.div>
    );
}

PostCard.propTypes = {
    post: PropTypes.shape({
        _id: PropTypes.string,
        userId: PropTypes.string,
        slug: PropTypes.string,
        title: PropTypes.string,
        createdAt: PropTypes.string,
        content: PropTypes.string,
        claps: PropTypes.number,
        clappedBy: PropTypes.arrayOf(PropTypes.string),
        bookmarkedBy: PropTypes.arrayOf(PropTypes.string),
        mediaUrl: PropTypes.string,
        image: PropTypes.string,
        mediaType: PropTypes.oneOf(['image', 'video', 'audio', 'document']),
        mediaAssets: PropTypes.arrayOf(
            PropTypes.shape({
                url: PropTypes.string.isRequired,
                type: PropTypes.oneOf(['image', 'video', 'audio', 'document']),
                caption: PropTypes.string,
                order: PropTypes.number,
            })
        ),
        coverAssetIndex: PropTypes.number,
        authorName: PropTypes.string,
        username: PropTypes.string,
        author: PropTypes.string,
    }).isRequired,
};
