import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const BLOCK_SELECTOR = 'h1, h2, h3, h4, h5, h6, p, li, figcaption';
const WORDS_PER_MINUTE = 170;

const normalizeSpeechText = (value = '') =>
    value
        .replace(/\s+/g, ' ')
        .replace(/\u00a0/g, ' ')
        .trim();

const countWords = (value = '') =>
    normalizeSpeechText(value)
        .split(/\s+/)
        .filter(Boolean).length;

const getSpeechSupport = () =>
    typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof (window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance)
        !== 'undefined';

export default function useArticleTextToSpeech({
    rootSelector,
    contentKey,
    voiceURI = '',
    rate = 1,
    pitch = 1,
    enabled = true,
}) {
    const [supported, setSupported] = useState(() => getSpeechSupport());
    const [voices, setVoices] = useState([]);
    const [status, setStatus] = useState('idle');
    const [message, setMessage] = useState('Ready to listen.');
    const [activeBlockIndex, setActiveBlockIndex] = useState(-1);
    const [activeBlockText, setActiveBlockText] = useState('');
    const [blockCount, setBlockCount] = useState(0);
    const [totalWords, setTotalWords] = useState(0);
    const [consumedWords, setConsumedWords] = useState(0);

    const blocksRef = useRef([]);
    const utteranceRef = useRef(null);
    const manualStopRef = useRef(false);

    const clearBlockMarkers = useCallback(() => {
        blocksRef.current.forEach((block) => {
            block.element?.removeAttribute('data-tts-active');
            block.element?.removeAttribute('data-tts-past');
        });
    }, []);

    const stop = useCallback(
        ({ preserveMessage = true, nextMessage = 'Stopped listening.' } = {}) => {
            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                manualStopRef.current = true;
                window.speechSynthesis.cancel();
            }

            utteranceRef.current = null;
            clearBlockMarkers();
            setStatus('idle');
            setActiveBlockIndex(-1);
            setActiveBlockText('');
            setConsumedWords(0);

            if (preserveMessage) {
                setMessage(nextMessage);
            }
        },
        [clearBlockMarkers],
    );

    const hydrateBlocks = useCallback(() => {
        if (typeof document === 'undefined') {
            blocksRef.current = [];
            setBlockCount(0);
            setTotalWords(0);
            return [];
        }

        const root = document.querySelector(rootSelector);
        if (!root) {
            blocksRef.current = [];
            setBlockCount(0);
            setTotalWords(0);
            return [];
        }

        const blocks = Array.from(root.querySelectorAll(BLOCK_SELECTOR))
            .map((element, index) => {
                if (element.closest('pre, code, table, [data-no-tts="true"]')) {
                    return null;
                }

                const text = normalizeSpeechText(element.textContent || '');
                if (!text) {
                    return null;
                }

                return {
                    id: `${element.tagName.toLowerCase()}-${index}`,
                    text,
                    element,
                    wordCount: countWords(text),
                };
            })
            .filter(Boolean);

        blocksRef.current = blocks;
        setBlockCount(blocks.length);
        setTotalWords(blocks.reduce((sum, block) => sum + block.wordCount, 0));

        return blocks;
    }, [rootSelector]);

    const markActiveBlock = useCallback((index) => {
        const blocks = blocksRef.current;
        const nextBlock = blocks[index] || null;

        blocks.forEach((block, blockIndex) => {
            if (!block.element) {
                return;
            }

            if (blockIndex === index) {
                block.element.setAttribute('data-tts-active', 'true');
                block.element.removeAttribute('data-tts-past');
            } else if (blockIndex < index) {
                block.element.setAttribute('data-tts-past', 'true');
                block.element.removeAttribute('data-tts-active');
            } else {
                block.element.removeAttribute('data-tts-active');
                block.element.removeAttribute('data-tts-past');
            }
        });

        setActiveBlockIndex(index);
        setActiveBlockText(nextBlock?.text || '');
        setConsumedWords(
            blocks.slice(0, Math.max(index, 0)).reduce((sum, block) => sum + block.wordCount, 0),
        );

        nextBlock?.element?.scrollIntoView?.({
            behavior: 'smooth',
            block: 'center',
        });
    }, []);

    const finishPlayback = useCallback(() => {
        utteranceRef.current = null;
        clearBlockMarkers();
        setStatus('completed');
        setMessage('Finished listening.');
        setActiveBlockIndex(-1);
        setActiveBlockText('');
        setConsumedWords(0);
    }, [clearBlockMarkers]);

    const speakBlock = useCallback(
        (requestedIndex) => {
            if (!getSpeechSupport()) {
                setSupported(false);
                setStatus('error');
                setMessage('Text-to-speech is not supported in this browser.');
                return;
            }

            const blocks = blocksRef.current.length ? blocksRef.current : hydrateBlocks();
            if (!blocks.length) {
                setStatus('error');
                setMessage('No readable article sections were found.');
                return;
            }

            const synth = window.speechSynthesis;
            const utteranceCtor =
                window.SpeechSynthesisUtterance || window.webkitSpeechSynthesisUtterance;
            const safeIndex = Math.min(Math.max(requestedIndex, 0), blocks.length - 1);
            const activeBlock = blocks[safeIndex];

            if (!activeBlock || typeof utteranceCtor === 'undefined') {
                setStatus('error');
                setMessage('Voice playback is not available on this device.');
                return;
            }

            const utterance = new utteranceCtor(activeBlock.text);
            utteranceRef.current = utterance;
            manualStopRef.current = false;

            try {
                const selectedVoice =
                    voices.find((voice) => voice.voiceURI === voiceURI)
                    || voices.find((voice) => voice.default)
                    || voices[0];

                if (selectedVoice) {
                    utterance.voice = selectedVoice;
                }

                utterance.rate = Math.min(2, Math.max(0.5, Number(rate) || 1));
                utterance.pitch = Math.min(2, Math.max(0.5, Number(pitch) || 1));
            } catch {
                // Fall back to browser defaults when voice assignment is not available.
            }

            utterance.onstart = () => {
                setStatus('playing');
                setMessage(`Listening to section ${safeIndex + 1} of ${blocks.length}.`);
                markActiveBlock(safeIndex);
            };

            utterance.onend = () => {
                if (manualStopRef.current) {
                    return;
                }

                if (safeIndex >= blocksRef.current.length - 1) {
                    finishPlayback();
                    return;
                }

                speakBlock(safeIndex + 1);
            };

            utterance.onerror = (event) => {
                if (manualStopRef.current || ['interrupted', 'canceled'].includes(event?.error)) {
                    return;
                }

                utteranceRef.current = null;
                clearBlockMarkers();
                setStatus('error');
                setMessage('Voice playback could not continue.');
                setActiveBlockIndex(-1);
                setActiveBlockText('');
                setConsumedWords(0);
            };

            synth.speak(utterance);
        },
        [clearBlockMarkers, finishPlayback, hydrateBlocks, markActiveBlock, pitch, rate, voiceURI, voices],
    );

    const start = useCallback(
        (index = 0) => {
            if (!enabled) {
                setMessage('Switch to scroll mode to use voice playback.');
                return;
            }

            if (!getSpeechSupport()) {
                setSupported(false);
                setStatus('error');
                setMessage('Text-to-speech is not supported in this browser.');
                return;
            }

            const blocks = blocksRef.current.length ? blocksRef.current : hydrateBlocks();
            if (!blocks.length) {
                setStatus('error');
                setMessage('No readable article sections were found.');
                return;
            }

            manualStopRef.current = true;
            window.speechSynthesis.cancel();
            manualStopRef.current = false;

            speakBlock(index);
        },
        [enabled, hydrateBlocks, speakBlock],
    );

    const togglePauseResume = useCallback(() => {
        if (!getSpeechSupport()) {
            setSupported(false);
            setStatus('error');
            setMessage('Text-to-speech is not supported in this browser.');
            return;
        }

        const synth = window.speechSynthesis;
        if (status === 'playing') {
            synth.pause();
            setStatus('paused');
            setMessage('Voice playback paused.');
            return;
        }

        if (status === 'paused') {
            synth.resume();
            setStatus('playing');
            setMessage('Resumed listening.');
        }
    }, [status]);

    useEffect(() => {
        setSupported(getSpeechSupport());
    }, []);

    useEffect(() => {
        if (!supported) {
            return undefined;
        }

        const synth = window.speechSynthesis;
        const loadVoices = () => {
            const availableVoices = synth.getVoices?.() || [];
            setVoices(
                [...availableVoices].sort(
                    (left, right) =>
                        left.lang.localeCompare(right.lang) || left.name.localeCompare(right.name),
                ),
            );
        };

        loadVoices();
        synth.addEventListener?.('voiceschanged', loadVoices);

        return () => synth.removeEventListener?.('voiceschanged', loadVoices);
    }, [supported]);

    useEffect(() => {
        if (!enabled) {
            blocksRef.current = [];
            setBlockCount(0);
            setTotalWords(0);
            stop({
                preserveMessage: true,
                nextMessage: 'Switch to scroll mode to use voice playback.',
            });
            return undefined;
        }

        stop({ preserveMessage: false });

        if (typeof window === 'undefined') {
            return undefined;
        }

        const rafId = window.requestAnimationFrame(() => {
            hydrateBlocks();
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [contentKey, enabled, hydrateBlocks, stop]);

    useEffect(() => () => {
        stop({ preserveMessage: false });
    }, [stop]);

    const progress = useMemo(() => {
        if (status === 'completed' && blockCount > 0) {
            return 100;
        }

        if (!blockCount || activeBlockIndex < 0) {
            return 0;
        }

        return Math.min(100, Math.round(((activeBlockIndex + 1) / blockCount) * 100));
    }, [activeBlockIndex, blockCount, status]);

    const remainingMinutes = useMemo(() => {
        if (status === 'completed') {
            return 0;
        }

        if (!totalWords) {
            return 0;
        }

        const rateMultiplier = Math.min(2, Math.max(0.5, Number(rate) || 1));
        const remainingWords = Math.max(totalWords - consumedWords, 0);

        if (!remainingWords) {
            return 0;
        }

        return Math.max(1, Math.ceil(remainingWords / (WORDS_PER_MINUTE * rateMultiplier)));
    }, [consumedWords, rate, status, totalWords]);

    return {
        supported,
        voices,
        status,
        message,
        activeBlockIndex,
        activeBlockText,
        blockCount,
        progress,
        remainingMinutes,
        hasContent: blockCount > 0,
        start,
        stop,
        togglePauseResume,
    };
}
