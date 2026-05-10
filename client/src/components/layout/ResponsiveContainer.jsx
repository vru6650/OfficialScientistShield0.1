import PropTypes from 'prop-types';

const widthClasses = {
    default: 'workspace-page__content',
    tight: 'workspace-page__content workspace-page__content--tight',
    story: 'workspace-page__content workspace-page__content--story',
    wide: 'workspace-page__content workspace-page__content--wide',
    xl: 'workspace-page__content workspace-page__content--xl',
    post: 'workspace-page__content workspace-page__content--post',
    full: 'workspace-page__content workspace-page__content--full',
};

const gutterClasses = {
    none: '',
    page: 'responsive-gutters',
    article: 'responsive-gutters responsive-gutters--article',
    compact: 'responsive-gutters responsive-gutters--compact',
};

const spacingClasses = {
    none: '',
    page: 'responsive-section',
    article: 'responsive-section responsive-section--article',
    compact: 'responsive-section responsive-section--compact',
};

export default function ResponsiveContainer({
    as: Component = 'div',
    width = 'default',
    gutters = 'page',
    spacing = 'none',
    className = '',
    children,
    ...props
}) {
    const classes = [
        'responsive-container',
        widthClasses[width] || widthClasses.default,
        gutterClasses[gutters] || '',
        spacingClasses[spacing] || '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <Component className={classes} {...props}>
            {children}
        </Component>
    );
}

ResponsiveContainer.propTypes = {
    as: PropTypes.elementType,
    width: PropTypes.oneOf(['default', 'tight', 'story', 'wide', 'xl', 'post', 'full']),
    gutters: PropTypes.oneOf(['none', 'page', 'article', 'compact']),
    spacing: PropTypes.oneOf(['none', 'page', 'article', 'compact']),
    className: PropTypes.string,
    children: PropTypes.node,
};
