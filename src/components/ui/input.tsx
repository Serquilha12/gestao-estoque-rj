import React from 'react';

export interface FormFieldProps {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  id?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  helperText,
  required,
  id,
  children,
  className = '',
}: FormFieldProps) {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={id} className="block text-xs font-semibold text-slate-700 tracking-wide">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      {children}
      {error ? (
        <p className="text-xs font-medium text-rose-600 flex items-center gap-1 mt-1">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-500 mt-1">{helperText}</p>
      ) : null}
    </div>
  );
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', error, leftIcon, rightIcon, ...props }, ref) => {
    return (
      <div className="relative flex items-center w-full">
        {leftIcon && <div className="absolute left-3.5 text-slate-400 pointer-events-none">{leftIcon}</div>}
        <input
          ref={ref}
          className={`w-full rounded-xl border bg-slate-50/70 text-slate-900 text-sm font-medium transition-all duration-150 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 ${
            leftIcon ? 'pl-10' : 'pl-3.5'
          } ${rightIcon ? 'pr-10' : 'pr-3.5'} py-2.5 ${
            error
              ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
              : 'border-slate-300/90 focus:border-emerald-600 focus:ring-emerald-600/15'
          } ${className}`}
          {...props}
        />
        {rightIcon && <div className="absolute right-3.5 text-slate-400">{rightIcon}</div>}
      </div>
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className = '', error, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={`w-full rounded-xl border bg-slate-50/70 text-slate-900 text-sm font-medium transition-all duration-150 focus:bg-white focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 px-3.5 py-2.5 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300/90 focus:border-emerald-600 focus:ring-emerald-600/15'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = '', error, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-xl border bg-slate-50/70 text-slate-900 text-sm font-medium transition-all duration-150 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-60 p-3.5 ${
          error
            ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/20'
            : 'border-slate-300/90 focus:border-emerald-600 focus:ring-emerald-600/15'
        } ${className}`}
        {...props}
      />
    );
  }
);
Textarea.displayName = 'Textarea';
