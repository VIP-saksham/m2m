import React from 'react';
import Button from './Button';

const EmptyState = ({
  icon,
  title = 'Nothing here yet',
  description,
  action,
  actionLabel,
  onAction,
  actionText,
  className = '',
}) => {
  // Accept both a component (Icon) or a rendered JSX element
  const renderIcon = () => {
    if (!icon) return null;
    if (React.isValidElement(icon)) {
      return (
        <div className="h-16 w-16 rounded-2xl bg-cream flex items-center justify-center mb-4">
          {icon}
        </div>
      );
    }
    const Icon = icon;
    return (
      <div className="h-16 w-16 rounded-2xl bg-cream flex items-center justify-center mb-4">
        <Icon className="h-8 w-8 text-charcoal-lighter" />
      </div>
    );
  };
  return (
  <div className={`flex flex-col items-center justify-center py-16 px-8 text-center ${className}`}>
    {renderIcon()}
    <h3 className="text-lg font-semibold text-charcoal mb-2">{title}</h3>
    {description && <p className="text-sm text-charcoal-lighter max-w-xs mb-6">{description}</p>}
    {(action || onAction) && (
      <Button variant="primary" size="md" onClick={onAction}>
        {actionLabel || actionText || action}
      </Button>
    )}
  </div>
  );
};

export default EmptyState;
