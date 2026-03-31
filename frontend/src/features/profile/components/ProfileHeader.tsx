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

  return (
    <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(20,32,56,0.94)_0%,rgba(11,18,32,0.92)_42%,rgba(7,14,26,0.96)_100%)] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(143,156,255,0.26),transparent_30%),radial-gradient(circle_at_78%_22%,rgba(110,233,216,0.18),transparent_24%),radial-gradient(circle_at_72%_100%,rgba(252,211,77,0.12),transparent_28%)]" />
      <div className="absolute -left-20 top-20 h-44 w-44 rounded-full border border-white/8 bg-white/6 blur-[2px]" />
      <div className="absolute right-10 top-8 h-36 w-36 rounded-full border border-white/6 bg-[radial-gradient(circle,rgba(255,255,255,0.14),transparent_68%)]" />

      <div className="relative p-6 sm:p-8 lg:p-10">
        <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end">
            <div className="rounded-[1.8rem] border border-white/12 bg-white/8 p-2 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
              <Avatar name={fullName} src={avatarUrl} size="lg" className="h-24 w-24 rounded-[1.4rem] text-2xl sm:h-28 sm:w-28" />
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="info" className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">{roleLabel}</Badge>
                <Badge tone={statusTone} className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">{statusLabel}</Badge>
                <Badge className="px-3 py-1.5 text-[0.72rem] uppercase tracking-[0.18em]">{specialization}</Badge>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.24em] text-[#b8c4ff]">{coverTitle}</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{fullName}</h1>
                <p className="mt-2 max-w-2xl text-base leading-7 text-slate-300">{coverDescription}</p>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-slate-300">
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">{email}</span>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5">Workspace: {currentWorkspace}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
            <Button className="min-w-[180px]" onClick={onEditProfile}>
              Edit profile
            </Button>
            <Button variant="secondary" className="min-w-[180px]" onClick={onOpenSecurity}>
              Security settings
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
