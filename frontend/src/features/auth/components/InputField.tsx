import { cn } from '../../../lib/cn';
import type { InputHTMLAttributes } from 'react';

export function InputField({
  label,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <input
        className={cn(
          'h-12 rounded-2xl border bg-white px-4 text-sm text-[#10241a] outline-none transition placeholder:text-slate-400',
          error
            ? 'border-rose-300 focus:border-rose-400 focus:ring-4 focus:ring-rose-100'
            : 'border-[#d8e3d7] focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100',
          className
        )}
        {...props}
      />
      {error ? <span className="text-xs font-medium text-rose-600">{error}</span> : null}
      {!error && hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

