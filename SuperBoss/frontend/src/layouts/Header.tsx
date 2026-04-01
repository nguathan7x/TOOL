import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Select } from '../components/ui/Select';
import { Button } from '../components/ui/Button';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useNotificationsInbox } from '../features/notifications/hooks/useNotificationsInbox';
import type { AppNotification, Invite } from '../features/admin/types';
import { setStoredWorkspaceId } from '../features/workspaces/store/workspaceSelection';
import { useWorkspaceData } from '../features/workspaces/store/WorkspaceDataContext';
import { cn } from '../lib/cn';
import { UserMenu } from './UserMenu';

const pageContext: Record<string, { eyebrow: string; title: string }> = {
  '/dashboard': { eyebrow: 'Workspace command', title: 'Delivery overview' },
  '/projects': { eyebrow: 'Execution surface', title: 'Projects and delivery lanes' },
  '/my-tasks': { eyebrow: 'Work inbox', title: 'My tasks' },
  '/admin': { eyebrow: 'Governance', title: 'Control surface' },
  '/notifications': { eyebrow: 'Signals', title: 'Notifications' },
  '/profile': { eyebrow: 'Identity', title: 'Profile and account' }
};


function inviteScopeLabel(invite: Invite) {
  return invite.scopeType === 'WORKSPACE' ? 'Workspace invite' : invite.scopeType === 'SPACE' ? 'Space invite' : 'Project invite';
}

function inviteTargetLabel(invite: Invite) {
  return invite.scopeName ?? invite.projectName ?? invite.spaceName ?? invite.workspaceName ?? 'Unnamed scope';
}

function formatSignalTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

const mobileNavItems = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/projects?view=board', label: 'Projects' },
  { to: '/my-tasks?filter=assigned', label: 'My tasks' },
  { to: '/admin', label: 'Control' },
  { to: '/profile', label: 'Profile' }
];

function Icon({ name, className = 'h-4 w-4' }: { name: 'menu' | 'search' | 'bell' | 'plus' | 'spark'; className?: string }) {
  if (name === 'menu') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
        <path d='M4 7h16M4 12h16M4 17h16' />
      </svg>
    );
  }
  if (name === 'search') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
        <circle cx='11' cy='11' r='6.5' />
        <path d='m16 16 4.5 4.5' />
      </svg>
    );
  }
  if (name === 'bell') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
        <path d='M15 18H9' />
        <path d='M18 16.5H6c1.1-1.2 2-2.7 2-6a4 4 0 1 1 8 0c0 3.3.9 4.8 2 6Z' />
      </svg>
    );
  }
  if (name === 'plus') {
    return (
      <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.9' className={className}>
        <path d='M12 5v14M5 12h14' />
      </svg>
    );
  }
  return (
    <svg viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' className={className}>
      <path d='M12 6v12M6 12h12' />
      <path d='M7 7h.01M17 7h.01M7 17h.01M17 17h.01' />
    </svg>
  );
}

export function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens } = useAuth();
  const { workspaces, selectedWorkspaceId, setSelectedWorkspaceId } = useWorkspaceData();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [actingInviteId, setActingInviteId] = useState<string | null>(null);
  const [notificationPulse, setNotificationPulse] = useState(false);
  const notificationRef = useRef<HTMLDivElement | null>(null);
  const previousPendingCountRef = useRef(0);
  const currentPage = pageContext[location.pathname] ?? { eyebrow: 'SuperBoss', title: 'Workspace surface' };

  const {
    invites: pendingInvites,
    signals: workSignals,
    counts: notificationCounts,
    isLoading: isNotificationsLoading,
    acceptInvite,
    declineInvite,
    markSignalRead
  } = useNotificationsInbox(tokens?.accessToken, { unreadOnly: true, pollIntervalMs: 20000, preserveDataOnRefresh: true });


  useEffect(() => {
    setMobileOpen(false);
    setNotificationOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const nextCount = notificationCounts.total;
    const previousCount = previousPendingCountRef.current;

    if (nextCount > previousCount) {
      setNotificationPulse(true);
      const timeoutId = window.setTimeout(() => {
        setNotificationPulse(false);
      }, 950);
      previousPendingCountRef.current = nextCount;
      return () => {
        window.clearTimeout(timeoutId);
      };
    }

    previousPendingCountRef.current = nextCount;
    return undefined;
  }, [notificationCounts.total]);

  async function handleAcceptInvite(invite: Invite) {
    setActingInviteId(invite.id);
    try {
      await acceptInvite(invite);
    } finally {
      setActingInviteId(null);
    }
  }

  async function handleDeclineInvite(inviteId: string) {
    setActingInviteId(inviteId);
    try {
      await declineInvite(inviteId);
    } finally {
      setActingInviteId(null);
    }
  }

  async function handleOpenSignal(signal: AppNotification) {
    try {
      await markSignalRead(signal.id, true);
    } catch {
      // Navigation still matters more than the read receipt.
    }

    setNotificationOpen(false);
    navigate('/projects?view=backlog', {
      state: {
        preferredWorkspaceId: signal.workspaceId,
        preferredSpaceId: signal.spaceId ?? undefined,
        preferredProjectId: signal.projectId ?? undefined
      }
    });
  }

  function handleWorkspaceChange(nextId: string | null) {
    setSelectedWorkspaceId(nextId);
    setStoredWorkspaceId(nextId);
  }

  const pendingInviteCount = notificationCounts.invites;
  const unreadSignalCount = notificationCounts.signals;
  const notificationCount = notificationCounts.total;
  const visibleSignals = workSignals.slice(0, 2);
  const visibleInvites = pendingInvites.slice(0, 2);
  const topSignal = visibleSignals[0] ?? null;

  return (
    <header className='sticky top-0 z-40 border-b border-white/8 bg-[linear-gradient(180deg,rgba(7,11,22,0.92)_0%,rgba(7,11,22,0.78)_100%)] shadow-[0_18px_40px_rgba(0,0,0,0.18)] backdrop-blur-2xl'>
      <div className='px-4 py-3 sm:px-6 lg:px-8'>
        <div className='flex items-center gap-3'>
          <button
            type='button'
            onClick={() => setMobileOpen((value) => !value)}
            className='inline-flex h-11 w-11 items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1] lg:hidden'
            aria-label='Open navigation menu'
          >
            <Icon name='menu' className='h-5 w-5' />
          </button>

          <div className='min-w-0 flex-1'>
            <div className='min-w-0'>
              <p className='eyebrow-label truncate'>{currentPage.eyebrow}</p>
              <h1 className='truncate text-lg font-semibold tracking-[-0.03em] text-white sm:text-[1.3rem]'>{currentPage.title}</h1>
            </div>
          </div>
          <div className='ml-auto flex items-center gap-2 sm:gap-3'>
            <div className='hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300 shadow-[0_16px_32px_rgba(0,0,0,0.12)] lg:flex'>
              <Icon name='search' className='h-4 w-4 text-slate-400' />
              <input
                type='text'
                placeholder={location.pathname === '/projects' ? 'Search tasks, stages, or assignees' : 'Search workspaces, members, or project signals'}
                className='w-[240px] bg-transparent text-sm text-white outline-none placeholder:text-slate-500'
              />
            </div>

            {workspaces.length > 1 ? (
              <div className='hidden min-w-[220px] xl:block'>
                <Select value={selectedWorkspaceId ?? ''} onChange={(event) => handleWorkspaceChange(event.target.value || null)} className='h-11 bg-white/[0.05]'>
                  {workspaces.map((workspace) => (
                    <option key={workspace.id} value={workspace.id}>
                      {workspace.name}
                    </option>
                  ))}
                </Select>
              </div>
            ) : null}

            <Button className='hidden h-11 rounded-full px-4 md:inline-flex' onClick={() => navigate('/projects?view=backlog')}>
              <span className='mr-2 inline-flex'><Icon name='plus' /></span>
              Quick create
            </Button>

            <div ref={notificationRef} className='relative'>
              <button
                type='button'
                onClick={() => setNotificationOpen((value) => !value)}
                className={cn(
                  'relative inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1]',
                  notificationCount > 0 && 'border-[#8f9cff]/40 bg-[linear-gradient(135deg,rgba(143,156,255,0.18)_0%,rgba(110,233,216,0.14)_100%)] text-white shadow-[0_0_0_1px_rgba(143,156,255,0.12),0_16px_34px_rgba(82,113,255,0.16)]',
                  notificationPulse && 'notification-pulse-ring'
                )}
                aria-label={notificationCount > 0 ? `Open notifications, ${notificationCount} unread` : 'Open notifications'}
                title={notificationCount > 0 ? `${notificationCount} unread signal${notificationCount === 1 ? '' : 's'}` : 'No new notifications'}
              >
                <Icon name='bell' className='h-4 w-4' />
                {notificationCount > 0 ? (
                  <span className={cn('absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-[linear-gradient(135deg,#8f9cff_0%,#6ee9d8_100%)] px-1.5 py-0.5 text-[0.65rem] font-bold text-[#08111f]', notificationPulse && 'notification-badge-pulse')}>
                    {notificationCount}
                  </span>
                ) : null}
              </button>

              {notificationOpen ? (
                <div className='absolute right-0 top-[calc(100%+0.9rem)] z-50 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(127,151,255,0.2),transparent_32%),radial-gradient(circle_at_top_right,rgba(122,231,207,0.12),transparent_26%),linear-gradient(180deg,rgba(12,17,31,0.98)_0%,rgba(8,12,24,0.98)_100%)] shadow-[0_34px_90px_rgba(0,0,0,0.46)] backdrop-blur-2xl'>
                  <div className='border-b border-white/10 px-5 py-5'>
                    <div className='flex items-start justify-between gap-4'>
                      <div>
                        <p className='eyebrow-label'>Signal desk</p>
                        <h3 className='mt-2 text-lg font-semibold tracking-[-0.02em] text-white'>Quick triage</h3>
                        <p className='mt-1 text-sm text-slate-300'>Only what needs action.</p>
                      </div>
                      {notificationCount > 0 ? (
                        <span className='inline-flex min-w-9 items-center justify-center rounded-full border border-[#8f9cff]/30 bg-[#8f9cff]/12 px-2.5 py-1 text-xs font-semibold text-[#dbe2ff]'>
                          {notificationCount}
                        </span>
                      ) : null}
                    </div>

                    <div className='mt-5 grid gap-3 sm:grid-cols-3'>
                      <div className='surface-chip rounded-[1rem] px-4 py-3'>
                        <p className='text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-400'>Unread</p>
                        <p className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-white'>{notificationCount}</p>
                      </div>
                      <div className='rounded-[1rem] border border-[#6ee9d8]/16 bg-[#6ee9d8]/8 px-4 py-3'>
                        <p className='text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-400'>Planning</p>
                        <p className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-white'>{unreadSignalCount}</p>
                      </div>
                      <div className='rounded-[1rem] border border-[#f7c96c]/16 bg-[#f7c96c]/8 px-4 py-3'>
                        <p className='text-[0.64rem] font-semibold uppercase tracking-[0.16em] text-slate-400'>Invites</p>
                        <p className='mt-2 text-2xl font-semibold tracking-[-0.03em] text-white'>{pendingInviteCount}</p>
                      </div>
                    </div>
                  </div>

                  <div className='max-h-[28rem] overflow-y-auto px-4 py-4'>
                    {isNotificationsLoading && notificationCount === 0 ? (
                      <div className='surface-chip rounded-[1.2rem] px-4 py-5 text-sm text-slate-300'>Loading...</div>
                    ) : notificationCount === 0 ? (
                      <div className='surface-chip rounded-[1.2rem] px-4 py-5 text-sm text-slate-300'>Nothing new.</div>
                    ) : (
                      <div className='space-y-4'>
                        {topSignal ? (
                          <div className='rounded-[1.4rem] border border-[#8f9cff]/20 bg-[linear-gradient(135deg,rgba(143,156,255,0.14)_0%,rgba(110,233,216,0.08)_100%)] px-4 py-4'>
                            <div className='flex items-start gap-3'>
                              {topSignal.actor ? <Avatar name={topSignal.actor.fullName} src={topSignal.actor.avatarUrl} size='sm' className='h-10 w-10 rounded-full' /> : null}
                              <div className='min-w-0 flex-1'>
                                <div className='flex flex-wrap items-center gap-2'>
                                  <Badge tone='warning'>Review</Badge>
                                  {typeof topSignal.metadata?.projectKey === 'string' ? <Badge tone='info'>{topSignal.metadata.projectKey}</Badge> : null}
                                </div>
                                <p className='mt-3 text-sm font-semibold text-white'>{topSignal.title}</p>
                                
                                <p className='mt-2 text-xs text-slate-400'>
                                  {typeof topSignal.metadata?.projectName === 'string' ? topSignal.metadata.projectName : 'Project signal'} ? {formatSignalTime(topSignal.createdAt)}
                                </p>
                              </div>
                              <Button className='h-9 rounded-full px-3 text-xs' onClick={() => void handleOpenSignal(topSignal)}>
                                Open
                              </Button>
                            </div>
                          </div>
                        ) : null}

                        {visibleInvites.length > 0 ? (
                          <div className='space-y-2'>
                            <p className='px-1 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9fb0ff]'>Invites</p>
                            {visibleInvites.map((invite) => (
                              <div key={invite.id} className='rounded-[1.25rem] border border-white/10 bg-white/[0.04] px-4 py-3'>
                                <div className='flex items-start gap-3'>
                                  {invite.invitedByUser ? (
                                    <Avatar name={invite.invitedByUser.fullName} src={invite.invitedByUser.avatarUrl} size='sm' className='h-9 w-9 rounded-full text-[0.7rem]' />
                                  ) : null}
                                  <div className='min-w-0 flex-1'>
                                    <div className='flex items-center gap-2'>
                                      <p className='text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[#9fb0ff]'>
                                        {inviteScopeLabel(invite)}
                                      </p>
                                      <span className='rounded-full border border-white/10 px-2 py-0.5 text-[0.65rem] font-semibold text-slate-300'>{invite.role}</span>
                                    </div>
                                    <p className='mt-1 truncate text-sm font-semibold text-white'>{inviteTargetLabel(invite)}</p>
                                    <p className='mt-1 truncate text-xs text-slate-400'>
                                      {invite.invitedByUser ? invite.invitedByUser.fullName : 'Pending invite'}
                                    </p>
                                  </div>
                                  <div className='flex shrink-0 flex-col gap-2'>
                                    <Button
                                      disabled={actingInviteId === invite.id}
                                      onClick={() => void handleAcceptInvite(invite)}
                                      className='h-9 rounded-full px-3 text-xs'
                                    >
                                      {actingInviteId === invite.id ? 'Saving...' : 'Accept'}
                                    </Button>
                                    <Button
                                      variant='secondary'
                                      disabled={actingInviteId === invite.id}
                                      onClick={() => void handleDeclineInvite(invite.id)}
                                      className='h-9 rounded-full px-3 text-xs'
                                    >
                                      Decline
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>

                  <div className='border-t border-white/10 px-4 py-3'>
                    <Button variant='secondary' fullWidth onClick={() => { setNotificationOpen(false); navigate('/notifications'); }}>
                      Open all notifications
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            <UserMenu />
          </div>
        </div>
      </div>

      <div className={cn('border-t border-white/10 bg-[rgba(8,12,24,0.94)] px-4 py-4 shadow-[0_22px_40px_rgba(0,0,0,0.24)] backdrop-blur-2xl transition lg:hidden', mobileOpen ? 'block' : 'hidden')}>
        <div className='space-y-4'>
          <div className='rounded-[1.4rem] border border-white/10 bg-white/[0.05] p-3'>
            <div className='flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-slate-300'>
              <Icon name='search' className='h-4 w-4 text-slate-400' />
              <input type='text' placeholder='Search the workspace' className='w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-400' />
            </div>
          </div>

          {workspaces.length > 1 ? (
            <Select value={selectedWorkspaceId ?? ''} onChange={(event) => handleWorkspaceChange(event.target.value || null)} className='bg-white/[0.06]'>
              {workspaces.map((workspace) => (
                <option key={workspace.id} value={workspace.id}>
                  {workspace.name}
                </option>
              ))}
            </Select>
          ) : null}

          <div className='grid gap-2 sm:grid-cols-2'>
            {mobileNavItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className='rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/[0.08]'
              >
                {item.label}
              </Link>
            ))}
          </div>

          <div className='grid gap-2 sm:grid-cols-2'>
            <Button fullWidth onClick={() => navigate('/projects?view=backlog')}>
              <span className='mr-2 inline-flex'><Icon name='plus' /></span>
              Quick create
            </Button>
            <Button variant='secondary' fullWidth onClick={() => navigate('/notifications')}>
              Open signals
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
