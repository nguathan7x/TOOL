import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../features/auth/hooks/useAuth';
import { cn } from '../lib/cn';

function MenuIcon({ kind, className = 'h-4 w-4' }: { kind: 'user' | 'settings' | 'logout'; className?: string }) {
  if (kind == 'user') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
        <path d='M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' />
        <path d='M5 20a7 7 0 0 1 14 0' />
      </svg>
    );
  }

  if (kind == 'settings') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
        <path d='M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1' />
        <circle cx='12' cy='12' r='3.5' />
      </svg>
    );
  }

  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
      <path d='M9 6 3 12l6 6' />
      <path d='M3 12h11a6 6 0 0 0 0-12h-1' />
    </svg>
  );
}

type UserMenuProps = {
  className?: string;
};

export function UserMenu({ className }: UserMenuProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    }

    window.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const controlLabel = user?.globalRole === 'SUPER_ADMIN' ? 'Admin console' : 'Control center';

  const items = useMemo(
    () => [
      { label: 'Profile', description: 'Identity, avatar, and account details', path: '/profile', icon: 'user' as const },
      { label: controlLabel, description: 'Workspace roles, members, and settings', path: '/admin', icon: 'settings' as const }
    ],
    [controlLabel]
  );

  if (!user) {
    return null;
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type='button'
        onClick={() => setOpen((value) => !value)}
        className={cn(
          'group flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-2.5 py-2 text-left shadow-[0_16px_35px_rgba(0,0,0,0.16)] transition hover:border-white/16 hover:bg-white/[0.1]',
          open && 'border-white/16 bg-white/[0.1]'
        )}
      >
        <Avatar name={user.fullName} src={user.avatarUrl} size='sm' />
        <div className='hidden min-w-0 sm:block'>
          <p className='truncate text-sm font-semibold text-white'>{user.fullName}</p>
          <p className='truncate text-xs text-slate-300'>{user.email}</p>
        </div>
        <svg viewBox='0 0 20 20' fill='none' stroke='currentColor' strokeWidth='1.8' className={cn('hidden h-4 w-4 text-slate-300 transition sm:block', open && 'rotate-180')}>
          <path d='m5 7 5 6 5-6' />
        </svg>
      </button>

      <div
        className={cn(
          'absolute right-0 top-[calc(100%+0.75rem)] z-50 w-[320px] origin-top-right rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,15,28,0.96)_0%,rgba(8,12,24,0.94)_100%)] p-3 shadow-[0_28px_80px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition duration-200',
          open ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-2 opacity-0'
        )}
      >
        <div className='rounded-[1.35rem] border border-white/10 bg-white/[0.05] p-4'>
          <div className='flex items-center gap-3'>
            <Avatar name={user.fullName} src={user.avatarUrl} />
            <div className='min-w-0'>
              <p className='truncate text-sm font-semibold text-white'>{user.fullName}</p>
              <p className='truncate text-xs text-slate-300'>{user.email}</p>
            </div>
          </div>
          <div className='mt-3 flex flex-wrap gap-2'>
            <Badge tone='info'>{user.globalRole ?? 'Scoped access'}</Badge>
            <Badge>{user.specialization}</Badge>
          </div>
        </div>

        <div className='mt-3 space-y-1'>
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                type='button'
                onClick={() => {
                  setOpen(false);
                  navigate(item.path);
                }}
                className={cn(
                  'flex w-full items-start gap-3 rounded-[1.15rem] px-3 py-3 text-left transition hover:bg-white/[0.06]',
                  active && 'bg-white/[0.08]'
                )}
              >
                <span className='mt-0.5 rounded-xl border border-white/10 bg-white/[0.05] p-2 text-slate-200'>
                  <MenuIcon kind={item.icon} />
                </span>
                <span className='min-w-0'>
                  <span className='block text-sm font-semibold text-white'>{item.label}</span>
                  <span className='mt-1 block text-xs leading-5 text-slate-300'>{item.description}</span>
                </span>
              </button>
            );
          })}
        </div>

        <div className='mt-3 border-t border-white/10 pt-3'>
          <button
            type='button'
            onClick={() => {
              setOpen(false);
              logout();
            }}
            className='flex w-full items-center gap-3 rounded-[1.15rem] px-3 py-3 text-left text-rose-100 transition hover:bg-rose-400/10'
          >
            <span className='rounded-xl border border-rose-300/16 bg-rose-300/10 p-2 text-rose-100'>
              <MenuIcon kind='logout' />
            </span>
            <span>
              <span className='block text-sm font-semibold'>Sign out</span>
              <span className='mt-1 block text-xs text-rose-100/70'>End this session on the current device.</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
