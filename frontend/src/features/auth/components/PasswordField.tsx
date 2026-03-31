import { useId, useState, type InputHTMLAttributes } from 'react';
import { cn } from '../../../lib/cn';

export function PasswordField({
  label,
  error,
  hint,
  className,
  theme = 'light',
  labelClassName,
  hintClassName,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  label: string;
  error?: string;
  hint?: string;
  theme?: 'light' | 'dark';
  labelClassName?: string;
  hintClassName?: string;
}) {
  const [visible, setVisible] = useState(false);
  const inputId = useId();
  const isDark = theme === 'dark';

  return (
    <label
      className={cn(
        'flex flex-col gap-2 text-sm font-medium',
        isDark ? 'text-slate-200' : 'text-slate-700',
        labelClassName
      )}
      htmlFor={inputId}
    >
      <span>{label}</span>
      <div
        className={cn(
          'flex h-12 items-center rounded-2xl border px-4 transition',
          isDark
            ? error
              ? 'border-rose-400/40 bg-white focus-within:border-rose-300 focus-within:ring-4 focus-within:ring-rose-500/10'
              : 'border-white/15 bg-white focus-within:border-[#8f9cff] focus-within:ring-4 focus-within:ring-[#8f9cff]/15'
            : error
              ? 'border-rose-300 bg-white focus-within:border-rose-400 focus-within:ring-4 focus-within:ring-rose-100'
              : 'border-[#d8e3d7] bg-white focus-within:border-emerald-400 focus-within:ring-4 focus-within:ring-emerald-100',
          className
        )}
      >
        <input
          id={inputId}
          className="h-full flex-1 border-0 bg-transparent text-sm text-[#10241a] outline-none placeholder:text-slate-400"
          type={visible ? 'text' : 'password'}
          {...props}
        />
        <button
          type="button"
          className={cn(
            'ml-3 text-xs font-semibold uppercase tracking-[0.16em] transition',
            isDark ? 'text-slate-500 hover:text-[#10241a]' : 'text-slate-500 hover:text-[#10241a]'
          )}
          onClick={() => setVisible((current) => !current)}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
      {error ? <span className={cn('text-xs font-medium', isDark ? 'text-rose-300' : 'text-rose-600')}>{error}</span> : null}
      {!error && hint ? (
        <span className={cn('text-xs font-normal', isDark ? 'text-slate-300' : 'text-slate-500', hintClassName)}>{hint}</span>
      ) : null}
    </label>
  );
}
