import React from 'react';
import { clsx } from 'clsx';

const Select = React.forwardRef(({
  label,
  error,
  helper,
  options = [],
  placeholder = 'Select...',
  required = false,
  fullWidth = true,
  className = '',
  containerClassName = '',
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
      <div className="relative">
        <select
          ref={ref}
          className={clsx(
            'w-full border rounded-xl px-4 py-2.5 text-sm text-charcoal bg-white appearance-none',
            'transition-colors duration-200 cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-forest/30 focus:border-forest',
            error
              ? 'border-red-400 focus:ring-red-200'
              : 'border-cream-darker hover:border-leaf-light',
            className
          )}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map((opt) =>
            typeof opt === 'string'
              ? <option key={opt} value={opt}>{opt}</option>
              : <option key={opt.value} value={opt.value}>{opt.label}</option>
          )}
        </select>
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-charcoal-lighter">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
      {helper && !error && <p className="text-xs text-charcoal-lighter">{helper}</p>}
    </div>
  );
});
Select.displayName = 'Select';

export default Select;
