import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = 'neutral', children, className = '', ...props }: BadgeProps) {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-600/10',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-600/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-600/10',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-600/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-600/10',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold tracking-wide ring-1 ring-inset ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
}
