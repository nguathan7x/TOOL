import type { ReactNode } from 'react';

type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  actions?: ReactNode;
};

export function PageHeader({ eyebrow, title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,18,32,0.9)_0%,rgba(10,14,25,0.86)_100%)] px-6 py-6 text-white shadow-[0_24px_70px_rgba(0,0,0,0.26)] backdrop-blur-xl lg:flex-row lg:items-end lg:justify-between">
      <div>
        {eyebrow ? <p className="text-xs uppercase tracking-[0.18em] text-[#b8c4ff]">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-white">{title}</h1>
        {subtitle ? <p className="mt-2 max-w-3xl text-sm leading-7 text-slate-200">{subtitle}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-3">{actions}</div> : null}
    </div>
  );
}




