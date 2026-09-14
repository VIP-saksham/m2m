import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

const icons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
};

const colors = {
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
};

const iconColors = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  warning: 'text-amber-500',
  info: 'text-blue-500',
};

export const ToastItem = ({ id, type = 'info', title, message, onDismiss, duration = 4000 }) => {
  const Icon = icons[type];

  useEffect(() => {
    const timer = setTimeout(() => onDismiss(id), duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 50, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.95 }}
      className={`flex items-start gap-3 px-4 py-3 rounded-xl border shadow-lg max-w-sm w-full ${colors[type]}`}
    >
      <Icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${iconColors[type]}`} />
      <div className="flex-1 min-w-0">
        {title && <p className="font-semibold text-sm">{title}</p>}
        {message && <p className="text-sm opacity-80">{message}</p>}
      </div>
      <button onClick={() => onDismiss(id)} className="flex-shrink-0 opacity-60 hover:opacity-100 transition-opacity">
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

const ToastContainer = ({ toasts, onDismiss }) => (
  <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
    <AnimatePresence mode="popLayout">
      {toasts.map((t) => (
        <ToastItem key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);

export default ToastContainer;
