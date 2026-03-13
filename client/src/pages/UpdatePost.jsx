import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
    Alert,
    Badge,
    Button,
    Select,
    Spinner,
    TextInput,
    Tooltip,
} from 'flowbite-react';
import {
    HiOutlineArrowPathRoundedSquare,
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineRocketLaunch,
    HiOutlineSparkles,
    HiOutlineSwatch,
} from 'react-icons/hi2';
import PostIllustrationStudio from '../components/PostIllustrationStudio';
import PostMediaStudio from '../components/PostMediaStudio';
import PostLivePreview from '../components/PostLivePreview';
import TiptapEditor from '../components/TiptapEditor';
import { ARTICLE_POST_CATEGORY_OPTIONS } from '../constants/postCategories.js';
import '../Tiptap.css';
import { getPost, updatePost } from '../services/postService';
import {
    coercePostIllustrationState,
    coercePostMediaState,
} from '../utils/postMedia.js';

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ');
const INITIAL_STUDIO_STATUS = Object.freeze({
    isUploading: false,
    hasPendingFile: false,
    error: null,
});

const generateSlug = (title) => {
    if (!title) return '';
    return title
        .toLowerCase()
        .trim()
        .replace(/[\s]+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-');
};

const formatCategoryLabel = (category = 'uncategorized') =>
    category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

export default function UpdatePost() {
    const { postId } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({});
    const debounceTimeout = useRef(null);
    const latestContentRef = useRef(undefined);
    const [mediaStudioKey, setMediaStudioKey] = useState(0);
    const [illustrationStudioKey, setIllustrationStudioKey] = useState(0);
    const [mediaStudioStatus, setMediaStudioStatus] = useState({
        ...INITIAL_STUDIO_STATUS,
    });
    const [illustrationStudioStatus, setIllustrationStudioStatus] = useState({
        ...INITIAL_STUDIO_STATUS,
    });
    const [submitError, setSubmitError] = useState(null);

    const { data: initialPost, isLoading } = useQuery({
        queryKey: ['post', postId],
        queryFn: () => getPost(postId),
        enabled: !!postId,
    });

    useEffect(() => {
        if (initialPost) {
            setFormData({
                ...initialPost,
                ...coercePostMediaState(initialPost),
                ...coercePostIllustrationState(initialPost),
            });
            latestContentRef.current = initialPost.content || '';
        }
    }, [initialPost]);

    useEffect(() => () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
        }
    }, []);

    const legacyPosterImage = useMemo(() => {
        if (!initialPost?.image) {
            return null;
        }

        const hasImageAsset = Array.isArray(initialPost.mediaAssets)
            && initialPost.mediaAssets.some((asset) => asset?.type === 'image');

        return hasImageAsset ? null : initialPost.image;
    }, [initialPost]);

    const updateMutation = useMutation({
        mutationFn: ({ formData: nextFormData = formData, ...variables }) =>
            updatePost({ ...variables, formData: nextFormData }),
        onSuccess: (data) => navigate(`/post/${data.slug}`),
    });
    const categoryOptions = useMemo(() => {
        const currentCategory = formData?.category?.trim();

        if (
            !currentCategory
            || ARTICLE_POST_CATEGORY_OPTIONS.some((option) => option.value === currentCategory)
        ) {
            return ARTICLE_POST_CATEGORY_OPTIONS;
        }

        return [
            ...ARTICLE_POST_CATEGORY_OPTIONS,
            {
                value: currentCategory,
                label: formatCategoryLabel(currentCategory),
            },
        ];
    }, [formData?.category]);
    const hasActiveUpload = mediaStudioStatus.isUploading || illustrationStudioStatus.isUploading;
    const hasPendingAssetSelection =
        mediaStudioStatus.hasPendingFile || illustrationStudioStatus.hasPendingFile;

    const wordCount = useMemo(() => {
        const text = stripHtml(formData?.content || '').trim();
        if (!text) return 0;
        return text.split(/\s+/).length;
    }, [formData?.content]);

    const readTime = useMemo(() => (wordCount ? Math.max(1, Math.ceil(wordCount / 180)) : 0), [wordCount]);

    const readiness = useMemo(() => {
        const parts = [
            formData?.title?.trim() ? 1 : 0,
            stripHtml(formData?.content || '').trim() ? 1 : 0,
            formData?.category && formData.category !== 'uncategorized' ? 1 : 0,
            formData?.mediaUrl ? 1 : 0,
        ];
        return Math.round((parts.reduce((acc, val) => acc + val, 0) / parts.length) * 100);
    }, [formData?.category, formData?.content, formData?.mediaUrl, formData?.title]);

    const handleContentChange = (content) => {
        setSubmitError(null);
        latestContentRef.current = content;
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        debounceTimeout.current = setTimeout(() => {
            setFormData((prev) => ({ ...prev, content }));
        }, 400);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitError(null);

        if (hasActiveUpload) {
            setSubmitError('Wait for all asset uploads to finish before updating the post.');
            return;
        }

        if (hasPendingAssetSelection) {
            setSubmitError('Upload or clear every selected asset before updating the post.');
            return;
        }

        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
        const nextFormData = {
            ...formData,
            content: latestContentRef.current ?? formData.content ?? '',
        };
        setFormData(nextFormData);

        updateMutation.mutate({
            postId: formData._id,
            userId: formData.userId,
            formData: nextFormData,
        });
    };

    const handleRevert = () => {
        if (debounceTimeout.current) {
            clearTimeout(debounceTimeout.current);
            debounceTimeout.current = null;
        }

        if (initialPost) {
            setFormData({
                ...initialPost,
                ...coercePostMediaState(initialPost),
                ...coercePostIllustrationState(initialPost),
            });
            latestContentRef.current = initialPost.content || '';
            setMediaStudioKey((currentKey) => currentKey + 1);
            setIllustrationStudioKey((currentKey) => currentKey + 1);
            setMediaStudioStatus({ ...INITIAL_STUDIO_STATUS });
            setIllustrationStudioStatus({ ...INITIAL_STUDIO_STATUS });
            setSubmitError(null);
        }
    };

    if (isLoading) {
        return (
            <div className='flex min-h-screen items-center justify-center'>
                <Spinner size='xl' />
            </div>
        );
    }

    return (
        <div className='relative min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(56,189,248,0.14),transparent_28%),radial-gradient(circle_at_80%_0%,rgba(129,140,248,0.14),transparent_28%)]' aria-hidden />

            <div className='relative mx-auto max-w-6xl px-4 py-10 lg:px-6'>
                <header className='overflow-hidden rounded-3xl border border-white/60 bg-white/90 px-6 py-5 shadow-[0_24px_80px_-60px_rgba(15,23,42,0.8)] backdrop-blur dark:border-slate-800/70 dark:bg-slate-900/85'>
                    <div className='relative flex flex-wrap items-center justify-between gap-3'>
                        <div className='space-y-1'>
                            <p className='text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-300'>Post studio</p>
                            <h1 className='text-3xl font-semibold text-slate-900 dark:text-white sm:text-4xl'>Refresh your post</h1>
                            <p className='text-sm text-slate-600 dark:text-slate-300'>Polish the story, tune the slug, and preview changes before shipping.</p>
                        </div>
                        <div className='flex flex-wrap items-center gap-2'>
                            <Badge color='info' className='bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/50 dark:text-sky-100'>
                                {readTime ? `${readTime} min read` : 'Drafting'}
                            </Badge>
                            <Badge color='gray' className='bg-slate-100 text-slate-700 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-200'>
                                {wordCount.toLocaleString()} words
                            </Badge>
                            <Badge color='success' className='bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200'>
                                {readiness}% ready
                            </Badge>
                            {formData?.slug && (
                                <Tooltip content='Open current live post'>
                                    <Button color='light' size='sm' onClick={() => navigate(`/post/${formData.slug}`)} className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'>
                                        <HiOutlineEye className='h-5 w-5' />
                                    </Button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                </header>

                <div className='mt-6 grid gap-6 lg:grid-cols-[1.6fr,1fr]'>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Step 1</p>
                                    <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Title & taxonomy</h2>
                                    <p className='text-sm text-slate-600 dark:text-slate-300'>Craft a headline, tune the slug, and keep the category aligned.</p>
                                </div>
                                <Button
                                    color='light'
                                    type='button'
                                    onClick={() => setFormData((prev) => ({ ...prev, slug: generateSlug(prev.title) }))}
                                    className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                >
                                    <div className='flex items-center gap-2'>
                                        <HiOutlineArrowPathRoundedSquare className='h-5 w-5 text-sky-500' />
                                        Refresh slug
                                    </div>
                                </Button>
                            </div>
                            <div className='mt-4 space-y-4'>
                                <TextInput
                                    type='text'
                                    placeholder='An irresistible headline'
                                    required
                                    id='title'
                                    value={formData.title || ''}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value, slug: generateSlug(e.target.value) })}
                                    color={formData.title ? 'success' : undefined}
                                />
                                <div className='grid gap-3 sm:grid-cols-2'>
                                    <TextInput
                                        id='slug'
                                        type='text'
                                        placeholder='post-slug'
                                        value={formData.slug || ''}
                                        onChange={(e) => setFormData({ ...formData, slug: generateSlug(e.target.value) })}
                                    />
                                    <Select
                                        value={formData.category || 'uncategorized'}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    >
                                        {categoryOptions.map((option) => (
                                            <option key={option.value} value={option.value}>
                                                {option.label}
                                            </option>
                                        ))}
                                    </Select>
                                </div>
                                <div className='rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'>
                                    <div className='flex flex-wrap items-center gap-3'>
                                        <HiOutlineSparkles className='h-5 w-5 text-amber-500' />
                                        <div>
                                            <p className='font-semibold text-slate-900 dark:text-white'>Keep it scannable</p>
                                            <p>Short slugs, a clear category, and a lead image help readers trust the update.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Step 2</p>
                                    <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Multimedia</h2>
                                    <p className='text-sm text-slate-600 dark:text-slate-300'>Upgrade the post with a richer media stack, then choose which asset leads the story.</p>
                                </div>
                                <Badge color='info'>
                                    {(formData.mediaAssets?.length || 0)} attached
                                </Badge>
                            </div>

                            <div className='mt-4'>
                                <PostMediaStudio
                                    key={mediaStudioKey}
                                    value={formData}
                                    title={formData.title}
                                    legacyPosterImage={legacyPosterImage}
                                    onChange={(mediaState) => {
                                        setSubmitError(null);
                                        setFormData((currentFormData) => ({
                                            ...currentFormData,
                                            ...mediaState,
                                        }));
                                    }}
                                    onStatusChange={setMediaStudioStatus}
                                    heading='Refine the post media reel'
                                    copy='Swap in sharper assets, preserve supporting files, and control which item becomes the hero on the published post.'
                                />
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Step 3</p>
                                    <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Illustrations</h2>
                                    <p className='text-sm text-slate-600 dark:text-slate-300'>Attach diagrams, concept art, or supporting frames with captions, alt text, and credits.</p>
                                </div>
                                <Badge color='info'>
                                    {(formData.illustrations?.length || 0)} staged
                                </Badge>
                            </div>

                            <div className='mt-4'>
                                <PostIllustrationStudio
                                    key={illustrationStudioKey}
                                    value={formData}
                                    title={formData.title}
                                    onChange={(illustrationState) => {
                                        setSubmitError(null);
                                        setFormData((currentFormData) => ({
                                            ...currentFormData,
                                            ...illustrationState,
                                        }));
                                    }}
                                    onStatusChange={setIllustrationStudioStatus}
                                    heading='Refine the illustration board'
                                    copy='Keep the visual sequence ordered and readable. Alt text, captions, and credits stay attached to each frame.'
                                />
                            </div>
                        </div>

                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Step 4</p>
                                    <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Body</h2>
                                    <p className='text-sm text-slate-600 dark:text-slate-300'>Update the content with inline formatting, embeds, and code blocks.</p>
                                </div>
                                <div className='inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200'>
                                    <HiOutlineDocumentText className='h-4 w-4 text-sky-500' />
                                    {wordCount ? `${wordCount.toLocaleString()} words` : 'Start writing'}
                                </div>
                            </div>

                            <div className='mt-3 rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner dark:border-slate-800 dark:bg-slate-900/80'>
                                <TiptapEditor
                                    content={formData.content || ''}
                                    onChange={handleContentChange}
                                    placeholder='Sketch the change, clarify the why, and highlight the outcome...'
                                    enableLottieEmbeds
                                />
                            </div>
                        </div>

                        <div className='flex flex-wrap items-center gap-3'>
                            <Button
                                color='light'
                                type='button'
                                onClick={handleRevert}
                                className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            >
                                Revert to loaded
                            </Button>
                            <div className='ml-auto flex items-center gap-3'>
                                <Button
                                    color='light'
                                    type='button'
                                    onClick={() => navigate(-1)}
                                    className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type='submit'
                                    disabled={updateMutation.isPending || hasActiveUpload}
                                    className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                >
                                    {updateMutation.isPending ? (
                                        <div className='flex items-center gap-2'>
                                            <Spinner size='sm' />
                                            <span>Updating…</span>
                                        </div>
                                    ) : (
                                        'Update post'
                                    )}
                                </Button>
                            </div>
                        </div>

                        {(submitError || updateMutation.isError) && (
                            <Alert className='mt-2' color='failure'>
                                {submitError || updateMutation.error.message}
                            </Alert>
                        )}
                    </form>

                    <aside className='space-y-4'>
                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-5 shadow-lg shadow-slate-200/60 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80 dark:shadow-slate-900/60'>
                            <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                <HiOutlineCheckCircle className='h-5 w-5 text-emerald-500' />
                                Health snapshot
                            </div>
                            <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>A quick pulse on the post before you ship the refresh.</p>
                            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                                <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-semibold'>Word count</span>
                                        <HiOutlineSwatch className='h-5 w-5 text-sky-500' />
                                    </div>
                                    <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>{wordCount}</p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Aim for clarity, not filler.</p>
                                </div>
                                <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-semibold'>Read time</span>
                                        <HiOutlineRocketLaunch className='h-5 w-5 text-emerald-500' />
                                    </div>
                                    <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>
                                        {readTime ? `${readTime} min` : '--'}
                                    </p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Keeps readers' attention span in check.</p>
                                </div>
                            </div>
                            <div className='mt-4'>
                                <div className='flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300'>
                                    <span>Readiness</span>
                                    <span>{readiness}%</span>
                                </div>
                                <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-cyan-500 transition-all duration-500'
                                        style={{ width: `${readiness}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <PostLivePreview
                            post={{
                                ...formData,
                                createdAt: formData.createdAt || new Date().toISOString(),
                            }}
                            readTime={readTime}
                            wordCount={wordCount}
                        />
                    </aside>
                </div>
            </div>
        </div>
    );
}
