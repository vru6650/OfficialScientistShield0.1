import { lazy, Suspense, useEffect, useId, useMemo, useRef, useState } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { useSelector } from 'react-redux';
import { HiOutlineCodeBracket, HiOutlineSparkles } from 'react-icons/hi2';
import useCodeSnippet from '../hooks/useCodeSnippet';

const CodeEditor = lazy(() => import('./CodeEditor'));

const DEFAULT_FRAME_HEIGHT = 320;
const MIN_FRAME_HEIGHT = 220;
const MAX_FRAME_HEIGHT = 760;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const buildPreviewDocument = ({ html = '', css = '', js = '', instanceId }) => {
    const safeInstanceId = JSON.stringify(instanceId);
    const safeHtml = html || '';
    const safeCss = (css || '').replace(/<\/style/gi, '<\\/style');
    const safeJs = (js || '').replace(/<\/script/gi, '<\\/script');

    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      :root {
        color-scheme: light;
      }

      html, body {
        margin: 0;
        padding: 0;
        min-height: 100%;
        overflow-x: hidden;
        background: transparent;
        font-family: 'Inter', 'Segoe UI', sans-serif;
      }

      body {
        min-height: 100%;
      }

      * {
        box-sizing: border-box;
      }

      ${safeCss}
    </style>
  </head>
  <body>
    ${safeHtml}
    <script>
      (() => {
        const instanceId = ${safeInstanceId};

        const postHeight = () => {
          const nextHeight = Math.max(
            document.documentElement.scrollHeight || 0,
            document.body.scrollHeight || 0,
            document.documentElement.offsetHeight || 0,
            document.body.offsetHeight || 0
          );

          parent.postMessage(
            {
              type: 'scientistshield-snippet-height',
              instanceId,
              height: nextHeight,
            },
            '*'
          );
        };

        const renderRuntimeError = (error) => {
          const banner = document.createElement('div');
          banner.style.position = 'fixed';
          banner.style.left = '12px';
          banner.style.right = '12px';
          banner.style.bottom = '12px';
          banner.style.zIndex = '9999';
          banner.style.padding = '10px 12px';
          banner.style.borderRadius = '12px';
          banner.style.background = 'rgba(15, 23, 42, 0.92)';
          banner.style.color = '#f8fafc';
          banner.style.font = '12px/1.5 ui-monospace, SFMono-Regular, Menlo, monospace';
          banner.style.boxShadow = '0 18px 40px rgba(15, 23, 42, 0.28)';
          banner.textContent = error instanceof Error ? error.message : String(error);
          document.body.appendChild(banner);
          postHeight();
        };

        window.addEventListener('error', (event) => {
          renderRuntimeError(event.error || event.message || 'Snippet runtime error');
        });

        window.addEventListener('load', () => {
          postHeight();
          requestAnimationFrame(postHeight);
          setTimeout(postHeight, 150);
          setTimeout(postHeight, 750);
        });

        if ('ResizeObserver' in window) {
          const observer = new ResizeObserver(() => postHeight());
          observer.observe(document.documentElement);
        }

        try {
          ${safeJs}
        } catch (error) {
          renderRuntimeError(error);
        }

        postHeight();
      })();
    </script>
  </body>
</html>`;
};

export default function EmbeddedSnippetPreview({ snippetId, className = '' }) {
    const iframeRef = useRef(null);
    const heightResetRef = useRef(null);
    const instanceId = useId().replace(/:/g, '');
    const { currentUser } = useSelector((state) => state.user || {});
    const { snippet, isLoading, error } = useCodeSnippet(snippetId);
    const [frameHeight, setFrameHeight] = useState(DEFAULT_FRAME_HEIGHT);
    const [showEditor, setShowEditor] = useState(false);

    const canEditSnippet = Boolean(currentUser?.isAdmin);
    const hasWebPreview = useMemo(
        () =>
            Boolean(
                snippet?.html?.trim() ||
                snippet?.css?.trim() ||
                snippet?.js?.trim()
            ),
        [snippet?.css, snippet?.html, snippet?.js]
    );

    const previewDocument = useMemo(() => {
        if (!hasWebPreview || !snippet) {
            return '';
        }

        return buildPreviewDocument({
            html: snippet.html,
            css: snippet.css,
            js: snippet.js,
            instanceId,
        });
    }, [hasWebPreview, instanceId, snippet]);

    useEffect(() => {
        if (!hasWebPreview) {
            return undefined;
        }

        const handleMessage = (event) => {
            if (event.source !== iframeRef.current?.contentWindow) {
                return;
            }

            if (event.data?.type !== 'scientistshield-snippet-height') {
                return;
            }

            if (event.data?.instanceId !== instanceId) {
                return;
            }

            const nextHeight = clamp(
                Number(event.data?.height) || DEFAULT_FRAME_HEIGHT,
                MIN_FRAME_HEIGHT,
                MAX_FRAME_HEIGHT
            );

            setFrameHeight(nextHeight);
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, [hasWebPreview, instanceId]);

    useEffect(() => {
        if (!hasWebPreview) {
            return undefined;
        }

        setFrameHeight(DEFAULT_FRAME_HEIGHT);

        if (heightResetRef.current) {
            window.clearTimeout(heightResetRef.current);
        }

        heightResetRef.current = window.setTimeout(() => {
            setFrameHeight((currentHeight) => Math.max(currentHeight, DEFAULT_FRAME_HEIGHT));
        }, 250);

        return () => {
            if (heightResetRef.current) {
                window.clearTimeout(heightResetRef.current);
            }
        };
    }, [hasWebPreview, previewDocument]);

    if (!snippetId) {
        return null;
    }

    if (isLoading) {
        return (
            <div
                className={`rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 ${className}`.trim()}
            >
                <div className='flex items-center gap-3 text-sm text-slate-600 dark:text-slate-300'>
                    <Spinner size='sm' />
                    Loading interactive snippet...
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div
                className={`rounded-2xl border border-rose-200 bg-rose-50/90 p-4 text-sm text-rose-700 shadow-sm dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-200 ${className}`.trim()}
            >
                Unable to load this code snippet: {error}
            </div>
        );
    }

    if (!snippet) {
        return null;
    }

    if (!hasWebPreview) {
        return (
            <div className={className}>
                <Suspense
                    fallback={
                        <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300'>
                            Loading code snippet...
                        </div>
                    }
                >
                    <CodeEditor snippetId={snippetId} />
                </Suspense>
            </div>
        );
    }

    return (
        <div
            className={`overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/80 ${className}`.trim()}
        >
            <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/80'>
                <div>
                    <div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400'>
                        <HiOutlineSparkles className='h-4 w-4 text-sky-500' />
                        Interactive snippet
                    </div>
                    <p className='mt-1 text-sm text-slate-600 dark:text-slate-300'>
                        The preview runs automatically when this block appears in the post.
                    </p>
                </div>

                <div className='flex flex-wrap items-center gap-2'>
                    <span className='inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-200'>
                        <HiOutlineCodeBracket className='h-3.5 w-3.5' />
                        Auto-run enabled
                    </span>
                    {canEditSnippet ? (
                        <Button
                            size='xs'
                            color='light'
                            type='button'
                            onClick={() => setShowEditor((value) => !value)}
                            className='border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800'
                        >
                            {showEditor ? 'Hide editor' : 'Edit snippet'}
                        </Button>
                    ) : null}
                </div>
            </div>

            <div className='space-y-4 p-4'>
                <div className='overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-inner dark:border-slate-800 dark:bg-slate-950'>
                    <iframe
                        ref={iframeRef}
                        title='Interactive code snippet preview'
                        sandbox='allow-scripts'
                        srcDoc={previewDocument}
                        className='block w-full bg-transparent'
                        style={{ height: `${frameHeight}px` }}
                    />
                </div>

                {canEditSnippet && showEditor ? (
                    <Suspense
                        fallback={
                            <div className='rounded-2xl border border-slate-200 bg-white/90 p-4 text-sm text-slate-500 shadow-sm dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300'>
                                Loading code editor...
                            </div>
                        }
                    >
                        <CodeEditor snippetId={snippetId} />
                    </Suspense>
                ) : null}
            </div>
        </div>
    );
}
