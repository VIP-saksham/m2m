import React from 'react';
import { clsx } from 'clsx';

const Card = ({ children, className = '', variant = 'default', hover = false, onClick }) => {
  const variants = {
    default: 'bg-white border border-cream-darker shadow-card',
    elevated: 'bg-white shadow-card-hover',
    glass: 'bg-white/70 backdrop-blur-md border border-white/50 shadow-card',
    cream: 'bg-cream border border-cream-dark shadow-card',
    green: 'bg-forest text-white shadow-green',
    outline: 'bg-white border-2 border-forest/20',
  };
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl',
        variants[variant],
        hover && 'transition-all duration-200 hover:shadow-card-hover hover:-translate-y-0.5',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {children}
    </div>
  );
};

Card.Header = ({ children, className = '' }) => (
  <div className={clsx('px-6 py-4 border-b border-cream-dark', className)}>{children}</div>
);
Card.Body = ({ children, className = '' }) => (
  <div className={clsx('p-6', className)}>{children}</div>
);
Card.Footer = ({ children, className = '' }) => (
  <div className={clsx('px-6 py-4 border-t border-cream-dark bg-cream/50 rounded-b-2xl', className)}>{children}</div>
);

export default Card;
