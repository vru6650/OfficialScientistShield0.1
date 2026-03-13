import { useEffect, useMemo, useState } from 'react';
import {
    Alert,
    Badge,
    Button,
    Modal,
    Progress,
    Select,
    Spinner,
    TextInput,
} from 'flowbite-react';
import { useNavigate } from 'react-router-dom';
import {
    HiOutlineClipboardList,
    HiOutlineClock,
    HiOutlineExclamationCircle,
    HiOutlineLightningBolt,
    HiOutlineRefresh,
} from 'react-icons/hi';
import {
    HiOutlineCheckCircle,
    HiOutlineDocumentText,
    HiOutlineEye,
    HiOutlineRocketLaunch,
    HiOutlineSparkles,
    HiOutlineTag,
} from 'react-icons/hi2';

import FloatingPreviewWindow from '../components/FloatingPreviewWindow';
import PostIllustrationStudio from '../components/PostIllustrationStudio';
import PostLivePreview from '../components/PostLivePreview';
import PostMediaStudio from '../components/PostMediaStudio';
import TiptapEditor from '../components/TiptapEditor';
import { ARTICLE_POST_CATEGORY_OPTIONS } from '../constants/postCategories.js';
import { createPost as createPostRequest } from '../services/postService';
import {
    buildPostIllustrationFormState,
    buildPostMediaFormState,
    coercePostIllustrationState,
    coercePostMediaState,
} from '../utils/postMedia.js';
import '../Tiptap.css';

const DRAFT_KEY = 'postDraft';
const INITIAL_STUDIO_STATUS = Object.freeze({
    isUploading: false,
    hasPendingFile: false,
    error: null,
});

const initialForm = Object.freeze({
    title: '',
    slug: '',
    category: 'uncategorized',
    content: '',
    ...buildPostMediaFormState({ mediaAssets: [] }),
    ...buildPostIllustrationFormState({ illustrations: [] }),
});

const QUICK_STARTS = [
    {
        id: 'deep-dive',
        label: 'Deep dive',
        description: 'Lead with the thesis, break down the shift, and close with a sharp takeaway.',
        html: `
            <h2>Why this matters</h2>
            <p>Open with the core shift, tension, or insight that makes the topic matter right now.</p>
            <h2>What is changing</h2>
            <p>Break the story into the key details, evidence, or tradeoffs the reader needs.</p>
            <h2>Key takeaway</h2>
            <p>Close with the practical conclusion, implication, or next move.</p>
        `,
    },
    {
        id: 'walkthrough',
        label: 'Walkthrough',
        description: 'Frame the goal, sequence the process, and leave the reader with a checkpoint.',
        html: `
            <h2>Goal</h2>
            <p>Explain what the reader will achieve and what context they need before starting.</p>
            <h2>Steps</h2>
            <p>Move through the sequence in a clean, practical order.</p>
            <h2>Checkpoint</h2>
            <p>Highlight the signal that confirms the result is working.</p>
        `,
    },
    {
        id: 'launch-note',
        label: 'Launch note',
        description: 'Useful for updates, release notes, community announcements, and shipping logs.',
        html: `
            <h2>What is new</h2>
            <p>State the release, update, or announcement in direct language.</p>
            <h2>Why it matters</h2>
            <p>Explain the outcome or value for the reader or community.</p>
            <h2>What happens next</h2>
            <p>Give the next action, ask, or follow-up path.</p>
        `,
    },
];

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const countMatches = (value, pattern) => value.match(pattern)?.length || 0;

const generateSlug = (value = '') =>
    value
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]+/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

const formatCategoryLabel = (category = 'uncategorized') =>
    category
        .split(/[-_\s]+/)
        .filter(Boolean)
        .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
        .join(' ');

const mergeTemplateIntoContent = (currentContent, templateHtml) => {
    if (!stripHtml(currentContent)) {
        return templateHtml.trim();
    }

    return `${currentContent}<p></p>${templateHtml.trim()}`;
};

const normalizeDraftPayload = (rawDraft) => {
    if (!rawDraft) {
        return { ...initialForm };
    }

    if (typeof rawDraft === 'string') {
        return {
            ...initialForm,
            content: rawDraft,
        };
    }

    if (rawDraft?.formData && typeof rawDraft.formData === 'object') {
        return normalizeDraftPayload(rawDraft.formData);
    }

    const mediaState = coercePostMediaState(rawDraft);
    const illustrationState = coercePostIllustrationState(rawDraft);

    return {
        ...initialForm,
        ...rawDraft,
        ...mediaState,
        ...illustrationState,
        title: rawDraft.title?.toString() ?? '',
        slug: rawDraft.slug?.toString() ?? '',
        category: rawDraft.category?.toString() || 'uncategorized',
        content: rawDraft.content?.toString() ?? '',
    };
};

const getSavedDraft = () => {
    try {
        const rawDraft = localStorage.getItem(DRAFT_KEY);
        if (!rawDraft) {
            return { ...initialForm };
        }

        return normalizeDraftPayload(JSON.parse(rawDraft));
    } catch {
        return { ...initialForm };
    }
};

export default function CreatePost() {
    const navigate = useNavigate();
    const [form, setForm] = useState(() => ({ ...initialForm }));
    const [pendingDraft, setPendingDraft] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [draftResolved, setDraftResolved] = useState(false);
    const [draftStatus, setDraftStatus] = useState('idle');
    const [lastSavedAt, setLastSavedAt] = useState(null);
    const [lastAppliedTemplate, setLastAppliedTemplate] = useState('');
    const [publishError, setPublishError] = useState(null);
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPreviewWindow, setShowPreviewWindow] = useState(true);
    const [mediaStudioKey, setMediaStudioKey] = useState(0);
    const [illustrationStudioKey, setIllustrationStudioKey] = useState(0);
    const [mediaStudioStatus, setMediaStudioStatus] = useState({
        ...INITIAL_STUDIO_STATUS,
    });
    const [illustrationStudioStatus, setIllustrationStudioStatus] = useState({
        ...INITIAL_STUDIO_STATUS,
    });

    const resetAssetStudios = () => {
        setMediaStudioKey((currentKey) => currentKey + 1);
        setIllustrationStudioKey((currentKey) => currentKey + 1);
        setMediaStudioStatus({ ...INITIAL_STUDIO_STATUS });
        setIllustrationStudioStatus({ ...INITIAL_STUDIO_STATUS });
    };

    useEffect(() => {
        const savedDraft = getSavedDraft();
        const hasSavedDraft = Boolean(
            savedDraft.title.trim()
            || stripHtml(savedDraft.content)
            || savedDraft.mediaUrl
            || savedDraft.illustrations?.length
        );

        if (hasSavedDraft) {
            setPendingDraft(savedDraft);
            setShowModal(true);
            return;
        }

        setDraftResolved(true);
    }, []);

    useEffect(() => {
        if (!draftResolved) {
            return;
        }

        const hasDraftContent = Boolean(
            form.title.trim()
            || stripHtml(form.content)
            || form.mediaUrl
            || form.illustrations?.length
        );

        if (!hasDraftContent) {
            localStorage.removeItem(DRAFT_KEY);
            setDraftStatus('idle');
            setLastSavedAt(null);
            return;
        }

        setDraftStatus('saving');

        const saveTimer = window.setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(form));
            setLastSavedAt(new Date());
            setDraftStatus('saved');
        }, 500);

        return () => window.clearTimeout(saveTimer);
    }, [draftResolved, form]);

    const plainText = useMemo(() => stripHtml(form.content), [form.content]);

    const wordCount = useMemo(() => {
        if (!plainText) {
            return 0;
        }

        return plainText.split(/\s+/).length;
    }, [plainText]);

    const characterCount = plainText.length;
    const paragraphCount = useMemo(
        () => (countMatches(form.content, /<p(?=[\s>])/g) || (plainText ? 1 : 0)),
        [form.content, plainText]
    );
    const headingCount = useMemo(
        () => countMatches(form.content, /<h[1-6](?=[\s>])/g),
        [form.content]
    );
    const readTime = useMemo(
        () => (wordCount ? Math.max(1, Math.ceil(wordCount / 190)) : 0),
        [wordCount]
    );
    const titleLength = form.title.trim().length;
    const formattedCategory = useMemo(() => formatCategoryLabel(form.category), [form.category]);
    const mediaAssetCount = form.mediaAssets?.length || 0;
    const illustrationCount = form.illustrations?.length || 0;
    const hasActiveUpload = mediaStudioStatus.isUploading || illustrationStudioStatus.isUploading;
    const hasPendingAssetSelection =
        mediaStudioStatus.hasPendingFile || illustrationStudioStatus.hasPendingFile;

    const readiness = useMemo(() => {
        const checks = [
            form.title.trim() ? 1 : 0,
            plainText ? 1 : 0,
            form.slug.trim() ? 1 : 0,
            form.category !== 'uncategorized' ? 1 : 0,
            mediaAssetCount > 0 ? 1 : 0,
        ];

        return Math.round((checks.reduce((sum, value) => sum + value, 0) / checks.length) * 100);
    }, [form.category, form.slug, form.title, mediaAssetCount, plainText]);

    const excerpt = useMemo(() => {
        if (!plainText) {
            return 'Start with a clean opening paragraph. The first two or three lines usually become the shareable hook.';
        }

        return plainText.length > 180 ? `${plainText.slice(0, 180)}...` : plainText;
    }, [plainText]);

    const draftStatusLabel = useMemo(() => {
        if (!form.title.trim() && !plainText) {
            return 'Blank canvas';
        }

        if (draftStatus === 'saving') {
            return 'Saving draft...';
        }

        if (draftStatus === 'saved' && lastSavedAt) {
            return `Saved at ${lastSavedAt.toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
            })}`;
        }

        return 'Draft ready';
    }, [draftStatus, form.title, lastSavedAt, plainText]);

    const headlineSignal = useMemo(() => {
        if (!titleLength) {
            return {
                label: 'Needs a headline',
                toneClass: 'text-slate-500 dark:text-slate-400',
                helper: 'Write the promise first so the rest of the post has direction.',
            };
        }

        if (titleLength < 34) {
            return {
                label: 'Could be punchier',
                toneClass: 'text-amber-600 dark:text-amber-300',
                helper: 'A bit more specificity will usually improve click-through.',
            };
        }

        if (titleLength <= 72) {
            return {
                label: 'Strong length',
                toneClass: 'text-emerald-600 dark:text-emerald-300',
                helper: 'This headline length is usually scannable and descriptive.',
            };
        }

        return {
            label: 'Running long',
            toneClass: 'text-amber-600 dark:text-amber-300',
            helper: 'Trim any filler words so the main outcome lands earlier.',
        };
    }, [titleLength]);

    const heroStats = useMemo(
        () => [
            {
                label: 'Word count',
                value: wordCount || '0',
                helper: wordCount
                    ? 'Momentum is building inside the draft.'
                    : 'The canvas is ready for the first push.',
                Icon: HiOutlineDocumentText,
            },
            {
                label: 'Read time',
                value: readTime ? `${readTime} min` : '--',
                helper: readTime
                    ? 'Pacing updates live while you write.'
                    : 'Read time appears once the draft has enough text.',
                Icon: HiOutlineClock,
            },
            {
                label: 'Structure',
                value: headingCount ? `${headingCount} markers` : 'Open',
                helper: headingCount
                    ? 'Your heading map is taking shape.'
                    : 'Use H2 or H3 blocks to guide the reader.',
                Icon: HiOutlineClipboardList,
            },
        ],
        [headingCount, readTime, wordCount]
    );

    const workspaceSignals = useMemo(
        () => [
            {
                label: 'Momentum',
                value: wordCount ? `${wordCount} words` : 'Blank',
                helper:
                    wordCount >= 240
                        ? 'There is enough material here to edit with intent.'
                        : 'Push through the opening before polishing too early.',
                width: wordCount ? Math.min(100, Math.round((wordCount / 750) * 100)) : 8,
            },
            {
                label: 'Structure',
                value: headingCount ? `${headingCount} headings` : 'Flat',
                helper: headingCount
                    ? 'The reader will be able to scan the story path.'
                    : 'Add headings to break the draft into navigable sections.',
                width: headingCount ? Math.min(100, headingCount * 24) : 10,
            },
            {
                label: 'Readiness',
                value: `${readiness}%`,
                helper:
                    readiness >= 80
                        ? 'Metadata and body are lined up for publishing.'
                        : 'Add the missing metadata pieces before shipping.',
                width: Math.max(readiness, 8),
            },
        ],
        [headingCount, readiness, wordCount]
    );

    const writerCues = useMemo(
        () => [
            form.title.trim()
                ? `Headline check: ${form.title}`
                : 'Write the headline before polishing the rest. It sharpens every later choice.',
            plainText
                ? `Opening preview: ${excerpt}`
                : 'Lead with the sharpest tension, outcome, or promise in the first paragraph.',
            mediaAssetCount > 1
                ? `${mediaAssetCount} media assets are ready. Keep the lead item aligned with the article payoff.`
                : form.mediaUrl
                    ? 'Lead media is in place. Use it to reinforce the payoff, not distract from it.'
                    : 'Add a visual, clip, audio segment, or document if the post benefits from richer media.',
            illustrationCount
                ? `${illustrationCount} illustrations are staged. Tight alt text and clear credits matter as much as the imagery.`
                : 'Use illustrations when the post needs diagrams, annotated frames, or concept art beyond the lead media.',
        ],
        [excerpt, form.mediaUrl, form.title, illustrationCount, mediaAssetCount, plainText]
    );

    const appliedTemplateLabel = useMemo(
        () => QUICK_STARTS.find((template) => template.id === lastAppliedTemplate)?.label || '',
        [lastAppliedTemplate]
    );

    const workflowSteps = useMemo(
        () => [
            {
                id: 'post-essentials',
                label: 'Setup',
                ready: Boolean(
                    form.title.trim() && form.slug.trim() && form.category !== 'uncategorized'
                ),
                detail: form.title.trim()
                    ? 'Headline, route, and category are in motion.'
                    : 'Start with the title, slug, and category.',
            },
            {
                id: 'post-templates',
                label: 'Structure',
                ready: Boolean(lastAppliedTemplate || headingCount),
                detail: appliedTemplateLabel
                    ? `${appliedTemplateLabel} applied.`
                    : headingCount
                      ? `${headingCount} headings mapped.`
                      : 'Pick a structure or add section headings.',
            },
            {
                id: 'post-media',
                label: 'Cover',
                ready: mediaAssetCount > 0,
                detail:
                    mediaAssetCount > 1
                        ? `${mediaAssetCount} media assets staged.`
                        : form.mediaUrl
                            ? `${form.mediaType || 'Media'} attached.`
                            : 'Optional image, video, audio, or document.',
            },
            {
                id: 'post-illustrations',
                label: 'Illustrations',
                ready: illustrationCount > 0,
                detail: illustrationCount
                    ? `${illustrationCount} illustrations staged.`
                    : 'Optional diagrams, artwork, or supporting frames.',
            },
            {
                id: 'post-editor',
                label: 'Draft',
                ready: Boolean(plainText),
                detail: plainText
                    ? `${wordCount} words drafted.`
                    : 'Write the opening paragraph.',
            },
            {
                id: 'post-publish',
                label: 'Ship',
                ready: readiness >= 80 && Boolean(form.title.trim()) && Boolean(plainText),
                detail:
                    readiness >= 80
                        ? 'Ready for final review and publish.'
                        : 'Close the missing checks before shipping.',
            },
        ],
        [
            appliedTemplateLabel,
            form.category,
            illustrationCount,
            form.mediaType,
            form.slug,
            form.title,
            headingCount,
            lastAppliedTemplate,
            mediaAssetCount,
            plainText,
            readiness,
            wordCount,
        ]
    );

    const publishChecklist = useMemo(
        () => [
            {
                sectionId: 'post-essentials',
                label: 'Headline',
                ready: Boolean(form.title.trim()),
                detail: form.title.trim() ? `${titleLength} characters` : 'Add the main promise.',
                optional: false,
            },
            {
                sectionId: 'post-editor',
                label: 'Body copy',
                ready: Boolean(plainText),
                detail: plainText ? `${wordCount} words in draft` : 'Write the post body.',
                optional: false,
            },
            {
                sectionId: 'post-essentials',
                label: 'Slug',
                ready: Boolean(form.slug.trim()),
                detail: form.slug.trim() ? `/${form.slug}` : 'Set the published path.',
                optional: false,
            },
            {
                sectionId: 'post-essentials',
                label: 'Category',
                ready: form.category !== 'uncategorized',
                detail:
                    form.category !== 'uncategorized'
                        ? formattedCategory
                        : 'Pick the reader lane.',
                optional: false,
            },
            {
                sectionId: 'post-media',
                label: 'Multimedia deck',
                ready: mediaAssetCount > 0,
                detail:
                    mediaAssetCount > 1
                        ? `${mediaAssetCount} assets attached`
                        : form.mediaUrl
                            ? `${form.mediaType || 'media'} attached`
                            : 'Optional, but useful for scannability.',
                optional: true,
            },
            {
                sectionId: 'post-illustrations',
                label: 'Illustrations',
                ready: illustrationCount > 0,
                detail: illustrationCount
                    ? `${illustrationCount} visuals attached`
                    : 'Optional visual sequence or diagram set.',
                optional: true,
            },
        ],
        [
            form.category,
            illustrationCount,
            form.mediaType,
            form.slug,
            form.title,
            formattedCategory,
            mediaAssetCount,
            plainText,
            titleLength,
            wordCount,
        ]
    );

    const nextAction = useMemo(
        () =>
            publishChecklist.find((item) => !item.ready && !item.optional) ||
            publishChecklist.find((item) => !item.ready) ||
            null,
        [publishChecklist]
    );

    const workflowReadyCount = useMemo(
        () => workflowSteps.filter((step) => step.ready).length,
        [workflowSteps]
    );

    const scrollToComposerSection = (sectionId) => {
        if (typeof document === 'undefined') {
            return;
        }

        document.getElementById(sectionId)?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };

    const handleFieldChange = (field) => (event) => {
        const nextValue = event.target.value;
        setPublishError(null);

        setForm((currentForm) => {
            if (field === 'title') {
                const previousGeneratedSlug = generateSlug(currentForm.title);
                const shouldSyncSlug =
                    !currentForm.slug || currentForm.slug === previousGeneratedSlug;

                return {
                    ...currentForm,
                    title: nextValue,
                    slug: shouldSyncSlug ? generateSlug(nextValue) : currentForm.slug,
                };
            }

            if (field === 'slug') {
                return {
                    ...currentForm,
                    slug: generateSlug(nextValue),
                };
            }

            return {
                ...currentForm,
                [field]: nextValue,
            };
        });
    };

    const handleContentChange = (nextContent) => {
        setPublishError(null);
        setForm((currentForm) => ({ ...currentForm, content: nextContent }));
    };

    const handleRestoreDraft = () => {
        if (pendingDraft) {
            setForm(pendingDraft);
        }
        resetAssetStudios();
        setPendingDraft(null);
        setShowModal(false);
        setDraftResolved(true);
    };

    const handleDismissDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        resetAssetStudios();
        setForm({ ...initialForm });
        setPendingDraft(null);
        setShowModal(false);
        setDraftResolved(true);
    };

    const handleClearDraft = () => {
        resetAssetStudios();
        setPublishError(null);
        setForm({ ...initialForm });
        setPendingDraft(null);
        setLastAppliedTemplate('');
        setDraftStatus('idle');
        setLastSavedAt(null);
        localStorage.removeItem(DRAFT_KEY);
    };

    const handleApplyTemplate = (template) => {
        setPublishError(null);
        setForm((currentForm) => ({
            ...currentForm,
            content: mergeTemplateIntoContent(currentForm.content, template.html),
        }));
        setLastAppliedTemplate(template.id);
    };

    const handleRefreshSlug = () => {
        setForm((currentForm) => ({
            ...currentForm,
            slug: generateSlug(currentForm.title),
        }));
    };

    const handlePublish = async () => {
        setPublishError(null);

        if (!form.title.trim()) {
            setPublishError('Add a title before publishing.');
            return;
        }

        if (!plainText) {
            setPublishError('Post content cannot be empty.');
            return;
        }

        if (hasActiveUpload) {
            setPublishError('Wait for all asset uploads to finish before publishing.');
            return;
        }

        if (hasPendingAssetSelection) {
            setPublishError('Upload or clear every selected asset before publishing.');
            return;
        }

        try {
            setIsPublishing(true);

            const savedPost = await createPostRequest({
                ...form,
                slug: form.slug || generateSlug(form.title),
            });

            localStorage.removeItem(DRAFT_KEY);
            setDraftStatus('idle');
            setLastSavedAt(null);
            setForm({ ...initialForm });
            resetAssetStudios();
            navigate(`/post/${savedPost.slug}`);
        } catch (error) {
            setPublishError(error.message || 'Unable to publish the post.');
        } finally {
            setIsPublishing(false);
        }
    };

    return (
        <div className='liquid-stage' data-theme='liquid-glass'>
            <div className='liquid-stage__backdrop' aria-hidden='true'>
                <div className='liquid-stage__blob liquid-stage__blob--cyan' />
                <div className='liquid-stage__blob liquid-stage__blob--violet' />
                <div className='liquid-stage__blob liquid-stage__blob--amber' />
                <div className='liquid-stage__mesh' />
                <div className='liquid-stage__glint' />
                <div className='liquid-stage__noise' />
            </div>

            <div className='create-post-studio relative z-10 min-h-screen px-4 py-8 pb-32 lg:px-6 lg:pb-10'>
                <div className='mx-auto max-w-7xl space-y-6'>
                    <section className='create-post-hero'>
                        <div className='grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)]'>
                            <div className='space-y-4'>
                                <div className='create-post-kicker'>
                                    <span className='create-post-kicker__dot' />
                                    <HiOutlineSparkles className='h-4 w-4' />
                                    Writer studio
                                </div>

                                <div className='space-y-3'>
                                    <h1 className='create-post-title'>
                                        Create in a faster, cleaner writing flow.
                                    </h1>
                                    <p className='create-post-copy'>
                                        Draft, cover media, metadata, and publish controls stay in one
                                        view again, so the page is useful as an editor instead of just a
                                        scratchpad.
                                    </p>
                                </div>

                                <div className='flex flex-wrap gap-3'>
                                    <span className='create-post-pill'>
                                        {draftStatus === 'saving' ? (
                                            <span className='h-2.5 w-2.5 animate-pulse rounded-full bg-amber-400' />
                                        ) : (
                                            <HiOutlineCheckCircle className='h-4 w-4 text-emerald-500' />
                                        )}
                                        {draftStatusLabel}
                                    </span>
                                    <span className='create-post-pill'>
                                        <HiOutlineRocketLaunch className='h-4 w-4 text-sky-500' />
                                        {readTime ? `${readTime} min reading pace` : 'Start the opening paragraph'}
                                    </span>
                                    <span className='create-post-pill'>
                                        <HiOutlineTag className='h-4 w-4 text-cyan-500' />
                                        {form.slug || 'Add a title to generate the slug'}
                                    </span>
                                </div>
                            </div>

                            <div className='grid gap-3 sm:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3'>
                                {heroStats.map(({ label, value, helper, Icon }) => (
                                    <article key={label} className='create-post-stat'>
                                        <div className='flex items-center justify-between gap-3'>
                                            <p className='create-post-stat__label'>{label}</p>
                                            <Icon className='h-5 w-5 text-sky-500' />
                                        </div>
                                        <p className='create-post-stat__value'>{value}</p>
                                        <p className='create-post-stat__helper'>{helper}</p>
                                    </article>
                                ))}
                            </div>
                        </div>

                        <div className='mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]'>
                            <article className='create-post-excerpt-card'>
                                <div className='flex flex-wrap items-center justify-between gap-3'>
                                    <div>
                                        <p className='create-post-panel-eyebrow'>Workflow navigator</p>
                                        <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>
                                            Move through the draft without hunting for controls.
                                        </h2>
                                    </div>
                                    <Badge color={workflowReadyCount >= 4 ? 'success' : 'info'}>
                                        {workflowReadyCount}/{workflowSteps.length} stages warm
                                    </Badge>
                                </div>

                                <div className='mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3'>
                                    {workflowSteps.map((step) => (
                                        <button
                                            key={step.id}
                                            type='button'
                                            onClick={() => scrollToComposerSection(step.id)}
                                            className={`rounded-[22px] border px-4 py-4 text-left transition ${
                                                step.ready
                                                    ? 'border-emerald-200 bg-emerald-50/90 shadow-[0_18px_42px_-34px_rgba(16,185,129,0.55)] dark:border-emerald-500/30 dark:bg-emerald-500/10'
                                                    : 'border-slate-200 bg-white/80 hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white dark:border-slate-800 dark:bg-slate-900/65 dark:hover:border-sky-500/40'
                                            }`}
                                        >
                                            <div className='flex items-start justify-between gap-3'>
                                                <div>
                                                    <p className='text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500'>
                                                        {step.label}
                                                    </p>
                                                    <p className='mt-2 text-base font-semibold text-slate-900 dark:text-white'>
                                                        {step.ready ? 'Ready to go' : 'Needs attention'}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex h-8 min-w-8 items-center justify-center rounded-full px-2 text-xs font-semibold ${
                                                        step.ready
                                                            ? 'bg-emerald-500 text-white'
                                                            : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'
                                                    }`}
                                                >
                                                    {step.ready ? 'OK' : 'Go'}
                                                </span>
                                            </div>
                                            <p className='mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300'>
                                                {step.detail}
                                            </p>
                                        </button>
                                    ))}
                                </div>
                            </article>

                            <article className='create-post-excerpt-card'>
                                <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                    <HiOutlineRocketLaunch className='h-4 w-4 text-sky-500' />
                                    Next best move
                                </div>

                                <div className='mt-4 space-y-3'>
                                    <p className='text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white'>
                                        {nextAction ? nextAction.label : 'Ready to publish'}
                                    </p>
                                    <p className='text-sm leading-7 text-slate-600 dark:text-slate-300'>
                                        {nextAction
                                            ? nextAction.detail
                                            : 'The main checks are covered. Use the preview window for a final read-through, then publish.'}
                                    </p>

                                    <div className='grid gap-3 sm:grid-cols-2'>
                                        <div className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Headline fit</span>
                                            <span className={`create-post-mini-stat__value ${headlineSignal.toneClass}`}>
                                                {headlineSignal.label}
                                            </span>
                                        </div>
                                        <div className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Topic lane</span>
                                            <span className='create-post-mini-stat__value'>
                                                {formattedCategory}
                                            </span>
                                        </div>
                                    </div>

                                    <p className='rounded-[20px] border border-slate-200 bg-white/70 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-300'>
                                        {headlineSignal.helper}
                                    </p>

                                    <div className='flex flex-wrap gap-3'>
                                        <Button
                                            size='sm'
                                            type='button'
                                            onClick={() =>
                                                scrollToComposerSection(
                                                    nextAction?.sectionId || 'post-publish'
                                                )
                                            }
                                            className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                        >
                                            {nextAction ? 'Go to section' : 'Jump to publish'}
                                        </Button>
                                        {!showPreviewWindow ? (
                                            <Button
                                                size='sm'
                                                color='light'
                                                type='button'
                                                onClick={() => setShowPreviewWindow(true)}
                                                className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                            >
                                                Open preview
                                            </Button>
                                        ) : null}
                                    </div>
                                </div>
                            </article>
                        </div>
                    </section>

                    {publishError ? (
                        <Alert color='failure' onDismiss={() => setPublishError(null)}>
                            {publishError}
                        </Alert>
                    ) : null}

                    <div className='grid gap-6 xl:grid-cols-[minmax(0,1.16fr)_320px]'>
                        <section className='create-post-workspace'>
                            <div className='create-post-panel-header'>
                                <div className='space-y-2'>
                                    <p className='create-post-panel-eyebrow'>Editor surface</p>
                                    <h2 className='create-post-panel-title'>
                                        Main composition canvas
                                    </h2>
                                    <p className='create-post-panel-copy'>
                                        Keep the post metadata, lead media, and editor in the same
                                        workspace so you can publish without leaving the page.
                                    </p>
                                </div>

                                <div className='flex flex-wrap items-center gap-3'>
                                    <Button
                                        color='light'
                                        type='button'
                                        onClick={() => setShowPreviewWindow((value) => !value)}
                                        className='create-post-clear-btn !border-none !bg-white/80 !text-slate-800 dark:!bg-slate-900/70 dark:!text-slate-100'
                                    >
                                        <div className='flex items-center gap-2'>
                                            <HiOutlineEye className='h-4 w-4' />
                                            {showPreviewWindow ? 'Hide preview' : 'Open preview'}
                                        </div>
                                    </Button>

                                    <Button
                                        color='light'
                                        type='button'
                                        onClick={handleClearDraft}
                                        className='create-post-clear-btn !border-none !bg-white/80 !text-slate-800 dark:!bg-slate-900/70 dark:!text-slate-100'
                                    >
                                        <div className='flex items-center gap-2'>
                                            <HiOutlineRefresh className='h-4 w-4' />
                                            Clear draft
                                        </div>
                                    </Button>
                                </div>
                            </div>

                            <div id='post-essentials' className='liquid-hybrid-tile space-y-4 p-5'>
                                <div className='grid gap-4 lg:grid-cols-2'>
                                    <div className='space-y-2 lg:col-span-2'>
                                        <label
                                            className='text-sm font-semibold text-slate-900 dark:text-white'
                                            htmlFor='post-title'
                                        >
                                            Title
                                        </label>
                                        <TextInput
                                            id='post-title'
                                            value={form.title}
                                            onChange={handleFieldChange('title')}
                                            placeholder='An irresistible headline'
                                        />
                                    </div>

                                    <div className='space-y-2 lg:col-span-2'>
                                        <div className='flex items-center justify-between gap-3'>
                                            <label
                                                className='text-sm font-semibold text-slate-900 dark:text-white'
                                                htmlFor='post-slug'
                                            >
                                                Slug
                                            </label>
                                            <Button
                                                size='xs'
                                                color='light'
                                                type='button'
                                                onClick={handleRefreshSlug}
                                                className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                            >
                                                Refresh
                                            </Button>
                                        </div>
                                        <TextInput
                                            id='post-slug'
                                            value={form.slug}
                                            onChange={handleFieldChange('slug')}
                                            placeholder='post-slug'
                                        />
                                    </div>

                                    <div className='space-y-2'>
                                        <label
                                            className='text-sm font-semibold text-slate-900 dark:text-white'
                                            htmlFor='post-category'
                                        >
                                            Category
                                        </label>
                                        <Select
                                            id='post-category'
                                            value={form.category}
                                            onChange={handleFieldChange('category')}
                                        >
                                            {ARTICLE_POST_CATEGORY_OPTIONS.map((option) => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </Select>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                            Publish readiness
                                        </p>
                                        <div className='rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <span>Score</span>
                                                <Badge color={readiness >= 80 ? 'success' : 'warning'}>
                                                    {readiness}%
                                                </Badge>
                                            </div>
                                            <Progress
                                                progress={readiness}
                                                color={readiness >= 80 ? 'success' : 'warning'}
                                                className='mt-3'
                                            />
                                        </div>
                                    </div>

                                    <div className='grid gap-3 sm:grid-cols-3 lg:col-span-2'>
                                        <article className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Headline status</span>
                                            <span className={`create-post-mini-stat__value ${headlineSignal.toneClass}`}>
                                                {headlineSignal.label}
                                            </span>
                                        </article>
                                        <article className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>URL preview</span>
                                            <span className='create-post-mini-stat__value break-all text-sm'>
                                                /post/{form.slug || 'your-post-slug'}
                                            </span>
                                        </article>
                                        <article className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Category lane</span>
                                            <span className='create-post-mini-stat__value text-sm'>
                                                {formattedCategory}
                                            </span>
                                        </article>
                                    </div>
                                </div>
                            </div>

                            <div id='post-templates' className='create-post-template-row'>
                                {QUICK_STARTS.map((template) => (
                                    <button
                                        key={template.id}
                                        type='button'
                                        onClick={() => handleApplyTemplate(template)}
                                        className={`create-post-template ${lastAppliedTemplate === template.id ? 'is-active' : ''}`}
                                    >
                                        <div className='flex items-start justify-between gap-3'>
                                            <div>
                                                <p className='create-post-template__label'>{template.label}</p>
                                                <p className='create-post-template__copy'>
                                                    {template.description}
                                                </p>
                                            </div>
                                            {lastAppliedTemplate === template.id ? (
                                                <span className='create-post-template__tag'>Applied</span>
                                            ) : null}
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div id='post-media' className='liquid-hybrid-tile p-5'>
                                <PostMediaStudio
                                    key={mediaStudioKey}
                                    value={form}
                                    title={form.title}
                                    onChange={(mediaState) => {
                                        setPublishError(null);
                                        setForm((currentForm) => ({
                                            ...currentForm,
                                            ...mediaState,
                                        }));
                                    }}
                                    onStatusChange={setMediaStudioStatus}
                                    heading='Assemble an advanced multimedia deck'
                                    copy='Combine visuals, demo reels, audio notes, and supporting docs in one post. Pick the lead asset and the published post will render the rest as a gallery.'
                                />
                            </div>

                            <div id='post-illustrations' className='liquid-hybrid-tile p-5'>
                                <PostIllustrationStudio
                                    key={illustrationStudioKey}
                                    value={form}
                                    title={form.title}
                                    onChange={(illustrationState) => {
                                        setPublishError(null);
                                        setForm((currentForm) => ({
                                            ...currentForm,
                                            ...illustrationState,
                                        }));
                                    }}
                                    onStatusChange={setIllustrationStudioStatus}
                                    heading='Build an illustration sequence'
                                    copy='Attach diagrams, concept art, or annotated frames as a dedicated illustration board. Captions, alt text, and credits ship with the post.'
                                />
                            </div>

                            <div id='post-editor' className='create-post-editor-shell mt-5'>
                                <TiptapEditor
                                    content={form.content}
                                    onChange={handleContentChange}
                                    placeholder='Sketch the opening, share the payoff, and outline the journey...'
                                    enableLottieEmbeds
                                />
                            </div>

                            <div className='create-post-excerpt-grid'>
                                <article className='create-post-excerpt-card'>
                                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                        <HiOutlineDocumentText className='h-4 w-4 text-sky-500' />
                                        Live excerpt
                                    </div>
                                    <p className='mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300'>
                                        {excerpt}
                                    </p>
                                </article>

                                <article className='create-post-excerpt-card'>
                                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                        <HiOutlineLightningBolt className='h-4 w-4 text-amber-500' />
                                        Session signals
                                    </div>
                                    <div className='mt-4 grid gap-3 sm:grid-cols-3'>
                                        <div className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Characters</span>
                                            <span className='create-post-mini-stat__value'>
                                                {characterCount}
                                            </span>
                                        </div>
                                        <div className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Paragraphs</span>
                                            <span className='create-post-mini-stat__value'>
                                                {paragraphCount}
                                            </span>
                                        </div>
                                        <div className='create-post-mini-stat'>
                                            <span className='create-post-mini-stat__label'>Draft state</span>
                                            <span className='create-post-mini-stat__value'>
                                                {plainText ? 'Active' : 'Open'}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            </div>
                        </section>

                        <aside className='space-y-4 xl:sticky xl:top-8 xl:self-start'>
                            <section id='post-publish' className='create-post-sidecard'>
                                <div className='flex items-center justify-between gap-3'>
                                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                        <HiOutlineRocketLaunch className='h-4 w-4 text-sky-500' />
                                        Publish controls
                                    </div>
                                    <Badge color={readiness >= 80 ? 'success' : 'warning'}>
                                        {readiness}%
                                    </Badge>
                                </div>

                                <div className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-300'>
                                    {publishChecklist.map((item) => (
                                        <button
                                            key={item.label}
                                            type='button'
                                            onClick={() => scrollToComposerSection(item.sectionId)}
                                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${
                                                item.ready
                                                    ? 'border-emerald-200 bg-emerald-50/80 dark:border-emerald-500/20 dark:bg-emerald-500/10'
                                                    : 'border-slate-200 bg-slate-50/70 hover:border-sky-200 hover:bg-white/90 dark:border-slate-800 dark:bg-slate-900/70 dark:hover:border-sky-500/30'
                                            }`}
                                        >
                                            <div className='flex items-start justify-between gap-3'>
                                                <div>
                                                    <p className='font-semibold text-slate-900 dark:text-white'>
                                                        {item.label}
                                                    </p>
                                                    <p className='mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400'>
                                                        {item.detail}
                                                    </p>
                                                </div>
                                                <span
                                                    className={`inline-flex min-w-[72px] items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                                                        item.ready
                                                            ? 'bg-emerald-500 text-white'
                                                            : item.optional
                                                              ? 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200'
                                                              : 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-200'
                                                    }`}
                                                >
                                                    {item.ready
                                                        ? 'Ready'
                                                        : item.optional
                                                          ? 'Optional'
                                                          : 'Missing'}
                                                </span>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                <Button
                                    type='button'
                                    onClick={handlePublish}
                                    disabled={isPublishing || hasActiveUpload}
                                    className='mt-4 w-full bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-300 transition hover:shadow-xl focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                >
                                    {isPublishing ? (
                                        <span className='flex items-center justify-center gap-2'>
                                            <Spinner size='sm' />
                                            Publishing...
                                        </span>
                                    ) : (
                                        'Publish post'
                                    )}
                                </Button>

                                <div className='mt-3 flex flex-wrap gap-3'>
                                    <Button
                                        size='sm'
                                        color='light'
                                        type='button'
                                        onClick={() =>
                                            scrollToComposerSection(
                                                nextAction?.sectionId || 'post-editor'
                                            )
                                        }
                                        className='flex-1 border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                    >
                                        {nextAction ? 'Fix next item' : 'Review draft'}
                                    </Button>
                                </div>
                            </section>

                            <section className='create-post-sidecard'>
                                <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                    <HiOutlineRocketLaunch className='h-4 w-4 text-sky-500' />
                                    Session pulse
                                </div>

                                <div className='mt-4 space-y-4'>
                                    {workspaceSignals.map((signal) => (
                                        <div key={signal.label} className='space-y-2'>
                                            <div className='flex items-center justify-between gap-3'>
                                                <div>
                                                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                                        {signal.label}
                                                    </p>
                                                    <p className='text-xs text-slate-500 dark:text-slate-400'>
                                                        {signal.value}
                                                    </p>
                                                </div>
                                                <span className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                                    {signal.width}%
                                                </span>
                                            </div>
                                            <div className='create-post-meter'>
                                                <span
                                                    className='create-post-meter__fill'
                                                    style={{ width: `${signal.width}%` }}
                                                />
                                            </div>
                                            <p className='text-xs leading-relaxed text-slate-600 dark:text-slate-300'>
                                                {signal.helper}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className='create-post-sidecard'>
                                <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                    <HiOutlineSparkles className='h-4 w-4 text-amber-500' />
                                    Writer cues
                                </div>

                                <div className='mt-4 space-y-3'>
                                    {writerCues.map((cue) => (
                                        <article key={cue} className='create-post-cue'>
                                            <HiOutlineCheckCircle className='mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500' />
                                            <p className='text-sm leading-6 text-slate-600 dark:text-slate-300'>
                                                {cue}
                                            </p>
                                        </article>
                                    ))}
                                </div>
                            </section>
                        </aside>
                    </div>
                </div>
            </div>

            <Modal show={showModal} size='md' onClose={handleDismissDraft} popup>
                <Modal.Header />
                <Modal.Body>
                    <div className='space-y-3 text-center'>
                        <div className='mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-inner shadow-amber-200 dark:bg-amber-900/30 dark:text-amber-200'>
                            <HiOutlineExclamationCircle className='h-8 w-8' />
                        </div>
                        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>
                            Resume your draft?
                        </h3>
                        <p className='text-sm text-slate-600 dark:text-slate-300'>
                            We found saved work. Pick up where you left off or start fresh.
                        </p>
                        <div className='flex justify-center gap-3'>
                            <Button
                                color='success'
                                onClick={handleRestoreDraft}
                                className='lg-btn-hybrid !text-slate-900'
                            >
                                Yes, restore it
                            </Button>
                            <Button
                                color='gray'
                                onClick={handleDismissDraft}
                                className='lg-btn-hybrid !bg-slate-900/80 !text-white'
                            >
                                No, start fresh
                            </Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>

            {showPreviewWindow ? (
                <FloatingPreviewWindow
                    title='Post Preview'
                    subtitle='Drag the header to move the live preview while you edit. Use the traffic lights to hide, minimize, or expand it.'
                    metaLabel={
                        readTime
                            ? `${readTime} min read • ${wordCount} words`
                            : plainText
                              ? `${wordCount} words`
                              : 'Auto refresh'
                    }
                    onClose={() => setShowPreviewWindow(false)}
                >
                    <PostLivePreview
                        post={form}
                        readTime={readTime}
                        wordCount={wordCount}
                        className='border-slate-200/70 shadow-none dark:border-slate-800/80'
                        emptyMessage='Start the draft and this floating window will mirror the published post layout in real time.'
                    />
                </FloatingPreviewWindow>
            ) : (
                <button
                    type='button'
                    onClick={() => setShowPreviewWindow(true)}
                    className='fixed bottom-5 right-4 z-[70] hidden items-center gap-2 rounded-full border border-sky-200 bg-white/90 px-4 py-3 text-sm font-semibold text-slate-800 shadow-lg shadow-sky-500/10 backdrop-blur transition hover:-translate-y-0.5 hover:border-sky-300 hover:bg-white dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 dark:hover:border-sky-500/50 xl:inline-flex'
                >
                    <HiOutlineEye className='h-4 w-4 text-sky-500' />
                    Open preview window
                </button>
            )}

            <div className='fixed inset-x-4 bottom-4 z-[65] xl:hidden'>
                <div className='rounded-[28px] border border-white/60 bg-white/88 p-3 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.72)] backdrop-blur-2xl dark:border-slate-700/70 dark:bg-slate-900/88'>
                    <div className='mb-3 flex items-center justify-between gap-3'>
                        <div>
                            <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                Mobile action dock
                            </p>
                            <p className='text-sm font-semibold text-slate-900 dark:text-white'>
                                {nextAction ? `${nextAction.label} needs attention` : 'Ready to ship'}
                            </p>
                        </div>
                        <Badge color={readiness >= 80 ? 'success' : 'warning'}>{readiness}%</Badge>
                    </div>

                    <div className='grid grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] gap-2'>
                        <Button
                            color='light'
                            type='button'
                            onClick={() => setShowPreviewWindow((value) => !value)}
                            className='!border-slate-200 !bg-white !text-slate-700 dark:!border-slate-700 dark:!bg-slate-950 dark:!text-slate-100'
                        >
                            <div className='flex items-center gap-2'>
                                <HiOutlineEye className='h-4 w-4' />
                                {showPreviewWindow ? 'Hide preview' : 'Show preview'}
                            </div>
                        </Button>
                        <Button
                            type='button'
                            onClick={handlePublish}
                            disabled={isPublishing || hasActiveUpload}
                            className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-300 transition hover:shadow-xl focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                        >
                            {isPublishing ? (
                                <span className='flex items-center justify-center gap-2'>
                                    <Spinner size='sm' />
                                    Publishing...
                                </span>
                            ) : (
                                'Publish post'
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
