import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,#8f9cff_0%,#6ee9d8_100%)] text-[#07111f] shadow-[0_14px_34px_rgba(111,132,255,0.28)] hover:brightness-105 disabled:brightness-95 disabled:saturate-75 disabled:shadow-none',
  secondary:
    'border border-white/12 bg-white/6 text-white hover:bg-white/10 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none',
  ghost:
    'bg-transparent text-slate-200 hover:bg-white/8 hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none'
};

export function Button({
  children,
  className,
  variant = 'primary',
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold transition backdrop-blur-sm disabled:cursor-not-allowed',
        variantClasses[variant],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
