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
        'surface-panel rounded-[1.45rem]',
        collapsed ? 'p-3' : 'p-4',
        className
      )}
    >
      {!collapsed ? (
        <div className="mb-4">
          {eyebrow ? <p className="eyebrow-label text-[#8ab9ff]">{eyebrow}</p> : null}
          <h3 className={cn('section-heading font-semibold text-white', eyebrow ? 'mt-3 text-[1.02rem]' : 'text-sm uppercase tracking-[0.18em] text-slate-300')}>
            {title}
          </h3>
        </div>
      ) : null}
      {children}
    </section>
  );
}
