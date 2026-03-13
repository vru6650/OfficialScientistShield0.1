import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
import Lottie from 'lottie-react';

const isHttpUrl = (value) => {
    try {
        const nextUrl = new URL(value);
        return nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

const getAnimationSourceKind = (src) => {
    if (!src || !isHttpUrl(src)) {
        return 'unknown';
    }

    try {
        const { pathname } = new URL(src);
        return pathname.toLowerCase().endsWith('.lottie') ? 'dotlottie' : 'json';
    } catch {
        return 'unknown';
    }
};

export default function LottieAnimationPlayer({
    src,
    autoplay = true,
    loop = true,
    title = 'Lottie animation',
    className = '',
}) {
    const [animationData, setAnimationData] = useState(null);
    const [error, setError] = useState(null);
    const sourceKind = useMemo(() => getAnimationSourceKind(src), [src]);

    useEffect(() => {
        if (!src || !isHttpUrl(src)) {
            setAnimationData(null);
            setError('A valid Lottie or dotLottie URL is required.');
            return undefined;
        }

        if (sourceKind === 'dotlottie') {
            setAnimationData(null);
            setError(null);
            return undefined;
        }

        const abortController = new AbortController();

        const loadAnimation = async () => {
            try {
                setError(null);
                setAnimationData(null);

                const response = await fetch(src, {
                    signal: abortController.signal,
                    headers: {
                        Accept: 'application/json',
                    },
                });

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}.`);
                }

                const payload = await response.json();
                setAnimationData(payload);
            } catch (loadError) {
                if (abortController.signal.aborted) {
                    return;
                }

                setError(loadError.message || 'Failed to load animation.');
            }
        };

        loadAnimation();

        return () => abortController.abort();
    }, [sourceKind, src]);

    return (
        <div
            className={`not-prose overflow-hidden rounded-3xl border border-slate-200 bg-white/90 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 ${className}`.trim()}
        >
            <div className='aspect-video w-full bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.16),transparent_38%),linear-gradient(160deg,#020617_0%,#0f172a_45%,#111827_100%)] p-3'>
                {sourceKind === 'dotlottie' ? (
                    <DotLottieReact
                        src={src}
                        autoplay={autoplay}
                        loop={loop}
                        className='h-full w-full'
                        aria-label={title}
                    />
                ) : animationData ? (
                    <Lottie
                        animationData={animationData}
                        autoplay={autoplay}
                        loop={loop}
                        className='h-full w-full'
                        aria-label={title}
                    />
                ) : (
                    <div className='flex h-full items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-slate-950/70 px-4 text-center text-sm text-slate-200'>
                        {error || 'Loading animation...'}
                    </div>
                )}
            </div>
        </div>
    );
}

LottieAnimationPlayer.propTypes = {
    src: PropTypes.string,
    autoplay: PropTypes.bool,
    loop: PropTypes.bool,
    title: PropTypes.string,
    className: PropTypes.string,
};
