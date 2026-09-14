import React from 'react';
import { clsx } from 'clsx';

const Input = React.forwardRef(({
  label,
  error,
  helper,
  type = 'text',
  fullWidth = true,
  required = false,
  className = '',
  containerClassName = '',
  prefix,
  suffix,
  ...props
}, ref) => {
  return (
    <div className={clsx('flex flex-col gap-1.5', fullWidth && 'w-full', containerClassName)}>
      {label && (
        <label className="text-sm font-medium text-charcoal">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {prefix && (
          <div className="absolute left-3 flex items-center text-charcoal-lighter text-sm">
            {prefix}
          </div>
        )}
        <input
          ref={ref}
          type={type}
          className={clsx(
            'w-full border rounded-xl px-4 py-2.5 text-sm text-charcoal bg-white',
            'placeholder:text-charcoal-lighter/60',
            'transition-colors duration-200',
            'focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest',
            error
              ? 'border-red-400 focus:ring-red-200 focus:border-red-400'
              : 'border-cream-darker hover:border-leaf-light',
            prefix && 'pl-10',
            suffix && 'pr-10',
            className
          )}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center text-charcoal-lighter text-sm">
            {suffix}
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-500 flex items-center gap-1">{error}</p>}
      {helper && !error && <p className="text-xs text-charcoal-lighter">{helper}</p>}
    </div>
  );
});
Input.displayName = 'Input';

export default Input;
