import { Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import LottieEmbedNodeView from '../components/LottieEmbedNodeView.jsx';

const parseBooleanAttribute = (value, defaultValue = true) => {
    if (value === 'false' || value === false) {
        return false;
    }

    if (value === 'true' || value === true) {
        return true;
    }

    return defaultValue;
};

const LottieEmbed = Node.create({
    name: 'lottieEmbed',

    group: 'block',

    atom: true,

    draggable: true,

    selectable: true,

    addAttributes() {
        return {
            src: {
                default: null,
            },
            autoplay: {
                default: true,
            },
            loop: {
                default: true,
            },
        };
    },

    parseHTML() {
        return [
            {
                tag: 'div[data-lottie-src]',
                getAttrs: (element) => {
                    const src = element.getAttribute('data-lottie-src');
                    if (!src) {
                        return false;
                    }

                    return {
                        src,
                        autoplay: parseBooleanAttribute(
                            element.getAttribute('data-lottie-autoplay'),
                            true
                        ),
                        loop: parseBooleanAttribute(
                            element.getAttribute('data-lottie-loop'),
                            true
                        ),
                    };
                },
            },
        ];
    },

    renderHTML({ HTMLAttributes }) {
        return [
            'div',
            {
                'data-lottie-src': HTMLAttributes.src,
                'data-lottie-autoplay': HTMLAttributes.autoplay ? 'true' : 'false',
                'data-lottie-loop': HTMLAttributes.loop ? 'true' : 'false',
            },
        ];
    },

    addNodeView() {
        return ReactNodeViewRenderer(LottieEmbedNodeView);
    },
});

export default LottieEmbed;
