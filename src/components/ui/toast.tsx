'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { CheckCircleIcon, AlertTriangleIcon, CloseIcon } from './icons';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  warning: (message: string, title?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    ({ type, title, message, duration = 3500 }: Omit<ToastItem, 'id'>) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);
    },
    []
  );

  const success = useCallback((message: string, title?: string) => addToast({ type: 'success', message, title }), [addToast]);
  const error = useCallback((message: string, title?: string) => addToast({ type: 'error', message, title }), [addToast]);
  const info = useCallback((message: string, title?: string) => addToast({ type: 'info', message, title }), [addToast]);
  const warning = useCallback((message: string, title?: string) => addToast({ type: 'warning', message, title }), [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, info, warning }}>
      {children}
      {/* Toast Viewport */}
      <div className="fixed bottom-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => removeToast(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: ToastItem; onClose: () => void }) {
  useEffect(() => {
    if (!toast.duration) return;
    const timer = setTimeout(onClose, toast.duration);
    return () => clearTimeout(timer);
  }, [toast.duration, onClose]);

  const config = {
    success: {
      bg: 'bg-emerald-950/90 border-emerald-500/40 text-emerald-100',
      icon: <CheckCircleIcon size={20} className="text-emerald-400 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-950/90 border-rose-500/40 text-rose-100',
      icon: <AlertTriangleIcon size={20} className="text-rose-400 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-950/90 border-amber-500/40 text-amber-100',
      icon: <AlertTriangleIcon size={20} className="text-amber-400 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-slate-900/90 border-slate-700 text-slate-100',
      icon: <CheckCircleIcon size={20} className="text-cyan-400 shrink-0 mt-0.5" />,
    },
  }[toast.type];

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-xl backdrop-blur-md animate-in slide-in-from-bottom-5 duration-200 ${config.bg}`}
    >
      {config.icon}
      <div className="flex-1 min-w-0">
        {toast.title && <p className="text-xs font-bold leading-tight tracking-wide">{toast.title}</p>}
        <p className="text-xs text-slate-200 leading-snug mt-0.5">{toast.message}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="text-slate-400 hover:text-white p-0.5 transition rounded-lg hover:bg-white/10 shrink-0"
        aria-label="Fechar notificação"
      >
        <CloseIcon size={14} />
      </button>
    </div>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast deve ser utilizado dentro de um ToastProvider');
  }
  return context;
}
