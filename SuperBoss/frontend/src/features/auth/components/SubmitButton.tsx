import { cn } from '../../../lib/cn';
import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';

export function SubmitButton({
  children,
  className,
  ...props
}: PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>>) {
  return (
    <button
      className={cn(
        'inline-flex h-12 w-full items-center justify-center rounded-2xl bg-[#163d2c] px-4 text-sm font-semibold text-white shadow-[0_14px_30px_rgba(22,61,44,0.2)] transition hover:bg-[#102f22] disabled:cursor-not-allowed disabled:opacity-60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

