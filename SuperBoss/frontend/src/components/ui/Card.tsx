import type { PropsWithChildren } from 'react';
import { cn } from '../../lib/cn';

type CardProps = PropsWithChildren<{
  className?: string;
}>;

export function Card({ children, className }: CardProps) {
  return (
    <div
      className={cn(
        'surface-panel rounded-[1.75rem] p-6 text-white transition-[border-color,transform,background-color,box-shadow] duration-300 hover:border-white/12',
        className
      )}
    >
      {children}
    </div>
  );
}



