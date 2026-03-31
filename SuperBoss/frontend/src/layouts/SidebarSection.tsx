import type { PropsWithChildren } from 'react';
import { cn } from '../lib/cn';

type SidebarSectionProps = PropsWithChildren<{
  title: string;
  eyebrow?: string;
  collapsed?: boolean;
  className?: string;
}>;

export function SidebarSection({
  title,
  eyebrow,
  collapsed = false,
  className,
  children
}: SidebarSectionProps) {
  return (
    <section
      className={cn(
        'rounded-[1.55rem] border border-white/10 bg-white/[0.05] shadow-[0_18px_50px_rgba(0,0,0,0.2)] backdrop-blur-xl',
        collapsed ? 'p-3' : 'p-4',
        className
      )}
    >
      {!collapsed ? (
        <div className="mb-4">
          {eyebrow ? <p className="text-[0.68rem] font-semibold uppercase tracking-[0.22em] text-[#8ae6d9]">{eyebrow}</p> : null}
          <h3 className={cn('font-semibold text-white', eyebrow ? 'mt-3 text-base' : 'text-sm uppercase tracking-[0.18em] text-slate-300')}>
            {title}
          </h3>
        </div>
      ) : null}
      {children}
    </section>
  );
}
