
import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../features/auth/hooks/useAuth';
import { adminApi } from '../features/admin/api/adminApi';
import { type ApiTask } from '../features/projects/api/projectsApi';
import { loadVisibleWorkGraph } from '../features/workspaces/api/visible-work-graph';
import type { Project, ProjectMembership, Space, SpaceMembership, Workspace, WorkspaceMembership } from '../features/admin/types';

type SuperAdminSummary = {
  workspaces: number;
  activeWorkspaces: number;
  spaces: number;
  activeSpaces: number;
  projects: number;
  archivedProjects: number;
  workspaceMembers: WorkspaceMembership[];
  spaceMembers: SpaceMembership[];
  projectMembers: ProjectMembership[];
  workspaceNames: string[];
  spaceNames: string[];
  projectNames: string[];
};

type DeliverySummary = {
  workspaces: Workspace[];
  spaces: Space[];
  projects: Project[];
  tasks: ApiTask[];
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const STATUS_COLORS: Record<string, string> = {
  BACKLOG: '#94a3b8',
  PLANNED: '#a5b4fc',
  IN_PROGRESS: '#60a5fa',
  REVIEW: '#c084fc',
  QA: '#f0abfc',
  UAT: '#fbbf24',
  DONE: '#34d399',
};

const PRIORITY_ICON: Record<string, string> = {
  CRITICAL: '🔴',
  HIGH: '🟠',
  MEDIUM: '🔵',
  LOW: '⚪',
};

function SummaryMetric({ label, value, note, icon, accentColor }: { label: string; value: number | string; note: string; icon: string; accentColor?: string }) {
  return (
    <Card className="group relative overflow-hidden rounded-[1.5rem] transition-all duration-300 hover:border-white/14 hover:shadow-[0_24px_80px_rgba(0,0,0,0.32)] hover:-translate-y-0.5">
      <div className="absolute inset-0 opacity-80 transition-opacity duration-300" style={{ background: `radial-gradient(circle at 50% 0%, ${accentColor ?? 'rgba(184,196,255,0.08)'}, transparent 70%)` }} />
      <div className="relative">
        <div className="flex items-center justify-between">
          <p className="eyebrow-label">{label}</p>
          <span className="text-base">{icon}</span>
        </div>
        <p className="mt-4 text-[2.35rem] font-bold tracking-[-0.05em] text-white">{value}</p>
        <p className="mt-2 text-[13px] leading-relaxed text-slate-300/90">{note}</p>
      </div>
    </Card>
  );
}

function CircularProgress({ percent, size = 100, strokeWidth = 8 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="drop-shadow-lg">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGradient)" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-700 ease-out"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#8ae6d9" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-white text-xl font-bold">{percent}%</text>
    </svg>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 transition-colors hover:bg-white/[0.06]">
      <span className="h-2.5 w-2.5 rounded-full ring-2 ring-offset-1 ring-offset-transparent" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }} />
      <span className="flex-1 text-sm text-slate-200">{label}</span>
      <span className="min-w-[3rem] text-right text-sm font-semibold text-white">{value}</span>
      <div className="hidden w-20 sm:block">
        <div className="h-1.5 rounded-full bg-white/10">
          <div className="h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

function DeliveryDashboard() {
  const { user, tokens } = useAuth();
  const [summary, setSummary] = useState<DeliverySummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const graph = await loadVisibleWorkGraph(tokens.accessToken);

        if (!cancelled) {
          setSummary({
            workspaces: graph.workspaces,
            spaces: graph.spaces,
            projects: graph.projects,
            tasks: graph.tasks
          });
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load dashboard');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken]);

  const myTasks = useMemo(() => {
    if (!summary || !user) {
      return [];
    }

    return summary.tasks.filter(
      (task) => task.createdBy === user.id || task.assigneeId === user.id || task.reporterId === user.id
    );
  }, [summary, user]);

  const myProjectIds = useMemo(() => new Set(myTasks.map((task) => task.projectId)), [myTasks]);

  const metrics = useMemo(() => {
    const total = myTasks.length;
    const completed = myTasks.filter((task) => task.status === 'DONE').length;
    const inProgress = myTasks.filter((task) => ['IN_PROGRESS', 'REVIEW', 'QA', 'UAT'].includes(task.status)).length;
    const backlog = myTasks.filter((task) => task.status === 'BACKLOG' || task.status === 'PLANNED').length;
    const overdue = myTasks.filter((task) => task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).getTime() < Date.now()).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, backlog, overdue, completionRate };
  }, [myTasks]);

  const focusProjects = useMemo(() => {
    if (!summary) {
      return [];
    }

    return summary.projects.filter((project) => myProjectIds.has(project.id)).slice(0, 5);
  }, [myProjectIds, summary]);

  const myWorkQueue = useMemo(() => {
    return [...myTasks]
      .filter((task) => task.status !== 'DONE')
      .sort((left, right) => {
        if (!left.dueDate && !right.dueDate) return 0;
        if (!left.dueDate) return 1;
        if (!right.dueDate) return -1;
        return new Date(left.dueDate).getTime() - new Date(right.dueDate).getTime();
      })
      .slice(0, 6);
  }, [myTasks]);

  const statusBreakdown = useMemo(() => {
    return [
      { label: 'Planned', value: myTasks.filter((task) => task.status === 'PLANNED').length },
      { label: 'In Progress', value: myTasks.filter((task) => task.status === 'IN_PROGRESS').length },
      { label: 'Review', value: myTasks.filter((task) => task.status === 'REVIEW').length },
      { label: 'QA', value: myTasks.filter((task) => task.status === 'QA').length },
      { label: 'UAT', value: myTasks.filter((task) => task.status === 'UAT').length },
      { label: 'Done', value: myTasks.filter((task) => task.status === 'DONE').length }
    ];
  }, [myTasks]);

  if (isLoading) {
    return <LoadingState label="Loading delivery dashboard..." />;
  }

  if (error) {
    return <EmptyState title="Dashboard unavailable" description={error} />;
  }

  if (!summary) {
    return <EmptyState title="No workspace access yet" description="Once you create or join a workspace, your delivery dashboard will populate here." />;
  }

  return (
    <div className="space-y-6 dashboard-fade-in">
      {/* Welcome banner */}
      <Card className="surface-panel-raised relative overflow-hidden rounded-[1.9rem] border-white/[0.08]">
        <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-gradient-to-br from-[#7ae7cf]/16 to-[#7f97ff]/10 blur-3xl" />
        <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-gradient-to-tr from-[#f4c56f]/10 to-transparent blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="eyebrow-label text-[#9ab0ff]">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h2 className="mt-3 text-[2rem] font-bold tracking-[-0.05em] text-white sm:text-[2.5rem]">
              {getGreeting()}, {user?.fullName ?? user?.email?.split('@')[0] ?? 'there'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300/90">Here's your execution snapshot — active tasks, progress, and the projects that need your attention today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="info">{user?.globalRole ?? 'Contributor'}</Badge>
            <Badge tone={metrics.overdue > 0 ? 'warning' : 'success'}>{metrics.overdue > 0 ? `${metrics.overdue} overdue` : 'On track'}</Badge>
          </div>
        </div>
      </Card>

      {/* Metric cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon="📋" label="My tasks" value={metrics.total} note="Tasks where you are creator, assignee, or reporter." accentColor="rgba(165,180,252,0.10)" />
        <SummaryMetric icon="⚡" label="In progress" value={metrics.inProgress} note="Work currently moving through execution stages." accentColor="rgba(96,165,250,0.10)" />
        <SummaryMetric icon="📥" label="Backlog & planned" value={metrics.backlog} note="Items still waiting for commitment or execution." accentColor="rgba(148,163,184,0.10)" />
        <SummaryMetric icon="🔥" label="At risk" value={metrics.overdue} note={metrics.overdue > 0 ? 'Overdue work that needs attention now.' : 'No overdue work — great job!'} accentColor={metrics.overdue > 0 ? 'rgba(251,113,133,0.12)' : 'rgba(52,211,153,0.10)'} />
      </div>

      {/* Work queue + Progress */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden rounded-[1.6rem]">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow-label text-[#7ae7cf]">My work queue</p>
              <h3 className="mt-2 text-lg font-semibold tracking-[-0.03em] text-white">What needs movement next</h3>
            </div>
            {myWorkQueue.length > 0 && <Badge tone="neutral">{myWorkQueue.length} items</Badge>}
          </div>
          <div className="mt-5 space-y-2.5">
            {myWorkQueue.length > 0 ? myWorkQueue.map((task, idx) => {
              const isOverdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).getTime() < Date.now();
              return (
                <div key={task.id} className="group relative rounded-[1.2rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.07]" style={{ animationDelay: `${idx * 60}ms` }}>
                  <div className="absolute left-0 top-0 h-full w-[3px] rounded-l-2xl" style={{ backgroundColor: STATUS_COLORS[task.status] ?? '#94a3b8' }} />
                  <div className="flex items-start gap-3 pl-2">
                    <span className="mt-0.5 text-sm">{PRIORITY_ICON[task.priority] ?? '⚪'}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white leading-snug">{task.title}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium" style={{ backgroundColor: `${STATUS_COLORS[task.status]}18`, color: STATUS_COLORS[task.status] }}>
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: STATUS_COLORS[task.status] }} />
                          {task.status.split('_').join(' ')}
                        </span>
                        <span className={`text-xs ${isOverdue ? 'font-semibold text-rose-400' : 'text-slate-400'}`}>
                          {isOverdue ? '⚠ Overdue · ' : ''}Due {task.dueDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.dueDate)) : 'someday'}
                        </span>
                        {task.assigneeId === user?.id && <Badge tone="success" className="text-[10px] px-1.5 py-0.5">Assigned</Badge>}
                      </div>
                    </div>
                    <Badge tone={task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : task.priority === 'MEDIUM' ? 'info' : 'neutral'} className="shrink-0 text-[10px]">{task.priority}</Badge>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <span className="text-4xl">🎉</span>
                <p className="mt-3 text-sm font-medium text-white">Queue cleared!</p>
                <p className="mt-1 text-xs text-slate-400">No active work right now. Enjoy the calm.</p>
              </div>
            )}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="rounded-[1.6rem]">
            <p className="eyebrow-label">Completion rate</p>
            <div className="mt-4 flex items-center gap-6">
              <CircularProgress percent={metrics.completionRate} />
              <div>
                <p className="text-3xl font-bold text-white">{metrics.completed}<span className="text-base font-normal text-slate-400">/{metrics.total}</span></p>
                <p className="mt-1 text-sm text-slate-300">tasks completed</p>
              </div>
            </div>
          </Card>

          <Card className="rounded-[1.6rem]">
            <p className="eyebrow-label">Status breakdown</p>
            <div className="mt-4 space-y-1.5">
              {statusBreakdown.map((item) => (
                <StatusBar key={item.label} label={item.label} value={item.value} total={metrics.total} color={STATUS_COLORS[item.label === 'In Progress' ? 'IN_PROGRESS' : item.label.toUpperCase()] ?? '#94a3b8'} />
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* Projects + Work context */}
      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="rounded-[1.6rem]">
          <div className="flex items-center justify-between">
            <p className="eyebrow-label">Projects in focus</p>
            {focusProjects.length > 0 && <Badge tone="neutral">{focusProjects.length}</Badge>}
          </div>
          <div className="mt-4 space-y-2">
            {focusProjects.length > 0 ? focusProjects.map((project) => {
              const projectTasks = myTasks.filter((t) => t.projectId === project.id);
              const projectDone = projectTasks.filter((t) => t.status === 'DONE').length;
              const projectPct = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0;
              return (
                <div key={project.id} className="group rounded-[1.15rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.07]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-[#8ae6d9]/20 to-[#a5b4fc]/20 text-xs font-bold text-white">{project.name.charAt(0).toUpperCase()}</span>
                        <p className="text-sm font-semibold text-white">{project.name}</p>
                      </div>
                      <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-slate-300/80">{project.description || 'No project description yet.'}</p>
                    </div>
                  </div>
                  {projectTasks.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span>{projectDone}/{projectTasks.length} done</span>
                        <span>{projectPct}%</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-white/10">
                        <div className="h-1.5 rounded-full bg-gradient-to-r from-emerald-400 to-[#8ae6d9] transition-all duration-500" style={{ width: `${projectPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <span className="text-3xl">📂</span>
                <p className="mt-2 text-sm text-slate-400">No active project memberships yet.</p>
              </div>
            )}
          </div>
        </Card>

        <Card className="rounded-[1.6rem]">
          <p className="eyebrow-label">Work context</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🏢', label: 'Workspaces', value: summary.workspaces.length, desc: 'Scopes you can currently navigate.' },
              { icon: '📁', label: 'Projects', value: summary.projects.length, desc: 'Execution surfaces from memberships.' },
              { icon: '🛡️', label: 'Role', value: user?.globalRole ?? 'Contributor', desc: 'Influences what you can move & approve.' },
              { icon: '🎯', label: 'Specialization', value: user?.specialization ?? 'General', desc: 'Used for QA, UAT, or role-based gates.' },
            ].map((item) => (
              <div key={item.label} className="group rounded-[1.15rem] border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/14 hover:bg-white/[0.07]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-xs font-medium uppercase tracking-wider text-slate-400">{item.label}</p>
                </div>
                <p className="mt-2 text-xl font-bold text-white">{item.value}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function SuperAdminDashboard() {
  const { user, tokens } = useAuth();
  const [summary, setSummary] = useState<SuperAdminSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const workspaceResponse = await adminApi.listWorkspaces(tokens.accessToken);
        const workspaces = workspaceResponse.items;

        const perWorkspace = await Promise.all(
          workspaces.map(async (workspace) => {
            const [spacesResponse, workspaceMembersResponse] = await Promise.all([
              adminApi.listSpaces(tokens.accessToken, workspace.id),
              adminApi.listWorkspaceMembers(tokens.accessToken, workspace.id)
            ]);

            const spaces = spacesResponse.items;
            const nested = await Promise.all(
              spaces.map(async (space) => {
                const [projectsResponse, spaceMembersResponse] = await Promise.all([
                  adminApi.listProjects(tokens.accessToken, workspace.id, space.id),
                  adminApi.listSpaceMembers(tokens.accessToken, space.id)
                ]);

                const projects = projectsResponse.items;
                const projectMembersGroups = await Promise.all(projects.map((project) => adminApi.listProjectMembers(tokens.accessToken, project.id)));

                return {
                  space,
                  projects,
                  spaceMembers: spaceMembersResponse.items,
                  projectMembers: projectMembersGroups.flatMap((group) => group.items)
                };
              })
            );

            return {
              workspace,
              workspaceMembers: workspaceMembersResponse.items,
              spaces: nested.map((item) => item.space),
              projects: nested.flatMap((item) => item.projects),
              spaceMembers: nested.flatMap((item) => item.spaceMembers),
              projectMembers: nested.flatMap((item) => item.projectMembers)
            };
          })
        );

        const nextSummary: SuperAdminSummary = {
          workspaces: workspaces.length,
          activeWorkspaces: workspaces.filter((item) => item.isActive).length,
          spaces: perWorkspace.flatMap((item) => item.spaces).length,
          activeSpaces: perWorkspace.flatMap((item) => item.spaces).filter((item) => item.isActive).length,
          projects: perWorkspace.flatMap((item) => item.projects).length,
          archivedProjects: perWorkspace.flatMap((item) => item.projects).filter((item) => item.isArchived).length,
          workspaceMembers: perWorkspace.flatMap((item) => item.workspaceMembers),
          spaceMembers: perWorkspace.flatMap((item) => item.spaceMembers),
          projectMembers: perWorkspace.flatMap((item) => item.projectMembers),
          workspaceNames: workspaces.map((item) => item.name),
          spaceNames: perWorkspace.flatMap((item) => item.spaces).map((item) => item.name),
          projectNames: perWorkspace.flatMap((item) => item.projects).map((item) => item.name)
        };

        if (!cancelled) {
          setSummary(nextSummary);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load system dashboard');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken]);

  const roleSignal = useMemo(() => {
    if (!summary) {
      return {
        workspaceAdmins: 0,
        spaceOwners: 0,
        pms: 0,
        projectAdmins: 0
      };
    }

    return {
      workspaceAdmins: summary.workspaceMembers.filter((item) => item.role === 'WORKSPACE_ADMIN' && item.status === 'ACTIVE').length,
      spaceOwners: summary.spaceMembers.filter((item) => item.role === 'OWNER' && item.status === 'ACTIVE').length,
      pms: summary.projectMembers.filter((item) => item.role === 'PM' && item.status === 'ACTIVE').length,
      projectAdmins: summary.projectMembers.filter((item) => item.role === 'PROJECT_ADMIN' && item.status === 'ACTIVE').length
    };
  }, [summary]);

  if (isLoading) {
    return <LoadingState label="Loading super admin dashboard..." />;
  }

  if (error) {
    return <EmptyState title="System dashboard unavailable" description={error} />;
  }

  if (!summary) {
    return <EmptyState title="No system overview yet" description="Create workspaces and spaces to populate the super admin control tower." />;
  }

  return (
    <div className="space-y-6 dashboard-fade-in">
      {/* Welcome banner */}
      <Card className="relative overflow-hidden border-white/[0.08]">
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/15 to-violet-500/10 blur-3xl" />
        <div className="absolute -left-12 -bottom-12 h-44 w-44 rounded-full bg-gradient-to-tr from-amber-400/10 to-transparent blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-400">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight text-white sm:text-3xl">
              {getGreeting()}, {user?.fullName ?? 'Super Admin'}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300/90">Full platform overview — workspaces, spaces, projects, and memberships across every governed scope.</p>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="danger">SUPER_ADMIN</Badge>
            <Badge tone="info">{user?.email ?? 'No session'}</Badge>
          </div>
        </div>
      </Card>

      {/* System metrics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon="🏢" label="Workspaces" value={summary.workspaces} note={`${summary.activeWorkspaces} active collaboration boundaries.`} accentColor="rgba(165,180,252,0.10)" />
        <SummaryMetric icon="🗂️" label="Spaces" value={summary.spaces} note={`${summary.activeSpaces} active operating areas.`} accentColor="rgba(138,230,217,0.10)" />
        <SummaryMetric icon="📊" label="Projects" value={summary.projects} note={`${summary.archivedProjects} archived projects parked.`} accentColor="rgba(251,191,36,0.10)" />
        <SummaryMetric icon="👥" label="Memberships" value={summary.workspaceMembers.length + summary.spaceMembers.length + summary.projectMembers.length} note="Total role assignments across all scopes." accentColor="rgba(192,132,252,0.10)" />
      </div>

      {/* Governance + Role coverage */}
      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="overflow-hidden">
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Governance visibility</p>
          <h3 className="mt-1 text-lg font-semibold text-white">What you can govern right now</h3>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              { icon: '🏗️', title: 'Workspace admin', desc: 'Create, update, archive, and inspect every top-level workspace boundary.' },
              { icon: '🗺️', title: 'Space topology', desc: 'See how delivery areas are grouped and how many are actively operating.' },
              { icon: '🔗', title: 'Membership hierarchy', desc: 'Track who has access at workspace, space, and project scope.' },
              { icon: '📈', title: 'Project coverage', desc: 'Observe project footprint across the platform.' },
            ].map((item) => (
              <div key={item.title} className="group rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4 transition-all duration-200 hover:border-white/15 hover:bg-white/[0.07]">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{item.icon}</span>
                  <p className="text-sm font-semibold text-white">{item.title}</p>
                </div>
                <p className="mt-2 text-[13px] leading-relaxed text-slate-300/80">{item.desc}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Role coverage</p>
          <div className="mt-4 space-y-1.5">
            {[
              { label: 'Workspace admins', value: roleSignal.workspaceAdmins, color: '#a5b4fc' },
              { label: 'Space owners', value: roleSignal.spaceOwners, color: '#8ae6d9' },
              { label: 'Project admins', value: roleSignal.projectAdmins, color: '#fbbf24' },
              { label: 'PMs in system', value: roleSignal.pms, color: '#c084fc' },
            ].map((item) => {
              const total = roleSignal.workspaceAdmins + roleSignal.spaceOwners + roleSignal.projectAdmins + roleSignal.pms;
              return <StatusBar key={item.label} label={item.label} value={item.value} total={total || 1} color={item.color} />;
            })}
          </div>

          <div className="mt-4 rounded-2xl border border-white/[0.07] bg-white/[0.04] p-4">
            <div className="flex items-center gap-3">
              <CircularProgress percent={summary.activeWorkspaces > 0 ? Math.round((summary.activeWorkspaces / summary.workspaces) * 100) : 0} size={72} strokeWidth={6} />
              <div>
                <p className="text-sm font-semibold text-white">Active rate</p>
                <p className="text-xs text-slate-400">{summary.activeWorkspaces}/{summary.workspaces} workspaces active</p>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Observed entities */}
      <div className="grid gap-6 xl:grid-cols-3">
        {[
          { icon: '🏢', label: 'Workspaces observed', names: summary.workspaceNames, emptyMsg: 'No workspaces found.' },
          { icon: '🗂️', label: 'Spaces observed', names: summary.spaceNames, emptyMsg: 'No spaces found.' },
          { icon: '📊', label: 'Projects observed', names: summary.projectNames, emptyMsg: 'No projects found.' },
        ].map((section) => (
          <Card key={section.label}>
            <div className="flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">{section.label}</p>
            </div>
            <div className="mt-4 space-y-2">
              {section.names.length > 0 ? section.names.slice(0, 5).map((name) => (
                <div key={name} className="flex items-center gap-2.5 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-white transition-colors hover:bg-white/[0.06]">
                  <span className="flex h-6 w-6 items-center justify-center rounded-md bg-white/10 text-[11px] font-bold">{name.charAt(0).toUpperCase()}</span>
                  {name}
                </div>
              )) : <p className="text-sm text-slate-400">{section.emptyMsg}</p>}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();

  if (user?.globalRole === 'SUPER_ADMIN') {
    return <SuperAdminDashboard />;
  }

  return <DeliveryDashboard />;
}
