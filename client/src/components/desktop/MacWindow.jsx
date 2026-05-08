import PropTypes from 'prop-types';
import { memo, useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { iconComponentForType } from './windowIcons';

// Dedicated Mac-like window component used by the desktop window manager.
function MacWindow({
    windowData,
    isFocused,
    isDragging,
    reduceMotion,
    renderContent,
    children,
    onPointerDown,
    onClose,
    onMinimize,
    onZoom,
    onFocus,
    onResizeStart,
    onApplyLayout,
    layoutPresets,
}) {
    const {
        id,
        title,
        x,
        y,
        width,
        height,
        z,
        allowClose,
        allowMinimize,
        allowZoom,
        type,
    } = windowData;
    const isFullScreen = Boolean(windowData.isZoomed);
    const isWorkspaceWindow = Boolean(windowData.isMain || windowData.isAppWindow);
    const IconComponent = windowData.iconComponent || iconComponentForType(type);
    const [snapMenuOpen, setSnapMenuOpen] = useState(false);
    const snapMenuEnabled = allowZoom && layoutPresets.length > 0 && typeof onApplyLayout === 'function';

    const windowClassName = useMemo(
        () =>
            `macos-window lg-hybrid-window pointer-events-auto select-none text-slate-700 transition-all ${
                reduceMotion ? 'duration-75' : 'duration-300'
            } dark:border-white/10 dark:bg-slate-950/70 dark:text-slate-100 ${
                isFocused ? 'macos-window--focused ring-2 ring-brand-300/60 dark:ring-brand-500/60' : 'ring-0'
            } ${isFullScreen ? 'macos-window--fullscreen' : ''} ${isWorkspaceWindow ? 'macos-window--workspace' : ''} ${isDragging ? 'macos-window--dragging' : ''}`,
        [isDragging, isFocused, isFullScreen, isWorkspaceWindow, reduceMotion]
    );

    const motionTransition = reduceMotion ? { duration: 0 } : { duration: 0.18, ease: 'easeOut' };
    const motionInitial = reduceMotion ? false : { opacity: 0, scale: 0.98, y: 12 };
    const motionExit = reduceMotion ? { opacity: 0, transition: { duration: 0 } } : { opacity: 0, scale: 0.95, y: 12 };

    const handlePointerDown = (event) => {
        if (typeof onPointerDown === 'function') {
            onPointerDown(event, id);
        }
    };

    const handleFocus = () => {
        if (typeof onFocus === 'function') {
            onFocus(id);
        }
    };

    const handleControlPointerDown = (event) => {
        event.stopPropagation();
        handleFocus();
    };

    const handleClose = (options = {}) => {
        if (allowClose && typeof onClose === 'function') {
            onClose(id, options);
        }
    };

    const handleMinimize = (options = {}) => {
        if (allowMinimize && typeof onMinimize === 'function') {
            onMinimize(id, options);
        }
    };

    const handleZoom = (options = {}) => {
        if (allowZoom && typeof onZoom === 'function') {
            onZoom(id, options);
        }
    };

    const buildModifierState = (event) => ({
        altKey: event.altKey,
        metaKey: event.metaKey,
        ctrlKey: event.ctrlKey,
        shiftKey: event.shiftKey,
    });

    const handleCloseClick = (event) => {
        event.stopPropagation();
        handleClose(buildModifierState(event));
    };

    const handleMinimizeClick = (event) => {
        event.stopPropagation();
        handleMinimize(buildModifierState(event));
    };

    const handleZoomClick = (event) => {
        event.stopPropagation();
        setSnapMenuOpen(false);
        handleZoom(buildModifierState(event));
    };

    const openSnapMenu = (event) => {
        event.stopPropagation();
        if (snapMenuEnabled) {
            setSnapMenuOpen(true);
        }
    };

    const closeSnapMenu = () => {
        setSnapMenuOpen(false);
    };

    const handleSnapMenuPointerDown = (event) => {
        event.stopPropagation();
    };

    const handleSnapMenuKeyDown = (event) => {
        if (event.key === 'Escape') {
            event.preventDefault();
            setSnapMenuOpen(false);
        }
    };

    const handleApplyLayout = (presetId) => (event) => {
        event.preventDefault();
        event.stopPropagation();
        if (snapMenuEnabled) {
            onApplyLayout(id, presetId);
            setSnapMenuOpen(false);
        }
    };

    useEffect(() => {
        if (!snapMenuEnabled && snapMenuOpen) {
            setSnapMenuOpen(false);
        }
    }, [snapMenuEnabled, snapMenuOpen]);

    const startResize = (direction) => (event) => {
        if (typeof onResizeStart === 'function') {
            onResizeStart(event, id, direction);
        }
    };

    const content = renderContent ? renderContent(windowData) : children;

    return (
        <motion.div
            layout
            data-window-id={id}
            data-window-type={type}
            data-focused={isFocused}
            className={windowClassName}
            style={{
                position: 'fixed',
                top: y,
                left: x,
                width,
                height,
                zIndex: z,
                cursor: 'default',
                touchAction: 'none',
                margin: 0,
                borderRadius: 'var(--macos-window-radius)',
            }}
            initial={motionInitial}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={motionExit}
            transition={motionTransition}
            onMouseDown={handleFocus}
            onFocus={handleFocus}
            tabIndex={0}
            role="group"
            aria-label={`${title} window`}
            data-dragging={isDragging ? 'true' : 'false'}
        >
            <div className="macos-window__resize macos-window__resize--n" onPointerDown={startResize('n')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--s" onPointerDown={startResize('s')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--e" onPointerDown={startResize('e')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--w" onPointerDown={startResize('w')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--ne" onPointerDown={startResize('ne')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--nw" onPointerDown={startResize('nw')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--se" onPointerDown={startResize('se')} aria-hidden="true" />
            <div className="macos-window__resize macos-window__resize--sw" onPointerDown={startResize('sw')} aria-hidden="true" />
            <div
                className="macos-window__titlebar"
                onPointerDown={handlePointerDown}
                onDoubleClick={handleZoom}
                title={`Drag to move${allowZoom ? ' • Double-click to toggle full screen' : ''} • Hold Alt for power controls`}
                role="presentation"
            >
                <div className="macos-traffic-lights">
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--close ${!allowClose ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Close window"
                        data-window-control="close"
                        onPointerDown={handleControlPointerDown}
                        onClick={handleCloseClick}
                        title="Close window (Alt+Click: close all utility windows)"
                        disabled={!allowClose}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--close" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--minimize ${!allowMinimize ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Minimize window"
                        data-window-control="minimize"
                        onPointerDown={handleControlPointerDown}
                        onClick={handleMinimizeClick}
                        title="Minimize window (Alt+Click: stash other windows)"
                        disabled={!allowMinimize}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--minimize" aria-hidden="true" />
                    </button>
                    <button
                        type="button"
                        className={`macos-traffic-light macos-traffic-light--zoom ${!allowZoom ? 'opacity-40 cursor-not-allowed' : 'hover:brightness-110 transition'} `}
                        aria-label="Zoom window"
                        aria-expanded={snapMenuEnabled ? snapMenuOpen : undefined}
                        aria-haspopup={snapMenuEnabled ? 'menu' : undefined}
                        data-window-control="zoom"
                        onPointerDown={(event) => {
                            handleControlPointerDown(event);
                            openSnapMenu(event);
                        }}
                        onMouseEnter={openSnapMenu}
                        onFocus={openSnapMenu}
                        onClick={handleZoomClick}
                        title="Zoom window (Alt+Click: toggle focus mode)"
                        disabled={!allowZoom}
                    >
                        <span className="macos-traffic-light__glyph macos-traffic-light__glyph--zoom" aria-hidden="true" />
                    </button>
                    {snapMenuOpen ? (
                        <div
                            className="macos-snap-menu"
                            role="menu"
                            aria-label="Window layout presets"
                            onMouseLeave={closeSnapMenu}
                            onPointerDown={handleSnapMenuPointerDown}
                            onKeyDown={handleSnapMenuKeyDown}
                        >
                            <div className="macos-snap-menu__header">
                                <span>Snap Layouts</span>
                            </div>
                            <div className="macos-snap-menu__grid">
                                {layoutPresets.map((preset) => (
                                    <button
                                        key={preset.id}
                                        type="button"
                                        role="menuitem"
                                        className={`macos-snap-menu__option macos-snap-menu__option--${preset.id}`}
                                        onClick={handleApplyLayout(preset.id)}
                                        title={preset.label}
                                    >
                                        <span className="macos-snap-menu__diagram" aria-hidden="true">
                                            <span />
                                            <span />
                                            <span />
                                            <span />
                                        </span>
                                        <span>{preset.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : null}
                </div>
                <div className="macos-window__titlebar-center">
                    {IconComponent ? (
                        <span className="macos-window__titlebar-icon" aria-hidden="true">
                            <IconComponent className="h-3.5 w-3.5" aria-hidden />
                        </span>
                    ) : null}
                    <span className="macos-window__titletext">{title}</span>
                </div>
                <div className="macos-window__titlebar-grip" aria-hidden="true">
                    <span />
                    <span />
                    <span />
                </div>
            </div>
            <div className="macos-window__content">
                <div className="macos-window__body">
                    {content}
                </div>
            </div>
        </motion.div>
    );
}

MacWindow.propTypes = {
    windowData: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        x: PropTypes.number.isRequired,
        y: PropTypes.number.isRequired,
        width: PropTypes.number.isRequired,
        height: PropTypes.number.isRequired,
        z: PropTypes.number.isRequired,
        allowClose: PropTypes.bool,
        allowMinimize: PropTypes.bool,
        allowZoom: PropTypes.bool,
        type: PropTypes.string.isRequired,
        isMain: PropTypes.bool,
        appRoutePath: PropTypes.string,
        appRouteLabel: PropTypes.string,
    }).isRequired,
    isFocused: PropTypes.bool,
    isDragging: PropTypes.bool,
    reduceMotion: PropTypes.bool,
    renderContent: PropTypes.func,
    children: PropTypes.node,
    onPointerDown: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onMinimize: PropTypes.func.isRequired,
    onZoom: PropTypes.func.isRequired,
    onFocus: PropTypes.func.isRequired,
    onResizeStart: PropTypes.func.isRequired,
    onApplyLayout: PropTypes.func,
    layoutPresets: PropTypes.arrayOf(
        PropTypes.shape({
            id: PropTypes.string.isRequired,
            label: PropTypes.string.isRequired,
        })
    ),
};

MacWindow.defaultProps = {
    isFocused: false,
    isDragging: false,
    reduceMotion: false,
    renderContent: null,
    children: null,
    onApplyLayout: null,
    layoutPresets: [],
};

export default memo(MacWindow);
