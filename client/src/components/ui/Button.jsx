import React from 'react';

const Spinner = () => (
  <svg
    className="animate-spin -ml-0.5 mr-2 h-4 w-4 text-current"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
  </svg>
);

const Button = React.forwardRef(
  (
    {
      as: Component = 'button',
      type = 'button',
      variant = 'primary',
      size = 'md',
      isLoading = false,
      disabled = false,
      leftIcon = null,
      rightIcon = null,
      fullWidth = false,
      className = '',
      children,
      ...props
    },
    ref
  ) => {
    const base = [
      'inline-flex items-center justify-center select-none',
      'rounded-radius-md font-medium whitespace-nowrap',
      'transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
    ].join(' ');

    const sizes = {
      sm: 'h-8 px-3 text-sm',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-5 text-base',
    };

    const variants = {
      primary: 'glass-button glass-button--primary focus-visible:outline-none',
      secondary: 'glass-button glass-button--secondary focus-visible:outline-none',
      outline: 'glass-button glass-button--ghost focus-visible:outline-none',
      ghost: 'glass-button glass-button--ghost bg-transparent focus-visible:outline-none',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-300',
      subtle: 'glass-button glass-button--ghost bg-ink-100 text-ink-800 hover:bg-ink-200 focus-visible:outline-none',
    };

    const width = fullWidth ? 'w-full' : '';
    const variantClasses = variants[variant] || variants.primary;
    const sizeClasses = sizes[size] || sizes.md;

    const isButton = Component === 'button' || props.role === 'button';
    const computedDisabled = disabled || isLoading;

    return (
      <Component
        ref={ref}
        type={isButton ? type : undefined}
        className={[base, sizeClasses, variantClasses, width, className].join(' ')}
        aria-busy={isLoading || undefined}
        aria-disabled={!isButton && computedDisabled ? true : undefined}
        disabled={isButton ? computedDisabled : undefined}
        {...props}
      >
        {isLoading && <Spinner />}
        {!isLoading && leftIcon ? <span className="-ml-0.5 mr-2 inline-flex">{leftIcon}</span> : null}
        <span>{children}</span>
        {!isLoading && rightIcon ? <span className="-mr-0.5 ml-2 inline-flex">{rightIcon}</span> : null}
      </Component>
    );
  }
);

Button.displayName = 'Button';

export default Button;
