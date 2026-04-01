import { Badge } from '../../../components/ui/Badge';
import type { ActivityItem } from '../profile.types';
import { ProfileIcon } from './ProfileIcon';

const toneStyles = {
  info: 'border-[#b8c4ff]/18 bg-[#b8c4ff]/10 text-[#d6dcff]',
  success: 'border-emerald-300/18 bg-emerald-300/10 text-emerald-100',
  warning: 'border-amber-300/18 bg-amber-300/10 text-amber-100'
};

type ActivityTimelineProps = {
  items: ActivityItem[];
};

export function ActivityTimeline({ items }: ActivityTimelineProps) {
  return (
    <section className="profile-fade-in rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Profile signals</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Profile activity</h3>
          <p className="mt-2 text-[13px] leading-7 text-slate-300/90">A concise feed of identity updates, access signals, and recent profile-level events.</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100 lg:block">
          <span className="text-xl">📡</span>
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[auto_1fr] gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-2xl border px-3 py-2 transition-transform duration-200 hover:scale-105 ${toneStyles[item.tone]}`}>
                <ProfileIcon name={item.tone === 'success' ? 'spark' : item.tone === 'warning' ? 'pulse' : 'activity'} />
              </div>
              {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent" /> : null}
            </div>
            <article className="group rounded-[1.45rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-[15px] font-semibold text-white">{item.title}</h4>
                  <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300/80">{item.description}</p>
                </div>
                <Badge className="shrink-0 px-3 py-1.5 text-[11px]">{item.timestamp}</Badge>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
