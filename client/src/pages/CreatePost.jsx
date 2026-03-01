import { useEffect, useMemo, useReducer, useState } from 'react';
import { Alert, Badge, Button, FileInput, Modal, Select, Spinner, TextInput } from 'flowbite-react';
import { CircularProgressbar } from 'react-circular-progressbar';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import DOMPurify from 'dompurify';
import parse from 'html-react-parser';
import { HiOutlineClock, HiOutlineClipboardList, HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineLightningBolt, HiOutlineRefresh, HiOutlineEye } from 'react-icons/hi';

import TiptapEditor from '../components/TiptapEditor';
import '../Tiptap.css';
import 'react-circular-progressbar/dist/styles.css';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import { apiFetch } from '../utils/apiFetch';

const DRAFT_KEY = 'postDraft';

const initialState = {
    formData: { title: '', category: 'uncategorized', slug: '', mediaUrl: null, mediaType: null, content: '' },
    publishError: null,
    loading: false,
};

function postReducer(state, action) {
    switch (action.type) {
    case 'FIELD_CHANGE':
        return { ...state, formData: { ...state.formData, ...action.payload } };
    case 'MEDIA_UPLOAD_SUCCESS':
        return { ...state, formData: { ...state.formData, mediaUrl: action.payload.url, mediaType: action.payload.type } };
    case 'PUBLISH_START':
        return { ...state, loading: true, publishError: null };
    case 'PUBLISH_SUCCESS':
        return { ...initialState, formData: { ...initialState.formData } };
    case 'PUBLISH_ERROR':
        return { ...state, loading: false, publishError: action.payload };
    case 'LOAD_DRAFT':
        return { ...state, formData: action.payload };
    case 'RESET_FORM':
        return { ...initialState, formData: { ...initialState.formData } };
    default:
        throw new Error(`Unhandled action type: ${action.type}`);
    }
}

const steps = [
    { id: 1, title: 'Compose', description: 'Draft and enrich your story.' },
    { id: 2, title: 'Details', description: 'Add headline, slug, and taxonomy.' },
    { id: 3, title: 'Review', description: 'Preview and publish confidently.' },
];

const stripHtml = (value = '') => value.replace(/<[^>]*>/g, ' ');

const getSavedDraft = () => {
    try {
        const raw = localStorage.getItem(DRAFT_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (err) {
        console.error('Failed to parse saved draft', err);
        return null;
    }
};

const stepVariants = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -12 },
};

const FullPostPreview = ({ post, readTime, wordCount }) => {
    const sanitizedContent = DOMPurify.sanitize(post.content || '');
    const hasBody = sanitizedContent.trim().length > 0;

    return (
        <div className='relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900'>
            <div className='absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.12),transparent_30%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.12),transparent_28%)] dark:bg-[radial-gradient(circle_at_0%_0%,rgba(56,189,248,0.14),transparent_26%),radial-gradient(circle_at_90%_10%,rgba(14,165,233,0.12),transparent_28%)]' aria-hidden='true' />
            <div className='relative space-y-4 p-5 sm:p-6'>
                <div className='flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>
                    <span className='rounded-full bg-sky-100 px-3 py-1 text-sky-700 shadow-sm dark:bg-sky-900/50 dark:text-sky-200'>
                        {post.category || 'uncategorized'}
                    </span>
                    <span className='rounded-full bg-slate-100 px-3 py-1 text-slate-700 dark:bg-slate-800 dark:text-slate-100'>
                        {readTime ? `${readTime} min read` : 'Preview'}
                    </span>
                    {wordCount > 0 && (
                        <span className='rounded-full bg-emerald-100 px-3 py-1 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                            {wordCount} words
                        </span>
                    )}
                </div>
                <div className='space-y-2'>
                    <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>Preview</p>
                    <h2 className='text-2xl font-semibold text-slate-900 dark:text-white'>{post.title || 'Untitled post'}</h2>
                </div>
                {post.mediaUrl && (
                    <div className='overflow-hidden rounded-xl border border-slate-200 shadow-sm dark:border-slate-800'>
                        {post.mediaType === 'video' ? (
                            <video src={post.mediaUrl} controls className='h-64 w-full object-cover' />
                        ) : (
                            <img src={post.mediaUrl} alt={post.title || 'Uploaded media'} className='h-64 w-full object-cover' />
                        )}
                    </div>
                )}
                <div className='prose prose-slate max-w-none text-slate-700 dark:prose-invert dark:text-slate-200'>
                    {hasBody ? (
                        parse(sanitizedContent)
                    ) : (
                        <p className='text-sm text-slate-500 dark:text-slate-400'>
                            Your story preview will appear here as you write. Add a headline, drop in visuals, and we will render it live.
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function CreatePost() {
    const [state, dispatch] = useReducer(postReducer, initialState);
    const [showModal, setShowModal] = useState(false);
    const [currentStep, setCurrentStep] = useState(1);
    const [draftStatus, setDraftStatus] = useState('idle');
    const { upload, progress: uploadProgress, error: uploadError, isUploading } = useCloudinaryUpload();
    const navigate = useNavigate();

    useEffect(() => {
        const savedDraft = getSavedDraft();
        if (savedDraft) {
            const hasContent = stripHtml(savedDraft.content || '').trim().length > 0;
            if (savedDraft.title || hasContent) {
                setShowModal(true);
            }
        }
    }, []);

    useEffect(() => {
        if (!state.formData.title && !stripHtml(state.formData.content || '').trim()) {
            setDraftStatus('idle');
            return;
        }

        setDraftStatus('saving');
        const saveTimer = setTimeout(() => {
            localStorage.setItem(DRAFT_KEY, JSON.stringify(state.formData));
            setDraftStatus('saved');
        }, 800);

        const resetTimer = setTimeout(() => setDraftStatus('idle'), 2200);

        return () => {
            clearTimeout(saveTimer);
            clearTimeout(resetTimer);
        };
    }, [state.formData]);

    const contentText = useMemo(() => stripHtml(state.formData.content || ''), [state.formData.content]);

    const wordCount = useMemo(() => {
        const trimmed = contentText.trim();
        return trimmed ? trimmed.split(/\s+/).length : 0;
    }, [contentText]);

    const estimatedReadTime = useMemo(
        () => (wordCount ? Math.max(1, Math.ceil(wordCount / 180)) : 0),
        [wordCount],
    );

    const completionScore = useMemo(() => {
        const scoreParts = [
            state.formData.title.trim() ? 1 : 0,
            stripHtml(state.formData.content || '').trim() ? 1 : 0,
            state.formData.category && state.formData.category !== 'uncategorized' ? 1 : 0,
            state.formData.mediaUrl ? 1 : 0,
        ];
        return Math.round((scoreParts.reduce((acc, item) => acc + item, 0) / scoreParts.length) * 100);
    }, [state.formData]);

    const handleRestoreDraft = () => {
        const savedDraft = getSavedDraft();
        if (savedDraft) {
            dispatch({ type: 'LOAD_DRAFT', payload: savedDraft });
        }
        setShowModal(false);
    };

    const handleDismissDraft = () => {
        localStorage.removeItem(DRAFT_KEY);
        setShowModal(false);
    };

    const generateSlug = (title = '') =>
        title.toLowerCase().trim().replace(/[\s\W-]+/g, '-').replace(/^-+|-+$/g, '');

    const handleChange = (e) => {
        const { id, value } = e.target;
        const payload = { [id]: value };
        if (id === 'title') {
            payload.slug = generateSlug(value);
        }
        dispatch({ type: 'FIELD_CHANGE', payload });
    };

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) {
            return;
        }

        const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
        const config = mediaType === 'image'
            ? { allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'], maxSizeMB: 2 }
            : { allowedTypes: ['video/mp4', 'video/webm', 'video/quicktime'], maxSizeMB: 50 };

        try {
            const url = await upload(file, config);
            dispatch({ type: 'MEDIA_UPLOAD_SUCCESS', payload: { url, type: mediaType } });
        } catch (err) {
            console.error(err.message);
        }
    };

    const handleNextStep = () => setCurrentStep((step) => Math.min(3, step + 1));
    const handlePreviousStep = () => setCurrentStep((step) => Math.max(1, step - 1));

    const handleResetForm = () => {
        localStorage.removeItem(DRAFT_KEY);
        dispatch({ type: 'RESET_FORM' });
        setCurrentStep(1);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!state.formData.title.trim()) {
            setCurrentStep(2);
            return dispatch({ type: 'PUBLISH_ERROR', payload: 'A title is required before publishing.' });
        }

        if (!stripHtml(state.formData.content || '').trim()) {
            setCurrentStep(1);
            return dispatch({ type: 'PUBLISH_ERROR', payload: 'Post content cannot be empty.' });
        }

        dispatch({ type: 'PUBLISH_START' });
        try {
            const res = await apiFetch('/api/v1/post/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state.formData),
            });
            const data = await res.json();
            if (!res.ok) {
                return dispatch({ type: 'PUBLISH_ERROR', payload: data.message });
            }
            dispatch({ type: 'PUBLISH_SUCCESS' });
            localStorage.removeItem(DRAFT_KEY);
            navigate(`/post/${data.slug}`);
        } catch (error) {
            dispatch({ type: 'PUBLISH_ERROR', payload: 'An unexpected error occurred.' });
        }
    };

    const readinessWidth = Math.min(100, Math.max(completionScore, wordCount > 0 ? 35 : 0));
    const stepProgress = ((currentStep - 1) / 2) * 100;

    return (
        <div className='relative min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(56,189,248,0.18),transparent_32%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.18),transparent_28%)] px-4 py-10 lg:px-6'>
            <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(14,165,233,0.08),transparent_45%)]' aria-hidden='true' />
            <div className='relative mx-auto max-w-6xl space-y-6'>
                <div className='rounded-3xl border border-white/60 bg-white/80 p-6 shadow-[0_30px_80px_-60px_rgba(15,23,42,0.7)] backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80'>
                    <div className='flex flex-wrap items-start justify-between gap-4'>
                        <div className='space-y-2'>
                            <p className='text-xs font-semibold uppercase tracking-[0.22em] text-sky-600 dark:text-sky-300'>Writer studio</p>
                            <h1 className='text-3xl font-semibold text-slate-900 dark:text-white'>Create a post</h1>
                            <p className='max-w-2xl text-sm text-slate-600 dark:text-slate-300'>
                                Build a polished article with live preview, autosave, and publishing readiness all in one place.
                            </p>
                        </div>
                        <div className='flex flex-wrap items-center gap-3'>
                            <Badge color='info' className='bg-sky-100 text-sky-800 ring-1 ring-sky-200 dark:bg-sky-900/60 dark:text-sky-100'>
                                {draftStatus === 'saving' && 'Saving draft...'}
                                {draftStatus === 'saved' && 'Draft saved'}
                                {draftStatus === 'idle' && 'Autosave ready'}
                            </Badge>
                            <Badge color='gray' className='bg-slate-100 text-slate-800 ring-1 ring-slate-200 dark:bg-slate-800 dark:text-slate-100'>
                                Step {currentStep} / 3
                            </Badge>
                        </div>
                    </div>

                    <div className='mt-6 space-y-3'>
                        <div className='flex items-center gap-3'>
                            <div className='h-2 flex-1 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800/80'>
                                <div
                                    className='h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-300'
                                    style={{ width: `${stepProgress}%` }}
                                />
                            </div>
                            <span className='text-xs font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>
                                Progress
                            </span>
                        </div>

                        <div className='grid gap-3 sm:grid-cols-3'>
                            {steps.map((step) => {
                                const isActive = currentStep === step.id;
                                const isComplete = currentStep > step.id;
                                return (
                                    <div
                                        key={step.id}
                                        className={`rounded-2xl border p-4 shadow-sm transition-all duration-200 ${
                                            isActive
                                                ? 'border-sky-400/60 bg-sky-50/60 dark:border-sky-500/50 dark:bg-sky-900/40'
                                                : 'border-slate-200 bg-white/70 dark:border-slate-800 dark:bg-slate-900/60'
                                        }`}
                                    >
                                        <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                            <span
                                                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                                    isActive
                                                        ? 'bg-sky-500 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
                                                }`}
                                            >
                                                {isComplete ? '\u2713' : step.id}
                                            </span>
                                            {step.title}
                                        </div>
                                        <p className='mt-2 text-sm text-slate-600 dark:text-slate-300'>{step.description}</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className='grid gap-6 lg:grid-cols-[1.5fr,1fr]'>
                    <form className='space-y-5' onSubmit={handleSubmit}>
                        <AnimatePresence mode='wait'>
                            {currentStep === 1 && (
                                <motion.div
                                    key='step1'
                                    variants={stepVariants}
                                    initial='hidden'
                                    animate='visible'
                                    exit='exit'
                                    transition={{ duration: 0.28 }}
                                    className='rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/80'
                                >
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>Step 1</p>
                                            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Compose & enrich</h2>
                                            <p className='text-sm text-slate-600 dark:text-slate-300'>Write, format, and bring your story to life with visuals.</p>
                                        </div>
                                        <div className='flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm dark:bg-slate-800 dark:text-slate-200'>
                                            <HiOutlineEye className='text-sky-500' />
                                            Live preview updates on the right
                                        </div>
                                    </div>

                                    <div className='mt-4 space-y-5'>
                                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70'>
                                            <div className='flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300'>
                                                <div className='flex items-center gap-2'>
                                                    <HiOutlineDocumentText className='text-sky-500' />
                                                    <span className='font-semibold text-slate-900 dark:text-white'>Editor</span>
                                                </div>
                                                <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-200'>
                                                    {wordCount ? `${wordCount} words` : 'Start typing'}
                                                </span>
                                                {estimatedReadTime > 0 && (
                                                    <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                                                        {estimatedReadTime} min read
                                                    </span>
                                                )}
                                            </div>
                                            <div className='mt-3 rounded-xl border border-slate-200 bg-white/80 p-2 shadow-inner dark:border-slate-800 dark:bg-slate-900/80'>
                                                <TiptapEditor
                                                    content={state.formData.content}
                                                    onChange={(newContent) => dispatch({ type: 'FIELD_CHANGE', payload: { content: newContent } })}
                                                    placeholder='Sketch the opening, share the payoff, and outline the journey...'
                                                />
                                            </div>
                                        </div>

                                        <div className='rounded-2xl border border-dashed border-sky-200 bg-sky-50/60 p-4 shadow-inner dark:border-sky-500/50 dark:bg-sky-900/30'>
                                            <div className='flex flex-wrap items-center gap-3'>
                                                <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                                    <HiOutlineClipboardList className='text-sky-500' />
                                                    Feature media
                                                </div>
                                                <p className='text-xs text-slate-600 dark:text-slate-300'>
                                                    Crisp images (max 2MB) or short clips (max 50MB). Drag a new file to replace.
                                                </p>
                                            </div>

                                            <div className='mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                                                <FileInput
                                                    helperText='JPG, PNG, WEBP, GIF or MP4/WEBM.'
                                                    type='file'
                                                    accept='image/*,video/*'
                                                    onChange={handleFileChange}
                                                    disabled={isUploading}
                                                    className='max-w-lg cursor-pointer rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80'
                                                />
                                                {isUploading && (
                                                    <div className='flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-sky-200 dark:bg-slate-900/80 dark:text-slate-100'>
                                                        <div className='h-10 w-10'>
                                                            <CircularProgressbar value={uploadProgress} text={`${uploadProgress}%`} />
                                                        </div>
                                                        Uploading...
                                                    </div>
                                                )}
                                            </div>

                                            {uploadError && <Alert color='failure' className='mt-3'>{uploadError}</Alert>}

                                            {state.formData.mediaUrl && (
                                                <div className='mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900'>
                                                    {state.formData.mediaType === 'image' ? (
                                                        <img src={state.formData.mediaUrl} alt='Uploaded preview' className='h-64 w-full object-cover' />
                                                    ) : (
                                                        <video src={state.formData.mediaUrl} controls className='h-64 w-full object-cover' />
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 2 && (
                                <motion.div
                                    key='step2'
                                    variants={stepVariants}
                                    initial='hidden'
                                    animate='visible'
                                    exit='exit'
                                    transition={{ duration: 0.28 }}
                                    className='rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/80'
                                >
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>Step 2</p>
                                            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Details & taxonomy</h2>
                                            <p className='text-sm text-slate-600 dark:text-slate-300'>
                                                Pick a standout headline, refine your slug, and guide readers with a category.
                                            </p>
                                        </div>
                                        <Button color='light' type='button' onClick={() => dispatch({ type: 'FIELD_CHANGE', payload: { slug: generateSlug(state.formData.title) } })}>
                                            <div className='flex items-center gap-2'>
                                                <HiOutlineRefresh className='text-sky-500' />
                                                Refresh slug
                                            </div>
                                        </Button>
                                    </div>

                                    <div className='mt-4 space-y-4'>
                                        <TextInput
                                            id='title'
                                            type='text'
                                            placeholder='An irresistible headline'
                                            required
                                            onChange={handleChange}
                                            value={state.formData.title}
                                            color={state.formData.title ? 'success' : undefined}
                                        />
                                        <div className='grid gap-3 sm:grid-cols-2'>
                                            <TextInput
                                                id='slug'
                                                type='text'
                                                placeholder='post-slug'
                                                value={state.formData.slug}
                                                onChange={handleChange}
                                            />
                                            <Select id='category' onChange={handleChange} value={state.formData.category}>
                                                <option value='uncategorized'>Select a category</option>
                                                <option value='javascript'>JavaScript</option>
                                                <option value='reactjs'>React.js</option>
                                                <option value='nextjs'>Next.js</option>
                                                <option value='technology'>Technology</option>
                                            </Select>
                                        </div>
                                        <div className='rounded-xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-600 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'>
                                            <div className='flex flex-wrap items-center gap-3'>
                                                <HiOutlineLightningBolt className='text-amber-500' />
                                                <div>
                                                    <p className='font-semibold text-slate-900 dark:text-white'>Publishing tips</p>
                                                    <p>Keep your slug short, add a category for routing, and drop a cover visual for instant credibility.</p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {currentStep === 3 && (
                                <motion.div
                                    key='step3'
                                    variants={stepVariants}
                                    initial='hidden'
                                    animate='visible'
                                    exit='exit'
                                    transition={{ duration: 0.28 }}
                                    className='rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900/80'
                                >
                                    <div className='flex items-center justify-between gap-3'>
                                        <div>
                                            <p className='text-xs uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300'>Step 3</p>
                                            <h2 className='text-xl font-semibold text-slate-900 dark:text-white'>Review & publish</h2>
                                            <p className='text-sm text-slate-600 dark:text-slate-300'>
                                                Finalize the story. Tweak any detail on the left, then ship it.
                                            </p>
                                        </div>
                                        <div className='rounded-full bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200'>
                                            Ready when you are
                                        </div>
                                    </div>
                                    <div className='mt-4'>
                                        <FullPostPreview post={{ ...state.formData, createdAt: new Date().toISOString() }} readTime={estimatedReadTime} wordCount={wordCount} />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className='flex flex-wrap items-center gap-3'>
                            {currentStep > 1 && (
                                <Button
                                    color='light'
                                    type='button'
                                    onClick={handlePreviousStep}
                                    className='border border-slate-200 bg-white text-slate-800 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800'
                                >
                                    Previous
                                </Button>
                            )}
                            <Button
                                color='light'
                                type='button'
                                onClick={handleResetForm}
                                className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            >
                                Reset
                            </Button>
                            <div className='ml-auto flex items-center gap-3'>
                                {currentStep < 3 && (
                                    <Button
                                        type='button'
                                        onClick={handleNextStep}
                                        className='bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                    >
                                        Next
                                    </Button>
                                )}
                                {currentStep === 3 && (
                                    <Button
                                        type='submit'
                                        disabled={state.loading || isUploading}
                                        className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                    >
                                        {state.loading ? (
                                            <div className='flex items-center gap-2'>
                                                <Spinner size='sm' />
                                                <span>Publishing...</span>
                                            </div>
                                        ) : (
                                            'Publish'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </div>

                        {state.publishError && (
                            <Alert className='mt-2' color='failure'>
                                {state.publishError}
                            </Alert>
                        )}
                    </form>

                    <aside className='space-y-4'>
                        <div className='rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-lg dark:border-slate-800 dark:bg-slate-900/80'>
                            <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                <HiOutlineLightningBolt className='text-amber-500' />
                                Publishing readiness
                            </div>
                            <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
                                Keep a steady cadence. Hitting 100% signals everything is in place.
                            </p>
                            <div className='mt-4 grid gap-3 sm:grid-cols-2'>
                                <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-semibold'>Word count</span>
                                        <HiOutlineDocumentText className='text-sky-500' />
                                    </div>
                                    <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>{wordCount}</p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Aim for clarity, not filler.</p>
                                </div>
                                <div className='rounded-2xl border border-slate-200 bg-slate-50/70 p-4 text-sm text-slate-700 shadow-inner dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-200'>
                                    <div className='flex items-center justify-between'>
                                        <span className='font-semibold'>Read time</span>
                                        <HiOutlineClock className='text-emerald-500' />
                                    </div>
                                    <p className='mt-2 text-2xl font-semibold text-slate-900 dark:text-white'>
                                        {estimatedReadTime ? `${estimatedReadTime} min` : '--'}
                                    </p>
                                    <p className='text-xs text-slate-500 dark:text-slate-400'>Keeps readers' attention span in check.</p>
                                </div>
                            </div>
                            <div className='mt-4'>
                                <div className='flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300'>
                                    <span>Readiness</span>
                                    <span>{readinessWidth}%</span>
                                </div>
                                <div className='mt-2 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                                    <div
                                        className='h-full rounded-full bg-gradient-to-r from-emerald-400 via-sky-500 to-cyan-500 transition-all duration-500'
                                        style={{ width: `${readinessWidth}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className='rounded-3xl border border-slate-200 bg-white/90 p-4 shadow-lg dark:border-slate-800 dark:bg-slate-900/80'>
                            <FullPostPreview post={{ ...state.formData, createdAt: new Date().toISOString() }} readTime={estimatedReadTime} wordCount={wordCount} />
                        </div>
                    </aside>
                </div>
            </div>

            <Modal show={showModal} size='md' onClose={handleDismissDraft} popup>
                <Modal.Header />
                <Modal.Body>
                    <div className='text-center'>
                        <HiOutlineExclamationCircle className='mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200' />
                        <h3 className='mb-5 text-lg font-normal text-gray-500 dark:text-gray-400'>We found an unsaved draft. Do you want to restore it?</h3>
                        <div className='flex justify-center gap-4'>
                            <Button color='success' onClick={handleRestoreDraft}>Yes, restore it</Button>
                            <Button color='gray' onClick={handleDismissDraft}>No, start fresh</Button>
                        </div>
                    </div>
                </Modal.Body>
            </Modal>
        </div>
    );
}
