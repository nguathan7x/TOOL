import { cn } from '../../lib/cn';
import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  hint?: string;
  theme?: 'dark' | 'light';
  labelClassName?: string;
  hintClassName?: string;
};

export function Select({ className, label, hint, children, theme = 'dark', labelClassName, hintClassName, ...props }: SelectProps) {
  const isLight = theme === 'light';

  return (
    <label className={cn('flex flex-col gap-2 text-sm font-medium', isLight ? 'text-slate-600' : 'text-slate-200', labelClassName)}>
      {label ? <span>{label}</span> : null}
      <div className="relative">
        <select
          className={cn(
            isLight
              ? 'h-11 w-full appearance-none rounded-xl border border-[#d8e3d7] bg-white px-3 pr-10 text-sm text-[#10241a] outline-none transition placeholder:text-slate-400 focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15 disabled:cursor-not-allowed disabled:opacity-60'
              : 'h-11 w-full appearance-none rounded-xl border border-white/15 bg-white px-3 pr-10 text-sm text-[#10241a] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] outline-none transition placeholder:text-slate-400 focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15 disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        >
          {children}
        </select>
        <span className={cn('pointer-events-none absolute inset-y-0 right-3 flex items-center', isLight ? 'text-slate-500' : 'text-slate-500')}>
          <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4" aria-hidden="true">
            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
      </div>
      {hint ? (
        <span className={cn('text-xs font-normal', isLight ? 'text-slate-500' : 'text-slate-300', hintClassName)}>{hint}</span>
      ) : null}
    </label>
  );
}
