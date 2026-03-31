import { cn } from '../../../lib/cn';

type LogoMarkProps = {
  className?: string;
  compact?: boolean;
};

export function LogoMark({ className, compact = false }: LogoMarkProps) {
  return (
    <div
      className={cn(
        'relative inline-flex items-center gap-3 rounded-[1.4rem] border border-white/10 bg-white/8 px-3 py-3 shadow-[0_20px_50px_rgba(0,0,0,0.22)] backdrop-blur-md',
        compact && 'gap-2 rounded-[1.2rem] px-2.5 py-2.5',
        className
      )}
    >
      <div className={cn('relative flex h-11 w-11 items-center justify-center rounded-[1rem] bg-[linear-gradient(135deg,#b8c4ff_0%,#76e8d6_52%,#17253f_100%)]', compact && 'h-9 w-9 rounded-[0.85rem]')}>
        <div className="absolute inset-[1px] rounded-[calc(1rem-1px)] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.7),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.02))]" />
        <div className={cn('relative h-6 w-6 rounded-[0.7rem] border border-white/35 bg-[rgba(7,14,30,0.36)]', compact && 'h-5 w-5 rounded-[0.55rem]')}>
          <div className="absolute inset-x-[3px] top-[5px] h-[2px] rounded-full bg-white/85" />
          <div className="absolute inset-x-[3px] top-[10px] h-[2px] rounded-full bg-white/66" />
          <div className="absolute inset-x-[3px] top-[15px] h-[2px] rounded-full bg-white/48" />
        </div>
      </div>
      <div className={cn('leading-none', compact && 'hidden sm:block')}>
        <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/60">SuperBoss</p>
        <p className="mt-1 text-sm font-semibold tracking-[-0.02em] text-white">Constellation OS</p>
      </div>
    </div>
  );
}

