import React from 'react';
import { clsx } from 'clsx';

const variants = {
  primary: 'bg-forest hover:bg-forest-dark text-white shadow-green hover:shadow-lg',
  secondary: 'bg-white border-2 border-forest text-forest hover:bg-cream',
  danger: 'bg-red-600 hover:bg-red-700 text-white',
  ghost: 'bg-transparent text-forest hover:bg-cream border border-transparent',
  gold: 'bg-gold hover:bg-gold-dark text-white',
  outline: 'bg-transparent border border-charcoal-lighter text-charcoal hover:bg-cream',
};

const sizes = {
  xs: 'px-3 py-1.5 text-xs',
  sm: 'px-4 py-2 text-sm',
  md: 'px-5 py-2.5 text-sm',
  lg: 'px-6 py-3 text-base',
  xl: 'px-8 py-4 text-lg',
};

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  type = 'button',
  ...props
}) => {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
        'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-forest/40 focus:ring-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="h-4 w-4 flex-shrink-0" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="h-4 w-4 flex-shrink-0" />}
        </>
      )}
    </button>
  );
};

export default Button;
