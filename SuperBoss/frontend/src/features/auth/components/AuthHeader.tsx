import type { ReactNode } from 'react';

export function AuthHeader({
  label,
  title,
  description,
  brandSlot
}: {
  label: string;
  title: string;
  description: string;
  brandSlot?: ReactNode;
}) {
  return (
    <div>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-emerald-700/80">{label}</p>
          <h2 className="mt-3 text-[2rem] font-semibold leading-[1.05] tracking-[-0.04em] text-[#10241a] sm:text-[2.35rem]">
            {title}
          </h2>
        </div>
        {brandSlot ? <div>{brandSlot}</div> : null}
      </div>
      <p className="mt-4 max-w-xl text-sm leading-7 text-slate-500">{description}</p>
    </div>
  );
}

