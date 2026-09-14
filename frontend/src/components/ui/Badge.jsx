import React from 'react';
import { clsx } from 'clsx';

const statusColors = {
  // Batch statuses
  draft: 'bg-gray-100 text-gray-600',
  submitted: 'bg-blue-100 text-blue-700',
  assessment_pending: 'bg-yellow-100 text-yellow-700',
  assessment_complete: 'bg-sky-100 text-sky-700',
  decision_ready: 'bg-purple-100 text-purple-700',
  available: 'bg-emerald-100 text-emerald-700',
  matched: 'bg-teal-100 text-teal-700',
  in_procurement: 'bg-orange-100 text-orange-700',
  confirmed: 'bg-forest/10 text-forest',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-600',
  // Demand statuses
  open: 'bg-emerald-100 text-emerald-700',
  matching: 'bg-blue-100 text-blue-700',
  partially_matched: 'bg-yellow-100 text-yellow-700',
  fully_matched: 'bg-green-100 text-green-800',
  pending_confirmation: 'bg-orange-100 text-orange-700',
  closed: 'bg-gray-100 text-gray-600',
  // Lot statuses
  proposed: 'bg-blue-100 text-blue-700',
  pending_review: 'bg-yellow-100 text-yellow-700',
  rejected: 'bg-red-100 text-red-600',
  partially_confirmed: 'bg-orange-100 text-orange-700',
  // Verification
  unverified: 'bg-gray-100 text-gray-500',
  pending: 'bg-yellow-100 text-yellow-700',
  verified: 'bg-emerald-100 text-emerald-700',
  // Decision
  SELL: 'bg-blue-100 text-blue-700',
  STORE: 'bg-amber-100 text-amber-700',
  PROCESS: 'bg-forest/10 text-forest',
  // Risk
  low: 'bg-emerald-100 text-emerald-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-600',
  critical: 'bg-red-200 text-red-800',
  // Demo
  demo: 'bg-gold/20 text-gold-dark border border-gold/30',
};

const statusLabels = {
  assessment_pending: 'Assessment Pending',
  assessment_complete: 'Assessment Complete',
  decision_ready: 'Decision Ready',
  in_procurement: 'In Procurement',
  partially_matched: 'Partially Matched',
  fully_matched: 'Fully Matched',
  pending_confirmation: 'Pending Confirmation',
  partially_confirmed: 'Partially Confirmed',
  pending_review: 'Pending Review',
};

const Badge = ({ status, label, size = 'sm', className = '' }) => {
  const key = status?.toLowerCase?.()?.replace(/ /g, '_') || status;
  const colorClass = statusColors[key] || 'bg-gray-100 text-gray-600';
  const displayLabel = label || statusLabels[key] || status?.replace(/_/g, ' ')?.replace(/\b\w/g, l => l.toUpperCase());

  const sizes = {
    xs: 'text-xs px-1.5 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1.5',
  };

  return (
    <span className={clsx('inline-flex items-center font-medium rounded-full capitalize', colorClass, sizes[size], className)}>
      {displayLabel}
    </span>
  );
};

export default Badge;
