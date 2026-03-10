import { useEffect, useMemo, useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Button, Tooltip } from 'flowbite-react';
import { HiArrowLeft, HiArrowRight, HiPlay, HiSpeakerWave, HiPhoto } from 'react-icons/hi2';

const renderMedia = (asset) => {
    if (!asset) return null;
    if (asset.type === 'video') {
        return (
            <video
                src={asset.url}
                controls
                className='h-full w-full object-contain rounded-2xl bg-slate-900/70'
            />
        );
    }
    if (asset.type === 'audio') {
        return (
            <div className='flex h-full items-center justify-center rounded-2xl bg-slate-900/70 p-6'>
                <audio src={asset.url} controls className='w-full' />
            </div>
        );
    }
    if (asset.type === 'document') {
        return (
            <div className='flex h-full flex-col items-center justify-center gap-3 rounded-2xl bg-slate-900/70 p-6 text-slate-100'>
                <div className='flex items-center gap-2 text-sm font-semibold'>
                    <span className='inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-800 text-white shadow'>PDF</span>
                    <span className='max-w-sm truncate'>{asset.caption || 'Document'}</span>
                </div>
                <a
                    href={asset.url}
                    target='_blank'
                    rel='noreferrer'
                    className='rounded-md bg-white/10 px-4 py-2 text-xs font-semibold text-slate-100 ring-1 ring-white/20 transition hover:bg-white/20'
                >
                    Open document
                </a>
            </div>
        );
    }
    return (
        <img
            src={asset.url}
            alt={asset.caption || 'Gallery item'}
            className='h-full w-full rounded-2xl object-contain bg-slate-900/70'
        />
    );
};

export default function GalleryCarousel({ items, initialIndex = 0 }) {
    const safeItems = useMemo(() => items || [], [items]);
    const [index, setIndex] = useState(() => Math.min(Math.max(initialIndex, 0), Math.max(safeItems.length - 1, 0)));

    useEffect(() => {
        setIndex(Math.min(Math.max(initialIndex, 0), Math.max(safeItems.length - 1, 0)));
    }, [initialIndex, safeItems.length]);

    const go = useCallback((delta) => {
        setIndex((prev) => {
            const next = (prev + delta + safeItems.length) % safeItems.length;
            return next;
        });
    }, [safeItems.length]);

    useEffect(() => {
        const onKey = (e) => {
            if (safeItems.length < 2) return;
            if (e.key === 'ArrowRight') go(1);
            if (e.key === 'ArrowLeft') go(-1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [go, safeItems.length]);

    if (!safeItems.length) return null;

    const active = safeItems[index];

    return (
        <div className='space-y-3'>
            <div className='relative overflow-hidden rounded-3xl border border-slate-200 bg-slate-50 p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900'>
                <div className='aspect-video w-full rounded-2xl bg-slate-900/60 p-2 sm:p-3'>
                    {renderMedia(active)}
                </div>
                <div className='pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/10' />
                {safeItems.length > 1 && (
                    <div className='absolute inset-y-0 left-0 flex items-center pl-2'>
                        <Tooltip content='Previous media'>
                            <Button size='xs' color='light' onClick={() => go(-1)}>
                                <HiArrowLeft className='h-4 w-4' />
                            </Button>
                        </Tooltip>
                    </div>
                )}
                {safeItems.length > 1 && (
                    <div className='absolute inset-y-0 right-0 flex items-center pr-2'>
                        <Tooltip content='Next media'>
                            <Button size='xs' color='light' onClick={() => go(1)}>
                                <HiArrowRight className='h-4 w-4' />
                            </Button>
                        </Tooltip>
                    </div>
                )}
            </div>
            <div className='grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6'>
                {safeItems.map((asset, idx) => {
                    const isActive = idx === index;
                    const icon =
                        asset.type === 'video'
                            ? HiPlay
                            : asset.type === 'audio'
                                ? HiSpeakerWave
                                : asset.type === 'document'
                                    ? HiPhoto
                                    : HiPhoto;
                    const Icon = icon;
                    return (
                        <button
                            key={`${asset.url}-${idx}`}
                            type='button'
                            onClick={() => setIndex(idx)}
                            className={`group relative overflow-hidden rounded-xl border p-1 transition ${
                                isActive
                                    ? 'border-sky-400 ring-2 ring-sky-200 dark:border-sky-500/70 dark:ring-sky-700/50'
                                    : 'border-slate-200 hover:border-sky-200 dark:border-slate-800 dark:hover:border-sky-600/60'
                            }`}
                        >
                            {asset.type === 'video' ? (
                                <video src={asset.url} className='h-16 w-full rounded-lg object-cover' />
                            ) : asset.type === 'audio' ? (
                                <div className='flex h-16 items-center justify-center rounded-lg bg-slate-900 text-slate-100'>
                                    <Icon className='h-5 w-5' />
                                </div>
                            ) : asset.type === 'document' ? (
                                <div className='flex h-16 items-center justify-center rounded-lg bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100'>
                                    <span className='rounded bg-slate-200 px-2 py-1 text-[10px] font-semibold dark:bg-slate-700'>DOC</span>
                                </div>
                            ) : (
                                <img src={asset.url} alt={asset.caption || `Media ${idx + 1}`} className='h-16 w-full rounded-lg object-cover' />
                            )}
                            <div className='absolute left-1 top-1 rounded-md bg-white/80 px-1.5 py-0.5 text-[10px] font-semibold text-slate-700 shadow-sm backdrop-blur dark:bg-slate-900/80 dark:text-slate-100 flex items-center gap-1'>
                                <Icon className='h-3 w-3' />
                                {idx + 1}
                            </div>
                        </button>
                    );
                })}
            </div>
            {active?.caption && (
                <p className='text-sm text-slate-600 dark:text-slate-300'>{active.caption}</p>
            )}
        </div>
    );
}

GalleryCarousel.propTypes = {
    items: PropTypes.arrayOf(
        PropTypes.shape({
            url: PropTypes.string.isRequired,
            type: PropTypes.oneOf(['image', 'video', 'audio', 'document']),
            caption: PropTypes.string,
            order: PropTypes.number,
        })
    ),
    initialIndex: PropTypes.number,
};
