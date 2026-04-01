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
    <section className="profile-fade-in rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Expertise map</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Skills and specialties</h3>
          <p className="mt-2 text-[13px] leading-7 text-slate-300/90">Technical focus, workflow ownership, and collaboration style.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100">
          <span className="text-xl">⚡</span>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2.5">
        {skills.map((skill) => (
          <Badge key={skill} tone="info" className="px-3.5 py-2 text-[13px] font-medium text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_4px_16px_rgba(143,156,255,0.18)]">
            {skill}
          </Badge>
        ))}
      </div>
    </section>
  );
}


export function ProfileCompletenessCard({ score, completedCount, totalCount, items }: ProfileCompletenessCardProps) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <section className="profile-fade-in rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Profile readiness</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Profile completeness</h3>
          <p className="mt-2 text-[13px] leading-7 text-slate-300/90">How complete your public identity card is for teammates and invites.</p>
        </div>
        <div className="relative flex-shrink-0">
          <svg width="88" height="88" className="drop-shadow-lg">
            <circle cx="44" cy="44" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              cx="44" cy="44" r={radius} fill="none"
              stroke="url(#completenessGradient)" strokeWidth="7"
              strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
              className="transition-all duration-700 ease-out"
              style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
            />
            <defs>
              <linearGradient id="completenessGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8f9cff" />
                <stop offset="100%" stopColor="#6ee9d8" />
              </linearGradient>
            </defs>
            <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-white text-lg font-bold">{score}%</text>
          </svg>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-sm text-slate-300">{completedCount} of {totalCount} profile signals completed.</p>
      </div>

      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className={`group flex items-center gap-3 rounded-[1.35rem] border px-4 py-3 transition-all duration-200 ${item.complete ? 'border-emerald-300/16 bg-emerald-300/10 hover:bg-emerald-300/14' : 'border-white/[0.07] bg-white/[0.04] hover:bg-white/[0.07]'}`}>
            <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${item.complete ? 'bg-emerald-400/20 text-emerald-300' : 'bg-white/10 text-slate-500'}`}>
              {item.complete ? '✓' : '○'}
            </span>
            <p className="flex-1 text-sm font-medium text-white">{item.label}</p>
            <Badge tone={item.complete ? 'success' : 'neutral'} className="text-[10px]">{item.complete ? 'Added' : 'Missing'}</Badge>
          </div>
        ))}
      </div>
    </section>
  );
}

export function AccountStatusCard({ items }: AccountStatusCardProps) {
  return (
    <section className="profile-fade-in rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">Account security</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">Settings snapshot</h3>
          <p className="mt-2 text-[13px] leading-7 text-slate-300/90">Access health, trust signals, and account safety posture.</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100">
          <span className="text-xl">🛡️</span>
        </div>
      </div>

      <div className="mt-6 space-y-2.5">
        {items.map((item) => (
          <article key={item.label} className={`group rounded-[1.45rem] border p-4 transition-all duration-200 hover:scale-[1.005] ${toneClasses[item.tone]}`}>
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs uppercase tracking-[0.18em] text-slate-300">{item.label}</p>
              <p className="text-sm font-bold text-white">{item.value}</p>
            </div>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-300/80">{item.supporting}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
