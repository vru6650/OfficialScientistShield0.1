import PropTypes from 'prop-types';
import {
    HiOutlineComputerDesktop,
    HiOutlineMoon,
    HiOutlineSparkles,
    HiOutlineSun,
} from 'react-icons/hi2';

function classNames(...classes) {
    return classes.filter(Boolean).join(' ');
}

const THEME_OPTIONS = Object.freeze([
    {
        key: 'light',
        title: 'Light',
        subtitle: 'Bright glass, crisp shadows, and higher daylight contrast.',
        previewClassName: 'macos-theme-toggle__preview-window--light',
        Icon: HiOutlineSun,
        flags: ['Day-ready', 'High clarity'],
    },
    {
        key: 'dark',
        title: 'Dark',
        subtitle: 'Low-glare chrome with deeper surfaces for long sessions.',
        previewClassName: 'macos-theme-toggle__preview-window--dark',
        Icon: HiOutlineMoon,
        flags: ['Low glare', 'Night focus'],
    },
    {
        key: 'system',
        title: 'System',
        subtitle: 'Follows the device preference and switches automatically.',
        previewClassName: 'macos-theme-toggle__preview-window--auto',
        Icon: HiOutlineComputerDesktop,
        flags: ['Auto sync', 'Adaptive'],
    },
]);

export default function ThemeToggle({
    themeMode,
    resolvedTheme,
    systemTheme,
    onChange,
    reduceMotion,
    className,
}) {
    const nextToggleMode = resolvedTheme === 'dark' ? 'light' : 'dark';
    const nextToggleLabel = resolvedTheme === 'dark' ? 'Use Light Now' : 'Use Dark Now';

    return (
        <section className={classNames('macos-theme-toggle', className)} aria-label="Theme mode">
            <div className="macos-theme-toggle__header">
                <div className="macos-theme-toggle__labels">
                    <p className="macos-theme-toggle__title">Theme Mode</p>
                    <p className="macos-theme-toggle__subtitle">
                        Runtime light, dark, and system themes now drive Tailwind `dark:` styles,
                        glass tokens, wallpaper tone, and browser chrome together.
                    </p>
                </div>
                <div className="macos-theme-toggle__actions">
                    <button
                        type="button"
                        className={classNames(
                            'macos-theme-toggle__quick',
                            themeMode !== 'system' && 'macos-theme-toggle__quick--ghost'
                        )}
                        onClick={() => onChange('system')}
                    >
                        <HiOutlineComputerDesktop className="h-4 w-4" />
                        Follow System
                    </button>
                    <button
                        type="button"
                        className="macos-theme-toggle__quick macos-theme-toggle__quick--ghost"
                        onClick={() => onChange(nextToggleMode)}
                    >
                        <HiOutlineSparkles className="h-4 w-4" />
                        {nextToggleLabel}
                    </button>
                </div>
            </div>

            <div className="macos-theme-toggle__preview-strip" aria-hidden="true">
                {THEME_OPTIONS.map((option) => {
                    const isActive = themeMode === option.key;
                    const isResolved =
                        option.key === 'system'
                            ? themeMode === 'system'
                            : resolvedTheme === option.key;

                    return (
                        <div
                            key={option.key}
                            className={classNames(
                                'macos-theme-toggle__preview-card',
                                isResolved && 'macos-theme-toggle__preview-card--resolved',
                                isActive && 'macos-theme-toggle__preview-card--active'
                            )}
                        >
                            <div
                                className={classNames(
                                    'macos-theme-toggle__preview-window',
                                    option.previewClassName
                                )}
                            >
                                <div className="macos-theme-toggle__preview-window-bar">
                                    <span className="macos-theme-toggle__preview-dot" />
                                    <span className="macos-theme-toggle__preview-dot" />
                                    <span className="macos-theme-toggle__preview-dot" />
                                </div>
                                <div className="macos-theme-toggle__preview-window-body">
                                    <span className="macos-theme-toggle__preview-line macos-theme-toggle__preview-line--strong" />
                                    <span className="macos-theme-toggle__preview-line" />
                                    <span className="macos-theme-toggle__preview-line macos-theme-toggle__preview-line--short" />
                                </div>
                            </div>
                            <div className="macos-theme-toggle__preview-copy">
                                <span className="macos-theme-toggle__preview-title">{option.title}</span>
                                <span className="macos-theme-toggle__preview-subtitle">
                                    {option.key === 'system'
                                        ? `Currently resolves to ${systemTheme}.`
                                        : isResolved
                                            ? 'Currently applied.'
                                            : 'Available instantly.'}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="macos-theme-toggle__options" role="radiogroup" aria-label="Select theme mode">
                {THEME_OPTIONS.map((option) => {
                    const isActive = themeMode === option.key;
                    const isResolved =
                        option.key === 'system'
                            ? themeMode === 'system'
                            : resolvedTheme === option.key;

                    return (
                        <button
                            key={option.key}
                            type="button"
                            role="radio"
                            aria-checked={isActive}
                            className={classNames(
                                'macos-theme-toggle__option',
                                isActive && 'macos-theme-toggle__option--active'
                            )}
                            onClick={() => onChange(option.key)}
                        >
                            <span className="macos-theme-toggle__option-icon" aria-hidden="true">
                                <option.Icon className="h-5 w-5" />
                            </span>
                            <span className="macos-theme-toggle__option-copy">
                                <span className="macos-theme-toggle__option-title">{option.title}</span>
                                <span className="macos-theme-toggle__option-subtitle">{option.subtitle}</span>
                                <span className="macos-theme-toggle__option-flags">
                                    {option.flags.map((flag) => (
                                        <span key={flag} className="macos-theme-toggle__option-flag">
                                            {flag}
                                        </span>
                                    ))}
                                    {isResolved && option.key !== 'system' ? (
                                        <span className="macos-theme-toggle__option-flag">Live</span>
                                    ) : null}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="macos-theme-toggle__footer">
                <div className="macos-theme-toggle__footer-status">
                    <span className="macos-theme-toggle__footer-pill">
                        Resolved {resolvedTheme}
                    </span>
                    <span className="macos-theme-toggle__a11y-pill">
                        System {systemTheme}
                    </span>
                    <span
                        className={classNames(
                            'macos-theme-toggle__a11y-pill',
                            !reduceMotion && 'macos-theme-toggle__a11y-pill--muted'
                        )}
                    >
                        {reduceMotion ? 'Reduced motion on' : 'Motion adaptive'}
                    </span>
                </div>
                <p className="macos-theme-toggle__footer-hint">
                    Manual modes lock the workspace immediately. System mode keeps the app aligned
                    with OS appearance changes.
                </p>
            </div>
        </section>
    );
}

ThemeToggle.propTypes = {
    themeMode: PropTypes.oneOf(['system', 'light', 'dark']).isRequired,
    resolvedTheme: PropTypes.oneOf(['light', 'dark']).isRequired,
    systemTheme: PropTypes.oneOf(['light', 'dark']).isRequired,
    onChange: PropTypes.func.isRequired,
    reduceMotion: PropTypes.bool,
    className: PropTypes.string,
};

ThemeToggle.defaultProps = {
    reduceMotion: false,
    className: '',
};
