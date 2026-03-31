import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../features/auth/hooks/useAuth';
import { useNotificationsInbox } from '../features/notifications/hooks/useNotificationsInbox';
import type { AppNotification, Invite } from '../features/admin/types';

function scopeLabel(invite: Invite) {
  if (invite.scopeType === 'WORKSPACE') return 'Workspace invite';
  if (invite.scopeType === 'SPACE') return 'Space invite';
  return 'Project invite';
}

function inviteTargetLabel(invite: Invite) {
  return invite.scopeName ?? invite.projectName ?? invite.spaceName ?? invite.workspaceName ?? 'Unnamed scope';
}

function inviteContextLabel(invite: Invite) {
  if (invite.scopeType === 'PROJECT') {
    const parts = [invite.spaceName, invite.workspaceName].filter(Boolean);
    return parts.length > 0 ? parts.join(' / ') : null;
  }

  if (invite.scopeType === 'SPACE') {
    return invite.workspaceName ?? null;
  }

  return null;
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

function signalProjectName(signal: AppNotification) {
  return typeof signal.metadata?.projectName === 'string' ? signal.metadata.projectName : 'Project';
}

function signalTaskTitle(signal: AppNotification) {
  return typeof signal.metadata?.taskTitle === 'string' ? signal.metadata.taskTitle : null;
}

function signalProjectKey(signal: AppNotification) {
  return typeof signal.metadata?.projectKey === 'string' ? signal.metadata.projectKey : null;
}

function StatCard({ eyebrow, value, label, tone }: { eyebrow: string; value: number; label: string; tone: 'violet' | 'cyan' | 'amber' }) {
  const toneMap = {
    violet: 'from-[#8f9cff]/22 via-[#8f9cff]/8 to-transparent border-[#8f9cff]/18',
    cyan: 'from-[#6ee9d8]/22 via-[#6ee9d8]/8 to-transparent border-[#6ee9d8]/18',
    amber: 'from-[#f7c96c]/22 via-[#f7c96c]/8 to-transparent border-[#f7c96c]/18'
  } as const;

  return (
    <div className={`rounded-[1.45rem] border bg-gradient-to-br ${toneMap[tone]} px-5 py-4`}>
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">{eyebrow}</p>
      <div className="mt-3 flex items-end justify-between gap-3">
        <p className="text-3xl font-semibold tracking-[-0.03em] text-white">{value}</p>
        <p className="max-w-[9rem] text-right text-sm leading-6 text-slate-300">{label}</p>
      </div>
    </div>
  );
}

export function NotificationsPage() {
  const navigate = useNavigate();
  const { tokens } = useAuth();
  const {
    invites,
    signals,
    isLoading,
    isMutating,
    error,
    acceptInvite,
    declineInvite,
    markSignalRead
  } = useNotificationsInbox(tokens?.accessToken, { unreadOnly: true });

  async function accept(invite: Invite) {
    await acceptInvite(invite);
  }

  async function decline(inviteId: string) {
    await declineInvite(inviteId);
  }

  async function openSignal(signal: AppNotification) {
    try {
      await markSignalRead(signal.id, true);
    } catch {
      // Keep navigation available even if the read receipt fails.
    }

    navigate('/projects?view=backlog', {
      state: {
        preferredWorkspaceId: signal.workspaceId,
        preferredSpaceId: signal.spaceId ?? undefined,
        preferredProjectId: signal.projectId ?? undefined
      }
    });
  }

  async function markRead(signalId: string) {
    await markSignalRead(signalId);
  }

  const notificationCount = signals.length + invites.length;
  const pendingApprovals = signals.length;
  const pendingInvites = invites.length;
  const newestSignal = signals[0]?.createdAt ?? null;

  const statusLine = useMemo(() => {
    if (notificationCount === 0) {
      return 'Nothing waiting right now.';
    }

    if (pendingApprovals > 0 && pendingInvites > 0) {
      return `${pendingApprovals} review${pendingApprovals === 1 ? '' : 's'} and ${pendingInvites} invite${pendingInvites === 1 ? '' : 's'} waiting.`;
    }

    if (pendingApprovals > 0) {
      return `${pendingApprovals} review${pendingApprovals === 1 ? '' : 's'} waiting.`;
    }

    return `${pendingInvites} invite${pendingInvites === 1 ? '' : 's'} waiting.`;
  }, [notificationCount, pendingApprovals, pendingInvites]);

  if (isLoading) {
    return <LoadingState label="Loading notifications..." />;
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow="Notifications"
        title="Signal desk"
        subtitle="Review, decide, and move on."
      />

      {error ? <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div> : null}

      <Card className="overflow-hidden p-0">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(143,156,255,0.22),transparent_34%),radial-gradient(circle_at_top_right,rgba(110,233,216,0.16),transparent_28%),linear-gradient(180deg,rgba(12,18,33,0.96)_0%,rgba(9,14,25,0.92)_100%)] px-6 py-6 sm:px-7 sm:py-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[#b8c4ff]">Overview</p>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white sm:text-[2.15rem]">Only the signals that matter.</h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">{statusLine}</p>
            </div>
            <div className="rounded-[1.35rem] border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300">
              <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-slate-400">Latest signal</p>
              <p className="mt-2 font-medium text-white">{newestSignal ? formatDateTime(newestSignal) : 'No unread activity'}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-3 md:grid-cols-3">
            <StatCard eyebrow="Unread" value={notificationCount} label="Need action now." tone="violet" />
            <StatCard eyebrow="Planning" value={pendingApprovals} label="Need planning review." tone="cyan" />
            <StatCard eyebrow="Invites" value={pendingInvites} label="Need accept or decline." tone="amber" />
          </div>
        </div>
      </Card>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <Card className="space-y-5">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#8ae6d9]">Work signals</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Review queue</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Backlog items waiting for approval.</p>
            </div>
            <Badge tone="info">{pendingApprovals} unread</Badge>
          </div>

          {signals.length === 0 ? (
            <EmptyState title="No review items" description="New items will appear here." />
          ) : (
            <div className="space-y-4">
              {signals.map((signal, index) => (
                <div
                  key={signal.id}
                  className={[
                    'group rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,42,0.88)_0%,rgba(11,17,31,0.84)_100%)] p-5 transition duration-200 hover:border-[#8f9cff]/28 hover:shadow-[0_18px_40px_rgba(66,92,180,0.12)]',
                    index === 0 ? 'ring-1 ring-[#8f9cff]/16' : ''
                  ].join(' ')}
                >
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="min-w-0 flex-1 space-y-4">
                      <div className="flex items-start gap-3">
                        {signal.actor ? <Avatar name={signal.actor.fullName} src={signal.actor.avatarUrl} size="sm" className="mt-0.5 h-11 w-11 rounded-full" /> : null}
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge tone="warning">Needs review</Badge>
                            {signalProjectKey(signal) ? <Badge tone="info">{signalProjectKey(signal)}</Badge> : null}
                          </div>
                          <h4 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">{signal.title}</h4>
                          <p className="mt-2 text-sm leading-7 text-slate-300">{signal.message}</p>
                        </div>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">From</p>
                          <p className="mt-2 text-sm font-semibold text-white">{signal.actor?.fullName ?? 'System signal'}</p>
                          <p className="mt-1 text-xs text-slate-400">{formatDateTime(signal.createdAt)}</p>
                        </div>
                        <div className="rounded-[1.1rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                          <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">Project</p>
                          <p className="mt-2 text-sm font-semibold text-white">{signalProjectName(signal)}</p>
                          <p className="mt-1 text-xs text-slate-400">{signalTaskTitle(signal) ?? 'Waiting for review'}</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-col gap-2 lg:w-[11rem]">
                      <Button onClick={() => void openSignal(signal)} className="rounded-full">Open</Button>
                      <Button variant="secondary" onClick={() => void markRead(signal.id)} className="rounded-full">Done</Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-5">
          <div className="flex items-end justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[#ffd79b]">Invites</p>
              <h3 className="mt-2 text-xl font-semibold tracking-[-0.03em] text-white">Invites</h3>
              <p className="mt-2 text-sm leading-6 text-slate-300">Accept or decline access requests.</p>
            </div>
            <Badge tone="warning">{pendingInvites} pending</Badge>
          </div>

          {invites.length === 0 ? (
            <EmptyState title="No invites" description="New invites will appear here." />
          ) : (
            <div className="space-y-4">
              {invites.map((invite) => (
                <div key={invite.id} className="rounded-[1.45rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,25,42,0.88)_0%,rgba(11,17,31,0.84)_100%)] p-5 transition duration-200 hover:border-white/16 hover:shadow-[0_18px_40px_rgba(0,0,0,0.16)]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone="info">{scopeLabel(invite)}</Badge>
                        <Badge>{invite.role}</Badge>
                      </div>
                      <h4 className="mt-3 text-lg font-semibold tracking-[-0.03em] text-white">{inviteTargetLabel(invite)}</h4>
                      {inviteContextLabel(invite) ? <p className="mt-1 text-sm text-slate-400">{inviteContextLabel(invite)}</p> : null}
                    </div>
                    <Badge tone="warning">{invite.status}</Badge>
                  </div>

                  {invite.invitedByUser ? (
                    <div className="mt-4 flex items-center gap-3 rounded-[1.15rem] border border-white/10 bg-white/[0.03] px-4 py-3">
                      <Avatar name={invite.invitedByUser.fullName} src={invite.invitedByUser.avatarUrl} size="sm" className="h-10 w-10 rounded-full" />
                      <div className="min-w-0 flex-1">
                        <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-slate-400">From</p>
                        <p className="truncate text-sm font-semibold text-white">{invite.invitedByUser.fullName}</p>
                        <p className="truncate text-xs text-slate-400">{invite.invitedByUser.email}</p>
                      </div>
                    </div>
                  ) : null}

                  
                  <div className="mt-5 flex gap-3">
                    <Button disabled={isMutating} onClick={() => void accept(invite)} className="rounded-full">
                      {isMutating ? 'Working...' : 'Accept'}
                    </Button>
                    <Button variant="secondary" disabled={isMutating} onClick={() => void decline(invite.id)} className="rounded-full">
                      Decline
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
