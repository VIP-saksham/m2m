import React, { createContext, useContext, useState, useCallback } from 'react';
import ToastContainer from '../components/ui/Toast';

const ToastContext = createContext(null);

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = useCallback((type, title, message, duration) => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, type, title, message, duration }]);
    return id;
  }, []);

  const success = useCallback((title, message) => toast('success', title, message), [toast]);
  const error = useCallback((title, message) => toast('error', title, message), [toast]);
  const warning = useCallback((title, message) => toast('warning', title, message), [toast]);
  const info = useCallback((title, message) => toast('info', title, message), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};
