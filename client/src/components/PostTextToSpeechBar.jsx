import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from 'flowbite-react';
import {
    HiOutlineArrowPath,
    HiOutlineArrowsPointingOut,
    HiOutlinePause,
    HiOutlineSpeakerWave,
    HiOutlineStop,
    HiOutlineXMark,
} from 'react-icons/hi2';
import { FaPlay } from 'react-icons/fa';

const SPEED_OPTIONS = [0.85, 1, 1.25, 1.5, 1.75];
const DESKTOP_BREAKPOINT = 1024;

export default function PostTextToSpeechBar({
    supported,
    status,
    message,
    activeBlockIndex,
    activeBlockText,
    blockCount,
    progress,
    remainingMinutes,
    voices,
    selectedVoiceURI,
    ttsRate,
    onVoiceChange,
    onRateChange,
    onStart,
    onPauseResume,
    onRestart,
    onStop,
    onClose,
}) {
    const panelRef = useRef(null);
    const dragRef = useRef({
        active: false,
        originX: 0,
        originY: 0,
        startX: 0,
        startY: 0,
    });

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isDesktop, setIsDesktop] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth >= DESKTOP_BREAKPOINT : false,
    );

    const isPlaying = status === 'playing';
    const isPaused = status === 'paused';
    const isCompleted = status === 'completed';
    const hasActiveBlock = activeBlockIndex >= 0 && blockCount > 0;
    const primaryLabel = isPlaying ? 'Pause' : isPaused ? 'Resume' : 'Listen';
    const PrimaryIcon = isPlaying ? HiOutlinePause : FaPlay;
    const progressLabel = isCompleted
        ? `Finished ${blockCount} sections`
        : hasActiveBlock
            ? `Section ${activeBlockIndex + 1} of ${blockCount}`
            : blockCount
                ? `${blockCount} sections detected`
                : 'Waiting for readable blocks';
    const playerCopy = supported
        ? activeBlockText || message
        : 'This browser does not expose a Web Speech voice engine for article playback.';
    const clampOffset = useCallback((x, y) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }

        const panelRect = panelRef.current?.getBoundingClientRect();
        if (!panelRect) {
            return { x, y };
        }

        const edgePadding = 12;
        const minX = -(panelRect.left - edgePadding);
        const maxX = window.innerWidth - panelRect.right - edgePadding;
        const minY = -(panelRect.top - edgePadding);
        const maxY = window.innerHeight - panelRect.bottom - edgePadding;

        return {
            x: Math.min(Math.max(x, minX), maxX),
            y: Math.min(Math.max(y, minY), maxY),
        };
    }, []);

    const startDrag = useCallback(
        (event) => {
            if (!isDesktop || event.button !== 0) {
                return;
            }

            const target = event.target;
            if (target?.closest?.('button, input, textarea, select, a, label')) {
                return;
            }

            dragRef.current = {
                active: true,
                originX: offset.x,
                originY: offset.y,
                startX: event.clientX,
                startY: event.clientY,
            };
            setIsDragging(true);
            event.preventDefault();
        },
        [isDesktop, offset.x, offset.y],
    );

    useEffect(() => {
        if (!isDragging) {
            return undefined;
        }

        const handlePointerMove = (event) => {
            const drag = dragRef.current;
            if (!drag.active) {
                return;
            }

            const nextX = drag.originX + (event.clientX - drag.startX);
            const nextY = drag.originY + (event.clientY - drag.startY);

            setOffset((previous) => {
                const clamped = clampOffset(nextX, nextY);
                if (previous.x === clamped.x && previous.y === clamped.y) {
                    return previous;
                }

                return clamped;
            });
        };

        const stopDragging = () => {
            dragRef.current.active = false;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', stopDragging);
        window.addEventListener('pointercancel', stopDragging);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', stopDragging);
            window.removeEventListener('pointercancel', stopDragging);
        };
    }, [clampOffset, isDragging]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handleResize = () => {
            const nextIsDesktop = window.innerWidth >= DESKTOP_BREAKPOINT;
            setIsDesktop(nextIsDesktop);
            setOffset((previous) => (nextIsDesktop ? clampOffset(previous.x, previous.y) : { x: 0, y: 0 }));
        };

        handleResize();
        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [clampOffset]);

    useEffect(() => {
        if (!isDesktop) {
            return;
        }

        setOffset((previous) => clampOffset(previous.x, previous.y));
    }, [activeBlockText, blockCount, clampOffset, isDesktop, message, remainingMinutes, status]);

    const shellStyle = useMemo(() => {
        if (!isDesktop) {
            return undefined;
        }

        return {
            position: 'fixed',
            top: '5.5rem',
            right: '1rem',
            width: 'min(94vw, 34rem)',
            maxHeight: 'calc(100vh - 7rem)',
            zIndex: 60,
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
        };
    }, [isDesktop, offset.x, offset.y]);

    return (
        <section
            ref={panelRef}
            style={shellStyle}
            className={`overflow-hidden rounded-[28px] border border-white/35 bg-white/75 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.8)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/72 ${
                isDesktop ? 'pointer-events-auto' : 'sticky top-20 z-20'
            } ${isDragging ? 'shadow-[0_28px_70px_-36px_rgba(15,23,42,0.95)]' : ''}`}
        >
            <div
                className='absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.18),transparent_34%),radial-gradient(circle_at_85%_10%,rgba(250,204,21,0.16),transparent_22%)]'
                aria-hidden='true'
            />
            <div className='relative space-y-4 p-4 sm:p-5'>
                <div
                    onPointerDown={startDrag}
                    className={`flex items-center justify-between gap-3 rounded-2xl border border-white/45 bg-white/65 px-3 py-2 shadow-sm backdrop-blur dark:border-white/10 dark:bg-slate-950/35 ${
                        isDesktop ? 'cursor-grab active:cursor-grabbing' : ''
                    }`}
                >
                    <div className='inline-flex items-center gap-2 rounded-full bg-sky-100/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-sky-700 shadow-sm ring-1 ring-sky-200 dark:bg-sky-950/60 dark:text-sky-100 dark:ring-sky-500/30'>
                        <HiOutlineSpeakerWave className='h-4 w-4' aria-hidden='true' />
                        Listen Mode
                    </div>
                    <div className='flex items-center gap-2'>
                        <div className='inline-flex items-center gap-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                            {isDesktop ? (
                                <>
                                    <HiOutlineArrowsPointingOut className='h-4 w-4' aria-hidden='true' />
                                    Drag player
                                </>
                            ) : (
                                'Voice controls'
                            )}
                        </div>
                        <button
                            type='button'
                            onClick={onClose}
                            className='rounded-full border border-slate-200/80 bg-white/80 p-1.5 text-slate-500 transition hover:bg-white hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/75 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white'
                            aria-label='Close listen mode'
                            title='Close listen mode'
                        >
                            <HiOutlineXMark className='h-4 w-4' aria-hidden='true' />
                        </button>
                    </div>
                </div>

                <div className={`space-y-4 ${isDesktop ? 'max-h-[calc(100vh-11rem)] overflow-y-auto pr-1' : ''}`}>
                    <div className='flex flex-col gap-4'>
                        <div className='space-y-2'>
                            <div className='flex items-center gap-2'>
                                <HiOutlineSpeakerWave className='h-5 w-5 text-sky-600 dark:text-sky-300' aria-hidden='true' />
                                <h2 className='text-lg font-semibold text-slate-900 dark:text-white'>
                                    Voice reader for this post
                                </h2>
                            </div>
                            <p className='max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300'>
                                {playerCopy}
                            </p>
                        </div>

                        <div className='flex flex-wrap items-center gap-2'>
                            <Button
                                type='button'
                                onClick={isPlaying ? onPauseResume : isPaused ? onPauseResume : onStart}
                                disabled={!supported}
                                className='bg-gradient-to-r from-sky-600 via-cyan-500 to-emerald-500 text-white shadow-lg shadow-sky-500/20 ring-1 ring-sky-300 transition hover:shadow-xl focus:ring-2 focus:ring-sky-300 dark:ring-sky-500/70'
                            >
                                <span className='flex items-center gap-2'>
                                    <PrimaryIcon className='h-4 w-4' />
                                    {primaryLabel}
                                </span>
                            </Button>
                            <Button
                                type='button'
                                color='light'
                                onClick={onRestart}
                                disabled={!supported || !blockCount}
                                className='border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800'
                            >
                                <span className='flex items-center gap-2'>
                                    <HiOutlineArrowPath className='h-4 w-4' />
                                    Restart
                                </span>
                            </Button>
                            <Button
                                type='button'
                                color='light'
                                onClick={onStop}
                                disabled={!supported || status === 'idle' || isCompleted}
                                className='border border-slate-200 bg-white/80 text-slate-700 hover:bg-white dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:bg-slate-800'
                            >
                                <span className='flex items-center gap-2'>
                                    <HiOutlineStop className='h-4 w-4' />
                                    Stop
                                </span>
                            </Button>
                        </div>
                    </div>

                    <div className='grid gap-4'>
                        <div className='rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <div className='flex flex-wrap items-center justify-between gap-3'>
                                <div>
                                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                        Playback progress
                                    </p>
                                    <p className='mt-1 text-sm font-semibold text-slate-900 dark:text-white'>
                                        {progressLabel}
                                    </p>
                                </div>
                                <div className='flex flex-wrap items-center gap-2'>
                                    <span className='rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-200 dark:ring-emerald-500/25'>
                                        {status === 'playing'
                                            ? 'Speaking'
                                            : status === 'paused'
                                                ? 'Paused'
                                                : status === 'completed'
                                                    ? 'Complete'
                                                : status === 'error'
                                                    ? 'Needs attention'
                                                    : 'Ready'}
                                    </span>
                                    <span className='rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700'>
                                        {remainingMinutes ? `~${remainingMinutes} min left` : 'Instant controls'}
                                    </span>
                                </div>
                            </div>

                            <div className='mt-4 h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800'>
                                <div
                                    className='h-full rounded-full bg-gradient-to-r from-sky-500 via-cyan-400 to-emerald-400 transition-all duration-500'
                                    style={{ width: `${progress}%` }}
                                />
                            </div>

                            <div className='mt-4 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-4 dark:border-slate-700 dark:bg-slate-900/40'>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Now reading
                                </p>
                                <p className='mt-2 text-sm leading-7 text-slate-700 dark:text-slate-200'>
                                    {activeBlockText || message}
                                </p>
                            </div>
                        </div>

                        <div className='space-y-4 rounded-3xl border border-slate-200/80 bg-white/80 p-4 shadow-inner shadow-slate-200/50 dark:border-slate-800/80 dark:bg-slate-950/50 dark:shadow-black/20'>
                            <div>
                                <label
                                    htmlFor='post-tts-voice'
                                    className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'
                                >
                                    Voice
                                </label>
                                <select
                                    id='post-tts-voice'
                                    value={selectedVoiceURI}
                                    onChange={(event) => onVoiceChange(event.target.value)}
                                    disabled={!supported || !voices.length}
                                    className='mt-2 w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none transition focus:border-sky-400 focus:ring-2 focus:ring-sky-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:focus:border-sky-500'
                                >
                                    <option value=''>System voice</option>
                                    {voices.map((voice) => (
                                        <option key={voice.voiceURI} value={voice.voiceURI}>
                                            {voice.name} {voice.lang ? `(${voice.lang})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500'>
                                    Playback speed
                                </p>
                                <div className='mt-2 flex flex-wrap gap-2'>
                                    {SPEED_OPTIONS.map((option) => {
                                        const isActive = Math.abs(Number(ttsRate) - option) < 0.01;
                                        return (
                                            <button
                                                key={option}
                                                type='button'
                                                onClick={() => onRateChange(option)}
                                                className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-sky-500 via-cyan-500 to-emerald-400 text-white shadow-sm'
                                                        : 'border border-slate-200 bg-white text-slate-600 hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-200'
                                                }`}
                                            >
                                                {option.toFixed(2).replace(/\.00$/, '')}x
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}

PostTextToSpeechBar.propTypes = {
    supported: PropTypes.bool.isRequired,
    status: PropTypes.string.isRequired,
    message: PropTypes.string.isRequired,
    activeBlockIndex: PropTypes.number.isRequired,
    activeBlockText: PropTypes.string.isRequired,
    blockCount: PropTypes.number.isRequired,
    progress: PropTypes.number.isRequired,
    remainingMinutes: PropTypes.number.isRequired,
    voices: PropTypes.arrayOf(
        PropTypes.shape({
            voiceURI: PropTypes.string,
            name: PropTypes.string,
            lang: PropTypes.string,
        }),
    ).isRequired,
    selectedVoiceURI: PropTypes.string.isRequired,
    ttsRate: PropTypes.number.isRequired,
    onVoiceChange: PropTypes.func.isRequired,
    onRateChange: PropTypes.func.isRequired,
    onStart: PropTypes.func.isRequired,
    onPauseResume: PropTypes.func.isRequired,
    onRestart: PropTypes.func.isRequired,
    onStop: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
};
