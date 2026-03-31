import type { InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  theme?: 'dark' | 'light';
  labelClassName?: string;
  hintClassName?: string;
};

export function Input({ className, label, hint, theme = 'dark', labelClassName, hintClassName, ...props }: InputProps) {
  const isLight = theme === 'light';

  return (
    <label className={cn('flex flex-col gap-2 text-sm font-medium', isLight ? 'text-slate-600' : 'text-slate-200', labelClassName)}>
      {label ? <span>{label}</span> : null}
      <input
        className={cn(
          isLight
            ? 'h-11 rounded-xl border border-[#d8e3d7] bg-white px-3 text-sm text-[#10241a] outline-none transition placeholder:text-slate-400 focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15'
            : 'h-11 rounded-xl border border-white/15 bg-white px-3 text-sm text-[#10241a] outline-none transition placeholder:text-slate-400 focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15',
          className
        )}
        {...props}
      />
      {hint ? (
        <span className={cn('text-xs font-normal', isLight ? 'text-slate-500' : 'text-slate-300', hintClassName)}>{hint}</span>
      ) : null}
    </label>
  );
}
