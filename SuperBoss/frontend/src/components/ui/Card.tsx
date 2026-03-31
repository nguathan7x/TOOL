import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-3xl border border-white/10 bg-[linear-gradient(180deg,rgba(13,20,34,0.86)_0%,rgba(10,16,28,0.82)_100%)] p-6 text-white shadow-[0_20px_60px_rgba(0,0,0,0.24)] backdrop-blur-xl',
        className
      )}
    >
      {children}
    </div>
  );
}



