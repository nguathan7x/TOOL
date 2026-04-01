import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren<ButtonHTMLAttributes<HTMLButtonElement>> & {
  variant?: ButtonVariant;
  fullWidth?: boolean;
};

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-[linear-gradient(135deg,#7f97ff_0%,#7ae7cf_100%)] text-[#07111f] shadow-[0_16px_38px_rgba(111,132,255,0.28)] hover:-translate-y-[1px] hover:brightness-105 disabled:translate-y-0 disabled:brightness-95 disabled:saturate-75 disabled:shadow-none',
  secondary:
    'border border-white/10 bg-white/[0.05] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] hover:-translate-y-[1px] hover:border-white/16 hover:bg-white/[0.08] disabled:translate-y-0 disabled:border-slate-300 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none',
  ghost:
    'bg-transparent text-slate-200 hover:bg-white/[0.06] hover:text-white disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none'
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
        'inline-flex h-11 items-center justify-center rounded-[0.95rem] px-4 text-sm font-semibold tracking-[-0.01em] transition-all duration-200 backdrop-blur-sm disabled:cursor-not-allowed',
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
