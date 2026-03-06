import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { Button, ToggleSwitch, Spinner, Alert } from 'flowbite-react';
import { useSelector } from 'react-redux';
import {
    FaPlay, FaRedo, FaTerminal, FaCopy, FaExpand, FaPlus, FaMinus, FaCheck, FaCompress, FaGlobe, FaExternalLinkAlt,
    FaColumns, FaDownload, FaUpload, FaSearch, FaCodeBranch, FaSave, FaBug, FaPause, FaStepForward, FaStepBackward,
    FaSignInAlt, FaSignOutAlt, FaStop, FaKeyboard, FaHtml5, FaCss3Alt, FaJsSquare, FaPython, FaJava, FaCode, FaBolt, FaSun, FaMoon
} from 'react-icons/fa';
import { SiCplusplus, SiCsharp } from 'react-icons/si';
import { motion, AnimatePresence } from 'framer-motion';

import useCodeSnippet from '../hooks/useCodeSnippet';
import { apiFetch } from '../utils/apiFetch';

const supportedLanguages = ['javascript', 'cpp', 'python', 'java', 'csharp'];
const storageLanguages = [...supportedLanguages, 'html', 'css'];

const languageAliases = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    'c++': 'cpp',
    cpp: 'cpp',
    java: 'java',
    csharp: 'csharp',
    'c#': 'csharp',
    cs: 'csharp',
    html: 'javascript',
    css: 'javascript',
};

const storageLanguageAliases = {
    js: 'javascript',
    javascript: 'javascript',
    py: 'python',
    python: 'python',
    'c++': 'cpp',
    cpp: 'cpp',
    java: 'java',
    csharp: 'csharp',
    'c#': 'csharp',
    cs: 'csharp',
    html: 'html',
    css: 'css',
};

const normalizeLanguage = (language) => {
    if (!language) {
        return 'javascript';
    }

    const normalizedInput = typeof language === 'string'
        ? language.toLowerCase()
        : String(language).toLowerCase();

    const normalized = languageAliases[normalizedInput] || normalizedInput;

    return supportedLanguages.includes(normalized) ? normalized : 'javascript';
};

const normalizeStorageLanguage = (language) => {
    if (!language) {
        return null;
    }

    const normalizedInput = typeof language === 'string'
        ? language.toLowerCase()
        : String(language).toLowerCase();

    const normalized = storageLanguageAliases[normalizedInput] || normalizedInput;

    return storageLanguages.includes(normalized) ? normalized : null;
};

const normalizeInitialCode = (initialCode, fallbackLanguage) => {
    if (!initialCode) {
        return {};
    }

    if (typeof initialCode === 'string') {
        const normalizedStorageLanguage = normalizeStorageLanguage(fallbackLanguage);
        if (normalizedStorageLanguage) {
            return { [normalizedStorageLanguage]: initialCode };
        }
        const normalizedLanguage = normalizeLanguage(fallbackLanguage);
        return { [normalizedLanguage]: initialCode };
    }

    if (typeof initialCode === 'object') {
        return Object.entries(initialCode).reduce((acc, [key, value]) => {
            const normalizedKey = normalizeStorageLanguage(key);
            if (typeof value === 'string' && normalizedKey) {
                acc[normalizedKey] = value;
            }
            return acc;
        }, {});
    }

    return {};
};

const defaultCodes = {
    html: `<!DOCTYPE html>
<html>
  <head>
    <style>
      body {
        font-family: sans-serif;
        color: #333;
        padding: 1.5rem;
      }
      h1 {
        color: #7c3aed;
        margin-bottom: 0.75rem;
      }
      p {
        margin: 0;
        color: #475569;
      }
    </style>
  </head>
  <body>
    <h1>Live Preview</h1>
    <p>This preview updates automatically when you run JavaScript.</p>
  </body>
</html>`,
    css: `body {
  background-color: #f8fafc;
  min-height: 100vh;
}
`,
    javascript: `// Use console.log() to see output in the terminal
function greet(name) {
  return 'Hello, ' + name + '!';
}
console.log(greet('Developer'));`,
    cpp: `#include <iostream>
#include <vector>
#include <string>

int main() {
    std::vector<std::string> msg {"Hello", "C++", "World", "from", "ScientistShield!"};
    for (const std::string& word : msg) {
        std::cout << word << " ";
    }
    std::cout << std::endl;
    return 0;
}`,
    java: `public class Main {
  public static void main(String[] args) {
    System.out.println("Hello from Java!");
  }
}
`,
    python: `def hello_world():
  message = "Hello, Python World!"
  print(message)

hello_world()`,
    csharp: `using System;

namespace ScientistShield
{
    public class Program
    {
        public static void Main(string[] args)
        {
            Console.WriteLine("Hello from C#!");
        }
    }
}`,
};

const languageMeta = {
    html: { label: 'HTML', Icon: FaHtml5, badge: 'bg-gradient-to-br from-orange-400 to-orange-600 text-white' },
    css: { label: 'CSS', Icon: FaCss3Alt, badge: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white' },
    javascript: { label: 'JavaScript', Icon: FaJsSquare, badge: 'bg-gradient-to-br from-yellow-300 to-amber-500 text-gray-900' },
    cpp: { label: 'C++', Icon: SiCplusplus, badge: 'bg-gradient-to-br from-sky-500 to-indigo-600 text-white' },
    python: { label: 'Python', Icon: FaPython, badge: 'bg-gradient-to-br from-sky-400 to-emerald-500 text-white' },
    java: { label: 'Java', Icon: FaJava, badge: 'bg-gradient-to-br from-orange-500 to-red-500 text-white' },
    csharp: { label: 'C#', Icon: SiCsharp, badge: 'bg-gradient-to-br from-emerald-500 to-teal-500 text-white' },
};

export default function CodeEditor({ initialCode = {}, language = 'javascript', snippetId, workspaceId }) {
    const { theme } = useSelector((state) => state.theme);
    const editorRef = useRef(null);
    const outputRef = useRef(null);
    const previewRef = useRef(null);
    const [previewHtml, setPreviewHtml] = useState('');
    const containerRef = useRef(null);
    const dragStateRef = useRef(null);
    const fileInputRef = useRef(null);
    const monacoRef = useRef(null);
    const { snippet, isLoading: isSnippetLoading, error: snippetError } = useCodeSnippet(snippetId);

    const normalizedInitialLanguage = normalizeLanguage(language);
    const storageKey = useMemo(
        () => `code-editor:v2:${workspaceId || snippetId || 'default'}`,
        [workspaceId, snippetId]
    );
    const normalizedInitialCode = useMemo(
        () => normalizeInitialCode(initialCode, language),
        [initialCode, language]
    );
    const initialStorageLanguage = useMemo(() => normalizeStorageLanguage(language), [language]);
    const initialWebTab = useMemo(() => {
        if (initialStorageLanguage === 'html' || initialStorageLanguage === 'css') {
            return initialStorageLanguage;
        }
        if (normalizedInitialCode.html) {
            return 'html';
        }
        if (normalizedInitialCode.css) {
            return 'css';
        }
        return 'javascript';
    }, [initialStorageLanguage, normalizedInitialCode.html, normalizedInitialCode.css]);
    const initialWebMode = useMemo(
        () =>
            initialStorageLanguage === 'html' ||
            initialStorageLanguage === 'css' ||
            Boolean(normalizedInitialCode.html || normalizedInitialCode.css),
        [initialStorageLanguage, normalizedInitialCode.html, normalizedInitialCode.css]
    );


    // Consolidated state for all code snippets
    const [codes, setCodes] = useState({
        html: normalizedInitialCode.html || defaultCodes.html,
        css: normalizedInitialCode.css || defaultCodes.css,
        javascript: normalizedInitialCode.javascript || defaultCodes.javascript,
        cpp: normalizedInitialCode.cpp || defaultCodes.cpp,
        python: normalizedInitialCode.python || defaultCodes.python,
        java: normalizedInitialCode.java || defaultCodes.java,
        csharp: normalizedInitialCode.csharp || defaultCodes.csharp,
    });

    const [selectedLanguage, setSelectedLanguage] = useState(normalizedInitialLanguage);
    const [isWebMode, setIsWebMode] = useState(initialWebMode);
    const [webTab, setWebTab] = useState(initialWebTab);
    const [consoleOutput, setConsoleOutput] = useState('');
    const [isRunning, setIsRunning] = useState(false);
    const [runError, setRunError] = useState(null);
    const [showOutputPanel, setShowOutputPanel] = useState(true);
    const [editorTheme, setEditorTheme] = useState(theme === 'dark' ? 'vs-dark' : 'vs-light');
    const [fontSize, setFontSize] = useState(14);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isCopied, setIsCopied] = useState(false);
    const [hasAppliedSnippet, setHasAppliedSnippet] = useState(false);
    const [autoRunPreview, setAutoRunPreview] = useState(true);
    const appliedLocalRef = useRef(false);
    const [showMinimap, setShowMinimap] = useState(true);
    const [showLineNumbers, setShowLineNumbers] = useState(true);
    const [wordWrap, setWordWrap] = useState('on'); // 'on' | 'off'
    const [splitVertical, setSplitVertical] = useState(false);
    const [panelSize, setPanelSize] = useState(280); // px
    const [showDiff, setShowDiff] = useState(false);
    const [baselines, setBaselines] = useState(null);
    const baselineInitRef = useRef(false);
    const [cursorPos, setCursorPos] = useState({ lineNumber: 1, column: 1 });
    const [isSaved, setIsSaved] = useState(true);
    const getLanguageMeta = useCallback((lang) => {
        if (!lang) return { label: 'CODE', Icon: FaCode, badge: 'bg-slate-700 text-slate-100' };
        const meta = languageMeta[lang.toLowerCase()];
        if (meta) return meta;
        return { label: lang.toUpperCase(), Icon: FaCode, badge: 'bg-slate-700 text-slate-100' };
    }, []);

    // Command palette state
    const [isCmdOpen, setIsCmdOpen] = useState(false);
    const [cmdQuery, setCmdQuery] = useState('');
    const [cmdIndex, setCmdIndex] = useState(0);

    // Debugger state
    const debugSupported = new Set();
    const [debugActive, setDebugActive] = useState(false);
    const [debugTrace, setDebugTrace] = useState(null);
    const [debugIndex, setDebugIndex] = useState(0);
    const [isDebugPlaying, setIsDebugPlaying] = useState(false);
    const [debugDelay, setDebugDelay] = useState(700);
    const [debugError, setDebugError] = useState(null);
    const [breakpointsByLang, setBreakpointsByLang] = useState({}); // { lang: number[] }
    const debugDecorationsRef = useRef([]);
    const [breakOnException, setBreakOnException] = useState(true);
    const [lineOnlyStepping, setLineOnlyStepping] = useState(true);
    const [disableBreakpoints, setDisableBreakpoints] = useState(false);
    const [runToLineTarget, setRunToLineTarget] = useState(null);
    const [selectedDebugFrame, setSelectedDebugFrame] = useState(null);
    const [selectedDebugObjectId, setSelectedDebugObjectId] = useState(null);

    const handleEditorDidMount = (editor, monaco) => {
        editorRef.current = editor;
        monacoRef.current = monaco;

        // Shortcuts
        try {
            // Ctrl/Cmd + Enter => Run
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
                runCode();
            });
            // Ctrl/Cmd + S => Format
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
                formatCode();
            });
            // F11 => Toggle Fullscreen
            editor.addCommand(monaco.KeyCode.F11, () => {
                toggleFullScreen();
            });
            // Ctrl/Cmd + F => Find
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
                editor.getAction('actions.find')?.run();
            });
            // Cursor status tracking
            setCursorPos(editor.getPosition() || { lineNumber: 1, column: 1 });
            editor.onDidChangeCursorPosition((e) => {
                setCursorPos(e.position);
            });

            // Gutter click: toggle breakpoint
            editor.onMouseDown((e) => {
                try {
                    const m = monaco.editor?.MouseTargetType;
                    if (!m) return;
                    if (e.target.type === m.GUTTER_GLYPH_MARGIN || e.target.type === m.GUTTER_LINE_DECORATIONS) {
                        const line = e.target.position?.lineNumber;
                        if (line) toggleBreakpoint(line);
                    }
                } catch (_) {}
            });

            // Keyboard shortcuts for debugger (Thonny-like)
            try {
                editor.addCommand(monaco.KeyCode.F5, () => setIsDebugPlaying((p) => !p)); // Continue/Pause
                editor.addCommand(monaco.KeyCode.F10, () => stepOver()); // Step Over
                editor.addCommand(monaco.KeyCode.F11, () => stepInto()); // Step Into
                editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F11, () => stepOut()); // Step Out
                editor.addCommand(monaco.KeyCode.F9, () => toggleBreakpointAtCursor()); // Toggle BP
                editor.addCommand(monaco.KeyMod.Shift | monaco.KeyCode.F9, () => clearBreakpoints()); // Clear BP
                editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.F10, () => runToCursor()); // Run to cursor
            } catch (_) {}
        } catch (e) {
            // non-fatal
        }
    };


    const handleCodeChange = (newCode) => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        setCodes(prevCodes => ({
            ...prevCodes,
            [activeLang]: newCode
        }));
        setIsSaved(false);
    };

    const buildPreviewHtml = () => {
        const html = codes.html || '';
        const css = codes.css || '';
        const js = codes.javascript || '';
        return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body { margin: 0; padding: 0; min-height: 100%; }
      ${css}
    </style>
  </head>
  <body>
    ${html}
    <script>
      try { ${js} } catch (e) { console.error(e); }
    </script>
  </body>
</html>`;
    };

    const updatePreview = () => {
        // Use srcDoc to render the preview to avoid cross-origin access errors
        setPreviewHtml(buildPreviewHtml());
    };

    const runCode = async () => {
        if (isWebMode) {
            updatePreview();
            return;
        }
        setIsRunning(true);
        setRunError(null);
        setConsoleOutput('');

        const endpointMap = {
            javascript: '/api/v1/code/run-js',
            cpp: '/api/v1/code/run-cpp',
            python: '/api/v1/code/run-python',
            java: '/api/v1/code/run-java',
            csharp: '/api/v1/code/run-csharp',
        };

        const endpoint = endpointMap[selectedLanguage];

        if (!endpoint) {
            setRunError(`Unsupported language: ${selectedLanguage}`);
            setIsRunning(false);
            return;
        }

        try {
            const res = await apiFetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: codes[selectedLanguage] }),
            });
            const data = await res.json();
            if (data.error) {
                setRunError(data.output);
            } else {
                setConsoleOutput(data.output);
            }
        } catch (error) {
            setRunError(`An error occurred while running the ${selectedLanguage} code.`);
            console.error(error);
        } finally {
            setIsRunning(false);
        }
    };

    useEffect(() => {
        setEditorTheme(theme === 'dark' ? 'vs-dark' : 'vs-light');
    }, [theme]);

    // Auto-run preview when code changes in web mode
    useEffect(() => {
        if (!isWebMode || !autoRunPreview) return;
        const t = setTimeout(() => updatePreview(), 400);
        return () => clearTimeout(t);
    }, [codes.html, codes.css, codes.javascript, isWebMode, autoRunPreview]);

    // When switching to web mode, ensure webTab and default preview
    useEffect(() => {
        if (isWebMode) {
            setWebTab((prev) => (['html','css','javascript'].includes(prev) ? prev : 'javascript'));
            // Initialize preview once on enter
            updatePreview();
        }
    }, [isWebMode]);

    useEffect(() => {
        setHasAppliedSnippet(false);
    }, [snippetId]);

    // Initialize diff baselines once from first resolved codes
    useEffect(() => {
        if (!baselineInitRef.current && codes && Object.keys(codes).length) {
            setBaselines((prev) => prev || { ...codes });
            baselineInitRef.current = true;
        }
    }, [codes]);

    // ============ Debugger helpers ============
    const activeLang = isWebMode ? webTab : selectedLanguage;
    const debugEvents = debugTrace?.events || [];
    const debugHasEvents = debugEvents.length > 0;
    const debugCurrent = debugHasEvents ? debugEvents[Math.min(debugIndex, debugEvents.length - 1)] : null;
    const debugNext = debugHasEvents && debugIndex < debugEvents.length - 1 ? debugEvents[debugIndex + 1] : null;
    const debugCurrentLine = debugCurrent?.line || null;
    const debugNextLine = debugNext?.line || null;
    const currentDepth = Array.isArray(debugCurrent?.stack) ? debugCurrent.stack.length : 0;
    const debugMemoryFrames = debugCurrent?.memory?.frames || [];
    const debugMemoryObjects = debugCurrent?.memory?.objects || [];

    const getBreakpoints = (lang) => new Set((breakpointsByLang[lang] || []).map(Number));
    const setBreakpoints = (lang, set) => {
        setBreakpointsByLang((prev) => ({ ...prev, [lang]: Array.from(set).sort((a, b) => a - b) }));
    };

    const toggleBreakpoint = (lineNumber) => {
        const lang = activeLang;
        const set = getBreakpoints(lang);
        if (set.has(lineNumber)) set.delete(lineNumber); else set.add(lineNumber);
        setBreakpoints(lang, set);
    };

    const renderBreakpointDecorations = () => {
        const editor = editorRef.current; const monaco = monacoRef.current;
        if (!editor || !monaco) return [];
        const set = getBreakpoints(activeLang);
        return Array.from(set).map((ln) => ({
            range: new monaco.Range(ln, 1, ln, 1),
            options: {
                isWholeLine: false,
                glyphMarginClassName: 'ss-breakpoint-glyph',
                glyphMarginHoverMessage: { value: `Breakpoint at line ${ln}` },
            },
        }));
    };

    const updateDebugDecorations = useCallback(() => {
        const editor = editorRef.current; const monaco = monacoRef.current;
        if (!editor || !monaco) return;
        const decos = [];
        if (debugCurrentLine) {
            decos.push({
                range: new monaco.Range(debugCurrentLine, 1, debugCurrentLine, 1),
                options: { isWholeLine: true, className: 'ss-debug-current', glyphMarginClassName: 'ss-debug-glyph-current' },
            });
        }
        if (debugNextLine && debugNextLine !== debugCurrentLine) {
            decos.push({
                range: new monaco.Range(debugNextLine, 1, debugNextLine, 1),
                options: { isWholeLine: true, className: 'ss-debug-next', glyphMarginClassName: 'ss-debug-glyph-next' },
            });
        }
        const bps = renderBreakpointDecorations();
        const all = decos.concat(bps);
        debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, all);
    }, [debugCurrentLine, debugNextLine, breakpointsByLang, activeLang]);

    useEffect(() => { updateDebugDecorations(); }, [updateDebugDecorations]);

    // Debugger placeholder (feature removed)
    const startDebug = async () => {
        setDebugActive(false);
        setDebugTrace(null);
        setDebugIndex(0);
        setIsDebugPlaying(false);
        setSelectedDebugFrame(null);
        setSelectedDebugObjectId(null);
        setRunToLineTarget(null);
        setDebugError('Step-by-step debugging is no longer available.');
    };

    const stopDebug = () => {
        setIsDebugPlaying(false);
        setDebugActive(false);
        setDebugTrace(null);
        setDebugIndex(0);
        setDebugError(null);
        setRunToLineTarget(null);
        // clear decorations
        try {
            const editor = editorRef.current;
            if (editor && debugDecorationsRef.current.length) {
                debugDecorationsRef.current = editor.deltaDecorations(debugDecorationsRef.current, []);
            }
        } catch (_) {}
    };

    const restartDebug = () => {
        stopDebug();
        startDebug();
    };

    const goToDebugIndex = (idx) => {
        if (!debugHasEvents) return;
        setDebugIndex(Math.max(0, Math.min(idx, debugEvents.length - 1)));
        setIsDebugPlaying(false);
    };
    const findNextIndex = (from) => {
        if (!debugHasEvents) return from;
        for (let i = Math.min(from + 1, debugEvents.length - 1); i < debugEvents.length; i += 1) {
            const ev = debugEvents[i];
            if (lineOnlyStepping && ev?.event !== 'line') continue;
            return i;
        }
        return from;
    };
    const findPrevIndex = (from) => {
        if (!debugHasEvents) return from;
        for (let i = Math.max(from - 1, 0); i >= 0; i -= 1) {
            const ev = debugEvents[i];
            if (lineOnlyStepping && ev?.event !== 'line') continue;
            return i;
        }
        return from;
    };
    const stepNext = () => { if (debugHasEvents) goToDebugIndex(findNextIndex(debugIndex)); };
    const stepPrev = () => { if (debugHasEvents) goToDebugIndex(findPrevIndex(debugIndex)); };
    const stepInto = () => { if (debugHasEvents) stepNext(); };
    const stepOver = () => {
        if (!debugHasEvents) return;
        const depth = currentDepth;
        for (let i = debugIndex + 1; i < debugEvents.length; i += 1) {
            const d = Array.isArray(debugEvents[i]?.stack) ? debugEvents[i].stack.length : 0;
            if (d <= depth) { goToDebugIndex(i); return; }
        }
        goToDebugIndex(debugEvents.length - 1);
    };
    const stepOut = () => {
        if (!debugHasEvents) return;
        const depth = currentDepth;
        for (let i = debugIndex + 1; i < debugEvents.length; i += 1) {
            const d = Array.isArray(debugEvents[i]?.stack) ? debugEvents[i].stack.length : 0;
            if (d < depth) { goToDebugIndex(i); return; }
        }
        goToDebugIndex(debugEvents.length - 1);
    };

    const toggleBreakpointAtCursor = () => {
        const pos = editorRef.current?.getPosition?.();
        if (!pos?.lineNumber) return;
        toggleBreakpoint(pos.lineNumber);
    };
    const clearBreakpoints = () => {
        setBreakpointsByLang((prev) => ({ ...prev, [activeLang]: [] }));
    };
    const runToCursor = () => {
        const pos = editorRef.current?.getPosition?.();
        if (!pos?.lineNumber) return;
        setRunToLineTarget(pos.lineNumber);
        setIsDebugPlaying(true);
    };

    // Play loop with breakpoint support
    useEffect(() => {
        if (!isDebugPlaying || !debugHasEvents) return;
        const bpSet = getBreakpoints(activeLang);
        const timer = setTimeout(() => {
            // next qualifying step
            const nextIdxRaw = findNextIndex(debugIndex);
            const nextIdx = Math.min(nextIdxRaw, debugEvents.length - 1);
            const nextEvt = debugEvents[nextIdx];
            if (breakOnException && nextEvt?.event === 'exception') {
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (runToLineTarget && nextEvt?.line === runToLineTarget) {
                setRunToLineTarget(null);
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (!disableBreakpoints && nextEvt && nextEvt.line && bpSet.has(Number(nextEvt.line))) {
                setIsDebugPlaying(false);
                setDebugIndex(nextIdx);
                return;
            }
            if (nextIdx === debugIndex) {
                setIsDebugPlaying(false);
                return;
            }
            setDebugIndex(nextIdx);
        }, debugDelay);
        return () => clearTimeout(timer);
    }, [isDebugPlaying, debugIndex, debugDelay, debugHasEvents, breakpointsByLang, activeLang, lineOnlyStepping, breakOnException, disableBreakpoints, runToLineTarget]);

    useEffect(() => {
        if (!snippetId || !snippet || hasAppliedSnippet) {
            return;
        }

        const snippetHasHtml = typeof snippet.html === 'string' && snippet.html.trim().length > 0;
        const snippetHasCss = typeof snippet.css === 'string' && snippet.css.trim().length > 0;
        const preferredLanguage = (() => {
            if (language) {
                return normalizeLanguage(language);
            }
            if (snippet.js && snippet.js.trim()) {
                return 'javascript';
            }
            if (snippet.cpp && snippet.cpp.trim()) {
                return 'cpp';
            }
            if (snippet.python && snippet.python.trim()) {
                return 'python';
            }
            if (snippet.java && snippet.java.trim()) {
                return 'java';
            }
            if (snippet.csharp && snippet.csharp.trim()) {
                return 'csharp';
            }
            return selectedLanguage;
        })();

        setCodes((prevCodes) => ({
            ...prevCodes,
            html: snippet.html || defaultCodes.html,
            css: snippet.css || defaultCodes.css,
            javascript: snippet.js || defaultCodes.javascript,
            cpp: snippet.cpp || prevCodes.cpp || defaultCodes.cpp,
            python: snippet.python || prevCodes.python || defaultCodes.python,
            java: snippet.java || prevCodes.java || defaultCodes.java,
            csharp: snippet.csharp || prevCodes.csharp || defaultCodes.csharp,
        }));
        setSelectedLanguage(supportedLanguages.includes(preferredLanguage) ? preferredLanguage : 'javascript');
        if (snippetHasHtml || snippetHasCss) {
            setIsWebMode(true);
            setWebTab(snippetHasHtml ? 'html' : 'css');
        }
        setHasAppliedSnippet(true);
    }, [snippetId, snippet, hasAppliedSnippet, language, selectedLanguage]);

    // Apply locally saved state (codes + settings) after snippet load
    useEffect(() => {
        if (appliedLocalRef.current) return;
        const raw = localStorage.getItem(storageKey);
        if (!raw) return;
        try {
            const saved = JSON.parse(raw);
            if (saved?.codes && typeof saved.codes === 'object') {
                setCodes((prev) => ({ ...prev, ...saved.codes }));
            }
            if (saved?.selectedLanguage) {
                setSelectedLanguage(normalizeLanguage(saved.selectedLanguage));
            }
            if (typeof saved?.isWebMode === 'boolean') setIsWebMode(saved.isWebMode);
            if (saved?.webTab && ['html','css','javascript'].includes(saved.webTab)) setWebTab(saved.webTab);
            if (typeof saved?.fontSize === 'number') setFontSize(Math.max(8, Math.min(32, saved.fontSize)));
            if (typeof saved?.autoRunPreview === 'boolean') setAutoRunPreview(saved.autoRunPreview);
            if (typeof saved?.showMinimap === 'boolean') setShowMinimap(saved.showMinimap);
            if (typeof saved?.showLineNumbers === 'boolean') setShowLineNumbers(saved.showLineNumbers);
            if (saved?.wordWrap) setWordWrap(saved.wordWrap === 'off' ? 'off' : 'on');
            if (typeof saved?.splitVertical === 'boolean') setSplitVertical(saved.splitVertical);
            if (typeof saved?.panelSize === 'number') setPanelSize(Math.max(160, Math.min(1000, saved.panelSize)));
            if (typeof saved?.showOutputPanel === 'boolean') setShowOutputPanel(saved.showOutputPanel);
        } catch (_) {
            // ignore bad local storage
        }
        appliedLocalRef.current = true;
    }, [hasAppliedSnippet, storageKey]);

    // Persist state to local storage (debounced)
    useEffect(() => {
        const t = setTimeout(() => {
            try {
                const payload = {
                    codes,
                    selectedLanguage,
                    isWebMode,
                    webTab,
                    fontSize,
                    autoRunPreview,
                    showMinimap,
                    showLineNumbers,
                    wordWrap,
                    splitVertical,
                    panelSize,
                    showOutputPanel,
                };
                localStorage.setItem(storageKey, JSON.stringify(payload));
                setIsSaved(true);
            } catch (_) {}
        }, 500);
        return () => clearTimeout(t);
    }, [codes, selectedLanguage, isWebMode, webTab, fontSize, autoRunPreview, showMinimap, showLineNumbers, wordWrap, splitVertical, panelSize, showOutputPanel, storageKey]);

    const resetCode = () => {
        setCodes({
            html: (snippet?.html ?? normalizedInitialCode.html) || defaultCodes.html,
            css: (snippet?.css ?? normalizedInitialCode.css) || defaultCodes.css,
            javascript: (snippet?.js ?? normalizedInitialCode.javascript) || defaultCodes.javascript,
            cpp: (snippet?.cpp ?? normalizedInitialCode.cpp) || defaultCodes.cpp,
            python: (snippet?.python ?? normalizedInitialCode.python) || defaultCodes.python,
            java: (snippet?.java ?? normalizedInitialCode.java) || defaultCodes.java,
            csharp: (snippet?.csharp ?? normalizedInitialCode.csharp) || defaultCodes.csharp,
        });
        setConsoleOutput('');
        setRunError(null);
        if (isWebMode) updatePreview();
    };

    const formatCode = () => {
        editorRef.current?.getAction('editor.action.formatDocument')?.run();
    };

    const copyCode = () => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        navigator.clipboard.writeText(codes[activeLang]).then(() => {
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000);
        });
    };

    const toggleFullScreen = () => setIsFullScreen(!isFullScreen);

    const FullScreenWrapper = isFullScreen ? motion.div : React.Fragment;
    const fullScreenProps = isFullScreen ? {
        className: "fixed inset-0 z-[100] bg-gray-50 dark:bg-gray-900 p-4 flex flex-col",
        initial: { opacity: 0, scale: 0.95 },
        animate: { opacity: 1, scale: 1 },
        exit: { opacity: 0, scale: 0.95 }
    } : {};

    const startResize = (e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        dragStateRef.current = { rect };
        const point = (ev) => (ev.touches && ev.touches[0]) ? ev.touches[0] : ev;
        const onMove = (ev) => {
            const { rect } = dragStateRef.current || {};
            if (!rect) return;
            const p = point(ev);
            if (splitVertical) {
                const newSize = Math.max(160, Math.min(rect.width - 160, rect.right - p.clientX));
                setPanelSize(newSize);
            } else {
                const newSize = Math.max(160, Math.min(rect.height - 160, rect.bottom - p.clientY));
                setPanelSize(newSize);
            }
        };
        const onUp = () => {
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onUp);
            dragStateRef.current = null;
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onMove, { passive: true });
        window.addEventListener('touchend', onUp);
    };

    // Command palette actions
    const openCmd = () => { setIsCmdOpen(true); setCmdQuery(''); setCmdIndex(0); };
    const closeCmd = () => setIsCmdOpen(false);
    const toggleCmd = () => (isCmdOpen ? closeCmd() : openCmd());


    const openFind = () => {
        editorRef.current?.focus();
        editorRef.current?.getAction('actions.find')?.run();
    };

    const downloadCode = () => {
        const activeLang = isWebMode ? webTab : selectedLanguage;
        const extMap = { javascript: 'js', cpp: 'cpp', python: 'py', java: 'java', csharp: 'cs', html: 'html', css: 'css' };
        const ext = extMap[activeLang] || 'txt';
        const blob = new Blob([codes[activeLang] || ''], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `snippet.${ext}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const uploadCode = (file) => {
        if (!file) return;
        const name = file.name.toLowerCase();
        const setForExt = (ext, lang) => {
            if (name.endsWith(`.${ext}`)) {
                const reader = new FileReader();
                reader.onload = () => {
                    setCodes((prev) => ({ ...prev, [lang]: String(reader.result || '') }));
                    if (isWebMode && ['html','css','javascript'].includes(lang)) {
                        setWebTab(lang);
                    } else if (!isWebMode && supportedLanguages.includes(lang)) {
                        setSelectedLanguage(lang);
                    }
                };
                reader.readAsText(file);
                return true;
            }
            return false;
        };
        const mapping = [
            ['js','javascript'], ['cpp','cpp'], ['py','python'], ['java','java'], ['cs','csharp'], ['html','html'], ['css','css']
        ];
        for (const [ext, lang] of mapping) {
            if (setForExt(ext, lang)) return;
        }
        // default to current language
        const reader = new FileReader();
        reader.onload = () => setCodes((prev) => ({ ...prev, [isWebMode ? webTab : selectedLanguage]: String(reader.result || '') }));
        reader.readAsText(file);
    };


    const setBaselineForActive = () => {
        setBaselines((prev) => ({ ...(prev || {}), [activeLang]: codes[activeLang] || '' }));
    };

    const commands = useMemo(() => {
        const entries = [];
        entries.push({ id: 'run', label: isWebMode ? 'Run Preview' : 'Run', action: runCode });
        entries.push({ id: 'reset', label: 'Reset Code', action: resetCode });
        entries.push({ id: 'format', label: 'Format Code', action: formatCode });
        entries.push({ id: 'find', label: 'Find', action: openFind });
        entries.push({ id: 'copy', label: 'Copy Code', action: copyCode });
        entries.push({ id: 'download', label: 'Download Code', action: downloadCode });
        entries.push({ id: 'upload', label: 'Upload From File…', action: () => fileInputRef.current?.click() });
        entries.push({ id: 'webmode', label: `${isWebMode ? 'Disable' : 'Enable'} Web Preview`, action: () => setIsWebMode(v => !v) });
        entries.push({ id: 'split', label: `Split ${splitVertical ? 'Horizontal' : 'Vertical'}`, action: () => setSplitVertical(v => !v) });
        entries.push({ id: 'minimap', label: `${showMinimap ? 'Hide' : 'Show'} Minimap`, action: () => setShowMinimap(v => !v) });
        entries.push({ id: 'linenumbers', label: `${showLineNumbers ? 'Hide' : 'Show'} Line Numbers`, action: () => setShowLineNumbers(v => !v) });
        entries.push({ id: 'wrap', label: `Word Wrap ${wordWrap === 'on' ? 'Off' : 'On'}`, action: () => setWordWrap(w => (w === 'on' ? 'off' : 'on')) });
        entries.push({ id: 'diff', label: `${showDiff ? 'Hide' : 'Show'} Diff`, action: () => setShowDiff(v => !v) });
        entries.push({ id: 'baseline', label: 'Set Baseline (current file)', action: setBaselineForActive });
        entries.push({ id: 'output', label: `${showOutputPanel ? 'Hide' : 'Show'} Output Panel`, action: () => setShowOutputPanel(v => !v) });
        entries.push({ id: 'theme', label: `Editor Theme: ${editorTheme === 'vs-dark' ? 'Light' : 'Dark'}`, action: () => setEditorTheme(t => (t === 'vs-dark' ? 'vs-light' : 'vs-dark')) });
        if (!isWebMode && debugSupported.has(selectedLanguage)) {
            entries.push({ id: 'debug', label: debugActive ? 'Stop Debugger' : 'Start Debugger', action: () => (debugActive ? stopDebug() : startDebug()) });
        }
        if (isWebMode) {
            entries.push({ id: 'open-preview', label: 'Open Preview in New Tab', action: () => {
                const blob = new Blob([buildPreviewHtml()], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank', 'noopener');
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }});
        }
        return entries;
    }, [isWebMode, runCode, resetCode, formatCode, openFind, copyCode, downloadCode, splitVertical, showMinimap, showLineNumbers, wordWrap, showDiff, setBaselineForActive, showOutputPanel, editorTheme, selectedLanguage, debugActive]);

    const filteredCommands = useMemo(() => {
        const q = cmdQuery.trim().toLowerCase();
        if (!q) return commands;
        return commands.filter(c => c.label.toLowerCase().includes(q));
    }, [cmdQuery, commands]);

    useEffect(() => {
        const onKey = (e) => {
            const mod = e.ctrlKey || e.metaKey;
            if ((mod && e.shiftKey && e.key.toLowerCase() === 'p')) {
                e.preventDefault();
                toggleCmd();
            } else if (isCmdOpen) {
                if (e.key === 'Escape') { e.preventDefault(); closeCmd(); }
                else if (e.key === 'ArrowDown') { e.preventDefault(); setCmdIndex(i => Math.min(i + 1, filteredCommands.length - 1)); }
                else if (e.key === 'ArrowUp') { e.preventDefault(); setCmdIndex(i => Math.max(i - 1, 0)); }
                else if (e.key === 'Enter') { e.preventDefault(); const cmd = filteredCommands[cmdIndex]; if (cmd) { closeCmd(); setTimeout(() => cmd.action(), 0); } }
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [isCmdOpen, filteredCommands, cmdIndex]);
    const { currentUser } = useSelector((state) => state.user || {});
    const navItems = isWebMode ? ['html', 'css', 'javascript'] : supportedLanguages;
    const activeLangKey = isWebMode ? webTab : selectedLanguage;
    const activeLanguageMeta = getLanguageMeta(activeLangKey);
    const stageClass = splitVertical ? 'flex flex-row gap-4' : 'flex flex-col gap-4';
    const controlButtonClass = 'inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-900/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 shadow-sm transition hover:bg-slate-800/70 hover:text-white';
    const ghostButtonClass = 'inline-flex items-center gap-2 rounded-md border border-slate-700/70 bg-slate-900/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-200 shadow-sm transition hover:bg-slate-800/70 hover:text-white';
    const ActiveLangIcon = activeLanguageMeta.Icon;
    const profileName = currentUser?.username || currentUser?.displayName || 'Guest';
    const profileInitial = profileName.slice(0, 1).toUpperCase() || 'G';
    const profileImage = currentUser?.profilePicture;
    const renderEditor = () => {
        if (showDiff) {
            return (
                <DiffEditor
                    height="100%"
                    language={activeLang}
                    original={baselines?.[activeLang] || ''}
                    modified={codes[activeLang] || ''}
                    theme={editorTheme}
                    onMount={(diff, monaco) => {
                        try {
                            const modified = diff.getModifiedEditor();
                            handleEditorDidMount(modified, monaco);
                        } catch (_) {}
                    }}
                    onChange={(value) => handleCodeChange(value ?? '')}
                    options={{
                        renderSideBySide: true,
                        readOnly: false,
                        originalEditable: false,
                        automaticLayout: true,
                        minimap: { enabled: showMinimap },
                        wordWrap: wordWrap,
                        lineNumbers: showLineNumbers ? 'on' : 'off',
                        scrollBeyondLastLine: false,
                        padding: { top: 10, bottom: 10 },
                        smoothScrolling: true,
                        mouseWheelZoom: true,
                    }}
                />
            );
        }
                return (
                    <Editor
                        height="100%"
                        language={activeLang}
                        value={codes[activeLang]}
                        theme={editorTheme}
                        onMount={handleEditorDidMount}
                        onChange={(value) => handleCodeChange(value ?? '')}
                        options={{
                            minimap: { enabled: showMinimap },
                            automaticLayout: true,
                            fontSize: fontSize,
                            folding: true,
                            wordWrap: wordWrap,
                            scrollBeyondLastLine: false,
                            padding: { top: 10, bottom: 10 },
                            smoothScrolling: true,
                            formatOnPaste: true,
                            formatOnType: true,
                            lineNumbers: showLineNumbers ? 'on' : 'off',
                            renderWhitespace: 'selection',
                            bracketPairColorization: { enabled: true },
                            guides: { indentation: true, bracketPairs: true },
                            stickyScroll: { enabled: true },
                            mouseWheelZoom: true,
                            glyphMargin: debugSupported.has(activeLang),
                            fontLigatures: true,
                            renderLineHighlight: 'line',
                            cursorSmoothCaretAnimation: 'on',
                            tabSize: 2,
                            roundedSelection: true,
                            quickSuggestions: { other: true, comments: false, strings: false },
                        }}
                    />
                );
            };
    const renderLanguageRail = () => (
        <div className="flex h-full flex-col justify-between">
            <div>
                <div className="px-3 pt-4">
                    <p className="text-[10px] uppercase tracking-[0.35em] text-slate-400/80">Workspace</p>
                </div>
                <div className="mt-3 space-y-1 px-2">
                    {navItems.map((lang) => {
                        const { label, Icon, badge } = getLanguageMeta(lang);
                        const isActive = activeLangKey === lang;
                        const onSelect = () => {
                            if (isWebMode) setWebTab(lang);
                            else setSelectedLanguage(normalizeLanguage(lang));
                        };
                        return (
                            <button
                                key={lang}
                                type="button"
                                onClick={onSelect}
                                className={`group w-full rounded-md border px-3 py-2 text-left transition ${
                                    isActive
                                        ? 'border-indigo-400/60 bg-indigo-500/15 text-indigo-100 shadow-[0_0_0_1px_rgba(99,102,241,0.35)]'
                                        : 'border-transparent text-slate-300 hover:border-slate-600/70 hover:bg-slate-800/70 hover:text-white'
                                }`}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-md text-base font-semibold shadow-sm ${badge} ${isActive ? 'ring-2 ring-indigo-300/70 ring-offset-2 ring-offset-slate-900' : 'opacity-80 group-hover:opacity-100'} transition`}>
                                        <Icon />
                                    </span>
                                    <div className="flex flex-1 flex-col">
                                        <span className="text-sm font-semibold">{label}</span>
                                        {!isWebMode && <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 group-hover:text-slate-300/90">source</span>}
                                        {isWebMode && <span className="text-[11px] uppercase tracking-[0.25em] text-slate-500 group-hover:text-slate-300/90">web</span>}
                                    </div>
                                    {isActive && (
                                        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-indigo-200">active</span>
                                    )}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>
            <div className="space-y-2 px-2 pb-4">
                <button
                    type="button"
                    onClick={() => setShowOutputPanel((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        showOutputPanel ? 'border-teal-400/60 bg-teal-500/15 text-teal-100' : 'border-transparent text-slate-400 hover:border-slate-600/70 hover:bg-slate-800/70 hover:text-white'
                    }`}
                >
                    <FaTerminal className="text-sm" />
                    {showOutputPanel ? 'Output Visible' : 'Show Output'}
                </button>
                <button
                    type="button"
                    onClick={() => setSplitVertical((v) => !v)}
                    className={`flex w-full items-center gap-2 rounded-md border px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition ${
                        splitVertical ? 'border-amber-400/60 bg-amber-500/15 text-amber-100' : 'border-transparent text-slate-400 hover:border-slate-600/70 hover:bg-slate-800/70 hover:text-white'
                    }`}
                >
                    <FaColumns className="text-sm" />
                    {splitVertical ? 'Vertical Split' : 'Horizontal Split'}
                </button>
                <button
                    type="button"
                    onClick={openCmd}
                    className="flex w-full items-center gap-2 rounded-md border border-transparent px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400 transition hover:border-slate-600/70 hover:bg-slate-800/70 hover:text-white"
                >
                    <FaKeyboard className="text-sm" />
                    Commands
                </button>
            </div>
        </div>
    );

    return (
        <FullScreenWrapper {...fullScreenProps}>
            <div
                className={`relative flex flex-col overflow-hidden rounded-2xl border border-slate-800/80 bg-gradient-to-br from-[#111623] via-[#161d2d] to-[#0d111a] text-slate-100 shadow-[0_40px_120px_-60px_rgba(9,12,20,0.95)] ${isFullScreen ? 'h-full' : 'h-[90vh] md:h-[800px]'}`}
            >
                <header className="flex flex-col gap-3 border-b border-slate-800/70 bg-slate-950/35 px-4 py-3 backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-1 flex-wrap items-center gap-4">
                        <div className="flex items-center gap-3 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2 shadow-sm">
                            <div className="flex items-center gap-1.5">
                                <span className="h-3 w-3 rounded-full bg-rose-500/90 shadow-[0_0_12px_rgba(244,63,94,0.55)]" />
                                <span className="h-3 w-3 rounded-full bg-amber-400/90 shadow-[0_0_12px_rgba(251,191,36,0.55)]" />
                                <span className="h-3 w-3 rounded-full bg-emerald-500/90 shadow-[0_0_12px_rgba(34,197,94,0.55)]" />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[11px] uppercase tracking-[0.45em] text-slate-500">ScientistShield Studio</span>
                                <span className="text-xs font-semibold text-slate-300">JetBrains-inspired workspace</span>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <Button
                                size="sm"
                                onClick={runCode}
                                isProcessing={!isWebMode && isRunning}
                                disabled={!isWebMode ? isRunning : false}
                                className="!flex !items-center !gap-2 !rounded-md !border-none !bg-gradient-to-r !from-emerald-500 !to-lime-500 !px-4 !py-2 !text-[11px] !font-semibold !uppercase !tracking-[0.28em] !text-white hover:!from-emerald-400 hover:!to-lime-400 focus:!ring-emerald-300 focus:!ring-offset-0"
                            >
                                <FaPlay className="h-3 w-3" /> {isWebMode ? 'Run Preview' : 'Run'}
                            </Button>
                            <button type="button" className={ghostButtonClass} onClick={resetCode}>
                                <FaRedo className="text-xs" /> Reset
                            </button>
                            {!isWebMode && debugSupported.has(selectedLanguage) && (
                                !debugActive ? (
                                    <button
                                        type="button"
                                        className={`${ghostButtonClass} border-emerald-500/60 text-emerald-200 hover:border-emerald-400/80`}
                                        onClick={startDebug}
                                    >
                                        <FaBug className="text-xs" /> Debug
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        className={`${ghostButtonClass} border-red-500/60 text-red-200 hover:border-red-400/80`}
                                        onClick={stopDebug}
                                    >
                                        <FaStop className="text-xs" /> Stop Debug
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="flex items-center gap-3 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                            <span className="font-semibold uppercase tracking-[0.28em] text-slate-500">Mode</span>
                            <ToggleSwitch
                                checked={isWebMode}
                                onChange={(checked) => setIsWebMode(checked)}
                                label=""
                                className="!text-slate-200"
                            />
                            <span className="font-semibold uppercase tracking-[0.18em] text-slate-200">
                                {isWebMode ? 'Web Preview' : 'Code'}
                            </span>
                        </div>
                        {isWebMode && (
                            <div className="flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-2 text-xs text-slate-300">
                                <FaBolt className={`text-sm ${autoRunPreview ? 'text-amber-300' : 'text-slate-500'}`} />
                                <span className="font-semibold uppercase tracking-[0.28em] text-slate-500">Auto</span>
                                <ToggleSwitch
                                    checked={autoRunPreview}
                                    onChange={(checked) => setAutoRunPreview(checked)}
                                    label=""
                                    className="!text-slate-200"
                                />
                            </div>
                        )}
                        <button
                            type="button"
                            className={ghostButtonClass}
                            onClick={() => setEditorTheme((t) => (t === 'vs-dark' ? 'vs-light' : 'vs-dark'))}
                        >
                            {editorTheme === 'vs-dark' ? <FaSun className="text-xs" /> : <FaMoon className="text-xs" />}
                            {editorTheme === 'vs-dark' ? 'Light Theme' : 'Dark Theme'}
                        </button>
                        <button type="button" className={ghostButtonClass} onClick={toggleFullScreen}>
                            {isFullScreen ? <FaCompress className="text-xs" /> : <FaExpand className="text-xs" />}
                            {isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}
                        </button>
                        {currentUser ? (
                            <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 shadow-sm">
                                <span className="relative inline-flex h-10 w-10 overflow-hidden rounded-lg border border-slate-800/70 bg-gradient-to-br from-indigo-500/60 via-purple-500/60 to-sky-500/60 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.35)]">
                                    {profileImage ? (
                                        <img
                                            src={profileImage}
                                            alt={profileName}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="flex h-full w-full items-center justify-center text-lg">
                                            {profileInitial}
                                        </span>
                                    )}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Signed in</span>
                                    <span className="text-sm font-semibold text-slate-100">{profileName}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 rounded-xl border border-slate-800/70 bg-slate-950/40 px-3 py-2 shadow-sm">
                                <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-800/70 bg-slate-900/70 text-lg font-semibold text-slate-300">
                                    {profileInitial}
                                </span>
                                <div className="flex flex-col">
                                    <span className="text-[10px] uppercase tracking-[0.32em] text-slate-500">Guest mode</span>
                                    <span className="text-sm font-semibold text-slate-100">Not signed in</span>
                                </div>
                            </div>
                        )}
                    </div>
                </header>
                <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                    <aside className="w-full shrink-0 border-b border-slate-800/70 bg-slate-950/30 backdrop-blur-md lg:w-60 lg:border-b-0 lg:border-r">
                        {renderLanguageRail()}
                    </aside>
                    <div className="flex flex-1 flex-col overflow-hidden">
                        <div className="border-b border-slate-800/70 bg-slate-950/30 px-4 py-3">
                            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                                <div className="flex flex-wrap items-center gap-2">
                                    <div className="flex items-center overflow-hidden rounded-md border border-slate-800/70 bg-slate-950/40 text-slate-300 shadow-inner">
                                        <button type="button" className="px-2 py-1 hover:bg-slate-800/70" onClick={() => setFontSize((fz) => Math.max(8, fz - 1))}>
                                            <FaMinus className="text-xs" />
                                        </button>
                                        <span className="px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-300">{fontSize}px</span>
                                        <button type="button" className="px-2 py-1 hover:bg-slate-800/70" onClick={() => setFontSize((fz) => Math.min(24, fz + 1))}>
                                            <FaPlus className="text-xs" />
                                        </button>
                                    </div>
                                    <button type="button" className={controlButtonClass} onClick={() => setFontSize(14)}>
                                        Reset Size
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={() => setShowDiff((v) => !v)}>
                                        <FaCodeBranch className="text-xs" />
                                        {showDiff ? 'Hide Diff' : 'Show Diff'}
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={setBaselineForActive}>
                                        <FaSave className="text-xs" /> Baseline
                                    </button>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        type="button"
                                        className={`${controlButtonClass} ${showMinimap ? 'border-sky-500/60 text-sky-200' : ''}`}
                                        onClick={() => setShowMinimap((v) => !v)}
                                    >
                                        <FaGlobe className="text-xs" /> Minimap
                                    </button>
                                    <button
                                        type="button"
                                        className={`${controlButtonClass} ${showLineNumbers ? 'border-sky-500/60 text-sky-200' : ''}`}
                                        onClick={() => setShowLineNumbers((v) => !v)}
                                    >
                                        <FaSignInAlt className="text-xs" /> Line Numbers
                                    </button>
                                    <button
                                        type="button"
                                        className={`${controlButtonClass} ${wordWrap === 'on' ? 'border-sky-500/60 text-sky-200' : ''}`}
                                        onClick={() => setWordWrap((w) => (w === 'on' ? 'off' : 'on'))}
                                    >
                                        <FaSignOutAlt className="text-xs" /> Wrap
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={formatCode}>
                                        <FaCode className="text-xs" /> Format
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={copyCode}>
                                        {isCopied ? <FaCheck className="text-xs text-emerald-300" /> : <FaCopy className="text-xs" />}
                                        {isCopied ? 'Copied' : 'Copy'}
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={openFind}>
                                        <FaSearch className="text-xs" /> Find
                                    </button>
                                    <button type="button" className={controlButtonClass} onClick={downloadCode}>
                                        <FaDownload className="text-xs" /> Download
                                    </button>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept=".js,.cpp,.py,.java,.cs,.html,.css,.txt"
                                        className="hidden"
                                        onChange={(e) => uploadCode(e.target.files?.[0])}
                                    />
                                    <button type="button" className={controlButtonClass} onClick={() => fileInputRef.current?.click()}>
                                        <FaUpload className="text-xs" /> Upload
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="flex-1 overflow-hidden px-4 py-4">
                            <div className="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-slate-800/70 bg-slate-950/35 p-4 shadow-inner shadow-black/40">
                                <div className={`flex h-full w-full overflow-hidden rounded-xl border border-slate-800/70 bg-slate-950/30 ${stageClass}`} ref={containerRef}>
                                    <div
                                        className={`flex h-full flex-col rounded-xl border border-slate-800/70 bg-slate-950/55 p-3 ${splitVertical ? 'flex-1' : 'flex-none'}`}
                                        style={splitVertical ? undefined : { flex: '1 1 auto' }}
                                    >
                                        <div className="relative flex-1 overflow-hidden rounded-lg border border-slate-800/60 bg-[#0f172a]/60 shadow-inner shadow-black/40">
                                            <style>{`
                                                .ss-debug-current { background-color: rgba(34,197,94,0.15) !important; }
                                                .ss-debug-next { background-color: rgba(239,68,68,0.12) !important; }
                                                .ss-debug-glyph-current::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#22c55e; border-radius:50%; box-shadow:0 0 0 2px rgba(34,197,94,0.4); }
                                                .ss-debug-glyph-next::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#ef4444; border-radius:50%; box-shadow:0 0 0 2px rgba(239,68,68,0.4); }
                                                .ss-breakpoint-glyph::before { content: ''; display: inline-block; width: 10px; height: 10px; background:#f43f5e; border-radius:50%; box-shadow:0 0 0 2px rgba(244,63,94,0.4); }
                                            `}</style>
                                            {renderEditor()}
                                            {isSnippetLoading && (
                                                <div className="absolute inset-0 flex items-center justify-center bg-slate-950/70">
                                                    <Spinner />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {showOutputPanel && (
                                        <>
                                            <div
                                                onMouseDown={startResize}
                                                onTouchStart={startResize}
                                                className={`${splitVertical ? 'mx-1 h-full w-1 cursor-col-resize' : 'my-1 h-1 w-full cursor-row-resize'} rounded bg-slate-800/70 transition hover:bg-slate-600/80`}
                                                title="Drag to resize"
                                                role="separator"
                                                aria-orientation={splitVertical ? 'vertical' : 'horizontal'}
                                                aria-label="Resize panel"
                                            />
                                            <div
                                                className="flex h-full flex-col rounded-xl border border-slate-800/70 bg-slate-950/55 p-3"
                                                style={splitVertical ? { width: panelSize } : { height: panelSize }}
                                            >
                                                {!isWebMode ? (
                                                    <>
                                                        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
                                                            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
                                                                <FaTerminal className="text-sm text-emerald-300" />
                                                                {debugActive ? 'Debugger' : 'Terminal Output'}
                                                            </h3>
                                                            <div className="ml-auto flex items-center gap-2">
                                                                {debugActive ? (
                                                                    <>
                                                                        <button type="button" className={ghostButtonClass} onClick={restartDebug}>
                                                                            <FaRedo className="text-xs" /> Restart
                                                                        </button>
                                                                        <button type="button" className={ghostButtonClass} onClick={stopDebug}>
                                                                            <FaStop className="text-xs" /> Stop
                                                                        </button>
                                                                    </>
                                                                ) : (
                                                                    <button type="button" className={ghostButtonClass} onClick={() => setConsoleOutput('')}>
                                                                        <FaRedo className="text-xs" /> Clear
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex-1 overflow-auto rounded-lg border border-slate-800/70 bg-slate-950/60 p-3 font-mono text-sm text-slate-200">
                                                            {runError ? (
                                                                <pre className="whitespace-pre-wrap text-red-400">{runError}</pre>
                                                            ) : (
                                                                <pre className="whitespace-pre-wrap text-slate-100">{consoleOutput || 'Awaiting output...'}</pre>
                                                            )}
                                                        </div>
                                                        {debugActive && (
                                                            <div className="mt-4 flex flex-col gap-3 overflow-auto rounded-lg border border-slate-800/70 bg-slate-950/60 p-3">
                                                                {debugError && (
                                                                    <Alert color="failure" className="!bg-transparent !p-0 text-sm text-red-300">
                                                                        <pre className="whitespace-pre-wrap font-mono">{debugError}</pre>
                                                                    </Alert>
                                                                )}
                                                                {!debugTrace && !debugError && (
                                                                    <div className="flex items-center gap-2 text-sm text-slate-400">
                                                                        <Spinner size="sm" />
                                                                        <span>Preparing debugger…</span>
                                                                    </div>
                                                                )}
                                                                {debugTrace && (
                                                                    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.55fr)_minmax(0,0.45fr)]">
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <h4 className="text-xs uppercase tracking-[0.25em] text-slate-500">Frames</h4>
                                                                                {debugMemoryFrames.length > 0 ? (
                                                                                    <ul className="space-y-1 text-xs text-slate-200">
                                                                                        {debugMemoryFrames.map((frame, i) => {
                                                                                            const isSel = selectedDebugFrame === i;
                                                                                            return (
                                                                                                <li
                                                                                                    key={`mframe-${i}`}
                                                                                                    className={`flex items-center justify-between rounded border px-2 py-1 ${isSel ? 'border-purple-500/60 bg-purple-500/15 text-purple-200' : 'border-slate-800/70 bg-slate-950/40'}`}
                                                                                                >
                                                                                                    <button className={`flex-1 text-left ${isSel ? 'text-purple-200' : ''}`} onClick={() => setSelectedDebugFrame(i)}>
                                                                                                        {frame.function || '<module>'}
                                                                                                    </button>
                                                                                                    <span className="text-[11px] text-slate-400">line {frame.line}</span>
                                                                                                </li>
                                                                                            );
                                                                                        })}
                                                                                    </ul>
                                                                                ) : (
                                                                                    <p className="text-xs text-slate-500">(no frames)</p>
                                                                                )}
                                                                            </div>
                                                                            <div>
                                                                                <h4 className="text-xs uppercase tracking-[0.25em] text-slate-500">Variables</h4>
                                                                                {(() => {
                                                                                    const locals = (() => {
                                                                                        if (selectedDebugFrame != null && debugMemoryFrames[selectedDebugFrame]) {
                                                                                            return debugMemoryFrames[selectedDebugFrame].locals || {};
                                                                                        }
                                                                                        return debugCurrent?.locals || {};
                                                                                    })();
                                                                                    const entries = Object.entries(locals);
                                                                                    return entries.length > 0 ? (
                                                                                        <ul className="space-y-1 text-sm font-mono text-slate-100">
                                                                                            {entries.map(([k, info]) => (
                                                                                                <li key={`loc-${k}`} className="flex items-center justify-between gap-3 rounded bg-slate-950/50 px-2 py-1">
                                                                                                    <span className="text-purple-300">{k}</span>
                                                                                                    <span className="text-right text-slate-300">{String(info?.preview ?? info)}</span>
                                                                                                </li>
                                                                                            ))}
                                                                                        </ul>
                                                                                    ) : (
                                                                                        <p className="text-xs text-slate-500">(no variables)</p>
                                                                                    );
                                                                                })()}
                                                                            </div>
                                                                        </div>
                                                                        <div className="space-y-3">
                                                                            <div>
                                                                                <h4 className="text-xs uppercase tracking-[0.25em] text-slate-500">Trace</h4>
                                                                                <div className="rounded border border-slate-800/70 bg-slate-950/40">
                                                                                    <ul className="divide-y divide-slate-800/70">
                                                                                        {debugEvents.map((event, index) => {
                                                                                            const isActiveEvent = index === debugIndex;
                                                                                            return (
                                                                                                <li
                                                                                                    key={`event-${index}`}
                                                                                                    className={`flex items-center gap-3 px-2 py-1 text-xs ${isActiveEvent ? 'bg-indigo-500/15 text-indigo-200' : 'text-slate-300'}`}
                                                                                                >
                                                                                                    <span className="rounded bg-slate-900/60 px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] text-slate-400">{event.event}</span>
                                                                                                    <span className="font-mono text-[11px] text-slate-400">line {event.line}</span>
                                                                                                </li>
                                                                                            );
                                                                                        })}
                                                                                    </ul>
                                                                                </div>
                                                                            </div>
                                                                            <div className="flex flex-wrap items-center gap-2">
                                                                                <button type="button" className={ghostButtonClass} onClick={() => goToDebugIndex(0)}>
                                                                                    <FaStepBackward className="text-xs" /> Start
                                                                                </button>
                                                                                <button type="button" className={ghostButtonClass} onClick={() => goToDebugIndex(debugEvents.length - 1)}>
                                                                                    <FaStepForward className="text-xs" /> End
                                                                                </button>
                                                                                <button type="button" className={ghostButtonClass} onClick={() => setIsDebugPlaying((p) => !p)}>
                                                                                    {isDebugPlaying ? <FaPause className="text-xs" /> : <FaPlay className="text-xs" />} {isDebugPlaying ? 'Pause' : 'Play'}
                                                                                </button>
                                                                                <div className="flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-1">
                                                                                    <span className="text-[10px] uppercase tracking-[0.28em] text-slate-500">Delay</span>
                                                                                    <input
                                                                                        type="range"
                                                                                        min="100"
                                                                                        max="1500"
                                                                                        step="100"
                                                                                        value={debugDelay}
                                                                                        onChange={(e) => setDebugDelay(Number(e.target.value))}
                                                                                        className="h-1 w-24 accent-indigo-400"
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="flex items-center gap-2 border-b border-slate-800/60 pb-2">
                                                            <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200">
                                                                <FaGlobe className="text-sm text-indigo-300" />
                                                                Live Preview
                                                            </h3>
                                                            <div className="ml-auto flex items-center gap-2">
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        const blob = new Blob([buildPreviewHtml()], { type: 'text/html' });
                                                                        const url = URL.createObjectURL(blob);
                                                                        window.open(url, '_blank', 'noopener');
                                                                        setTimeout(() => URL.revokeObjectURL(url), 60000);
                                                                    }}
                                                                    className={ghostButtonClass}
                                                                >
                                                                    <FaExternalLinkAlt className="text-xs" /> Open in new tab
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div className="mt-3 flex-1 overflow-hidden rounded-lg border border-slate-800/70 bg-white">
                                                            <iframe
                                                                ref={previewRef}
                                                                title="Live Preview"
                                                                sandbox="allow-scripts allow-forms allow-modals"
                                                                srcDoc={previewHtml}
                                                                className="h-full w-full"
                                                            />
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <footer className="flex flex-col gap-2 border-t border-slate-800/70 bg-slate-950/35 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-slate-400 md:flex-row md:items-center md:justify-between">
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/40 px-3 py-1 text-slate-100">
                            <ActiveLangIcon className="text-sm" />
                            {activeLanguageMeta.label}
                        </span>
                        <span>Ln {cursorPos.lineNumber}</span>
                        <span>Col {cursorPos.column}</span>
                        <span>Wrap {wordWrap === 'on' ? 'On' : 'Off'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span>{isSaved ? 'Saved' : 'Saving…'}</span>
                        <span>UTF-8</span>
                        <span className="hidden items-center gap-1 text-slate-500 md:inline-flex">
                            <FaKeyboard className="text-xs" /> Ctrl+Shift+P
                        </span>
                    </div>
                </footer>
            </div>
            {/* Command Palette */}
            <AnimatePresence>
                {isCmdOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] bg-slate-950/80 backdrop-blur-sm"
                        onClick={closeCmd}
                    >
                        <motion.div
                            initial={{ opacity: 0, scale: 0.96, y: -8 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -8 }}
                            className="mx-auto mt-24 w-[min(720px,92vw)] rounded-xl border border-slate-800/70 bg-slate-950/90 p-2 shadow-[0_40px_120px_-60px_rgba(0,0,0,0.8)]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="rounded-lg border border-slate-800/60 bg-slate-900/60 p-3">
                                <div className="flex items-center gap-2 rounded-md border border-slate-800/70 bg-slate-950/60 px-3 py-2">
                                    <FaKeyboard className="text-slate-500" />
                                    <input
                                        autoFocus
                                        value={cmdQuery}
                                        onChange={(e) => { setCmdQuery(e.target.value); setCmdIndex(0); }}
                                        placeholder="Type a command… (e.g., Run, Wrap, Minimap)"
                                        className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 outline-none"
                                    />
                                </div>
                            </div>
                            <div className="max-h-72 overflow-auto pt-2">
                                {filteredCommands.length === 0 ? (
                                    <div className="rounded-lg border border-slate-800/60 bg-slate-950/70 p-4 text-sm text-slate-400">
                                        No matching commands
                                    </div>
                                ) : (
                                    <ul className="space-y-1">
                                        {filteredCommands.map((c, i) => (
                                            <li key={c.id}>
                                                <button
                                                    className={`w-full rounded-md px-4 py-2 text-left text-sm ${
                                                        i === cmdIndex
                                                            ? 'bg-indigo-500/25 text-indigo-100'
                                                            : 'text-slate-200 hover:bg-slate-900/60'
                                                    }`}
                                                    onClick={() => { closeCmd(); setTimeout(() => c.action(), 0); }}
                                                >
                                                    {c.label}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </FullScreenWrapper>
    );

}
