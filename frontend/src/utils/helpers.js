import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(dateString, formatStr = 'MMM d, yyyy') {
  if (!dateString) return '';
  try {
    return format(parseISO(dateString), formatStr);
  } catch (error) {
    return dateString;
  }
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

