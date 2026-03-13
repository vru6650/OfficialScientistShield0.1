import React, { useRef, useCallback, useMemo, useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { createLowlight } from 'lowlight';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Subscript from '@tiptap/extension-subscript';
import Superscript from '@tiptap/extension-superscript';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { CharacterCount } from '@tiptap/extension-character-count';
import { Youtube } from '@tiptap/extension-youtube';
import { HorizontalRule } from '@tiptap/extension-horizontal-rule';
import { useSelector } from 'react-redux';
import Placeholder from '@tiptap/extension-placeholder';
import { ListItem } from '@tiptap/extension-list-item';
import TiptapToolbar from './TiptapToolbar';
import { useCloudinaryUpload } from '../hooks/useCloudinaryUpload';
import CodeSnippet from '../tiptap/CodeSnippet';
import ColoredCodeBlock from '../tiptap/ColoredCodeBlock';
import LottieEmbed from '../tiptap/LottieEmbed';
import { apiFetch } from '../utils/apiFetch';

const DEFAULT_SNIPPET_TEMPLATE = Object.freeze({
    html: `
        <section class="snippet-showcase">
            <div class="snippet-showcase__halo"></div>
            <div class="snippet-showcase__ring snippet-showcase__ring--outer"></div>
            <div class="snippet-showcase__ring snippet-showcase__ring--inner"></div>
            <div class="snippet-showcase__core"></div>
            <div class="snippet-showcase__orb snippet-showcase__orb--one"></div>
            <div class="snippet-showcase__orb snippet-showcase__orb--two"></div>
            <div class="snippet-showcase__copy">
                <span class="snippet-showcase__eyebrow">Interactive demo</span>
                <h3 class="snippet-showcase__title">Auto-running orbit animation</h3>
                <p class="snippet-showcase__text">This snippet runs as soon as the post loads, so readers see the motion without pressing play.</p>
            </div>
        </section>
    `,
    css: `
        body {
            display: grid;
            place-items: center;
            min-height: 100vh;
            margin: 0;
            background:
                radial-gradient(circle at top, rgba(14, 165, 233, 0.18), transparent 30%),
                linear-gradient(160deg, #020617 0%, #0f172a 48%, #111827 100%);
            color: #e2e8f0;
        }

        .snippet-showcase {
            --tilt: -10deg;
            position: relative;
            width: min(100%, 420px);
            min-height: 280px;
            padding: 28px 24px;
            border-radius: 28px;
            overflow: hidden;
            isolation: isolate;
            background: linear-gradient(145deg, rgba(15, 23, 42, 0.92), rgba(30, 41, 59, 0.72));
            border: 1px solid rgba(148, 163, 184, 0.18);
            box-shadow:
                inset 0 1px 0 rgba(255, 255, 255, 0.06),
                0 30px 80px rgba(2, 6, 23, 0.45);
            transform: perspective(1200px) rotateX(10deg) rotateY(var(--tilt));
            transition: transform 180ms ease;
        }

        .snippet-showcase__halo {
            position: absolute;
            inset: 12% 18%;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(56, 189, 248, 0.28), transparent 68%);
            filter: blur(14px);
            animation: haloPulse 5s ease-in-out infinite;
        }

        .snippet-showcase__ring,
        .snippet-showcase__core,
        .snippet-showcase__orb {
            position: absolute;
            border-radius: 999px;
        }

        .snippet-showcase__ring {
            inset: 50%;
            translate: -50% -50%;
            border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .snippet-showcase__ring--outer {
            width: 188px;
            height: 188px;
            animation: ringSpin 16s linear infinite;
        }

        .snippet-showcase__ring--inner {
            width: 124px;
            height: 124px;
            border-style: dashed;
            border-color: rgba(34, 211, 238, 0.45);
            animation: ringSpinReverse 10s linear infinite;
        }

        .snippet-showcase__core {
            left: 50%;
            top: 50%;
            width: 22px;
            height: 22px;
            translate: -50% -50%;
            background: linear-gradient(135deg, #67e8f9, #22c55e);
            box-shadow:
                0 0 0 10px rgba(34, 197, 94, 0.08),
                0 0 30px rgba(103, 232, 249, 0.45);
        }

        .snippet-showcase__orb {
            left: 50%;
            top: 50%;
            width: 18px;
            height: 18px;
            margin: -9px 0 0 -9px;
            background: linear-gradient(135deg, #facc15, #fb7185);
            box-shadow: 0 0 22px rgba(250, 204, 21, 0.45);
        }

        .snippet-showcase__orb--one {
            animation: orbitOne 4.8s linear infinite;
        }

        .snippet-showcase__orb--two {
            width: 14px;
            height: 14px;
            margin: -7px 0 0 -7px;
            background: linear-gradient(135deg, #38bdf8, #818cf8);
            box-shadow: 0 0 20px rgba(56, 189, 248, 0.38);
            animation: orbitTwo 3.6s linear infinite;
        }

        .snippet-showcase__copy {
            position: relative;
            z-index: 1;
            display: flex;
            min-height: 224px;
            flex-direction: column;
            justify-content: flex-end;
            gap: 10px;
        }

        .snippet-showcase__eyebrow {
            font: 600 0.7rem/1.2 'Inter', 'Segoe UI', sans-serif;
            letter-spacing: 0.24em;
            text-transform: uppercase;
            color: #67e8f9;
        }

        .snippet-showcase__title {
            margin: 0;
            font: 700 1.65rem/1.05 'Inter', 'Segoe UI', sans-serif;
            letter-spacing: -0.04em;
            color: #f8fafc;
        }

        .snippet-showcase__text {
            margin: 0;
            max-width: 28ch;
            font: 400 0.96rem/1.65 'Inter', 'Segoe UI', sans-serif;
            color: rgba(226, 232, 240, 0.78);
        }

        @keyframes orbitOne {
            from { transform: rotate(0deg) translateX(94px) rotate(0deg); }
            to { transform: rotate(360deg) translateX(94px) rotate(-360deg); }
        }

        @keyframes orbitTwo {
            from { transform: rotate(360deg) translateX(62px) rotate(-360deg); }
            to { transform: rotate(0deg) translateX(62px) rotate(0deg); }
        }

        @keyframes ringSpin {
            from { transform: translate(-50%, -50%) rotate(0deg); }
            to { transform: translate(-50%, -50%) rotate(360deg); }
        }

        @keyframes ringSpinReverse {
            from { transform: translate(-50%, -50%) rotate(360deg); }
            to { transform: translate(-50%, -50%) rotate(0deg); }
        }

        @keyframes haloPulse {
            0%, 100% { opacity: 0.7; transform: scale(0.94); }
            50% { opacity: 1; transform: scale(1.08); }
        }
    `,
    js: `
        const card = document.querySelector('.snippet-showcase');
        let frame = 0;

        const animateCard = () => {
            frame += 0.018;
            const tilt = Math.sin(frame) * 8;
            card?.style.setProperty('--tilt', tilt.toFixed(2) + 'deg');
            requestAnimationFrame(animateCard);
        };

        animateCard();
    `,
});

const isHttpUrl = (value = '') => {
    try {
        const nextUrl = new URL(value);
        return nextUrl.protocol === 'http:' || nextUrl.protocol === 'https:';
    } catch {
        return false;
    }
};

export default function TiptapEditor({
    content,
    onChange,
    placeholder,
    enableLottieEmbeds = false,
}) {
    const { upload, isUploading } = useCloudinaryUpload();
    const fileInputRef = useRef(null);
    const lowlight = useMemo(() => createLowlight(), []);
    const { currentUser } = useSelector((state) => state.user);
    const [isMounted, setIsMounted] = useState(false);

    const editor = useEditor({
        extensions: [
            StarterKit.configure({
                codeBlock: false,
                horizontalRule: false,
                link: false,
                orderedList: { keepAttributes: true },
                bulletList: { keepAttributes: true },
            }),
            HorizontalRule,
            Image,
            Highlight,
            TextAlign.configure({
                types: ['heading', 'paragraph', 'bulletList', 'orderedList', 'listItem'],
            }),
            Subscript,
            Superscript,
            Link.configure({
                openOnClick: false,
                autolink: true,
            }),
            TextStyle,
            Color,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            ColoredCodeBlock.configure({
                lowlight,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableCell,
            TableHeader,
            Youtube.configure({
                controls: false,
                class: 'youtube-iframe',
            }),
            CharacterCount.configure({
                limit: 10000,
            }),
            CodeSnippet,
            ...(enableLottieEmbeds ? [LottieEmbed] : []),
            Placeholder.configure({
                placeholder: placeholder,
            }),
            ListItem
        ],
        content: content,
        onUpdate: ({ editor }) => {
            if (onChange) {
                const html = editor.getHTML();
                const text = editor.getText();
                onChange(html, text); // ✅ return both HTML + plain text
            }
        },
        editorProps: {
            attributes: {
                class: 'tiptap prose max-w-none focus:outline-none dark:prose-invert',
            },
        },
    }, [isMounted]);

    useEffect(() => {
        if (editor) {
            setIsMounted(true);
        }
        if (editor && editor.getHTML() !== content) {
            editor.commands.setContent(content, false);
        }
    }, [content, editor]);

    const addYoutubeVideo = useCallback(() => {
        const url = prompt('Enter YouTube URL');
        if (url && editor) {
            editor.commands.setYoutubeVideo({ src: url });
        }
    }, [editor]);

    const handleImageUpload = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const url = await upload(file, {
                allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
                maxSizeMB: 2
            });
            if (url && editor) {
                editor.chain().focus().setImage({ src: url }).run();
            }
        } catch (error) {
            console.error('Image upload failed:', error);
            alert('Image upload failed: ' + error.message);
        }
    }, [editor, upload]);

    const addCodeSnippet = useCallback(async () => {
        if (!currentUser || !currentUser.isAdmin) {
            alert('You must be an admin to add a code snippet.');
            return;
        }
        if (!editor) return;

        try {
            const res = await apiFetch('/api/v1/code-snippet/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(DEFAULT_SNIPPET_TEMPLATE),
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || 'Failed to create code snippet.');
            }
            const newSnippet = await res.json();
            editor.chain().focus().insertContent({
                type: 'codeSnippet',
                attrs: { snippetId: newSnippet._id },
            }).run();
        } catch (error) {
            console.error('Failed to create code snippet:', error.message);
            alert('Failed to create code snippet: ' + error.message);
        }
    }, [editor, currentUser]);

    const addLottieAnimation = useCallback(() => {
        if (!editor) {
            return;
        }

        const src = window.prompt('Enter a public Lottie JSON or dotLottie URL');
        const normalizedSrc = src?.trim();

        if (!normalizedSrc) {
            return;
        }

        if (!isHttpUrl(normalizedSrc)) {
            window.alert('Enter a valid http or https URL for the animation file.');
            return;
        }

        editor
            .chain()
            .focus()
            .insertContent({
                type: 'lottieEmbed',
                attrs: {
                    src: normalizedSrc,
                    autoplay: true,
                    loop: true,
                },
            })
            .run();
    }, [editor]);

    const memoizedToolbar = useMemo(() => {
        if (!editor) return null;
        return (
            <TiptapToolbar
                editor={editor}
                isUploading={isUploading}
                onAddImage={() => fileInputRef.current?.click()}
                onAddYoutubeVideo={addYoutubeVideo}
                onAddCodeSnippet={addCodeSnippet}
                onAddLottieAnimation={enableLottieEmbeds ? addLottieAnimation : undefined}
            />
        );
    }, [editor, isUploading, addYoutubeVideo, addCodeSnippet, addLottieAnimation, enableLottieEmbeds]);

    return (
        <div className="tiptap-container">
            {memoizedToolbar}
            <EditorContent editor={editor} />
            {editor && (
                <div className="character-count text-sm text-gray-500 dark:text-gray-400 mt-2">
                    {editor.storage.characterCount.characters()} characters
                    {' / '}
                    {editor.storage.characterCount.words()} words
                </div>
            )}
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageUpload}
                accept="image/*"
                style={{ display: 'none' }}
            />
        </div>
    );
}
