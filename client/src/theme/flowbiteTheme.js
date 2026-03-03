// client/src/theme/flowbiteTheme.js
// Centralize Flowbite React theme customizations so built-in components
// match our Tailwind design tokens and brand palette.

export const customFlowbiteTheme = {
  button: {
    base:
      'group inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 rounded-radius-md transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
    color: {
      // Primary now follows dynamic accent tokens from Control Center presets.
      primary:
        'btn-theme-primary text-white hover:brightness-105 active:scale-[0.985] transition-transform focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
      secondary:
        'btn-glass-secondary focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
      light:
        'text-ink-700 bg-white/65 border border-white/55 hover:bg-white/75 focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:text-ink-100 dark:bg-ink-900/55 dark:border-white/10 dark:hover:bg-ink-900/65 dark:focus-visible:ring-offset-slate-900',
      danger: 'text-white bg-red-600 hover:bg-red-700 focus-visible:ring-red-300',
      success:
        'text-white bg-green-600 hover:bg-green-700 focus-visible:ring-green-300',
      // Accent option
      teal: 'text-white bg-accent-teal hover:bg-teal-500 focus-visible:ring-[var(--theme-focus-ring)]',
      aqua:
        'btn-aqua text-white focus-visible:ring-[var(--theme-focus-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-900',
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
        'flex items-center gap-2 py-2 px-3 rounded-radius-md text-ink-700 dark:text-ink-100 hover:bg-ink-100 dark:hover:bg-ink-800/60 focus-visible:ring-2 focus-visible:ring-[var(--theme-focus-ring)]',
      active: {
        on: 'bg-ink-100 dark:bg-ink-800/60 text-ink-900 dark:text-white',
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
        // Big Sur-style frosted translucent surface
        'relative w-full p-0 m-4 sm:m-6 max-w-lg sm:max-w-xl rounded-radius-lg shadow-elevated border backdrop-blur-2xl bg-white/70 border-white/40 dark:bg-ink-900/60 dark:border-white/10',
    },
    header: {
      base: 'flex items-start justify-between py-3 px-4 border-b border-ink-200/60 dark:border-ink-700/60',
      title: 'text-base font-semibold text-ink-800 dark:text-ink-100',
      close: {
        base:
          'ml-auto inline-flex items-center rounded-radius-md p-1.5 text-ink-500 hover:bg-ink-100 dark:hover:bg-ink-700/60 hover:text-ink-700 focus-visible:ring-2 focus-visible:ring-[var(--theme-focus-ring)]',
        icon: 'w-5 h-5',
      },
    },
    body: {
      base: 'p-4 text-ink-700 dark:text-ink-100',
    },
    footer: {
      base: 'flex items-center justify-end gap-2 p-4 border-t border-ink-200/60 dark:border-ink-700/60',
    },
  },
  textInput: {
    field: {
      base: 'relative w-full',
      input: {
        base:
          'theme-control-input block w-full rounded-radius-md border border-ink-300 bg-white text-ink-900 placeholder-ink-400 focus:border-[var(--theme-control-focus)] focus:ring-[var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700 dark:placeholder-ink-500',
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
        'inline-flex items-center rounded-l-radius-md border border-r-0 border-ink-300 bg-ink-100 px-3 text-ink-600 dark:border-ink-700 dark:bg-ink-700 dark:text-ink-200',
    },
  },
  select: {
    field: {
      base: 'relative w-full',
      select: {
        base:
          'theme-control-input block w-full rounded-radius-md border border-ink-300 bg-white text-ink-900 focus:border-[var(--theme-control-focus)] focus:ring-[var(--theme-focus-ring)] disabled:cursor-not-allowed disabled:opacity-60 dark:bg-ink-800 dark:text-ink-100 dark:border-ink-700',
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
      'absolute z-10 inline-block rounded-radius-md px-3 py-1.5 text-xs font-medium shadow-soft backdrop-blur bg-white/80 text-ink-900 ring-1 ring-white/50 dark:bg-ink-900/70 dark:text-ink-100 dark:ring-white/10',
    arrow: {
      base: 'absolute h-2 w-2 rotate-45 bg-white/80 dark:bg-ink-900/70',
      style: {
        dark: 'bg-ink-900/70',
        light: 'bg-white/80',
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
};
