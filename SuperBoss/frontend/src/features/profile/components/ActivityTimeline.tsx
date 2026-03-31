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
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Profile signals</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Profile activity</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">A concise feed of identity updates, access signals, and recent profile-level events tied to this account.</p>
        </div>
        <div className="hidden rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100 lg:block">
          <ProfileIcon name="activity" className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-8 space-y-5">
        {items.map((item, index) => (
          <div key={`${item.title}-${index}`} className="grid grid-cols-[auto_1fr] gap-4">
            <div className="flex flex-col items-center">
              <div className={`rounded-2xl border px-3 py-2 ${toneStyles[item.tone]}`}>
                <ProfileIcon name={item.tone === 'success' ? 'spark' : item.tone === 'warning' ? 'pulse' : 'activity'} />
              </div>
              {index < items.length - 1 ? <div className="mt-2 h-full w-px bg-gradient-to-b from-white/20 to-transparent" /> : null}
            </div>
            <article className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/16 hover:bg-white/[0.06]">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-white">{item.title}</h4>
                  <p className="mt-2 text-sm leading-6 text-slate-300">{item.description}</p>
                </div>
                <Badge className="px-3 py-1.5">{item.timestamp}</Badge>
              </div>
            </article>
          </div>
        ))}
      </div>
    </section>
  );
}
