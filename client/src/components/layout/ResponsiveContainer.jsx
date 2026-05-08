import PropTypes from 'prop-types';

const widthClasses = {
    default: 'workspace-page__content',
    tight: 'workspace-page__content workspace-page__content--tight',
    story: 'workspace-page__content workspace-page__content--story',
    wide: 'workspace-page__content workspace-page__content--wide',
    xl: 'workspace-page__content workspace-page__content--xl',
    post: 'workspace-page__content workspace-page__content--post',
};

const gutterClasses = {
    none: '',
    page: 'px-4 sm:px-6 lg:px-8',
    article: 'px-4 sm:px-6 lg:px-10',
    compact: 'px-3 sm:px-4',
};

const spacingClasses = {
    none: '',
    page: 'py-8 sm:py-10 lg:py-12',
    article: 'py-8 sm:py-10',
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
    width: PropTypes.oneOf(['default', 'tight', 'story', 'wide', 'xl', 'post']),
    gutters: PropTypes.oneOf(['none', 'page', 'article', 'compact']),
    spacing: PropTypes.oneOf(['none', 'page', 'article']),
    className: PropTypes.string,
    children: PropTypes.node,
};
