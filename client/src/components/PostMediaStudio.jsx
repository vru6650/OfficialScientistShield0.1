import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, FileInput, Progress, Select, TextInput } from 'flowbite-react';
import {
    HiOutlineCloudArrowUp,
    HiOutlineDocumentText,
    HiOutlineFilm,
    HiOutlineLink,
    HiOutlineMusicalNote,
    HiOutlinePhoto,
    HiOutlineSparkles,
    HiOutlineTrash,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import {
    buildPostMediaFormState,
    coercePostMediaState,
    inferPostMediaTypeFromMime,
} from '../utils/postMedia.js';

const MAX_MEDIA_ASSETS = 8;
const SUPPORTED_UPLOAD_TYPES = Object.freeze([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/mp4',
    'audio/wav',
    'audio/ogg',
    'audio/aac',
    'application/pdf',
]);
const MEDIA_ACCEPT_ATTR = SUPPORTED_UPLOAD_TYPES.join(',');
const EMPTY_REMOTE_ASSET = Object.freeze({
    url: '',
    type: 'video',
    caption: '',
});

const uploadLimitsByType = {
    image: 6,
    video: 120,
    audio: 30,
    document: 25,
};

const assetTypeOptions = [
    { value: 'image', label: 'Image', Icon: HiOutlinePhoto },
    { value: 'video', label: 'Video', Icon: HiOutlineFilm },
    { value: 'audio', label: 'Audio', Icon: HiOutlineMusicalNote },
    { value: 'document', label: 'Document', Icon: HiOutlineDocumentText },
];

const getAssetMeta = (type = 'image') =>
    assetTypeOptions.find((option) => option.value === type) || assetTypeOptions[0];

const isHttpUrl = (value) => {
    try {
        const nextUrl = new URL(value);
        return nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

const renderAssetPreview = (asset, fallbackTitle) => {
    if (!asset) {
        return null;
    }

    if (asset.type === 'video') {
        return (
            <video
                src={asset.url}
                controls
                className='h-full w-full rounded-2xl bg-slate-900/80 object-cover'
            />
        );
    }

    if (asset.type === 'audio') {
        return (
            <div className='flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950 px-4 text-slate-100'>
                <HiOutlineMusicalNote className='h-8 w-8 text-amber-300' />
                <audio src={asset.url} controls className='w-full' />
            </div>
        );
    }

    if (asset.type === 'document') {
        return (
            <div className='flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-950 px-4 text-center text-slate-100'>
                <HiOutlineDocumentText className='h-8 w-8 text-cyan-300' />
                <p className='text-sm font-semibold'>
                    {asset.caption || fallbackTitle || 'Attached document'}
                </p>
                <a
                    href={asset.url}
                    target='_blank'
                    rel='noreferrer'
                    className='rounded-full border border-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-100 transition hover:bg-white/10'
                >
                    Open
                </a>
            </div>
        );
    }

    return (
        <img
            src={asset.url}
            alt={asset.caption || fallbackTitle || 'Attached media'}
            className='h-full w-full rounded-2xl bg-slate-900/80 object-cover'
        />
    );
};

export default function PostMediaStudio({
    value,
    title = '',
    onChange,
    onStatusChange,
    legacyPosterImage = null,
    eyebrow = 'Advanced multimedia',
    heading = 'Build a mixed media story deck',
    copy = 'Add images, clips, audio, and docs. Reorder them, choose the lead asset, and publish a richer post experience.',
}) {
    const fileInputRef = useRef(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [remoteAsset, setRemoteAsset] = useState(() => ({ ...EMPTY_REMOTE_ASSET }));
    const [manualError, setManualError] = useState(null);
    const {
        upload,
        progress,
        error: uploadError,
        isUploading,
        cancelUpload,
        reset,
    } = useCloudinaryUpload();

    const mediaState = useMemo(() => coercePostMediaState(value), [value]);
    const mediaAssets = mediaState.mediaAssets;
    const canAddMoreAssets = mediaAssets.length < MAX_MEDIA_ASSETS;

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

    const toOrderedAssets = (nextAssets) =>
        nextAssets.map((asset, index) => ({
            ...asset,
            order: index,
        }));

    const commitMediaAssets = (nextAssets, requestedCoverAssetIndex = mediaState.coverAssetIndex) => {
        onChange?.(
            buildPostMediaFormState({
                mediaAssets: toOrderedAssets(nextAssets),
                coverAssetIndex: requestedCoverAssetIndex,
                fallbackImage: legacyPosterImage,
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
        if (!selectedFile || !canAddMoreAssets) {
            return;
        }

        setManualError(null);

        const inferredType = inferPostMediaTypeFromMime(selectedFile.type || '');

        try {
            const uploadedUrl = await upload(selectedFile, {
                allowedTypes: SUPPORTED_UPLOAD_TYPES,
                maxSizeMB: uploadLimitsByType[inferredType] || 25,
            });

            commitMediaAssets([
                ...mediaAssets,
                {
                    url: uploadedUrl,
                    type: inferredType,
                    caption: '',
                    order: mediaAssets.length,
                },
            ]);
            resetSelectedFile();
            reset();
        } catch (error) {
            console.error('Post media upload failed:', error);
        }
    };

    const handleAddRemoteAsset = () => {
        setManualError(null);

        if (!canAddMoreAssets) {
            setManualError(`You can attach up to ${MAX_MEDIA_ASSETS} media items per post.`);
            return;
        }

        const nextUrl = remoteAsset.url.trim();

        if (!nextUrl) {
            setManualError('Add a media URL before attaching it.');
            return;
        }

        if (!isHttpUrl(nextUrl)) {
            setManualError('Only valid http or https media URLs are supported.');
            return;
        }

        commitMediaAssets([
            ...mediaAssets,
            {
                url: nextUrl,
                type: remoteAsset.type,
                caption: remoteAsset.caption.trim(),
                order: mediaAssets.length,
            },
        ]);
        setRemoteAsset({ ...EMPTY_REMOTE_ASSET });
    };

    const handleUpdateAsset = (assetIndex, patch) => {
        const nextAssets = mediaAssets.map((asset, index) =>
            index === assetIndex
                ? {
                    ...asset,
                    ...patch,
                }
                : asset
        );

        commitMediaAssets(nextAssets);
    };

    const handleMoveAsset = (assetIndex, direction) => {
        const nextIndex = assetIndex + direction;
        if (nextIndex < 0 || nextIndex >= mediaAssets.length) {
            return;
        }

        const nextAssets = [...mediaAssets];
        [nextAssets[assetIndex], nextAssets[nextIndex]] = [nextAssets[nextIndex], nextAssets[assetIndex]];

        const nextCoverIndex =
            mediaState.coverAssetIndex === assetIndex
                ? nextIndex
                : mediaState.coverAssetIndex === nextIndex
                    ? assetIndex
                    : mediaState.coverAssetIndex;

        commitMediaAssets(nextAssets, nextCoverIndex);
    };

    const handleRemoveAsset = (assetIndex) => {
        const nextAssets = mediaAssets.filter((_, index) => index !== assetIndex);
        const nextCoverIndex =
            mediaState.coverAssetIndex > assetIndex
                ? mediaState.coverAssetIndex - 1
                : mediaState.coverAssetIndex === assetIndex
                    ? 0
                    : mediaState.coverAssetIndex;

        commitMediaAssets(nextAssets, nextCoverIndex);
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
                            {mediaAssets.length}/{MAX_MEDIA_ASSETS} assets
                        </Badge>
                    </div>
                    <p className='max-w-2xl text-sm text-slate-600 dark:text-slate-300'>
                        {copy}
                    </p>
                </div>
                {mediaAssets[mediaState.coverAssetIndex] ? (
                    <Badge color='success'>
                        Lead: {getAssetMeta(mediaAssets[mediaState.coverAssetIndex].type).label}
                    </Badge>
                ) : null}
            </div>

            <div className='grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]'>
                <div className='space-y-4 rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                    <div className='rounded-[22px] border border-slate-200 bg-slate-50/80 p-4 shadow-inner dark:border-slate-800 dark:bg-slate-900/70'>
                        <div className='flex flex-wrap items-center justify-between gap-3'>
                            <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                                <HiOutlineCloudArrowUp className='h-4 w-4 text-sky-500' />
                                Upload a media asset
                            </div>
                            {!canAddMoreAssets ? (
                                <span className='text-xs font-semibold uppercase tracking-[0.18em] text-amber-600 dark:text-amber-300'>
                                    Limit reached
                                </span>
                            ) : null}
                        </div>

                        <div className='mt-4 flex flex-col gap-3'>
                            <FileInput
                                ref={fileInputRef}
                                type='file'
                                accept={MEDIA_ACCEPT_ATTR}
                                helperText='Images, video, audio, or PDF documents.'
                                onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                                disabled={isUploading || !canAddMoreAssets}
                                className='cursor-pointer rounded-xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-700 dark:bg-slate-900/80'
                            />

                            <div className='flex flex-wrap items-center gap-3'>
                                <Button
                                    type='button'
                                    onClick={handleUploadSelectedFile}
                                    disabled={!selectedFile || isUploading || !canAddMoreAssets}
                                    className='bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-md ring-1 ring-sky-300 transition hover:shadow-lg focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                                >
                                    {isUploading ? 'Uploading...' : 'Add uploaded asset'}
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
                                        Choose one file at a time.
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
                            Attach a remote media URL
                        </div>

                        <div className='mt-4 grid gap-3 md:grid-cols-[minmax(0,1.3fr)_minmax(160px,0.5fr)]'>
                            <TextInput
                                value={remoteAsset.url}
                                onChange={(event) =>
                                    setRemoteAsset((currentAsset) => ({
                                        ...currentAsset,
                                        url: event.target.value,
                                    }))
                                }
                                placeholder='https://cdn.example.com/demo.mp4'
                                disabled={isUploading || !canAddMoreAssets}
                            />
                            <Select
                                value={remoteAsset.type}
                                onChange={(event) =>
                                    setRemoteAsset((currentAsset) => ({
                                        ...currentAsset,
                                        type: event.target.value,
                                    }))
                                }
                                disabled={isUploading || !canAddMoreAssets}
                            >
                                {assetTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div className='mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]'>
                            <TextInput
                                value={remoteAsset.caption}
                                onChange={(event) =>
                                    setRemoteAsset((currentAsset) => ({
                                        ...currentAsset,
                                        caption: event.target.value,
                                    }))
                                }
                                placeholder='Optional caption or context'
                                disabled={isUploading || !canAddMoreAssets}
                            />
                            <Button
                                type='button'
                                color='light'
                                onClick={handleAddRemoteAsset}
                                disabled={isUploading || !canAddMoreAssets}
                                className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                            >
                                Add remote asset
                            </Button>
                        </div>
                    </div>

                    {uploadError || manualError ? (
                        <Alert color='failure'>
                            {uploadError || manualError}
                        </Alert>
                    ) : null}
                </div>

                <div className='space-y-3 rounded-[24px] border border-slate-200 bg-white/80 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/50'>
                    <div className='flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white'>
                        <HiOutlineSparkles className='h-4 w-4 text-amber-500' />
                        Lead media preview
                    </div>

                    <div className='overflow-hidden rounded-[22px] border border-slate-200 bg-slate-50 shadow-inner dark:border-slate-800 dark:bg-slate-900'>
                        <div className='aspect-video w-full p-3'>
                            {mediaAssets[mediaState.coverAssetIndex] ? (
                                renderAssetPreview(
                                    mediaAssets[mediaState.coverAssetIndex],
                                    title
                                )
                            ) : (
                                <div className='flex h-full items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white/80 px-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400'>
                                    The selected lead asset appears here.
                                </div>
                            )}
                        </div>
                    </div>

                    <div className='rounded-[20px] border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300'>
                        The first selected lead item becomes the post hero. Additional assets show up as a gallery on the published post page.
                    </div>
                </div>
            </div>

            {mediaAssets.length > 0 ? (
                <div className='grid gap-4 lg:grid-cols-2 2xl:grid-cols-3'>
                    {mediaAssets.map((asset, index) => {
                        const { Icon, label } = getAssetMeta(asset.type);
                        const isLeadAsset = index === mediaState.coverAssetIndex;

                        return (
                            <article
                                key={`${asset.url}-${index}`}
                                className='overflow-hidden rounded-[24px] border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/60'
                            >
                                <div className='aspect-video border-b border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900'>
                                    {renderAssetPreview(asset, title)}
                                </div>

                                <div className='space-y-4 p-4'>
                                    <div className='flex flex-wrap items-center gap-2'>
                                        <Badge color='info'>
                                            <span className='inline-flex items-center gap-1.5'>
                                                <Icon className='h-3.5 w-3.5' />
                                                {label}
                                            </span>
                                        </Badge>
                                        <Badge color={isLeadAsset ? 'success' : 'gray'}>
                                            {isLeadAsset ? 'Lead asset' : `Asset ${index + 1}`}
                                        </Badge>
                                    </div>

                                    <div className='space-y-2'>
                                        <p className='truncate text-sm font-semibold text-slate-900 dark:text-white'>
                                            {asset.url}
                                        </p>
                                        <TextInput
                                            value={asset.caption || ''}
                                            onChange={(event) =>
                                                handleUpdateAsset(index, {
                                                    caption: event.target.value,
                                                })
                                            }
                                            placeholder='Add a caption or short context'
                                        />
                                    </div>

                                    <div className='flex flex-wrap gap-2'>
                                        <Button
                                            size='xs'
                                            type='button'
                                            color={isLeadAsset ? 'success' : 'light'}
                                            onClick={() => commitMediaAssets(mediaAssets, index)}
                                            className={
                                                isLeadAsset
                                                    ? ''
                                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                            }
                                        >
                                            {isLeadAsset ? 'Lead media' : 'Set as lead'}
                                        </Button>
                                        <Button
                                            size='xs'
                                            type='button'
                                            color='light'
                                            onClick={() => handleMoveAsset(index, -1)}
                                            disabled={index === 0}
                                            className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                        >
                                            Move up
                                        </Button>
                                        <Button
                                            size='xs'
                                            type='button'
                                            color='light'
                                            onClick={() => handleMoveAsset(index, 1)}
                                            disabled={index === mediaAssets.length - 1}
                                            className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                        >
                                            Move down
                                        </Button>
                                        <Button
                                            size='xs'
                                            type='button'
                                            color='failure'
                                            onClick={() => handleRemoveAsset(index)}
                                            className='inline-flex items-center gap-2'
                                        >
                                            <HiOutlineTrash className='h-4 w-4' />
                                            Remove
                                        </Button>
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            ) : (
                <div className='rounded-[24px] border border-dashed border-slate-300 bg-white/70 px-5 py-8 text-center text-sm leading-7 text-slate-500 dark:border-slate-700 dark:bg-slate-950/40 dark:text-slate-400'>
                    No media attached yet. Start with an image, clip, audio segment, or supporting document.
                </div>
            )}
        </div>
    );
}
