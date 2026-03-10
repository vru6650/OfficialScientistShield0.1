import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from 'flowbite-react';

export default function FloatingPreviewWindow({
    title = 'Live preview',
    subtitle = 'Drag the header to move this window while you write.',
    metaLabel = '',
    onClose,
    children,
}) {
    const windowRef = useRef(null);
    const dragRef = useRef({
        active: false,
        originX: 0,
        originY: 0,
        startX: 0,
        startY: 0,
    });

    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const clampOffset = useCallback((x, y) => {
        if (typeof window === 'undefined') {
            return { x, y };
        }

        const panelRect = windowRef.current?.getBoundingClientRect();
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

    const startDrag = useCallback((event) => {
        if (event.button !== 0) {
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
    }, [offset.x, offset.y]);

    const resetPosition = useCallback(() => {
        setOffset({ x: 0, y: 0 });
    }, []);

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

        const handlePointerStop = () => {
            dragRef.current.active = false;
            setIsDragging(false);
        };

        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerStop);
        window.addEventListener('pointercancel', handlePointerStop);

        return () => {
            window.removeEventListener('pointermove', handlePointerMove);
            window.removeEventListener('pointerup', handlePointerStop);
            window.removeEventListener('pointercancel', handlePointerStop);
        };
    }, [clampOffset, isDragging]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return undefined;
        }

        const handleResize = () => {
            setOffset((previous) => clampOffset(previous.x, previous.y));
        };

        window.addEventListener('resize', handleResize);

        return () => window.removeEventListener('resize', handleResize);
    }, [clampOffset]);

    useEffect(() => {
        setOffset((previous) => clampOffset(previous.x, previous.y));
    }, [clampOffset, isExpanded, isMinimized]);

    const shellStyle = useMemo(
        () => ({
            position: 'fixed',
            top: isExpanded ? '1rem' : '5.5rem',
            right: '1rem',
            width: isExpanded ? 'min(96vw, 760px)' : 'min(92vw, 540px)',
            height: isMinimized ? 'auto' : isExpanded ? 'min(88vh, 860px)' : 'min(72vh, 720px)',
            zIndex: 80,
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0)`,
            borderRadius: 'var(--macos-window-radius)',
            margin: 0,
            touchAction: 'none',
        }),
        [isExpanded, isMinimized, offset.x, offset.y]
    );

    return (
        <section
            ref={windowRef}
            className={`macos-window macos-window--focused lg-hybrid-window pointer-events-auto select-none text-slate-700 transition-all duration-300 dark:text-slate-100 ${
                isDragging ? 'macos-window--dragging' : ''
            }`}
            style={shellStyle}
            aria-label={title}
        >
            <div className='macos-window__titlebar' onPointerDown={startDrag}>
                <div className='macos-traffic-lights'>
                    <button
                        type='button'
                        className='macos-traffic-light macos-traffic-light--close hover:brightness-110'
                        onClick={onClose}
                        aria-label='Hide preview window'
                        title='Hide preview window'
                    >
                        <span
                            className='macos-traffic-light__glyph macos-traffic-light__glyph--close'
                            aria-hidden='true'
                        />
                    </button>
                    <button
                        type='button'
                        className='macos-traffic-light macos-traffic-light--minimize hover:brightness-110'
                        onClick={() => setIsMinimized((value) => !value)}
                        aria-label={isMinimized ? 'Restore preview window' : 'Minimize preview window'}
                        title={isMinimized ? 'Restore preview window' : 'Minimize preview window'}
                    >
                        <span
                            className='macos-traffic-light__glyph macos-traffic-light__glyph--minimize'
                            aria-hidden='true'
                        />
                    </button>
                    <button
                        type='button'
                        className='macos-traffic-light macos-traffic-light--zoom hover:brightness-110'
                        onClick={() => setIsExpanded((value) => !value)}
                        aria-label={isExpanded ? 'Restore preview size' : 'Expand preview window'}
                        title={isExpanded ? 'Restore preview size' : 'Expand preview window'}
                    >
                        <span
                            className='macos-traffic-light__glyph macos-traffic-light__glyph--zoom'
                            aria-hidden='true'
                        />
                    </button>
                </div>

                <div className='macos-window__titlebar-center'>
                    <span className='macos-window__titlebar-icon' aria-hidden='true'>
                        <span className='h-2.5 w-2.5 rounded-full bg-sky-500' />
                    </span>
                    <span className='macos-window__titletext'>{title}</span>
                </div>

                {metaLabel ? (
                    <div className='relative z-[2] ml-auto hidden items-center gap-2 pr-1 sm:flex'>
                        <span className='macos-chip macos-chip--accent text-[10px]'>
                            {metaLabel}
                        </span>
                    </div>
                ) : (
                    <div className='ml-auto' />
                )}
            </div>

            {isMinimized ? null : (
                <div className='macos-window__content'>
                    <div className='macos-window__body pr-0'>
                        <div className='space-y-4'>
                            <div className='flex flex-wrap items-start justify-between gap-3 px-1'>
                                <div className='space-y-1'>
                                    <p className='text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                                        Floating preview
                                    </p>
                                    <p className='text-sm text-slate-600 dark:text-slate-300'>
                                        {subtitle}
                                    </p>
                                </div>

                                <Button
                                    size='xs'
                                    color='light'
                                    type='button'
                                    onClick={resetPosition}
                                    className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                                >
                                    Reset position
                                </Button>
                            </div>

                            {children}
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}
