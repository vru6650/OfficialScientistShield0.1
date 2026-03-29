import PropTypes from 'prop-types';
import { Badge, Button, Card } from 'flowbite-react';

const getBackgroundClass = (background) => {
    switch (background) {
        case 'muted':
            return 'bg-slate-50/90 dark:bg-slate-900/70';
        case 'accent':
            return 'bg-gradient-to-r from-cyan-500/10 via-sky-500/10 to-emerald-500/10';
        case 'panel':
            return 'bg-white/85 dark:bg-slate-950/70 shadow-sm ring-1 ring-slate-200/70 dark:ring-slate-800/80 backdrop-blur';
        default:
            return '';
    }
};

const alignmentClass = (alignment) => {
    switch (alignment) {
        case 'center':
            return 'text-center items-center';
        case 'right':
            return 'text-right items-end';
        default:
            return 'text-left items-start';
    }
};

const Paragraphs = ({ text }) => {
    if (!text) {
        return null;
    }

    return text
        .split(/\n+/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line, index) => (
            <p key={index} className='text-base leading-relaxed text-gray-600 dark:text-gray-300'>
                {line}
            </p>
        ));
};

Paragraphs.propTypes = {
    text: PropTypes.string,
};

const HeroSection = ({ section }) => (
    <div
        className={`workspace-surface relative overflow-hidden ${getBackgroundClass(
            section.background
        )}`}
    >
        <div className='absolute inset-0 bg-gradient-to-br from-white/70 via-transparent to-transparent dark:from-slate-950/80' />
        <div className='relative grid gap-10 p-10 md:grid-cols-2 md:items-center'>
            <div className='flex flex-col gap-4'>
                <Badge className='w-fit border border-sky-200 bg-sky-100 text-sm uppercase tracking-wide text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'>
                    {section.subtitle || 'Featured'}
                </Badge>
                <h2 className='text-4xl font-bold text-gray-900 dark:text-white md:text-5xl'>{section.title}</h2>
                <Paragraphs text={section.body} />
                {section.cta?.label && (
                    <div className='mt-4'>
                        <Button className='btn-aqua' href={section.cta.url || '#'} as='a'>
                            {section.cta.label}
                        </Button>
                    </div>
                )}
            </div>
            {section.media?.url && (
                <div className='relative isolate'>
                    <div className='absolute -inset-6 rounded-3xl bg-sky-500/20 blur-3xl dark:bg-sky-500/12' />
                    <img
                        src={section.media.url}
                        alt={section.media.alt || section.title}
                        className='relative z-10 w-full rounded-2xl object-cover shadow-xl'
                    />
                </div>
            )}
        </div>
    </div>
);

HeroSection.propTypes = {
    section: PropTypes.shape({
        title: PropTypes.string,
        subtitle: PropTypes.string,
        body: PropTypes.string,
        cta: PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string,
        }),
        media: PropTypes.shape({
            url: PropTypes.string,
            alt: PropTypes.string,
        }),
        background: PropTypes.string,
    }).isRequired,
};

const FeatureGridSection = ({ section }) => (
    <div className={`workspace-surface p-6 ${getBackgroundClass(section.background)}`}>
        <div className={`flex flex-col gap-4 ${alignmentClass(section.alignment)}`}>
            <div>
                {section.subtitle && (
                    <span className='text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300'>{section.subtitle}</span>
                )}
                <h3 className='text-3xl font-semibold text-gray-900 dark:text-white'>{section.title}</h3>
            </div>
            <Paragraphs text={section.body} />
            <div className='grid gap-6 md:grid-cols-2'>
                {section.items?.map((item, index) => (
                    <Card key={index} className='h-full border-none bg-white/80 shadow-none ring-1 ring-slate-200/70 dark:bg-slate-950/70 dark:ring-slate-800'>
                        <div className='flex flex-col gap-2'>
                            {item.icon && (
                                <span className='text-3xl text-sky-500' aria-hidden>
                                    {item.icon}
                                </span>
                            )}
                            <h4 className='text-xl font-semibold text-gray-900 dark:text-white'>{item.title}</h4>
                            <p className='text-sm text-gray-600 dark:text-gray-300'>{item.body}</p>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    </div>
);

FeatureGridSection.propTypes = {
    section: PropTypes.shape({
        title: PropTypes.string,
        subtitle: PropTypes.string,
        body: PropTypes.string,
        alignment: PropTypes.oneOf(['left', 'center', 'right']),
        background: PropTypes.string,
        items: PropTypes.arrayOf(
            PropTypes.shape({
                title: PropTypes.string,
                body: PropTypes.string,
                icon: PropTypes.string,
            })
        ),
    }).isRequired,
};

const CTASection = ({ section }) => (
    <div
        className={`workspace-surface relative overflow-hidden p-10 text-center shadow-sm ${getBackgroundClass(
            section.background
        )}`}
    >
        <div className='mx-auto flex max-w-2xl flex-col items-center gap-4'>
            {section.subtitle && (
                <Badge className='border border-sky-200 bg-sky-100 text-sky-700 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200'>
                    {section.subtitle}
                </Badge>
            )}
            <h3 className='text-3xl font-semibold text-gray-900 dark:text-white'>{section.title}</h3>
            <Paragraphs text={section.body} />
            {section.cta?.label && (
                <Button className='btn-aqua' size='lg' href={section.cta.url || '#'} as='a'>
                    {section.cta.label}
                </Button>
            )}
        </div>
    </div>
);

CTASection.propTypes = {
    section: PropTypes.shape({
        title: PropTypes.string,
        subtitle: PropTypes.string,
        body: PropTypes.string,
        cta: PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string,
        }),
        background: PropTypes.string,
    }).isRequired,
};

const RichTextSection = ({ section }) => (
    <div className={`workspace-surface p-8 ${getBackgroundClass(section.background)}`}>
        <div className={`flex flex-col gap-4 ${alignmentClass(section.alignment)}`}>
            <div>
                {section.subtitle && (
                    <span className='text-sm font-semibold uppercase tracking-wide text-sky-600 dark:text-sky-300'>{section.subtitle}</span>
                )}
                <h3 className='text-3xl font-semibold text-gray-900 dark:text-white'>{section.title}</h3>
            </div>
            <Paragraphs text={section.body} />
            {section.media?.url && (
                <img
                    src={section.media.url}
                    alt={section.media.alt || section.title}
                    className='mt-4 w-full rounded-2xl object-cover shadow'
                />
            )}
            {section.cta?.label && (
                <div className='mt-2'>
                    <Button color='light' href={section.cta.url || '#'} as='a'>
                        {section.cta.label}
                    </Button>
                </div>
            )}
        </div>
    </div>
);

RichTextSection.propTypes = {
    section: PropTypes.shape({
        title: PropTypes.string,
        subtitle: PropTypes.string,
        body: PropTypes.string,
        alignment: PropTypes.oneOf(['left', 'center', 'right']),
        background: PropTypes.string,
        media: PropTypes.shape({
            url: PropTypes.string,
            alt: PropTypes.string,
        }),
        cta: PropTypes.shape({
            label: PropTypes.string,
            url: PropTypes.string,
        }),
    }).isRequired,
};

const renderSection = (section) => {
    switch (section.type) {
        case 'hero':
            return <HeroSection section={section} />;
        case 'feature-grid':
            return <FeatureGridSection section={section} />;
        case 'cta':
            return <CTASection section={section} />;
        default:
            return <RichTextSection section={section} />;
    }
};

const PageRenderer = ({ page, compact = false }) => {
    if (!page) {
        return null;
    }

    const sections = [...(page.sections ?? [])].sort((a, b) => (Number(a.order) || 0) - (Number(b.order) || 0));

    const containerClasses = compact
        ? 'mx-auto flex max-w-4xl flex-col gap-6'
        : 'workspace-page';
    const contentClasses = compact
        ? 'flex flex-col gap-6'
        : 'workspace-page__content workspace-page__content--story flex flex-col gap-10 px-4 py-10 sm:px-6 lg:px-8';

    const headerClasses = compact
        ? 'flex flex-col gap-3 text-left'
        : 'mx-auto flex max-w-3xl flex-col items-center gap-4 text-center';

    return (
        <div className={containerClasses}>
            <div className={contentClasses}>
                <header className={headerClasses}>
                    <h1
                        className={`font-bold tracking-tight text-gray-900 dark:text-white ${
                            compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl'
                        }`}
                    >
                        {page.title}
                    </h1>
                    {page.description && (
                        <p className={`text-gray-600 dark:text-gray-300 ${compact ? 'text-base md:text-lg' : 'text-lg'}`}>
                            {page.description}
                        </p>
                    )}
                </header>

                <div className='flex flex-col gap-8'>
                    {sections.map((section, index) => (
                        <section key={section._id || `${section.type}-${index}`} className='scroll-mt-24'>
                            {renderSection(section)}
                        </section>
                    ))}
                </div>
            </div>
        </div>
    );
};

PageRenderer.propTypes = {
    page: PropTypes.shape({
        title: PropTypes.string,
        description: PropTypes.string,
        sections: PropTypes.arrayOf(
            PropTypes.shape({
                _id: PropTypes.string,
                type: PropTypes.string,
                order: PropTypes.number,
            })
        ),
    }),
    compact: PropTypes.bool,
};

export default PageRenderer;
