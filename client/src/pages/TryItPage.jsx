import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
    FaBolt,
    FaGlobe,
    FaTerminal,
    FaLaptopCode,
    FaKeyboard,
    FaShieldAlt,
    FaPalette,
    FaPython,
    FaJava,
} from 'react-icons/fa';
import { SiCplusplus, SiCsharp } from 'react-icons/si';
import CodeEditor from '../components/CodeEditor';

const playgroundTemplates = [
    {
        id: 'frontend',
        label: 'Frontend Sprint',
        description: 'Sketch a launch card with HTML + CSS, then wire a button hover in JS.',
        language: 'html',
        tags: ['HTML', 'CSS', 'JS'],
        Icon: FaPalette,
        code: {
            html: `<main class="hero">
  <div class="chip">Launch Lab</div>
  <h1>Ship a confident hero</h1>
  <p>Design a panel with glow, spacing, and a single focus CTA.</p>
  <button id="pulse">Pulse CTA</button>
  <div class="stats">
    <div><strong>98%</strong><span>Stability</span></div>
    <div><strong>24h</strong><span>Iteration</span></div>
    <div><strong>3x</strong><span>Velocity</span></div>
  </div>
</main>`,
            css: `:root {
  --ink: #0f172a;
  --muted: #475569;
  --accent: #22d3ee;
  --glow: rgba(34, 211, 238, 0.28);
  --surface: #f8fafc;
}
* { box-sizing: border-box; }
body {
  margin: 0;
  font-family: 'Space Grotesk', sans-serif;
  background: radial-gradient(circle at top, #e0f2fe, #f8fafc);
  color: var(--ink);
  display: grid;
  place-items: center;
  min-height: 100vh;
  padding: 2.5rem;
}
.hero {
  max-width: 520px;
  width: 100%;
  padding: 2.5rem;
  border-radius: 28px;
  background: var(--surface);
  box-shadow: 0 30px 80px -50px rgba(15, 23, 42, 0.45);
  border: 1px solid rgba(148, 163, 184, 0.3);
}
.chip {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: 999px;
  background: rgba(34, 211, 238, 0.2);
  color: #0e7490;
  font-size: 0.75rem;
  letter-spacing: 0.2em;
  text-transform: uppercase;
  font-weight: 600;
}
h1 { margin: 1.5rem 0 0.5rem; font-size: 2.2rem; }
p { margin: 0 0 1.5rem; color: var(--muted); }
button {
  border: none;
  background: linear-gradient(120deg, #22d3ee, #38bdf8);
  color: white;
  padding: 0.8rem 1.6rem;
  border-radius: 999px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 12px 24px -12px var(--glow);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
}
button.pulsing {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 16px 32px -12px var(--glow);
}
.stats {
  margin-top: 1.75rem;
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(3, 1fr);
  font-size: 0.85rem;
  color: var(--muted);
}
.stats strong {
  display: block;
  font-size: 1.2rem;
  color: var(--ink);
}`,
            javascript: `const button = document.querySelector('#pulse');

button.addEventListener('click', () => {
  button.classList.add('pulsing');
  button.textContent = 'Pulse confirmed';
  setTimeout(() => {
    button.classList.remove('pulsing');
    button.textContent = 'Pulse CTA';
  }, 900);
});`,
        },
    },
    {
        id: 'javascript',
        label: 'Node Workflow',
        description: 'Run JavaScript, inspect output, and shape quick data flows.',
        language: 'javascript',
        tags: ['JS', 'Console'],
        Icon: FaTerminal,
        code: `// Console-first workflow
const tasks = [
  { name: 'Parse input', mins: 12 },
  { name: 'Model edge cases', mins: 18 },
  { name: 'Ship solution', mins: 28 },
];

const total = tasks.reduce((sum, task) => sum + task.mins, 0);
console.log('Plan:', tasks.map(task => task.name).join(' -> '));
console.log('Total minutes:', total);
console.log('Velocity:', (total / tasks.length).toFixed(1), 'mins/task');`,
    },
    {
        id: 'python',
        label: 'Python Notebook',
        description: 'Practice a clean Python solution with small utilities.',
        language: 'python',
        tags: ['Python'],
        Icon: FaPython,
        code: `def build_scorecard(values):
    total = sum(values)
    average = total / len(values)
    return {
        'total': total,
        'average': round(average, 2),
        'max': max(values),
    }

scores = [88, 91, 76, 95, 89]
card = build_scorecard(scores)
print('Scorecard:', card)`,
    },
    {
        id: 'cpp',
        label: 'C++ Sprint',
        description: 'Focus on structured output and clear data structures.',
        language: 'cpp',
        tags: ['C++'],
        Icon: SiCplusplus,
        code: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> checkpoints = {3, 7, 11, 14};
    int sum = 0;
    for (int value : checkpoints) {
        sum += value;
    }
    std::cout << "Checkpoints: " << checkpoints.size() << "\\n";
    std::cout << "Total energy: " << sum << "\\n";
    return 0;
}`,
    },
    {
        id: 'java',
        label: 'Java Focus',
        description: 'Run a structured Java snippet for quick iteration.',
        language: 'java',
        tags: ['Java'],
        Icon: FaJava,
        code: `public class Main {
    public static void main(String[] args) {
        String[] stages = {"Plan", "Build", "Review", "Ship"};
        System.out.println("Stages:");
        for (int i = 0; i < stages.length; i++) {
            System.out.println((i + 1) + ". " + stages[i]);
        }
    }
}`,
    },
    {
        id: 'csharp',
        label: 'C# Pulse',
        description: 'Spin up a C# console run with light formatting.',
        language: 'csharp',
        tags: ['C#'],
        Icon: SiCsharp,
        code: `using System;
using System.Collections.Generic;

public class Program
{
    public static void Main(string[] args)
    {
        var checkpoints = new List<string> { "Warmup", "Solve", "Reflect" };
        Console.WriteLine("Sprint:");
        foreach (var step in checkpoints)
        {
            Console.WriteLine("- " + step);
        }
    }
}`,
    },
];

const hashContent = (value) => {
    const text = typeof value === 'string' ? value : JSON.stringify(value ?? '');
    let hash = 5381;
    for (let i = 0; i < text.length; i += 1) {
        hash = ((hash << 5) + hash) ^ text.charCodeAt(i);
    }
    return (hash >>> 0).toString(36);
};

export default function TryItPage() {
    const location = useLocation();
    const incomingCode = location.state?.code ?? null;
    const incomingLanguage = location.state?.language ?? null;
    const editorAnchorRef = useRef(null);
    const [activeTemplateId, setActiveTemplateId] = useState(
        incomingCode ? 'custom' : playgroundTemplates[0].id
    );
    const [templateEpoch, setTemplateEpoch] = useState(0);

    const customTemplate = useMemo(() => {
        if (!incomingCode) return null;
        return {
            id: 'custom',
            label: 'Imported Snippet',
            description: 'Loaded from the previous page.',
            language: incomingLanguage || 'javascript',
            tags: ['Imported'],
            Icon: FaLaptopCode,
            code: incomingCode,
        };
    }, [incomingCode, incomingLanguage]);

    const templates = useMemo(
        () => (customTemplate ? [customTemplate, ...playgroundTemplates] : playgroundTemplates),
        [customTemplate]
    );

    const activeTemplate = useMemo(
        () => templates.find((template) => template.id === activeTemplateId) || templates[0],
        [templates, activeTemplateId]
    );

    const workspaceId = useMemo(() => {
        if (activeTemplate.id === 'custom' && incomingCode) {
            return `tryit:custom:${hashContent(incomingCode)}`;
        }
        return `tryit:${activeTemplate.id}`;
    }, [activeTemplate.id, incomingCode]);

    useEffect(() => {
        if (!incomingCode) return;
        setActiveTemplateId('custom');
        setTemplateEpoch((prev) => prev + 1);
    }, [incomingCode, incomingLanguage]);

    const handleSelectTemplate = (id) => {
        if (id === activeTemplateId) return;
        setActiveTemplateId(id);
        setTemplateEpoch((prev) => prev + 1);
    };

    const handleResetWorkspace = () => {
        if (!workspaceId) return;
        localStorage.removeItem(`code-editor:v2:${workspaceId}`);
        setTemplateEpoch((prev) => prev + 1);
    };

    const scrollToEditor = () => {
        editorAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    const highlights = [
        { label: 'Sandboxed runtime', detail: 'Isolated execution with no persistence.', Icon: FaShieldAlt },
        { label: 'Auto preview', detail: 'HTML/CSS/JS updates in milliseconds.', Icon: FaBolt },
        { label: 'Multi-language', detail: 'JS, Python, C++, Java, and C#.', Icon: FaGlobe },
        { label: 'Keyboard flow', detail: 'Run, format, and search instantly.', Icon: FaKeyboard },
    ];

    const shortcuts = [
        { keys: 'Ctrl/Cmd + Enter', action: 'Run code' },
        { keys: 'Ctrl/Cmd + S', action: 'Format document' },
        { keys: 'F11', action: 'Toggle fullscreen' },
        { keys: 'Ctrl/Cmd + Shift + P', action: 'Command palette' },
    ];

    const ActiveTemplateIcon = activeTemplate.Icon;
    const isWebTemplate = activeTemplate.language === 'html'
        || activeTemplate.language === 'css'
        || (typeof activeTemplate.code === 'object' && (activeTemplate.code?.html || activeTemplate.code?.css));

    return (
        <div className='min-h-screen px-4 pb-16 pt-10 sm:px-6 lg:px-10 text-slate-900 dark:text-slate-100'>
            <div className='mx-auto flex max-w-7xl flex-col gap-10'>
                <section className='relative overflow-hidden rounded-[32px] border border-slate-200/70 bg-white/80 p-8 shadow-[0_50px_140px_-80px_rgba(8,14,28,0.25)] dark:border-white/15 dark:bg-slate-950/70 dark:shadow-[0_50px_140px_-80px_rgba(8,14,28,0.9)]'>
                    <div className='pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.28),_transparent_55%),radial-gradient(circle_at_80%_10%,_rgba(251,191,36,0.2),_transparent_45%),radial-gradient(circle_at_20%_85%,_rgba(56,189,248,0.22),_transparent_50%)]' />
                    <div className='relative grid gap-8 lg:grid-cols-[1.1fr_0.9fr]'>
                        <div className='space-y-6'>
                            <div className='inline-flex items-center gap-3 rounded-full border border-cyan-200/60 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.35em] text-cyan-700 dark:border-cyan-300/30 dark:text-cyan-100'>
                                <span className='h-2 w-2 rounded-full bg-cyan-500 shadow-[0_0_12px_rgba(34,211,238,0.6)]' />
                                Interactive Playground
                            </div>
                            <div className='space-y-4'>
                                <h1 className='text-3xl font-semibold tracking-tight text-slate-900 dark:text-white sm:text-4xl lg:text-5xl'>
                                    Build, run, and iterate inside a focused code studio.
                                </h1>
                                <p className='max-w-xl text-base text-slate-600 dark:text-slate-200/80 sm:text-lg'>
                                    Use templates to kickstart a new idea, inspect outputs instantly, and keep your work saved locally
                                    while you explore. Switch to web preview for HTML/CSS/JS or stay in console mode for algorithms.
                                </p>
                            </div>
                            <div className='flex flex-wrap gap-3'>
                                <button
                                    type='button'
                                    onClick={scrollToEditor}
                                    className='rounded-full bg-gradient-to-r from-cyan-400 to-sky-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-900 shadow-lg shadow-cyan-500/40 transition hover:translate-y-[-1px]'
                                >
                                    Jump to editor
                                </button>
                                <button
                                    type='button'
                                    onClick={handleResetWorkspace}
                                    className='rounded-full border border-slate-200/70 bg-white/70 px-6 py-3 text-sm font-semibold uppercase tracking-[0.28em] text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-white/20 dark:bg-white/10 dark:text-white dark:hover:border-white/40 dark:hover:bg-white/15'
                                >
                                    Reset workspace
                                </button>
                            </div>
                            <div className='grid gap-4 sm:grid-cols-2'>
                                {highlights.map(({ label, detail, Icon }) => (
                                    <div
                                        key={label}
                                        className='flex items-start gap-3 rounded-2xl border border-slate-200/70 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-200/80'
                                    >
                                        <span className='mt-1 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-100'>
                                            <Icon />
                                        </span>
                                        <div>
                                            <p className='text-sm font-semibold text-slate-900 dark:text-white'>{label}</p>
                                            <p className='text-xs text-slate-500 dark:text-slate-200/70'>{detail}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className='space-y-6'>
                            <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                                <div className='flex items-center justify-between'>
                                    <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Session</p>
                                    <span className='inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-200'>
                                        <span className='h-2 w-2 animate-pulse rounded-full bg-emerald-500 dark:bg-emerald-300' />
                                        Active
                                    </span>
                                </div>
                                <div className='mt-4 grid gap-3 text-sm text-slate-600 dark:text-slate-200/80'>
                                    <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                        <span>Workspace</span>
                                        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100'>
                                            {activeTemplate.label}
                                        </span>
                                    </div>
                                    <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                        <span>Autosave</span>
                                        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-200'>On</span>
                                    </div>
                                    <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/70 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                        <span>Preview</span>
                                        <span className='text-xs font-semibold uppercase tracking-[0.2em] text-amber-600 dark:text-amber-200'>
                                            {isWebTemplate ? 'Web' : 'Console'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                                <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Shortcuts</p>
                                <div className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-200/80'>
                                    {shortcuts.map(({ keys, action }) => (
                                        <div key={keys} className='flex items-center justify-between rounded-xl bg-white/70 px-4 py-3 dark:bg-white/5'>
                                            <span className='text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100'>{keys}</span>
                                            <span className='text-xs text-slate-500 dark:text-slate-200/70'>{action}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                                <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Flow tips</p>
                                <div className='mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-200/70'>
                                    <p>Baseline a solution, then use Diff mode to compare variants.</p>
                                    <p>Switch to vertical split when reviewing long outputs.</p>
                                    <p>Use Web mode for HTML/CSS/JS or stay in console for algorithms.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className='space-y-6'>
                    <div className='flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between'>
                        <div className='space-y-2'>
                            <p className='text-xs uppercase tracking-[0.35em] text-slate-500 dark:text-slate-400'>Templates</p>
                            <h2 className='text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl'>Pick a starting point</h2>
                            <p className='text-sm text-slate-600 dark:text-slate-200/70'>
                                Switch templates to explore a different runtime. Your work saves per template.
                            </p>
                        </div>
                        <div className='flex flex-wrap gap-3'>
                            <button
                                type='button'
                                onClick={handleResetWorkspace}
                                className='rounded-full border border-slate-200/70 bg-white/70 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700 transition hover:border-slate-300 hover:bg-white dark:border-white/15 dark:bg-white/5 dark:text-white dark:hover:border-white/30 dark:hover:bg-white/10'
                            >
                                Clear saved session
                            </button>
                            <button
                                type='button'
                                onClick={scrollToEditor}
                                className='rounded-full bg-cyan-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 transition hover:bg-cyan-500/20 dark:bg-white/10 dark:text-cyan-100 dark:hover:bg-white/15'
                            >
                                Open editor
                            </button>
                        </div>
                    </div>
                    <div className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
                        {templates.map(({ id, label, description, Icon, tags }) => {
                            const isActive = id === activeTemplate.id;
                            return (
                                <button
                                    key={id}
                                    type='button'
                                    onClick={() => handleSelectTemplate(id)}
                                    className={`group flex h-full flex-col gap-3 rounded-2xl border p-5 text-left transition ${
                                        isActive
                                            ? 'border-cyan-300/60 bg-cyan-400/10 shadow-[0_20px_50px_-30px_rgba(34,211,238,0.65)]'
                                            : 'border-slate-200/70 bg-white/80 hover:border-slate-300 hover:bg-white dark:border-white/10 dark:bg-white/5 dark:hover:border-white/25 dark:hover:bg-white/10'
                                    }`}
                                >
                                    <div className='flex items-center justify-between'>
                                        <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:bg-white/10 dark:text-cyan-100'>
                                            <Icon />
                                        </span>
                                        {isActive && (
                                            <span className='rounded-full border border-cyan-300/40 bg-cyan-400/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-cyan-700 dark:text-cyan-100'>
                                                Active
                                            </span>
                                        )}
                                    </div>
                                    <div>
                                        <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>{label}</h3>
                                        <p className='mt-1 text-sm text-slate-600 dark:text-slate-200/70'>{description}</p>
                                    </div>
                                    <div className='flex flex-wrap gap-2'>
                                        {tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className='rounded-full border border-slate-200/70 bg-white/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-100'
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </section>

                <section
                    ref={editorAnchorRef}
                    id='playground-workspace'
                    className='grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]'
                >
                    <div className='overflow-hidden rounded-[28px] border border-slate-200/70 bg-white/85 shadow-[0_35px_100px_-70px_rgba(10,14,24,0.25)] dark:border-white/10 dark:bg-slate-950/40 dark:shadow-[0_35px_100px_-70px_rgba(10,14,24,0.9)]'>
                        <div className='flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/70 bg-white/80 px-6 py-4 dark:border-white/10 dark:bg-white/5'>
                            <div>
                                <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400'>Workspace</p>
                                <h3 className='text-lg font-semibold text-slate-900 dark:text-white'>{activeTemplate.label}</h3>
                            </div>
                            <div className='flex flex-wrap items-center gap-2'>
                                <span className='rounded-full border border-slate-200/70 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-100'>
                                    Autosave on
                                </span>
                                <span className='rounded-full border border-slate-200/70 bg-white px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-600 dark:border-white/10 dark:bg-white/10 dark:text-slate-100'>
                                    {isWebTemplate ? 'Web preview' : 'Console mode'}
                                </span>
                            </div>
                        </div>
                        <div className='p-4 sm:p-6'>
                            <CodeEditor
                                key={`${activeTemplate.id}:${templateEpoch}`}
                                initialCode={activeTemplate.code}
                                language={activeTemplate.language}
                                workspaceId={workspaceId}
                            />
                        </div>
                    </div>
                    <div className='flex flex-col gap-4 xl:sticky xl:top-24'>
                        <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                            <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Active template</p>
                            <div className='mt-4 flex items-start gap-3'>
                                <span className='inline-flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-700 dark:bg-white/10 dark:text-cyan-100'>
                                    <ActiveTemplateIcon />
                                </span>
                                <div>
                                    <p className='text-sm font-semibold text-slate-900 dark:text-white'>{activeTemplate.label}</p>
                                    <p className='text-xs text-slate-600 dark:text-slate-200/70'>{activeTemplate.description}</p>
                                </div>
                            </div>
                        </div>
                        <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                            <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Build loops</p>
                            <div className='mt-4 space-y-3 text-sm text-slate-600 dark:text-slate-200/70'>
                                <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                    <span>Run code</span>
                                    <span className='text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100'>Ctrl/Cmd + Enter</span>
                                </div>
                                <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                    <span>Format</span>
                                    <span className='text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100'>Ctrl/Cmd + S</span>
                                </div>
                                <div className='flex items-center justify-between rounded-xl border border-slate-200/70 bg-white/80 px-4 py-3 dark:border-white/10 dark:bg-white/5'>
                                    <span>Command palette</span>
                                    <span className='text-xs uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-100'>Ctrl/Cmd + Shift + P</span>
                                </div>
                            </div>
                        </div>
                        <div className='rounded-3xl border border-slate-200/70 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5'>
                            <p className='text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-300'>Output habits</p>
                            <div className='mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-200/70'>
                                <p>Use the splitter to keep output visible while iterating.</p>
                                <p>Save a baseline before experimenting with alternate solutions.</p>
                                <p>Switch layout orientation when running longer traces.</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
