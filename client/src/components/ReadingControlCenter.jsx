// client/src/components/ReadingControlCenter.jsx
import { useMemo, useState, useEffect, useRef } from 'react';
import {
    HiOutlineAdjustmentsHorizontal,
    HiOutlineXMark,
    HiOutlineArrowsPointingOut,
    HiOutlineLightBulb,
    HiOutlineSparkles,
    HiOutlineEye,
    HiOutlineSpeakerWave,
    HiOutlineBookOpen,
    HiOutlineClipboardDocument,
} from 'react-icons/hi2';
import { LuAlignLeft, LuAlignJustify } from 'react-icons/lu';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import { marginStyleMap } from '../hooks/useReadingSettings';

const themeOptions = [
    { id: 'auto', label: 'Auto', swatch: 'bg-gradient-to-r from-slate-200 via-white to-slate-200', description: 'Follow site theme' },
    { id: 'day', label: 'Day', swatch: 'bg-white border border-slate-200', description: 'Bright background' },
    { id: 'sepia', label: 'Sepia', swatch: 'bg-[#f7f2e7] border border-[#e0d3b8]', description: 'Warm sepia tone' },
    { id: 'mint', label: 'Mint', swatch: 'bg-[#f0fdf4] border border-[#bbf7d0]', description: 'Cool green tint' },
    { id: 'dusk', label: 'Dusk', swatch: 'bg-[#1e293b] border border-[#334155]', description: 'Soft dark mode' },
    { id: 'night', label: 'Night', swatch: 'bg-slate-900 border border-slate-700', description: 'Low-light mode' },
];

const fontOptions = [
    { id: 'serif', label: 'Serif' },
    { id: 'sans', label: 'Sans' },
    { id: 'mono', label: 'Mono' },
];

const widthOptions = [
    { id: 'cozy', label: 'Cozy' },
    { id: 'comfortable', label: 'Comfort' },
    { id: 'spacious', label: 'Wide' },
];

const alignmentOptions = [
    { id: 'left', label: 'Left', description: 'Ragged right edge', Icon: LuAlignLeft },
    { id: 'justify', label: 'Justify', description: 'Clean edges on both sides', Icon: LuAlignJustify },
];

const marginOptions = [
    { id: 'narrow', label: 'Narrow', description: 'More words per line' },
    { id: 'medium', label: 'Medium', description: 'Balanced reading comfort' },
    { id: 'wide', label: 'Wide', description: 'Extra breathing room' },
];

const readingAidOptions = [
    {
        id: 'focusMode',
        label: 'Focus Mode',
        description: 'Dim the surrounding interface to stay immersed in the page.',
        Icon: HiOutlineEye,
    },
    {
        id: 'readingGuide',
        label: 'Reading Guide',
        description: 'Highlight lines as you hover to keep your place like a reading ruler.',
        Icon: HiOutlineSparkles,
    },
    {
        id: 'highContrast',
        label: 'Enhanced Contrast',
        description: 'Boost contrast for crisp, Kindle-style text clarity.',
        Icon: HiOutlineLightBulb,
    },
    {
        id: 'hideImages',
        label: 'Hide Images',
        description: 'Reduce distraction by hiding images and videos.',
        Icon: HiOutlineClipboardDocument,
    },
];

const themePreviewClassMap = {
    auto: 'bg-white/90 text-slate-800 border-slate-200/70 dark:bg-slate-900/80 dark:text-slate-100 dark:border-slate-700/70',
    day: 'bg-white text-slate-900 border-slate-200',
    sepia: 'bg-[#f7f2e7] text-[#5b4636] border-[#d6c5aa]',
    mint: 'bg-[#f0fdf4] text-[#14532d] border-[#bbf7d0]',
    dusk: 'bg-[#1e293b] text-[#cbd5e1] border-[#334155]',
    night: 'bg-slate-900 text-slate-100 border-slate-700',
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export default function ReadingControlCenter({ settings, onChange, onReset }) {
    const [isOpen, setIsOpen] = useState(false);
    const panelRef = useRef(null);
    const triggerRef = useRef(null);
    const dragControls = useDragControls(); // 1. Initialize drag controls
    const speechRef = useRef(null);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [isReadingAloud, setIsReadingAloud] = useState(false);
    const [voices, setVoices] = useState([]);
    const scrollRAF = useRef(null);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickAway = (event) => {
            if (
                panelRef.current && !panelRef.current.contains(event.target) &&
                triggerRef.current && !triggerRef.current.contains(event.target)
            ) {
                setIsOpen(false);
            }
        };
        const handleEscape = (event) => {
            if (event.key === 'Escape') setIsOpen(false);
        };

        document.addEventListener('mousedown', handleClickAway);
        document.addEventListener('keydown', handleEscape);
        return () => {
            document.removeEventListener('mousedown', handleClickAway);
            document.removeEventListener('keydown', handleEscape);
        };
    }, [isOpen]);

    useEffect(() => () => {
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel();
        }
    }, []);

    // Populate available TTS voices when supported
    useEffect(() => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
        const synth = window.speechSynthesis;
        const load = () => {
            const list = synth.getVoices?.() || [];
            setVoices(list);
        };
        load();
        synth.addEventListener?.('voiceschanged', load);
        return () => synth.removeEventListener?.('voiceschanged', load);
    }, []);

    // Auto-scroll using requestAnimationFrame, controlled via settings
    useEffect(() => {
        if (!settings.autoScroll) {
            if (scrollRAF.current) cancelAnimationFrame(scrollRAF.current);
            scrollRAF.current = null;
            return undefined;
        }

        let prev = performance.now();
        const speed = Math.max(0, Number(settings.autoScrollSpeed) || 0); // px/sec
        const step = (now) => {
            const dt = Math.max(0, now - prev) / 1000; // seconds
            prev = now;
            const delta = speed * dt;
            const { scrollY, innerHeight, document: { body, documentElement } } = window;
            const maxScroll = Math.max(body.scrollHeight, documentElement.scrollHeight) - innerHeight;
            if (scrollY >= maxScroll - 2) {
                onChange('autoScroll', false);
                return;
            }
            window.scrollBy({ top: delta, left: 0, behavior: 'auto' });
            scrollRAF.current = requestAnimationFrame(step);
        };
        scrollRAF.current = requestAnimationFrame(step);
        return () => {
            if (scrollRAF.current) cancelAnimationFrame(scrollRAF.current);
            scrollRAF.current = null;
        };
    }, [settings.autoScroll, settings.autoScrollSpeed, onChange]);

    useEffect(() => {
        if (!feedbackMessage) return undefined;
        const timeout = setTimeout(() => setFeedbackMessage(''), 4000);
        return () => clearTimeout(timeout);
    }, [feedbackMessage]);

    const previewStyles = useMemo(() => ({
        fontSize: `${settings.fontSize}px`,
        lineHeight: settings.lineHeight,
        letterSpacing: `${settings.letterSpacing}em`,
        wordSpacing: `${settings.wordSpacing}em`,
        fontWeight: settings.fontWeight,
        textAlign: settings.textAlign,
        '--paragraph-spacing': `${settings.paragraphSpacing}em`,
        fontFamily: settings.fontFamily === 'mono' ? 'monospace' : settings.fontFamily === 'sans' ? 'sans-serif' : 'serif',
        filter: `brightness(${settings.brightness})`,
        paddingInline: marginStyleMap[settings.pageMargin] || marginStyleMap.medium,
    }), [settings]);

    const previewThemeClass = themePreviewClassMap[settings.theme] || themePreviewClassMap.auto;

    const handleFontSizeChange = (direction) => {
        const next = direction === 'increase' ? settings.fontSize + 1 : settings.fontSize - 1;
        onChange('fontSize', clamp(next, 14, 26));
    };

    // ... (other handlers remain the same) ...
    const handleLineHeightChange = (event) => {
        const value = Number(event.target.value);
        onChange('lineHeight', clamp(Number(value.toFixed(2)), 1.2, 2.4));
    };

    const handleLetterSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('letterSpacing', clamp(Number(value.toFixed(2)), -0.05, 0.1));
    };

    const handleWordSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('wordSpacing', clamp(Number(value.toFixed(2)), 0, 0.5));
    };

    const handleFontWeightChange = (event) => {
        const value = Number(event.target.value);
        onChange('fontWeight', clamp(Math.round(value), 300, 800));
    };

    const handleParagraphSpacingChange = (event) => {
        const value = Number(event.target.value);
        onChange('paragraphSpacing', clamp(Number(value.toFixed(2)), 0.5, 2));
    };

    const handleBrightnessChange = (event) => {
        const value = Number(event.target.value);
        onChange('brightness', clamp(Number(value.toFixed(2)), 0.6, 1.4));
    };

    const handleMarginChange = (event) => {
        const index = clamp(Number(event.target.value), 0, marginOptions.length - 1);
        const option = marginOptions[index];
        if (option) {
            onChange('pageMargin', option.id);
        }
    };

    const marginIndex = Math.max(0, marginOptions.findIndex(option => option.id === settings.pageMargin));

    const handleAidToggle = (option) => {
        const isActive = Boolean(settings[option.id]);
        onChange(option.id, !isActive);
        setFeedbackMessage(`${option.label} ${!isActive ? 'enabled' : 'disabled'}.`);
    };

    const handleDictionaryLookup = () => {
        if (typeof window === 'undefined') {
            return;
        }
        const selection = window.getSelection()?.toString().trim();
        if (!selection) {
            setFeedbackMessage('Select a word or phrase to look up in the dictionary.');
            return;
        }
        const encoded = encodeURIComponent(selection);
        window.open(`https://www.lexico.com/en/definition/${encoded}`, '_blank', 'noopener,noreferrer');
        setFeedbackMessage(`Looking up “${selection}” in a new tab.`);
    };

    const handleSaveHighlight = async () => {
        if (typeof window === 'undefined' || typeof navigator === 'undefined' || !navigator.clipboard) {
            setFeedbackMessage('Clipboard access is not available in this environment.');
            return;
        }
        const selection = window.getSelection()?.toString().trim();
        if (!selection) {
            setFeedbackMessage('Select text to copy it as a highlight.');
            return;
        }
        try {
            await navigator.clipboard.writeText(selection);
            setFeedbackMessage('Highlight copied to your clipboard.');
        } catch (error) {
            setFeedbackMessage('Unable to copy the selected text.');
        }
    };

    const handleReadAloud = () => {
        if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
            setFeedbackMessage('Read aloud is not supported in this browser.');
            return;
        }
        const synth = window.speechSynthesis;
        if (isReadingAloud) {
            synth.cancel();
            setIsReadingAloud(false);
            setFeedbackMessage('Stopped reading aloud.');
            return;
        }

        const utteranceCtor = window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
        if (typeof utteranceCtor === 'undefined') {
            setFeedbackMessage('Read aloud is not available on this device.');
            return;
        }

        const target = document.querySelector('[data-reading-surface]') || document.querySelector('.post-content');
        const text = target?.innerText?.trim();

        if (!text) {
            setFeedbackMessage('No readable content detected on this page.');
            return;
        }

        const utterance = new utteranceCtor(text);
        speechRef.current = utterance;
        // Apply selected voice, rate, and pitch if available
        try {
            if (voices?.length && settings.ttsVoiceURI) {
                const v = voices.find((vc) => vc.voiceURI === settings.ttsVoiceURI);
                if (v) utterance.voice = v;
            }
            if (typeof settings.ttsRate === 'number') utterance.rate = Math.min(2, Math.max(0.5, settings.ttsRate));
            if (typeof settings.ttsPitch === 'number') utterance.pitch = Math.min(2, Math.max(0, settings.ttsPitch));
        } catch (_) {
            // ignore voice assignment errors
        }
        utterance.onend = () => {
            setIsReadingAloud(false);
            setFeedbackMessage('Finished reading aloud.');
        };
        utterance.onerror = () => {
            setIsReadingAloud(false);
            setFeedbackMessage('Unable to read aloud this content.');
        };

        synth.cancel();
        synth.speak(utterance);
        setIsReadingAloud(true);
        setFeedbackMessage('Started reading aloud the article.');
    };


    return (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 lg:hidden">
            <motion.button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(prev => !prev)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 px-4 py-2 shadow-lg shadow-slate-900/20 dark:shadow-slate-900/40 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
                <HiOutlineAdjustmentsHorizontal className="h-5 w-5" />
                <span className="font-semibold text-sm">Reading Controls</span>
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={panelRef}
                        drag // 2. Enable dragging
                        dragListener={false} // 3. Disable dragging on the whole panel
                        dragControls={dragControls} // 4. Connect controls
                        dragMomentum={false}
                        dragConstraints={{ top: 20, left: 20, right: window.innerWidth - 340, bottom: window.innerHeight - 600 }} // Keep it in viewport
                        initial={{ opacity: 0, y: 20, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.9 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                        id="reading-control-panel"
                        role="dialog"
                        aria-label="Reading Control Center"
                        className="w-80 max-w-sm rounded-3xl border border-slate-200 bg-white/90 p-5 text-slate-800 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-100 origin-bottom-right"
                    >
                        {/* 5. Create a drag handle */}
                        <motion.div
                            onPointerDown={(e) => dragControls.start(e)}
                            className="mb-4 flex items-start justify-between cursor-grab active:cursor-grabbing"
                        >
                            <div>
                                <h3 className="text-lg font-semibold">Reading Control Center</h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                    <HiOutlineArrowsPointingOut/> Drag to move panel
                                </p>
                            </div>
                            <button type="button" onClick={() => setIsOpen(false)} className="rounded-full p-1 text-slate-500 transition hover:bg-slate-200/60 hover:text-slate-900 dark:hover:bg-slate-700/60 cursor-pointer">
                                <HiOutlineXMark className="h-5 w-5" />
                            </button>
                        </motion.div>

                        <div className={`mb-6 rounded-2xl border p-4 text-xs shadow-inner transition-colors ${previewThemeClass}`} style={previewStyles}>
                            <p className="text-sm font-semibold uppercase tracking-wide text-slate-500/70 dark:text-slate-400/80">Live preview</p>
                            <p className="mt-2 text-sm leading-relaxed" style={{marginBottom: 'var(--paragraph-spacing, 1.25em)'}}>The quick brown fox jumps over the lazy dog. Adjust controls to see typography updates instantly.</p>
                            <p className="text-[0.8rem] text-slate-500 dark:text-slate-300">
                                {settings.lineHeight.toFixed(1)}× line height · {settings.paragraphSpacing.toFixed(2)}em spacing · {settings.fontSize}px type · {settings.fontWeight} weight · {Math.round(settings.brightness * 100)}% brightness
                            </p>
                        </div>

                        {/* The rest of the controls remain unchanged */}
                        <div className="max-h-[40vh] overflow-y-auto pr-2 space-y-6">
                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Theme</h4>
                                <div className="grid grid-cols-2 gap-3">
                                    {themeOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onChange('theme', option.id)}
                                            className={`flex flex-col rounded-2xl border p-3 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                settings.theme === option.id
                                                    ? 'border-sky-400/80 bg-sky-50/70 text-sky-700 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200/80 hover:border-sky-300/80 dark:border-slate-700/80 dark:hover:border-sky-500/70'
                                            }`}
                                        >
                                            <span className={`h-6 w-12 rounded-full ${option.swatch} mb-2`}></span>
                                            <span className="text-sm font-medium">{option.label}</span>
                                            <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{option.description}</span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Font size</h4>
                                <div className="flex items-center justify-between rounded-2xl bg-slate-100/70 p-2 dark:bg-slate-800/60">
                                    <button type="button" onClick={() => handleFontSizeChange('decrease')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition hover:scale-105 disabled:opacity-50 dark:bg-slate-900" disabled={settings.fontSize <= 14}>
                                        <span className="text-lg font-semibold">A-</span>
                                    </button>
                                    <div className="text-center"><p className="text-xs uppercase text-slate-500">Current</p><p className="text-lg font-semibold">{settings.fontSize}px</p></div>
                                    <button type="button" onClick={() => handleFontSizeChange('increase')} className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-sm transition hover:scale-105 disabled:opacity-50 dark:bg-slate-900" disabled={settings.fontSize >= 26}>
                                        <span className="text-lg font-semibold">A+</span>
                                    </button>
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Font family</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {fontOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onChange('fontFamily', option.id)}
                                            className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                settings.fontFamily === option.id
                                                    ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                            }`}
                                            style={{ fontFamily: option.id === 'mono' ? 'monospace' : option.id === 'sans' ? 'Inter, sans-serif' : 'Georgia, serif' }}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Font weight</h4>
                                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3">
                                    <div className="mb-2 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                                        <span>Weight</span>
                                        <span className="font-semibold text-slate-600 dark:text-slate-200">{settings.fontWeight}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="300"
                                        max="800"
                                        step="50"
                                        value={settings.fontWeight}
                                        onChange={handleFontWeightChange}
                                        className="w-full accent-sky-500"
                                        aria-label="Adjust font weight"
                                    />
                                    <div className="mt-2 flex items-center justify-between text-[0.65rem] uppercase tracking-wide text-slate-400">
                                        <span>Light</span>
                                        <span>Bold</span>
                                    </div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Spacing</h4>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400"><span>Line height</span><span>{settings.lineHeight.toFixed(1)}x</span></div>
                                    <input type="range" min="1.2" max="2.4" step="0.1" value={settings.lineHeight} onChange={handleLineHeightChange} className="w-full accent-sky-500" />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400"><span>Letter</span><span>{settings.letterSpacing.toFixed(2)}em</span></div>
                                    <input type="range" min="-0.05" max="0.1" step="0.01" value={settings.letterSpacing} onChange={handleLetterSpacingChange} className="w-full accent-sky-500" />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400"><span>Paragraph</span><span>{settings.paragraphSpacing.toFixed(2)}em</span></div>
                                    <input type="range" min="0.5" max="2" step="0.05" value={settings.paragraphSpacing} onChange={handleParagraphSpacingChange} className="w-full accent-sky-500" />
                                </div>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400"><span>Word</span><span>{settings.wordSpacing.toFixed(2)}em</span></div>
                                    <input type="range" min="0" max="0.5" step="0.01" value={settings.wordSpacing} onChange={handleWordSpacingChange} className="w-full accent-sky-500" />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Display</h4>
                                <div>
                                    <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400"><span>Brightness</span><span>{Math.round(settings.brightness * 100)}%</span></div>
                                    <input type="range" min="0.6" max="1.4" step="0.05" value={settings.brightness} onChange={handleBrightnessChange} className="w-full accent-sky-500" />
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Layout</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {widthOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onChange('pageWidth', option.id)}
                                            className={`rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                settings.pageWidth === option.id
                                                    ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                            }`}
                                        >
                                            {option.label}
                                        </button>
                                    ))}
                                </div>
                                <div className="rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-3 space-y-3">
                                    <div className="flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                                        <span>Page margins</span>
                                        <span className="font-semibold text-slate-500 dark:text-slate-300">{marginOptions[marginIndex]?.label || 'Medium'}</span>
                                    </div>
                                    <div className="flex items-center justify-between gap-2">
                                        {marginOptions.map(option => {
                                            const isActive = settings.pageMargin === option.id;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => onChange('pageMargin', option.id)}
                                                    aria-pressed={isActive}
                                                    className={`flex-1 rounded-xl border px-2 py-2 text-center transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                        isActive
                                                            ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                                            : 'border-transparent text-slate-500 dark:text-slate-400 hover:border-sky-300/60 dark:hover:border-sky-500/60'
                                                    }`}
                                                >
                                                    <div className="mx-auto mb-1 flex h-8 w-full max-w-[3.5rem] items-center justify-center rounded-lg bg-slate-200/70 dark:bg-slate-700/70">
                                                        <div
                                                            className={`h-6 w-full rounded-md bg-white dark:bg-slate-900 shadow-inner transition-all ${
                                                                option.id === 'narrow'
                                                                    ? 'mx-1'
                                                                    : option.id === 'medium'
                                                                        ? 'mx-2'
                                                                        : 'mx-3'
                                                            }`}
                                                        ></div>
                                                    </div>
                                                    <p className="text-[0.65rem] font-medium">{option.label}</p>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max={marginOptions.length - 1}
                                        step="1"
                                        value={marginIndex}
                                        onChange={handleMarginChange}
                                        className="w-full accent-sky-500"
                                        aria-label="Adjust page margins"
                                    />
                                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400 text-center">
                                        {marginOptions[marginIndex]?.description || 'Adjust the white space on either side of the page.'}
                                    </p>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    {alignmentOptions.map(option => (
                                        <button
                                            key={option.id}
                                            type="button"
                                            onClick={() => onChange('textAlign', option.id)}
                                            className={`flex items-center justify-center gap-2 rounded-2xl border px-3 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                settings.textAlign === option.id
                                                    ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                                    : 'border-slate-200 hover:border-sky-300 dark:border-slate-700 dark:hover:border-sky-500'
                                            }`}
                                        >
                                            <option.Icon className="h-5 w-5" aria-hidden="true" />
                                            <span className="flex flex-col items-start leading-tight">
                                                <span>{option.label}</span>
                                                <span className="text-[0.6rem] font-normal text-slate-500 dark:text-slate-400">{option.description}</span>
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-3">
                                <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Reading Aids &amp; Tools</h4>
                                <div className="space-y-2">
                                    {readingAidOptions.map(option => {
                                        const isActive = Boolean(settings[option.id]);
                                        return (
                                            <button
                                                key={option.id}
                                                type="button"
                                                role="switch"
                                                aria-checked={isActive}
                                                onClick={() => handleAidToggle(option)}
                                                className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                    isActive
                                                        ? 'border-sky-400 bg-sky-50 text-sky-700 dark:border-sky-500 dark:bg-sky-500/10 dark:text-sky-200'
                                                        : 'border-slate-200/80 hover:border-sky-300 dark:border-slate-700/80 dark:hover:border-sky-500/70'
                                                }`}
                                            >
                                                <span className="flex items-start gap-3">
                                                    <span className={`mt-1 flex h-8 w-8 items-center justify-center rounded-full ${
                                                        isActive
                                                            ? 'bg-sky-500/20 text-sky-600 dark:text-sky-200'
                                                            : 'bg-slate-200/70 text-slate-500 dark:bg-slate-700/70 dark:text-slate-300'
                                                    }`}>
                                                        <option.Icon className="h-5 w-5" aria-hidden="true" />
                                                    </span>
                                                    <span className="flex flex-col">
                                                        <span className="text-sm font-semibold">{option.label}</span>
                                                        <span className="text-[0.7rem] text-slate-500 dark:text-slate-400">{option.description}</span>
                                                    </span>
                                                </span>
                                                <span className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition ${
                                                    isActive
                                                        ? 'bg-sky-500/90'
                                                        : 'bg-slate-300 dark:bg-slate-600'
                                                }`}>
                                                    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition ${
                                                        isActive ? 'translate-x-5' : 'translate-x-1'
                                                    }`}></span>
                                                </span>
                                            </button>
                                        );
                                    })}
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={handleReadAloud}
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-sky-500/80"
                                    >
                                        <HiOutlineSpeakerWave className="h-5 w-5" aria-hidden="true" />
                                        <span>{isReadingAloud ? 'Stop reading' : 'Read aloud'}</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleDictionaryLookup}
                                        className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700/80 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:border-sky-500/80"
                                    >
                                        <HiOutlineBookOpen className="h-5 w-5" aria-hidden="true" />
                                        <span>Dictionary</span>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSaveHighlight}
                                        className="col-span-2 flex items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-slate-100/70 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:border-sky-300 hover:bg-sky-50 hover:text-sky-700 dark:border-slate-600 dark:bg-slate-800/50 dark:text-slate-300 dark:hover:border-sky-500/60 dark:hover:text-sky-200"
                                    >
                                        <HiOutlineClipboardDocument className="h-5 w-5" aria-hidden="true" />
                                        <span>Copy highlight</span>
                                    </button>
                                </div>

                                {/* Read Aloud Settings */}
                                <div className="mt-3 rounded-2xl border border-slate-200/80 p-3 dark:border-slate-700/80">
                                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Read Aloud Settings</h5>
                                    <div className="space-y-2">
                                        <label className="block text-[0.7rem] font-medium text-slate-500 dark:text-slate-400">
                                            Voice
                                            <select
                                                className="mt-1 w-full rounded-md border border-slate-200 bg-white p-2 text-xs dark:border-slate-700 dark:bg-slate-800"
                                                value={settings.ttsVoiceURI || ''}
                                                onChange={(e) => onChange('ttsVoiceURI', e.target.value)}
                                            >
                                                <option value="">Default</option>
                                                {voices.map((v) => (
                                                    <option key={v.voiceURI} value={v.voiceURI}>
                                                        {v.name} {v.lang ? `(${v.lang})` : ''}
                                                    </option>
                                                ))}
                                            </select>
                                        </label>
                                        <label className="block text-[0.7rem] font-medium text-slate-500 dark:text-slate-400">
                                            Rate: {Number(settings.ttsRate ?? 1).toFixed(2)}x
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="1.8"
                                                step="0.05"
                                                value={Number(settings.ttsRate ?? 1)}
                                                onChange={(e) => onChange('ttsRate', Number(e.target.value))}
                                                className="w-full accent-sky-500"
                                            />
                                        </label>
                                        <label className="block text-[0.7rem] font-medium text-slate-500 dark:text-slate-400">
                                            Pitch: {Number(settings.ttsPitch ?? 1).toFixed(2)}
                                            <input
                                                type="range"
                                                min="0.5"
                                                max="1.8"
                                                step="0.05"
                                                value={Number(settings.ttsPitch ?? 1)}
                                                onChange={(e) => onChange('ttsPitch', Number(e.target.value))}
                                                className="w-full accent-sky-500"
                                            />
                                        </label>
                                    </div>
                                </div>

                                {/* Auto Scroll */}
                                <div className="mt-3 rounded-2xl border border-slate-200/80 p-3 dark:border-slate-700/80">
                                    <h5 className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Auto Scroll</h5>
                                    <div className="flex items-center justify-between gap-2">
                                        <button
                                            type="button"
                                            onClick={() => onChange('autoScroll', !settings.autoScroll)}
                                            className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-sky-400 ${
                                                settings.autoScroll
                                                    ? 'bg-sky-600 text-white hover:bg-sky-700'
                                                    : 'bg-slate-200 text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200'
                                            }`}
                                        >
                                            {settings.autoScroll ? 'Pause' : 'Start'}
                                        </button>
                                        <div className="flex-1">
                                            <div className="mb-1 flex items-center justify-between text-[0.7rem] uppercase tracking-wide text-slate-400">
                                                <span>Speed</span>
                                                <span>{Math.round(Number(settings.autoScrollSpeed ?? 40))} px/s</span>
                                            </div>
                                            <input
                                                type="range"
                                                min="10"
                                                max="200"
                                                step="5"
                                                value={Number(settings.autoScrollSpeed ?? 40)}
                                                onChange={(e) => onChange('autoScrollSpeed', Number(e.target.value))}
                                                className="w-full accent-sky-500"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Import/Export */}
                                <div className="mt-3 flex items-center justify-between gap-2">
                                    <button
                                        type="button"
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        onClick={async () => {
                                            try {
                                                await navigator.clipboard.writeText(JSON.stringify(settings));
                                                setFeedbackMessage('Settings copied to clipboard.');
                                            } catch (_) {
                                                setFeedbackMessage('Unable to copy settings.');
                                            }
                                        }}
                                    >
                                        Export settings
                                    </button>
                                    <button
                                        type="button"
                                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-sky-300 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                                        onClick={async () => {
                                            try {
                                                const text = await navigator.clipboard.readText();
                                                const data = JSON.parse(text);
                                                if (data && typeof data === 'object') {
                                                    Object.entries(data).forEach(([k, v]) => onChange(k, v));
                                                    setFeedbackMessage('Settings imported from clipboard.');
                                                }
                                            } catch (_) {
                                                setFeedbackMessage('Unable to import settings. Copy JSON first.');
                                            }
                                        }}
                                    >
                                        Import settings
                                    </button>
                                </div>

                                {feedbackMessage && (
                                    <p className="text-[0.7rem] text-slate-500 dark:text-slate-400">
                                        {feedbackMessage}
                                    </p>
                                )}
                            </section>
                        </div>
                        <button type="button" onClick={onReset} className="mt-6 w-full rounded-2xl border border-transparent bg-slate-900 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-400 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200">
                            Reset to defaults
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
