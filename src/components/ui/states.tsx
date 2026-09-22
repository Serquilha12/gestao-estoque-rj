import React from 'react';
import { AlertTriangleIcon, CheckCircleIcon, SpinnerIcon } from './icons';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center p-8 text-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 ${className}`}
    >
      {icon && <div className="mb-3 text-slate-400 p-3 bg-white rounded-2xl shadow-xs border border-slate-100">{icon}</div>}
      <h4 className="text-base font-bold text-slate-800">{title}</h4>
      {description && <p className="mt-1 text-xs text-slate-500 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface AlertBannerProps {
  type?: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: React.ReactNode;
  onClose?: () => void;
  className?: string;
}

export function AlertBanner({
  type = 'info',
  title,
  message,
  onClose,
  className = '',
}: AlertBannerProps) {
  const styles: Record<string, { bg: string; border: string; text: string; icon: React.ReactNode }> = {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-900',
      icon: <CheckCircleIcon size={18} className="text-emerald-600 shrink-0 mt-0.5" />,
    },
    error: {
      bg: 'bg-rose-50',
      border: 'border-rose-200',
      text: 'text-rose-900',
      icon: <AlertTriangleIcon size={18} className="text-rose-600 shrink-0 mt-0.5" />,
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-900',
      icon: <AlertTriangleIcon size={18} className="text-amber-600 shrink-0 mt-0.5" />,
    },
    info: {
      bg: 'bg-sky-50',
      border: 'border-sky-200',
      text: 'text-sky-900',
      icon: <CheckCircleIcon size={18} className="text-sky-600 shrink-0 mt-0.5" />,
    },
  };

  const current = styles[type];

  return (
    <div
      className={`flex items-start justify-between gap-3 rounded-xl border p-4 text-xs ${current.bg} ${current.border} ${current.text} ${className}`}
    >
      <div className="flex items-start gap-2.5">
        {current.icon}
        <div>
          {title && <p className="font-bold text-sm mb-0.5">{title}</p>}
          <div className="font-medium leading-relaxed">{message}</div>
        </div>
      </div>
      {onClose && (
        <button
          onClick={onClose}
          type="button"
          className="text-slate-400 hover:text-slate-700 transition"
        >
          ✕
        </button>
      )}
    </div>
  );
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`} />;
}

export function LoadingSpinner({ text = 'A carregar...', size = 20 }: { text?: string; size?: number }) {
  return (
    <div className="flex items-center justify-center gap-2.5 p-6 text-slate-500 text-xs font-semibold">
      <SpinnerIcon size={size} className="text-emerald-700" />
      <span>{text}</span>
    </div>
  );
}
