import PropTypes from 'prop-types';
import { NodeViewWrapper } from '@tiptap/react';
import LottieAnimationPlayer from './LottieAnimationPlayer.jsx';

const getAnimationLabel = (src = '') => {
    try {
        const { pathname } = new URL(src);
        return pathname.toLowerCase().endsWith('.lottie') ? 'dotLottie animation' : 'Lottie animation';
    } catch {
        return 'Animation';
    }
};

export default function LottieEmbedNodeView({ node, selected }) {
    const { src, autoplay, loop } = node.attrs;
    const animationLabel = getAnimationLabel(src);

    return (
        <NodeViewWrapper
            className={`not-prose my-6 overflow-hidden rounded-3xl ${selected ? 'ring-2 ring-sky-400 ring-offset-2 ring-offset-white dark:ring-offset-slate-950' : ''}`.trim()}
        >
            <div
                className='mb-2 flex items-center justify-between rounded-2xl border border-slate-200 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300'
                data-drag-handle
            >
                <span>{animationLabel}</span>
                <span>{loop ? 'Loop' : 'One shot'}</span>
            </div>
            <LottieAnimationPlayer
                src={src}
                autoplay={autoplay}
                loop={loop}
                title={`Embedded ${animationLabel}`}
            />
        </NodeViewWrapper>
    );
}

LottieEmbedNodeView.propTypes = {
    node: PropTypes.shape({
        attrs: PropTypes.shape({
            src: PropTypes.string,
            autoplay: PropTypes.bool,
            loop: PropTypes.bool,
        }).isRequired,
    }).isRequired,
    selected: PropTypes.bool,
};
