import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, FileInput, Progress, TextInput } from 'flowbite-react';
import {
    HiOutlineCloudArrowUp,
    HiOutlineLink,
    HiOutlinePhoto,
    HiOutlineSparkles,
    HiOutlineTrash,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import {
    buildPostIllustrationFormState,
    coercePostIllustrationState,
} from '../utils/postMedia.js';

const MAX_ILLUSTRATIONS = 12;
const SUPPORTED_ILLUSTRATION_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'image/avif',
    'image/svg+xml',
]);
const ILLUSTRATION_ACCEPT_ATTR = SUPPORTED_ILLUSTRATION_TYPES.join(',');
const EMPTY_REMOTE_ILLUSTRATION = Object.freeze({
    url: '',
    alt: '',
    caption: '',
    credit: '',
});

const isHttpUrl = (value) => {
    try {
        const nextUrl = new URL(value);
        return nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

export default function PostIllustrationStudio({
    value,
    title = '',
    onChange,
    onStatusChange,
    eyebrow = 'Illustration board',
    heading = 'Curate an illustration sequence',
    copy = 'Upload images or attach remote artwork URLs, then set alt text, captions, credits, and ordering for the published story.',
}) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [remoteIllustration, setRemoteIllustration] = useState(() => ({
        ...EMPTY_REMOTE_ILLUSTRATION,
    }));
    const [manualError, setManualError] = useState(null);
    const {
        upload,
        progress,
        error: uploadError,
        isUploading,
        cancelUpload,
        reset,
    } = useCloudinaryUpload();

    const illustrationState = useMemo(
        () => coercePostIllustrationState(value),
        [value]
    );
    const illustrations = illustrationState.illustrations;
    const canAddMoreIllustrations = illustrations.length < MAX_ILLUSTRATIONS;
    const leadIllustration = illustrations[0] || null;

    useEffect(() => {
        onStatusChange?.({
            isUploading,
            hasPendingFile: Boolean(selectedFile),
            error: uploadError || manualError,
        });
    }, [isUploading, manualError, onStatusChange, selectedFile, uploadError]);

    useEffect(() => () => {
        if (isUploading) {
            cancelUpload();
        }
    }, [cancelUpload, isUploading]);

    const toOrderedIllustrations = (nextIllustrations) =>
        nextIllustrations.map((illustration, index) => ({
            ...illustration,
            order: index,
        }));

    const commitIllustrations = (nextIllustrations) => {
        onChange?.(
            buildPostIllustrationFormState({
                illustrations: toOrderedIllustrations(nextIllustrations),
            })
        );
    };

    const resetSelectedFile = () => {
        setManualError(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleUploadSelectedFile = async () => {
        if (!selectedFile || !canAddMoreIllustrations) {
            return;
        }

        setManualError(null);

        try {
            const uploadedUrl = await upload(selectedFile, {
                allowedTypes: SUPPORTED_ILLUSTRATION_TYPES,
                maxSizeMB: 10,
            });

            commitIllustrations([
                ...illustrations,
                {
                    url: uploadedUrl,
                    alt: title || '',
                    caption: '',
                    credit: '',
                    order: illustrations.length,
                },
            ]);
            resetSelectedFile();
            reset();
        } catch (error) {
            console.error('Post illustration upload failed:', error);
        }
    };

    const handleAddRemoteIllustration = () => {
        setManualError(null);

        if (!canAddMoreIllustrations) {
            setManualError(`You can attach up to ${MAX_ILLUSTRATIONS} illustrations per post.`);
            return;
        }

        const nextUrl = remoteIllustration.url.trim();
        if (!nextUrl) {
            setManualError('Add an illustration URL before attaching it.');
            return;
        }

        if (!isHttpUrl(nextUrl)) {
            setManualError('Only valid http or https illustration URLs are supported.');
            return;
        }

        commitIllustrations([
            ...illustrations,
            {
                url: nextUrl,
                alt: remoteIllustration.alt.trim(),
                caption: remoteIllustration.caption.trim(),
                credit: remoteIllustration.credit.trim(),
                order: illustrations.length,
            },
        ]);
        setRemoteIllustration({ ...EMPTY_REMOTE_ILLUSTRATION });
    };

    const handleUpdateIllustration = (illustrationIndex, patch) => {
        const nextIllustrations = illustrations.map((illustration, index) =>
            index === illustrationIndex
                ? {
                    ...illustration,
                    ...patch,
                }
                : illustration
        );

        commitIllustrations(nextIllustrations);
    };

    const handleMoveIllustration = (illustrationIndex, direction) => {
        const nextIndex = illustrationIndex + direction;
        if (nextIndex < 0 || nextIndex >= illustrations.length) {
            return;
        }

        const nextIllustrations = [...illustrations];
        [nextIllustrations[illustrationIndex], nextIllustrations[nextIndex]] = [
            nextIllustrations[nextIndex],
            nextIllustrations[illustrationIndex],
        ];

        commitIllustrations(nextIllustrations);
    };

    const handleRemoveIllustration = (illustrationIndex) => {
        commitIllustrations(
            illustrations.filter((_, index) => index !== illustrationIndex)
        );
    };

    return (
        <div className='space-y-5'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
                <div className='space-y-1'>
                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                        {eyebrow}
                    </p>
                    <div className='flex flex-wrap items-center gap-3'>
                        <h3 className='text-xl font-semibold text-slate-900 dark:text-white'>
                            {heading}
                        </h3>
                        <Badge color='info'>
                            {illustrations.length}/{MAX_ILLUSTRATIONS} illustrations
                        </Badge>
                    </div>
                    <p className='max-w-2xl text-sm text-slate-600 dark:text-slate-300'>
                        {copy}
                    </p>
                </div>
                {leadIllustration ? (
                    <Badge color='success'>Lead illustration ready</Badge>
                ) : null}
            </div>

            <div className='grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]'>
                <div className='space-y-4 rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                    <div className='rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                <HiOutlineCloudArrowUp className='h-4 w-4 text-sky-500' />
                                Upload an illustration
                            </div>
                            {!canAddMoreIllustrations ? (
                                <span className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300'>
                                    Limit reached
                                </span>
                            ) : null}
                        </div>

                        <div className='mt-4 flex flex-col gap-3'>
                            <FileInput
                                ref={fileInputRef}
                                type='file'
                                accept={ILLUSTRATION_ACCEPT_ATTR}
                                helperText='JPEG, PNG, WebP, GIF, AVIF, or SVG.'
                                onChange={(event) =>
                                    setSelectedFile(event.target.files?.[0] || null)
                                }
                                disabled={isUploading || !canAddMoreIllustrations}
                                className='cursor-pointer rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80'
                            />

                            <div className='flex flex-wrap items-center gap-3'>
                                <Button
                                    type='button'
                                    onClick={handleUploadSelectedFile}
                                    disabled={
                                        !selectedFile || isUploading || !canAddMoreIllustrations
                                    }
                                    className='bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                >
                                    {isUploading ? 'Uploading...' : 'Add uploaded illustration'}
                                </Button>
                                {selectedFile ? (
                                    <>
                                        <span className='text-sm text-slate-500 dark:text-slate-400'>
                                            {selectedFile.name}
                                        </span>
                                        <Button
                                            size='xs'
                                            type='button'
                                            color='light'
                                            onClick={resetSelectedFile}
                                            className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                        >
                                            <span className='inline-flex items-center gap-1.5'>
                                                <HiOutlineXMark className='h-4 w-4' />
                                                Clear selection
                                            </span>
                                        </Button>
                                    </>
                                ) : (
                                    <span className='text-sm text-slate-500 dark:text-slate-400'>
                                        Choose one image at a time.
                                    </span>
                                )}
                            </div>
                        </div>

                        {isUploading ? (
                            <div className='mt-4 flex items-center gap-3'>
                                <Progress progress={progress} color='teal' className='flex-1' />
                                <span className='text-sm font-semibold text-slate-600 dark:text-slate-200'>
                                    {progress}%
                                </span>
                            </div>
                        ) : null}
                    </div>

                    <div className='rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70'>
                        <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                            <HiOutlineLink className='h-4 w-4 text-cyan-500' />
                            Attach a remote illustration URL
                        </div>

                        <div className='mt-4 space-y-3'>
                            <TextInput
                                value={remoteIllustration.url}
                                onChange={(event) =>
                                    setRemoteIllustration((currentIllustration) => ({
                                        ...currentIllustration,
                                        url: event.target.value,
                                    }))
                                }
                                placeholder='https://cdn.example.com/illustration.webp'
                                disabled={isUploading || !canAddMoreIllustrations}
                            />
                            <div className='grid gap-3 md:grid-cols-2'>
                                <TextInput
                                    value={remoteIllustration.alt}
                                    onChange={(event) =>
                                        setRemoteIllustration((currentIllustration) => ({
                                            ...currentIllustration,
                                            alt: event.target.value,
                                        }))
                                    }
                                    placeholder='Alt text for accessibility'
                                    disabled={isUploading || !canAddMoreIllustrations}
                                />
                                <TextInput
                                    value={remoteIllustration.credit}
                                    onChange={(event) =>
                                        setRemoteIllustration((currentIllustration) => ({
                                            ...currentIllustration,
                                            credit: event.target.value,
                                        }))
                                    }
                                    placeholder='Artist or source credit'
                                    disabled={isUploading || !canAddMoreIllustrations}
                                />
                            </div>
                            <div className='grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
                                <TextInput
                                    value={remoteIllustration.caption}
                                    onChange={(event) =>
                                        setRemoteIllustration((currentIllustration) => ({
                                            ...currentIllustration,
                                            caption: event.target.value,
                                        }))
                                    }
                                    placeholder='Optional caption or scene note'
                                    disabled={isUploading || !canAddMoreIllustrations}
                                />
                                <Button
                                    type='button'
                                    color='light'
                                    onClick={handleAddRemoteIllustration}
                                    disabled={isUploading || !canAddMoreIllustrations}
                                    className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                >
                                    Add illustration
                                </Button>
                            </div>
                        </div>
                    </div>

                    {uploadError || manualError ? (
                        <Alert color='failure'>{uploadError || manualError}</Alert>
                    ) : null}
                </div>

                <div className='space-y-3 rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                        <HiOutlineSparkles className='h-4 w-4 text-amber-500' />
                        Lead illustration preview
                    </div>

                    <div className='overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-800 dark:bg-slate-900'>
                        <div className='aspect-[4/3] w-full p-3'>
                            {leadIllustration ? (
                                <img
                                    src={leadIllustration.url}
                                    alt={leadIllustration.alt || leadIllustration.caption || title || 'Lead illustration'}
                                    className='h-full w-full rounded-2xl bg-slate-900/80 object-cover'
                                />
                            ) : (
                                <div className='flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400'>
                                    The first illustration appears here as the lead visual in the sequence.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'>
                        Keep alt text descriptive and credit the source when the artwork comes from a collaborator or external library.
                    </div>
                </div>
            </div>

            {illustrations.length > 0 ? (
                <div className='grid gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
                    {illustrations.map((illustration, index) => (
                        <article
                            key={`${illustration.url}-${index}`}
                            className='overflow-hidden rounded-[24px] border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/60'
                        >
                            <div className='aspect-[4/3] border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900'>
                                <img
                                    src={illustration.url}
                                    alt={
                                        illustration.alt
                                        || illustration.caption
                                        || `Illustration ${index + 1}`
                                    }
                                    className='h-full w-full rounded-2xl object-cover'
                                />
                            </div>

                            <div className='space-y-4 p-4'>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <Badge color='info'>
                                        <span className='inline-flex items-center gap-1.5'>
                                            <HiOutlinePhoto className='h-3.5 w-3.5' />
                                            Illustration
                                        </span>
                                    </Badge>
                                    <Badge color={index === 0 ? 'success' : 'gray'}>
                                        {index === 0 ? 'Lead illustration' : `Illustration ${index + 1}`}
                                    </Badge>
                                </div>

                                <div className='space-y-2'>
                                    <p className='truncate text-sm font-semibold text-slate-900 dark:text-white'>
                                        {illustration.url}
                                    </p>
                                    <TextInput
                                        value={illustration.alt || ''}
                                        onChange={(event) =>
                                            handleUpdateIllustration(index, {
                                                alt: event.target.value,
                                            })
                                        }
                                        placeholder='Alt text'
                                    />
                                    <TextInput
                                        value={illustration.caption || ''}
                                        onChange={(event) =>
                                            handleUpdateIllustration(index, {
                                                caption: event.target.value,
                                            })
                                        }
                                        placeholder='Caption or scene note'
                                    />
                                    <TextInput
                                        value={illustration.credit || ''}
                                        onChange={(event) =>
                                            handleUpdateIllustration(index, {
                                                credit: event.target.value,
                                            })
                                        }
                                        placeholder='Artist or source credit'
                                    />
                                </div>

                                <div className='flex flex-wrap gap-2'>
                                    <Button
                                        size='xs'
                                        type='button'
                                        color='light'
                                        onClick={() => handleMoveIllustration(index, -1)}
                                        disabled={index === 0}
                                        className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                    >
                                        Move up
                                    </Button>
                                    <Button
                                        size='xs'
                                        type='button'
                                        color='light'
                                        onClick={() => handleMoveIllustration(index, 1)}
                                        disabled={index === illustrations.length - 1}
                                        className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                    >
                                        Move down
                                    </Button>
                                    <Button
                                        size='xs'
                                        type='button'
                                        color='failure'
                                        onClick={() => handleRemoveIllustration(index)}
                                        className='inline-flex items-center gap-2'
                                    >
                                        <HiOutlineTrash className='h-4 w-4' />
                                        Remove
                                    </Button>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            ) : (
                <div className='rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400'>
                    No illustrations attached yet. Add concept art, step diagrams, or supporting frames when the story needs visual context.
                </div>
            )}
        </div>
    );
}
