import React from 'react';
import { clsx } from 'clsx';

export const LoadingSkeletonLine = ({ className = '' }) => (
  <div className={clsx('animate-pulse bg-cream-darker rounded', className)} />
);

export const LoadingSkeletonCard = () => (
  <div className="bg-white rounded-2xl p-6 shadow-card animate-pulse">
    <div className="flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-cream-darker flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-4 bg-cream-darker rounded w-3/4" />
        <div className="h-3 bg-cream-darker rounded w-1/2" />
      </div>
      <div className="h-6 w-16 bg-cream-darker rounded-full" />
    </div>
    <div className="mt-4 space-y-2">
      <div className="h-3 bg-cream-darker rounded w-full" />
      <div className="h-3 bg-cream-darker rounded w-4/5" />
      <div className="h-3 bg-cream-darker rounded w-2/3" />
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-8 w-24 bg-cream-darker rounded-xl" />
      <div className="h-8 w-20 bg-cream-darker rounded-xl" />
    </div>
  </div>
);

export const LoadingSkeletonTable = ({ rows = 5 }) => (
  <div className="bg-white rounded-2xl shadow-card overflow-hidden">
    <div className="p-4 border-b border-cream-dark">
      <div className="h-5 bg-cream-darker rounded w-1/4 animate-pulse" />
    </div>
    <div className="divide-y divide-cream-dark">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
          <div className="h-4 bg-cream-darker rounded w-24" />
          <div className="h-4 bg-cream-darker rounded w-32 flex-1" />
          <div className="h-4 bg-cream-darker rounded w-20" />
          <div className="h-6 bg-cream-darker rounded-full w-16" />
          <div className="h-8 bg-cream-darker rounded-lg w-20" />
        </div>
      ))}
    </div>
  </div>
);

export const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8', xl: 'h-12 w-12' };
  return (
    <svg className={clsx('animate-spin text-forest', sizes[size], className)} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
};

const LoadingSkeleton = ({ count = 3, variant = 'card' }) => {
  if (variant === 'table') return <LoadingSkeletonTable rows={count} />;
  return (
    <div className="grid gap-4">
      {Array.from({ length: count }).map((_, i) => <LoadingSkeletonCard key={i} />)}
    </div>
  );
};

export default LoadingSkeleton;
