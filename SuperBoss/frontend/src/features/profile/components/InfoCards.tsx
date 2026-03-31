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

function SectionFrame({ eyebrow, title, description, children }: { eyebrow: string; title: string; description: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.9rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.88)_0%,rgba(9,15,27,0.84)_100%)] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)]">
      <p className="text-xs uppercase tracking-[0.2em] text-[#b8c4ff]">{eyebrow}</p>
      <h3 className="mt-3 text-2xl font-semibold tracking-tight text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-slate-300">{description}</p>
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
    >
      <div className="rounded-[1.6rem] border border-white/10 bg-white/6 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Bio</p>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{bio}</p>
          </div>
          <Badge tone="info" className="hidden px-3 py-1.5 md:inline-flex">Visible to teammates</Badge>
        </div>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item) => (
          <article key={item.label} className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4 transition hover:border-white/16 hover:bg-white/[0.06]">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-2xl border border-white/10 bg-white/8 p-2 text-slate-200">
                <ProfileIcon name={item.icon} />
              </div>
              <div className="min-w-0">
                <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-white">{item.value}</p>
                {item.supporting ? <p className="mt-2 text-sm leading-6 text-slate-300">{item.supporting}</p> : null}
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
    >
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-[1.45rem] border border-white/10 bg-white/[0.05] p-4 transition hover:border-white/16">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/8 p-2 text-slate-100">
                <ProfileIcon name={item.icon} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{item.label}</p>
                  <span className="text-sm font-semibold text-white">{item.value}</span>
                </div>
                {item.supporting ? <p className="mt-2 text-sm leading-6 text-slate-300">{item.supporting}</p> : null}
              </div>
            </div>
          </div>
        ))}
      </div>
    </SectionFrame>
  );
}
