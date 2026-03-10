import { useMemo } from 'react';
import DOMPurify from 'dompurify';
import { HiOutlineEye, HiOutlineTag } from 'react-icons/hi2';

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const formatCategoryLabel = (category = 'uncategorized') =>
    category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

const sanitizeWithEmbeds = (html = '') => {
    if (!html) {
        return '';
    }

    const clean = DOMPurify.sanitize(html, {
        ADD_TAGS: ['iframe'],
        ADD_ATTR: [
            'allow',
            'allowfullscreen',
            'frameborder',
            'height',
            'loading',
            'referrerpolicy',
            'src',
            'title',
            'width',
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
    const previewTitle = post?.title?.trim() || 'Untitled post';
    const hasBody = stripHtml(sanitizedContent).length > 0;
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

                {post?.mediaUrl ? (
                    <div className='overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800'>
                        {post.mediaType === 'video' ? (
                            <video
                                src={post.mediaUrl}
                                controls
                                className='h-64 w-full object-cover'
                            />
                        ) : (
                            <img
                                src={post.mediaUrl}
                                alt={previewTitle}
                                className='h-64 w-full object-cover'
                            />
                        )}
                    </div>
                ) : null}

                {hasBody ? (
                    <div
                        className='post-content tiptap w-full text-left text-slate-700 dark:text-slate-200'
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />
                ) : (
                    <div className='rounded-2xl border border-dashed border-slate-200 bg-white/80 px-4 py-6 text-sm leading-7 text-slate-500 dark:border-slate-800 dark:bg-slate-950/40 dark:text-slate-400'>
                        {emptyMessage}
                    </div>
                )}
            </div>
        </div>
    );
}
