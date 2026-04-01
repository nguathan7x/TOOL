import type { HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'border border-white/10 bg-white/[0.045] text-slate-200',
  success: 'border border-emerald-300/18 bg-emerald-300/10 text-emerald-100',
  warning: 'border border-amber-300/22 bg-amber-300/12 text-amber-100',
  danger: 'border border-rose-300/22 bg-rose-300/12 text-rose-100',
  info: 'border border-[#b8c4ff]/20 bg-[#8fa2ff]/12 text-[#dce4ff]'
};

export function Badge({ tone = 'neutral', className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-[0.72rem] font-semibold tracking-[0.01em] backdrop-blur-sm',
        toneClasses[tone],
        className
      )}
      {...props}
    />
  );
}

