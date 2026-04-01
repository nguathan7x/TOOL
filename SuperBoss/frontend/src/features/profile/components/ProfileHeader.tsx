import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { cn } from '../../../lib/cn';

type ProfileHeaderProps = {
  fullName: string;
  email: string;
  avatarUrl: string | null;
  roleLabel: string;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'neutral';
  coverTitle: string;
  coverDescription: string;
  specialization: string;
  currentWorkspace: string;
  onEditProfile: () => void;
  onOpenSecurity: () => void;
};

export function ProfileHeader(props: ProfileHeaderProps) {
  const {
    fullName,
    email,
    avatarUrl,
    roleLabel,
    statusLabel,
    statusTone,
    coverTitle,
    coverDescription,
    specialization,
    currentWorkspace,
    onEditProfile,
    onOpenSecurity
  } = props;

  const initials = fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();

  return (
    <section className="profile-fade-in relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(20,32,56,0.94)_0%,rgba(11,18,32,0.92)_42%,rgba(7,14,26,0.96)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(143,156,255,0.26),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(110,233,216,0.18),transparent_24%),radial-gradient(circle_at_72%_100%,rgba(252,211,77,0.12),transparent_28%)]" />
      <div className="absolute -left-20 top-20 h-44 w-44 rounded-full border border-white/8 bg-white/6 blur-[2px] profile-float-slow" />
      <div className="absolute right-10 top-8 h-36 w-36 rounded-full border border-white/6 bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_68%)] profile-float-delayed" />
      <div className="absolute left-1/2 -top-24 h-48 w-[500px] -translate-x-1/2 bg-gradient-to-b from-[#8f9cff]/10 to-transparent blur-3xl" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            {/* Avatar with glow ring */}
            <div className="group relative">
              <div className="absolute -inset-1.5 rounded-[2rem] bg-gradient-to-br from-[#8f9cff]/40 via-[#8ae6d9]/30 to-[#fcd34d]/20 opacity-60 blur-md transition-opacity duration-500 group-hover:opacity-90" />
              <div className="relative rounded-[1.8rem] border border-white/12 bg-white/8 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
                <Avatar name={fullName} src={avatarUrl} size="lg" className="h-24 w-24 rounded-[1.4rem] text-2xl sm:h-28 sm:w-28" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info" className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">{roleLabel}</Badge>
                <Badge tone={statusTone} className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">
                  <span className={cn('mr-1.5 inline-block h-1.5 w-1.5 rounded-full', statusTone === 'success' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : statusTone === 'warning' ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]' : 'bg-slate-400')} />
                  {statusLabel}
                </Badge>
                <Badge className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">{specialization}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#b8c4ff]">{coverTitle}</p>
                <h1 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">{fullName}</h1>
                <p className="mt-2 max-w-2xl text-[15px] leading-7 text-slate-300/90">{coverDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 transition-colors hover:bg-white/10">
                  <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M4 6h16v12H4z" /><path d="M4 8l8 6 8-6" /></svg>
                  {email}
                </span>
                <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-3 py-1.5 transition-colors hover:bg-white/10">
                  <svg className="h-3.5 w-3.5 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="M3 9h18M8 4v16" /></svg>
                  {currentWorkspace}
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
            <Button className="min-w-[180px] transition-transform duration-200 hover:-translate-y-0.5" onClick={onEditProfile}>
              Edit profile
            </Button>
            <Button variant="secondary" className="min-w-[180px] transition-transform duration-200 hover:-translate-y-0.5" onClick={onOpenSecurity}>
              Security settings
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
