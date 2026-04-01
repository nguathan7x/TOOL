import type { ReactNode } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { cn } from '../../../lib/cn';
import type { PersonalInfoItem, WorkInfoItem } from '../profile.types';
import { ProfileIcon } from './ProfileIcon';

type PersonalInfoCardProps = {
  bio: string;
  items: PersonalInfoItem[];
};

type ProfessionalIdentityCardProps = {
  items: WorkInfoItem[];
};

function SectionFrame({ eyebrow, title, description, icon, children }: { eyebrow: string; title: string; description: string; icon?: string; children: ReactNode }) {
  return (
    <section className="profile-fade-in rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] transition-all duration-300 hover:shadow-[0_24px_70px_rgba(0,0,0,0.28)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">{eyebrow}</p>
          <h3 className="mt-3 text-2xl font-bold tracking-tight text-white">{title}</h3>
          <p className="mt-2 text-[13px] leading-7 text-slate-300/90">{description}</p>
        </div>
        {icon && (
          <div className="hidden rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-100 lg:block">
            <span className="text-xl">{icon}</span>
          </div>
        )}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  );
}

export function PersonalInfoCard({ bio, items }: PersonalInfoCardProps) {
  return (
    <SectionFrame
      eyebrow="Personal dossier"
      title="Personal information"
      description="A polished identity snapshot for teammates, invites, and workspace collaboration."
      icon="👤"
    >
      <div className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
        <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-[#b8c4ff]/10 to-transparent blur-2xl" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bio</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{bio}</p>
          </div>
          <Badge tone="info" className="hidden shrink-0 px-3 py-1.5 md:inline-flex">Visible to teammates</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="group rounded-[1.5rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07] hover:-translate-y-0.5 hover:shadow-[0_12px_40px_rgba(0,0,0,0.16)]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/8 p-2 text-slate-200 transition-colors group-hover:border-[#b8c4ff]/20 group-hover:bg-[#b8c4ff]/10">
                <ProfileIcon name={item.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-1.5 text-sm font-semibold text-white">{item.value}</p>
                {item.supporting ? <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{item.supporting}</p> : null}
              </div>
            </div>
          </article>
        ))}
      </div>
    </SectionFrame>
  );
}

export function ProfessionalIdentityCard({ items }: ProfessionalIdentityCardProps) {
  return (
    <SectionFrame
      eyebrow="Professional identity"
      title="Professional identity"
      description="A concise view of your operating role, collaboration context, and the professional signals teammates rely on."
      icon="💼"
    >
      <div className="space-y-2.5">
        {items.map((item) => (
          <div key={item.label} className="group rounded-[1.45rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/16 hover:bg-white/[0.07]">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-2 text-slate-100 transition-colors group-hover:border-[#8ae6d9]/20 group-hover:bg-[#8ae6d9]/10">
                <ProfileIcon name={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <span className="text-sm font-bold text-white">{item.value}</span>
                </div>
                {item.supporting ? <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">{item.supporting}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
