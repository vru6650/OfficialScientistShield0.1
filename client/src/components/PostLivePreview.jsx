import { useMemo } from 'react';
import parse from 'html-react-parser';
import DOMPurify from 'dompurify';
import { HiOutlineEye, HiOutlineTag } from 'react-icons/hi2';
import EmbeddedSnippetPreview from './EmbeddedSnippetPreview';
import LottieAnimationPlayer from './LottieAnimationPlayer.jsx';
import GalleryCarousel from './media/GalleryCarousel.jsx';
import {
    getPostIllustrationGalleryItems,
    getPrimaryPostAsset,
    getSortedPostMediaAssets,
} from '../utils/postMedia.js';

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
const EMBED_CONTENT_SELECTOR =
    'img,iframe,video,audio,pre,table,blockquote,hr,[data-snippet-id],[data-lottie-src]';

const formatCategoryLabel = (category = 'uncategorized') =>
    category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

const hasRenderableBodyContent = (html = '') => {
    if (!html) {
        return false;
    }

    if (stripHtml(html).length > 0) {
        return true;
    }

    if (typeof document === 'undefined') {
        return (
            /<(img|iframe|video|audio|pre|table|blockquote|hr)\b/i.test(html)
            || html.includes('data-snippet-id=')
            || html.includes('data-lottie-src=')
        );
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = html;
    return Boolean(wrapper.querySelector(EMBED_CONTENT_SELECTOR));
};

const sanitizeWithEmbeds = (html = '') => {
    if (!html) {
        return '';
    }

    const clean = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: [
            'allow',
            'allowfullscreen',
            'data-snippet-id',
            'frameborder',
            'height',
            'loading',
            'referrerpolicy',
            'src',
            'title',
            'width',
            'data-lottie-autoplay',
            'data-lottie-loop',
            'data-lottie-src',
        ],
    });

    if (typeof document === 'undefined') {
        return clean;
    }

    const wrapper = document.createElement('div');
    wrapper.innerHTML = clean;

    const allowedEmbedHosts =
        /^(https?:)?\/\/(www\.)?(youtube\.com|youtube-nocookie\.com|youtu\.be|player\.vimeo\.com)\//i;

    wrapper.querySelectorAll('iframe').forEach((frame) => {
        const src = frame.getAttribute('src') || '';

        if (!allowedEmbedHosts.test(src)) {
            frame.remove();
            return;
        }

        frame.setAttribute('loading', 'lazy');
        frame.setAttribute('allowfullscreen', '');
        frame.setAttribute(
            'referrerpolicy',
            frame.getAttribute('referrerpolicy') || 'strict-origin-when-cross-origin'
        );

        if (!frame.getAttribute('allow')) {
            frame.setAttribute(
                'allow',
                'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
            );
        }

        if (!frame.getAttribute('title')) {
            frame.setAttribute('title', 'Embedded video');
        }
    });

    return wrapper.innerHTML;
};

const renderFeaturedMedia = (asset, fallbackTitle) => {
    if (!asset) {
        return null;
    }

    if (asset.type === 'video') {
        return (
            <video
                src={asset.url}
                controls
                className='h-64 w-full object-cover'
            />
        );
    }

    if (asset.type === 'audio') {
        return (
            <div className='space-y-3 bg-slate-950/95 p-5 text-slate-100'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-300'>
                    Audio
                </p>
                <audio src={asset.url} controls className='w-full' />
                {asset.caption ? (
                    <p className='text-sm text-slate-300'>{asset.caption}</p>
                ) : null}
            </div>
        );
    }

    if (asset.type === 'document') {
        return (
            <div className='space-y-3 bg-slate-950/95 p-5 text-slate-100'>
                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-300'>
                    Document
                </p>
                <p className='text-sm text-slate-200'>
                    {asset.caption || fallbackTitle || 'Attached document'}
                </p>
                <a
                    href={asset.url}
                    target='_blank'
                    rel='noreferrer'
                    className='inline-flex rounded-full border border-white/15 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-100 transition hover:bg-white/10'
                >
                    Open document
                </a>
            </div>
        );
    }

    return (
        <img
            src={asset.url}
            alt={asset.caption || fallbackTitle}
            className='h-64 w-full object-cover'
        />
    );
};

export default function PostLivePreview({
    post,
    readTime = 0,
    wordCount = 0,
    eyebrow = 'Live preview',
    emptyMessage = 'Your story preview will appear here as you edit.',
    className = '',
}) {
    const sanitizedContent = useMemo(
        () => sanitizeWithEmbeds(post?.content || ''),
        [post?.content]
    );
    const parserOptions = useMemo(
        () => ({
            replace: (domNode) => {
                if (
                    domNode.type === 'tag' &&
                    domNode.name === 'div' &&
                    domNode.attribs?.['data-snippet-id']
                ) {
                    return (
                        <EmbeddedSnippetPreview
                            snippetId={domNode.attribs['data-snippet-id']}
                            className='my-6'
                        />
                    );
                }

                if (
                    domNode.type === 'tag' &&
                    domNode.name === 'div' &&
                    domNode.attribs?.['data-lottie-src']
                ) {
                    return (
                        <LottieAnimationPlayer
                            src={domNode.attribs['data-lottie-src']}
                            autoplay={domNode.attribs['data-lottie-autoplay'] !== 'false'}
                            loop={domNode.attribs['data-lottie-loop'] !== 'false'}
                            className='my-6'
                        />
                    );
                }

                return undefined;
            },
        }),
        []
    );
    const parsedContent = useMemo(
        () => parse(sanitizedContent, parserOptions),
        [parserOptions, sanitizedContent]
    );
    const previewTitle = post?.title?.trim() || 'Untitled post';
    const primaryAsset = useMemo(() => getPrimaryPostAsset(post), [post]);
    const galleryItems = useMemo(() => getSortedPostMediaAssets(post), [post]);
    const illustrationItems = useMemo(
        () => getPostIllustrationGalleryItems(post),
        [post]
    );
    const hasBody = useMemo(
        () => hasRenderableBodyContent(sanitizedContent),
        [sanitizedContent]
    );
    const categoryLabel = formatCategoryLabel(post?.category || 'uncategorized');

    return (
        <div
            className={`relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900 ${className}`.trim()}
        >
            <div
                className='absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.16),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.16),transparent_28%)]'
                aria-hidden
            />

            <div className='relative space-y-4 p-5 sm:p-6'>
                <div className='flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>
                    <span className='inline-flex items-center gap-2 rounded-full bg-sky-100 px-3 py-1 text-sky-700 shadow-sm ring-1 ring-sky-200 dark:bg-sky-900/50 dark:text-sky-100'>
                        <HiOutlineTag className='h-4 w-4' />
                        {categoryLabel}
                    </span>
                    {readTime ? (
                        <span className='rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 shadow-sm ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200'>
                            {readTime} min read
                        </span>
                    ) : (
                        <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-600 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200'>
                            Preview
                        </span>
                    )}
                    {wordCount > 0 ? (
                        <span className='rounded-full bg-amber-100 px-3 py-1 text-amber-700 shadow-sm ring-1 ring-amber-200 dark:bg-amber-900/40 dark:text-amber-200'>
                            {wordCount} words
                        </span>
                    ) : null}
                </div>

                <div className='space-y-2'>
                    <div className='flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                        <HiOutlineEye className='h-4 w-4 text-sky-500' />
                        {eyebrow}
                    </div>
                    <h2 className='text-2xl font-semibold text-slate-900 dark:text-white'>
                        {previewTitle}
                    </h2>
                    {post?.slug ? (
                        <p className='text-xs font-medium uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500'>
                            /{post.slug}
                        </p>
                    ) : null}
                </div>

                {primaryAsset ? (
                    <div className='space-y-3'>
                        <div className='overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800'>
                            {renderFeaturedMedia(primaryAsset, previewTitle)}
                        </div>
                        {galleryItems.length > 1 ? (
                            <div className='rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                                <div className='mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200'>
                                    <span>Media gallery</span>
                                    <span className='text-xs text-slate-500 dark:text-slate-400'>
                                        {galleryItems.length} items
                                    </span>
                                </div>
                                <GalleryCarousel
                                    items={galleryItems}
                                    initialIndex={Number.isInteger(post?.coverAssetIndex) ? post.coverAssetIndex : 0}
                                />
                            </div>
                        ) : null}
                    </div>
                ) : null}

                {hasBody ? (
                    <div className='post-content tiptap w-full text-left text-slate-700 dark:text-slate-200'>
                        {parsedContent}
                    </div>
                ) : (
                    <div className='rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'>
                        {emptyMessage}
                    </div>
                )}

                {illustrationItems.length ? (
                    <section className='rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                        <div className='mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-slate-700 dark:text-slate-200'>
                            <span>Illustrations</span>
                            <span className='text-xs text-slate-500 dark:text-slate-400'>
                                {illustrationItems.length} frames
                            </span>
                        </div>
                        <GalleryCarousel items={illustrationItems} />
                    </section>
                ) : null}
            </div>
        </div>
    );
}
