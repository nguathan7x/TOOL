import type { PropsWithChildren, ReactNode } from 'react';
import { cn } from '../../lib/cn';

type DrawerProps = PropsWithChildren<{
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  footer?: ReactNode;
  eyebrow?: string;
}>;

export function Drawer({ open, onClose, title, subtitle, footer, eyebrow = 'Panel', children }: DrawerProps) {
  return (
    <div className={cn('fixed inset-0 z-40 transition', open ? 'pointer-events-auto' : 'pointer-events-none')}>
      <div
        className={cn('absolute inset-0 bg-[#02050d]/70 backdrop-blur-sm transition-opacity', open ? 'opacity-100' : 'opacity-0')}
        onClick={onClose}
      />
      <aside
        className={cn(
          'absolute right-0 top-0 flex h-full w-full max-w-[44rem] flex-col border-l border-white/10 bg-[linear-gradient(180deg,rgba(10,16,28,0.96)_0%,rgba(7,11,20,0.94)_100%)] text-white shadow-[0_30px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl transition-transform',
          open ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <div className="flex items-start justify-between border-b border-white/10 px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-[#b8c4ff]">{eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">{title}</h2>
            {subtitle ? <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-200">{subtitle}</p> : null}
          </div>
          <button
            type="button"
            className="rounded-2xl px-3 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/8 hover:text-white"
            onClick={onClose}
          >
            Close
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-6">{children}</div>
        {footer ? <div className="border-t border-white/10 px-6 py-4">{footer}</div> : null}
      </aside>
    </div>
  );
}
