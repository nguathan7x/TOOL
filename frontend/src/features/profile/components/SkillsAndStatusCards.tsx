import { Badge } from '../../../components/ui/Badge';
import type { AccountStatusItem, ProfileCompletenessItem } from '../profile.types';
import { ProfileIcon } from './ProfileIcon';

const toneClasses = {
  success: 'border-emerald-300/16 bg-emerald-300/10',
  warning: 'border-amber-300/16 bg-amber-300/10',
  neutral: 'border-white/10 bg-white/6'
};


type ProfileCompletenessCardProps = {
  score: number;
  completedCount: number;
  totalCount: number;
  items: ProfileCompletenessItem[];
};

type SkillsCardProps = {
  skills: string[];
};

type AccountStatusCardProps = {
  items: AccountStatusItem[];
};

export function SkillsCard({ skills }: SkillsCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Expertise map</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Skills and specialties</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">A compact tag system for technical focus, workflow ownership, and collaboration style.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100">
          <ProfileIcon name="spark" className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        {skills.map((skill) => (
          <Badge key={skill} tone="info" className="px-3 py-2 text-sm font-medium text-white">
            {skill}
          </Badge>
        ))}
      </div>
    </section>
  );
}


export function ProfileCompletenessCard({ score, completedCount, totalCount, items }: ProfileCompletenessCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Profile readiness</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Profile completeness</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">A lightweight signal showing how complete your public identity card is for teammates and invites.</p>
        </div>
        <div className="rounded-2xl border border-emerald-300/18 bg-emerald-300/10 px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-emerald-100/80">Ready score</p>
          <p className="mt-1 text-2xl font-semibold text-white">{score}%</p>
        </div>
      </div>

      <div className="mt-6">
        <div className="h-2 rounded-full bg-white/10">
          <div className="h-2 rounded-full bg-[linear-gradient(90deg,#8f9cff_0%,#6ee9d8_100%)]" style={{ width: `${score}%` }} />
        </div>
        <p className="mt-3 text-sm text-slate-300">{completedCount} of {totalCount} profile signals completed.</p>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={`rounded-[1.35rem] border px-4 py-3 ${item.complete ? 'border-emerald-300/16 bg-emerald-300/10' : 'border-white/10 bg-white/[0.04]'}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-white">{item.label}</p>
              <Badge tone={item.complete ? 'success' : 'neutral'}>{item.complete ? 'Added' : 'Missing'}</Badge>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AccountStatusCard({ items }: AccountStatusCardProps) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Account security</p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">Settings snapshot</h3>
          <p className="mt-2 text-sm leading-7 text-slate-300">A concise overview of access health, trust signals, and account safety posture.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100">
          <ProfileIcon name="shield" className="h-5 w-5" />
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {items.map((item) => (
          <article key={item.label} className={`rounded-[1.45rem] border p-4 ${toneClasses[item.tone]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
              <p className="text-sm font-semibold text-white">{item.value}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-300">{item.supporting}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
