// client/src/theme/flowbiteTheme.js
// Centralize Flowbite React theme customizations so built-in components
// match our Liquid Glass + Glassmorphism design language.

const glassColorScales = {
    info: 'border-sky-300/65 bg-white/85 text-sky-900 dark:border-sky-400/45 dark:bg-slate-950/68 dark:text-sky-100',
    gray: 'border-slate-300/70 bg-white/85 text-slate-800 dark:border-slate-600/55 dark:bg-slate-950/68 dark:text-slate-100',
    failure: 'border-rose-300/70 bg-white/85 text-rose-900 dark:border-rose-400/50 dark:bg-slate-950/68 dark:text-rose-100',
    success: 'border-emerald-300/70 bg-white/85 text-emerald-900 dark:border-emerald-400/50 dark:bg-slate-950/68 dark:text-emerald-100',
    warning: 'border-amber-300/70 bg-white/85 text-amber-900 dark:border-amber-400/50 dark:bg-slate-950/68 dark:text-amber-100',
    red: 'border-rose-300/70 bg-white/85 text-rose-900 dark:border-rose-400/50 dark:bg-slate-950/68 dark:text-rose-100',
    green: 'border-emerald-300/70 bg-white/85 text-emerald-900 dark:border-emerald-400/50 dark:bg-slate-950/68 dark:text-emerald-100',
    yellow: 'border-amber-300/70 bg-white/85 text-amber-900 dark:border-amber-400/50 dark:bg-slate-950/68 dark:text-amber-100',
    blue: 'border-sky-300/65 bg-white/85 text-sky-900 dark:border-sky-400/45 dark:bg-slate-950/68 dark:text-sky-100',
    cyan: 'border-sky-300/65 bg-white/85 text-sky-900 dark:border-sky-400/45 dark:bg-slate-950/68 dark:text-sky-100',
    pink: 'border-pink-300/70 bg-white/85 text-pink-900 dark:border-pink-400/50 dark:bg-slate-950/68 dark:text-pink-100',
    lime: 'border-lime-300/70 bg-white/85 text-lime-900 dark:border-lime-400/50 dark:bg-slate-950/68 dark:text-lime-100',
    dark: 'border-slate-500/65 bg-slate-900/82 text-slate-100 dark:border-slate-500/65 dark:bg-slate-950/82 dark:text-slate-100',
    indigo: 'border-indigo-300/70 bg-white/85 text-indigo-900 dark:border-indigo-400/50 dark:bg-slate-950/68 dark:text-indigo-100',
    purple: 'border-violet-300/70 bg-white/85 text-violet-900 dark:border-violet-400/50 dark:bg-slate-950/68 dark:text-violet-100',
    teal: 'border-teal-300/70 bg-white/85 text-teal-900 dark:border-teal-400/50 dark:bg-slate-950/68 dark:text-teal-100',
    light: 'border-slate-300/70 bg-white/85 text-slate-800 dark:border-slate-600/55 dark:bg-slate-900/68 dark:text-slate-100',
};

export const customFlowbiteTheme = {
    button: {
        base:
            'group inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-radius-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
        color: {
            primary:
                'btn-theme-primary text-white hover:brightness-105 active:scale-[0.985] transition-transform focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
            secondary:
                'btn-glass-secondary focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
            light:
                'btn-glass-secondary text-ink-800 dark:text-ink-100 focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
            danger:
                'text-white bg-red-600 hover:bg-red-700 focus-visible:ring-red-300',
            success:
                'text-white bg-green-600 hover:bg-green-700 focus-visible:ring-green-300',
            teal:
                'text-white bg-accent-teal hover:bg-teal-500 focus-visible:ring-[var(--theme-focus-ring)]',
            aqua:
                'btn-aqua text-white focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
        },
        gradientDuoTone: {
            cyanToBlue: 'btn-aqua text-white',
            greenToBlue: 'btn-aqua text-white',
            pinkToOrange: 'btn-aqua text-white',
            purpleToBlue: 'btn-aqua text-white',
            purpleToPink: 'btn-aqua text-white',
            redToYellow: 'btn-theme-primary text-white',
            tealToLime: 'btn-aqua text-white',
        },
        size: {
            xs: 'h-7 px-2.5 text-xs',
            sm: 'h-8 px-3 text-sm',
            md: 'h-10 px-4 text-sm',
            lg: 'h-12 px-5 text-base',
            xl: 'h-14 px-6 text-base',
        },
        pill: {
            off: '',
            on: 'rounded-radius-full',
        },
    },
    navbar: {
        link: {
            base:
                'flex items-center gap-2 py-2 px-3 rounded-radius-md text-ink-700 dark:text-ink-100 hover:bg-white/75 hover:text-ink-900 dark:hover:bg-ink-800/60 focus-visible:ring-2 focus-visible:ring-[var(--theme-focus-ring)]',
            active: {
                on: 'bg-white/85 shadow-sm shadow-slate-900/5 dark:bg-ink-800/60 text-ink-900 dark:text-white',
                off: '',
            },
        },
        toggle: {
            base: 'text-ink-700 hover:text-ink-900 dark:text-ink-100',
        },
    },
    modal: {
        root: {
            base: 'fixed inset-0 z-50 overflow-y-auto',
            show: {
                on: 'flex',
                off: 'hidden',
            },
        },
        content: {
            base:
                'relative w-full p-0 m-4 sm:m-6 max-w-lg sm:max-w-xl rounded-radius-lg border border-slate-200/75 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.42)] backdrop-blur-2xl bg-white/82 dark:bg-ink-900/60 dark:border-white/10',
        },
        header: {
            base: 'flex items-start justify-between py-3 px-4 border-b border-slate-200/70 dark:border-ink-700/60',
            title: 'text-base font-semibold text-ink-800 dark:text-ink-100',
            close: {
                base:
                    'ml-auto inline-flex items-center rounded-radius-md p-1.5 text-ink-500 hover:bg-white hover:text-ink-700 dark:hover:bg-ink-700/60 focus-visible:ring-2 focus-visible:ring-[var(--theme-focus-ring)]',
                icon: 'w-5 h-5',
            },
        },
        body: {
            base: 'p-4 text-ink-700 dark:text-ink-100',
        },
        footer: {
            base: 'flex items-center justify-end gap-2 p-4 border-t border-slate-200/70 dark:border-ink-700/60',
        },
    },
    alert: {
        base:
            'liquid-hybrid-tile flex flex-col gap-2 border border-white/65 p-4 text-sm backdrop-blur-xl',
        borderAccent: 'border-t',
        rounded: 'rounded-[1rem]',
        wrapper: 'flex items-start',
        icon: 'mr-3 inline h-5 w-5 flex-shrink-0',
        color: glassColorScales,
        closeButton: {
            base:
                '-mx-1.5 -my-1.5 ml-auto inline-flex h-8 w-8 rounded-full p-1.5 transition hover:scale-[1.03] focus-visible:ring-2',
            icon: 'h-4 w-4',
            color: {
                info: 'bg-sky-100/70 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60',
                gray: 'bg-slate-100/75 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800/80',
                failure: 'bg-rose-100/70 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/60',
                success: 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60',
                warning: 'bg-amber-100/70 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60',
                red: 'bg-rose-100/70 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/40 dark:text-rose-200 dark:hover:bg-rose-900/60',
                green: 'bg-emerald-100/70 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-200 dark:hover:bg-emerald-900/60',
                yellow: 'bg-amber-100/70 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/40 dark:text-amber-200 dark:hover:bg-amber-900/60',
                blue: 'bg-sky-100/70 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60',
                cyan: 'bg-sky-100/70 text-sky-700 hover:bg-sky-100 dark:bg-sky-900/40 dark:text-sky-200 dark:hover:bg-sky-900/60',
                pink: 'bg-pink-100/70 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/40 dark:text-pink-200 dark:hover:bg-pink-900/60',
                lime: 'bg-lime-100/70 text-lime-700 hover:bg-lime-100 dark:bg-lime-900/40 dark:text-lime-200 dark:hover:bg-lime-900/60',
                dark: 'bg-slate-900/70 text-slate-100 hover:bg-slate-900 dark:bg-slate-900/80 dark:text-slate-100 dark:hover:bg-slate-900',
                indigo: 'bg-indigo-100/70 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/40 dark:text-indigo-200 dark:hover:bg-indigo-900/60',
                purple: 'bg-violet-100/70 text-violet-700 hover:bg-violet-100 dark:bg-violet-900/40 dark:text-violet-200 dark:hover:bg-violet-900/60',
                teal: 'bg-teal-100/70 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/40 dark:text-teal-200 dark:hover:bg-teal-900/60',
                light: 'bg-slate-100/75 text-slate-700 hover:bg-slate-100 dark:bg-slate-800/60 dark:text-slate-200 dark:hover:bg-slate-800/80',
            },
        },
    },
    card: {
        root: {
            base:
                'liquid-hybrid-tile flex rounded-[1.35rem] border border-white/65 bg-white/72 shadow-[0_26px_80px_-58px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/58',
            children: 'flex h-full flex-col justify-center gap-4 p-6',
            horizontal: {
                off: 'flex-col',
                on: 'flex-col md:max-w-xl md:flex-row',
            },
            href:
                'transition-transform duration-200 hover:-translate-y-1 hover:border-sky-300/70 dark:hover:border-sky-400/40',
        },
        img: {
            base: '',
            horizontal: {
                off: 'rounded-t-[1.35rem]',
                on: 'h-96 w-full rounded-t-[1.35rem] object-cover md:h-auto md:w-48 md:rounded-none md:rounded-l-[1.35rem]',
            },
        },
    },
    textInput: {
        field: {
            base: 'relative w-full',
            input: {
                base:
                    'theme-control-input liquid-hybrid-input block w-full rounded-radius-md border border-slate-300/90 bg-white/92 text-ink-900 placeholder-ink-400 shadow-[0_1px_1px_rgba(15,23,42,0.06)] focus:border-[var(--theme-control-focus)] focus:ring-[var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700 dark:placeholder-ink-500',
                colors: {
                    gray: '',
                },
                sizes: {
                    sm: 'p-2 text-sm',
                    md: 'p-2.5 text-sm',
                    lg: 'p-3 text-base',
                },
            },
            addon:
                'inline-flex items-center rounded-l-radius-md border border-r-0 border-slate-300 bg-slate-100 px-3 text-ink-600 dark:border-ink-700 dark:bg-ink-700 dark:text-ink-200',
        },
    },
    textarea: {
        base:
            'theme-control-input liquid-hybrid-input block w-full rounded-radius-md border border-slate-300/90 bg-white/92 text-sm text-ink-900 placeholder-ink-400 shadow-[0_1px_1px_rgba(15,23,42,0.06)] focus:border-[var(--theme-control-focus)] focus:ring-[var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700 dark:placeholder-ink-500',
        colors: {
            gray: '',
        },
        withShadow: {
            on: 'shadow-[0_14px_32px_-24px_rgba(15,23,42,0.35)]',
            off: '',
        },
    },
    select: {
        field: {
            base: 'relative w-full',
            select: {
                base:
                    'theme-control-input liquid-hybrid-input block w-full rounded-radius-md border border-slate-300/90 bg-white/92 text-ink-900 shadow-[0_1px_1px_rgba(15,23,42,0.06)] focus:border-[var(--theme-control-focus)] focus:ring-[var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700',
                sizes: {
                    sm: 'p-2 text-sm',
                    md: 'p-2.5 text-sm',
                    lg: 'p-3 text-base',
                },
            },
        },
    },
    tooltip: {
        target: 'focus:outline-none',
        base:
            'absolute z-10 inline-block rounded-radius-md px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur bg-white/92 text-ink-900 ring-1 ring-slate-200/80 dark:bg-ink-900/70 dark:text-ink-100 dark:ring-white/10',
        arrow: {
            base: 'absolute h-2 w-2 rotate-45 bg-white/92 dark:bg-ink-900/70',
            style: {
                dark: 'bg-ink-900/70',
                light: 'bg-white/92',
            },
            placement: '-4px',
        },
    },
    badge: {
        color: {
            info: 'bg-brand-100 text-brand-700 dark:bg-brand-800 dark:text-brand-100',
            gray: 'bg-ink-100 text-ink-700 dark:bg-ink-800 dark:text-ink-100',
            success: 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100',
            failure: 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100',
            pink: 'bg-pink-100 text-pink-800 dark:bg-pink-800 dark:text-pink-100',
            purple: 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100',
            warning: 'bg-orange-100 text-orange-800 dark:bg-orange-800 dark:text-orange-100',
        },
        size: {
            xs: 'text-xs px-2 py-0.5',
            sm: 'text-xs px-2.5 py-0.5',
            md: 'text-sm px-3 py-0.5',
        },
    },
    spinner: {
        color: {
            primary: 'fill-[var(--color-accent)] text-ink-200',
            gray: 'fill-ink-500 text-ink-200',
        },
    },
    table: {
        root: {
            base: 'w-full text-left text-sm text-slate-600 dark:text-slate-300',
            shadow:
                'absolute bg-white/60 dark:bg-slate-950/60 w-full h-full top-0 left-0 rounded-[1rem] -z-10',
            wrapper:
                'relative overflow-hidden rounded-[1rem] border border-white/65 bg-white/62 shadow-[0_26px_72px_-54px_rgba(15,23,42,0.58)] backdrop-blur-xl dark:border-slate-700/55 dark:bg-slate-950/58',
        },
        body: {
            base: 'group/body',
            cell: {
                base:
                    'group-first/body:group-first/row:first:rounded-tl-[1rem] group-first/body:group-first/row:last:rounded-tr-[1rem] group-last/body:group-last/row:first:rounded-bl-[1rem] group-last/body:group-last/row:last:rounded-br-[1rem] px-6 py-4',
            },
        },
        head: {
            base:
                'group/head text-xs uppercase tracking-[0.08em] text-slate-600 dark:text-slate-300',
            cell: {
                base:
                    'group-first/head:first:rounded-tl-[1rem] group-first/head:last:rounded-tr-[1rem] bg-white/78 dark:bg-slate-900/72 px-6 py-3',
            },
        },
        row: {
            base: 'group/row',
            hovered: 'hover:bg-white/55 dark:hover:bg-slate-800/55',
            striped:
                'odd:bg-white/45 even:bg-white/22 odd:dark:bg-slate-900/35 even:dark:bg-slate-900/20',
        },
    },
};
