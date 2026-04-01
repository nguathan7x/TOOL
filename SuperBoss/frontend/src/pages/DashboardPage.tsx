import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { useAuth } from '../features/auth/hooks/useAuth';
import { adminApi } from '../features/admin/api/adminApi';
import { type ApiTask } from '../features/projects/api/projectsApi';
import { loadVisibleWorkGraph } from '../features/workspaces/api/visible-work-graph';
import type { Project, ProjectMembership, Space, SpaceMembership, Workspace, WorkspaceMembership } from '../features/admin/types';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faListCheck,
  faChartLine,
  faInbox,
  faTriangleExclamation,
  faTrophy,
  faDiagramProject,
  faBriefcase,
  faShieldHalved,
  faBolt,
  faObjectGroup,
  faUserGroup,
  faGears,
  faProjectDiagram,
  faCodeMerge,
  faGlobe
} from '@fortawesome/free-solid-svg-icons';

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

type DashboardIconName =
  | 'tasks'
  | 'velocity'
  | 'backlog'
  | 'risk'
  | 'celebration'
  | 'workspace'
  | 'project'
  | 'shield'
  | 'spark'
  | 'space'
  | 'members'
  | 'governance'
  | 'topology'
  | 'hierarchy'
  | 'coverage';

function DashboardIcon({ name, className = "h-6 w-6" }: { name: DashboardIconName; className?: string }) {
  const commonProps = { className: `${className} drop-shadow-[0_2px_8px_rgba(255,255,255,0.4)]` };

  switch (name) {
    case 'tasks': return <FontAwesomeIcon icon={faListCheck} color="#c084fc" {...commonProps} />;
    case 'velocity': return <FontAwesomeIcon icon={faChartLine} color="#38bdf8" {...commonProps} />;
    case 'backlog': return <FontAwesomeIcon icon={faInbox} color="#94a3b8" {...commonProps} />;
    case 'risk': return <FontAwesomeIcon icon={faTriangleExclamation} color="#f43f5e" {...commonProps} />;
    case 'celebration': return <FontAwesomeIcon icon={faTrophy} color="#10b981" {...commonProps} />;
    case 'workspace': return <FontAwesomeIcon icon={faDiagramProject} color="#a78bfa" {...commonProps} />;
    case 'project': return <FontAwesomeIcon icon={faBriefcase} color="#fcd34d" {...commonProps} />;
    case 'shield': return <FontAwesomeIcon icon={faShieldHalved} color="#10b981" {...commonProps} />;
    case 'spark': return <FontAwesomeIcon icon={faBolt} color="#fb923c" {...commonProps} />;
    case 'space': return <FontAwesomeIcon icon={faObjectGroup} color="#38bdf8" {...commonProps} />;
    case 'members': return <FontAwesomeIcon icon={faUserGroup} color="#f472b6" {...commonProps} />;
    case 'governance': return <FontAwesomeIcon icon={faGears} color="#6366f1" {...commonProps} />;
    case 'topology': return <FontAwesomeIcon icon={faProjectDiagram} color="#14b8a6" {...commonProps} />;
    case 'hierarchy': return <FontAwesomeIcon icon={faCodeMerge} color="#eab308" {...commonProps} />;
    case 'coverage': return <FontAwesomeIcon icon={faGlobe} color="#f43f5e" {...commonProps} />;
    default: return null;
  }
}

const PRIORITY_ICON: Record<string, DashboardIconName> = {
  CRITICAL: 'risk',
  HIGH: 'spark',
  MEDIUM: 'velocity',
  LOW: 'backlog',
};

// Modern SaaS Glassmorphic Components
function GlassCard({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.02] backdrop-blur-[40px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] transition-all duration-300 ${className}`}>
      {/* Subtle top glare */}
      <div className="absolute inset-0 z-0 h-px w-full bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="relative z-10 w-full h-full p-6">
        {children}
      </div>
    </div>
  );
}

function SummaryMetric({ label, value, note, icon, accentColor }: { label: string; value: number | string; note: string; icon: ReactNode; accentColor?: string }) {
  return (
    <GlassCard className="group hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.04] !p-0">
      <div className="absolute inset-0 opacity-40 transition-opacity duration-300 group-hover:opacity-70" style={{ background: `radial-gradient(circle at 80% 0%, ${accentColor ?? 'rgba(184,196,255,0.08)'}, transparent 60%)` }} />
      <div className="relative p-6 px-7">
        <div className="flex items-center justify-between">
          <p className="text-[0.7rem] font-bold uppercase tracking-[0.15em] text-slate-300 drop-shadow-sm">{label}</p>
          <span className="inline-flex h-14 w-14 items-center justify-center rounded-[1.2rem] bg-white/[0.03] border border-white/5 shadow-[inset_0_2px_10px_rgba(255,255,255,0.06),0_10px_20px_rgba(0,0,0,0.2)]">
            {icon}
          </span>
        </div>
        <p className="mt-5 text-[2.75rem] font-extrabold tracking-[-0.04em] text-transparent bg-clip-text bg-gradient-to-br from-white to-slate-400 drop-shadow-sm leading-none">{value}</p>
        <p className="mt-4 text-[13px] font-medium leading-relaxed text-slate-400">{note}</p>
      </div>
    </GlassCard>
  );
}

function CircularProgress({ percent, size = 110, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <svg width={size} height={size} className="drop-shadow-[0_10px_20px_rgba(0,0,0,0.4)]">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth={strokeWidth} />
      {/* Glow outline */}
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgba(52,211,153,0.3)" strokeWidth={strokeWidth + 4} strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="blur-md" style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }} />
      {/* Main Track */}
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke="url(#progressGradient)" strokeWidth={strokeWidth}
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        className="transition-all duration-1000 ease-out"
        style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
      </defs>
      <text x="50%" y="50%" textAnchor="middle" dy="0.35em" className="fill-white text-2xl font-extrabold drop-shadow-md">{percent}%</text>
    </svg>
  );
}

function StatusBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="group relative flex flex-col gap-2 rounded-[1.25rem] border border-white/5 bg-white/[0.02] p-4 transition-all hover:bg-white/[0.04]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: color, color: color }} />
          <span className="text-[13px] font-semibold text-slate-200">{label}</span>
        </div>
        <span className="text-[14px] font-bold text-white drop-shadow-sm">{value}</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-black/40 shadow-inner">
        <div className="h-full rounded-full transition-all duration-700 ease-out shadow-[0_0_8px_currentColor]" style={{ width: `${pct}%`, backgroundColor: color, color: color }} />
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
    return () => { cancelled = true; };
  }, [tokens?.accessToken]);

  const myTasks = useMemo(() => {
    if (!summary || !user) return [];
    return summary.tasks.filter((task) => task.createdBy === user.id || task.assigneeId === user.id || task.reporterId === user.id);
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
    if (!summary) return [];
    return summary.projects.filter((project) => myProjectIds.has(project.id)).slice(0, 5);
  }, [myProjectIds, summary]);

  const myWorkQueue = useMemo(() => {
    return [...myTasks]
      .filter((task) => task.status !== 'DONE')
      .sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
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

  if (isLoading) return <LoadingState label="Loading delivery dashboard..." />;
  if (error) return <EmptyState title="Dashboard unavailable" description={error} />;
  if (!summary) return <EmptyState title="No workspace access yet" description="Once you create or join a workspace, your delivery dashboard will populate here." />;

  return (
    <div className="relative space-y-8 dashboard-fade-in p-2">
      {/* Dramatic ambient background blobs strictly for dashboard */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] h-[500px] w-[500px] rounded-full bg-[#38bdf8] opacity-[0.15] blur-[120px] mix-blend-screen" />
        <div className="absolute top-[20%] right-[-10%] h-[600px] w-[600px] rounded-full bg-[#c084fc] opacity-[0.12] blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-[-10%] left-[20%] h-[400px] w-[400px] rounded-full bg-[#34d399] opacity-[0.1] blur-[100px] mix-blend-screen" />
      </div>

      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.01] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 z-0 h-64 w-64 rounded-full bg-gradient-to-br from-[#7ae7cf]/30 to-[#7f97ff]/20 blur-[80px]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-[#9ab0ff]/80 truncate">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h2 className="mt-4 text-[2.5rem] font-extrabold tracking-[-0.03em] text-white drop-shadow-md sm:text-[3.2rem]">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{user?.fullName ?? user?.email?.split('@')[0] ?? 'there'}</span>
            </h2>
            <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-300">Here's your execution snapshot — active tasks, progress, and the projects that need your attention today.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white shadow-sm backdrop-blur-md">{user?.globalRole ?? 'Contributor'}</span>
            <span className={`rounded-full px-4 py-2 text-sm font-bold shadow-sm backdrop-blur-md ${metrics.overdue > 0 ? 'bg-rose-500/20 text-rose-200 border border-rose-500/30' : 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30'}`}>
              {metrics.overdue > 0 ? `${metrics.overdue} overdue` : 'On track'}
            </span>
          </div>
        </div>
      </div>

      {/* Metric cards */}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={<DashboardIcon name="tasks" className="h-7 w-7" />} label="My tasks" value={metrics.total} note="Tasks where you are creator, assignee, or reporter." accentColor="rgba(165,180,252,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="velocity" className="h-7 w-7" />} label="In progress" value={metrics.inProgress} note="Work currently moving through execution stages." accentColor="rgba(96,165,250,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="backlog" className="h-7 w-7" />} label="Backlog & planned" value={metrics.backlog} note="Items still waiting for commitment." accentColor="rgba(148,163,184,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="risk" className="h-7 w-7" />} label="At risk" value={metrics.overdue} note={metrics.overdue > 0 ? 'Overdue work that needs attention now.' : 'No overdue work — great job!'} accentColor={metrics.overdue > 0 ? 'rgba(251,113,133,0.3)' : 'rgba(52,211,153,0.2)'} />
      </div>

      {/* Work queue + Progress */}
      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassCard>
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#7ae7cf]">My work queue</p>
              <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-white drop-shadow-sm">What needs movement next</h3>
            </div>
            {myWorkQueue.length > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">Top {myWorkQueue.length}</span>}
          </div>
          <div className="space-y-4">
            {myWorkQueue.length > 0 ? myWorkQueue.map((task, idx) => {
              const isOverdue = task.status !== 'DONE' && task.dueDate && new Date(task.dueDate).getTime() < Date.now();
              return (
                <div key={task.id} className="group relative flex items-center gap-4 rounded-[1.5rem] border border-white/5 bg-white/[0.03] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.05]" style={{ animationDelay: `${idx * 50}ms` }}>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-black/20 shadow-inner">
                    <DashboardIcon name={PRIORITY_ICON[task.priority] ?? 'backlog'} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-base font-bold text-white drop-shadow-sm truncate">{task.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2.5">
                      <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wider shadow-[inset_0_1px_4px_rgba(0,0,0,0.3)]" style={{ backgroundColor: `${STATUS_COLORS[task.status]}22`, color: STATUS_COLORS[task.status] }}>
                        <span className="h-2 w-2 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: STATUS_COLORS[task.status] }} />
                        {task.status.split('_').join(' ')}
                      </span>
                      <span className={`text-[12px] font-medium ${isOverdue ? 'text-rose-400 drop-shadow-[0_0_5px_rgba(251,113,133,0.5)]' : 'text-slate-400'}`}>
                        {isOverdue ? '⚠ Overdue · ' : ''}Due {task.dueDate ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(new Date(task.dueDate)) : 'someday'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center p-12 text-center rounded-[2rem] border border-dashed border-white/10 bg-white/[0.01]">
                <DashboardIcon name="celebration" className="h-16 w-16 opacity-80" />
                <p className="mt-6 text-lg font-bold text-white">Queue cleared!</p>
                <p className="mt-2 text-sm text-slate-400">No active work right now. Enjoy the calm.</p>
              </div>
            )}
          </div>
        </GlassCard>

        <div className="space-y-8 flex flex-col">
          <GlassCard className="flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-6">Completion rate</p>
            <div className="flex items-center gap-8 justify-center py-4">
              <CircularProgress percent={metrics.completionRate} />
              <div className="flex flex-col">
                <p className="text-[3rem] font-extrabold text-white leading-none drop-shadow-md">{metrics.completed}</p>
                <p className="text-lg font-medium text-slate-400">of {metrics.total} tasks</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="flex-1 !p-6">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-6">Status breakdown</p>
            <div className="grid grid-cols-2 gap-4">
              {statusBreakdown.map((item) => (
                <StatusBar key={item.label} label={item.label} value={item.value} total={metrics.total} color={STATUS_COLORS[item.label === 'In Progress' ? 'IN_PROGRESS' : item.label.toUpperCase()] ?? '#94a3b8'} />
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Projects + Work context */}
      <div className="grid gap-8 xl:grid-cols-2">
        <GlassCard>
          <div className="flex items-center justify-between mb-8">
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">Projects in focus</p>
            {focusProjects.length > 0 && <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">{focusProjects.length}</span>}
          </div>
          <div className="space-y-4">
            {focusProjects.length > 0 ? focusProjects.map((project) => {
              const projectTasks = myTasks.filter((t) => t.projectId === project.id);
              const projectDone = projectTasks.filter((t) => t.status === 'DONE').length;
              const projectPct = projectTasks.length > 0 ? Math.round((projectDone / projectTasks.length) * 100) : 0;
              return (
                <div key={project.id} className="group rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-1 hover:bg-white/[0.05] hover:border-white/20">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[1rem] bg-gradient-to-br from-[#8ae6d9]/30 to-[#a5b4fc]/30 text-lg font-extrabold text-white shadow-inner backdrop-blur-md">
                      {project.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-lg font-bold text-white truncate drop-shadow-sm">{project.name}</p>
                      <p className="mt-1 truncate text-[13px] font-medium text-slate-400">{project.description || 'No project description yet.'}</p>
                    </div>
                  </div>
                  {projectTasks.length > 0 && (
                    <div className="mt-5">
                      <div className="mb-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-300">
                        <span>{projectDone} / {projectTasks.length} Done</span>
                        <span>{projectPct}%</span>
                      </div>
                      <div className="h-2.5 w-full overflow-hidden rounded-full bg-black/30 shadow-inner">
                        <div className="h-full rounded-full bg-gradient-to-r from-[#34d399] to-[#38bdf8] shadow-[0_0_10px_#34d399] transition-all duration-1000 ease-out" style={{ width: `${projectPct}%` }} />
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <DashboardIcon name="project" className="h-14 w-14 opacity-50" />
                <p className="mt-4 text-sm text-slate-400">No active project memberships yet.</p>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300 mb-8">Work context</p>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: <DashboardIcon name="workspace" className="h-8 w-8" />, label: 'Workspaces', value: summary.workspaces.length, desc: 'Scopes you can currently navigate.' },
              { icon: <DashboardIcon name="project" className="h-8 w-8" />, label: 'Projects', value: summary.projects.length, desc: 'Execution surfaces from memberships.' },
              { icon: <DashboardIcon name="shield" className="h-8 w-8" />, label: 'Role', value: user?.globalRole ?? 'Contributor', desc: 'Influences what you can move & approve.' },
              { icon: <DashboardIcon name="spark" className="h-8 w-8" />, label: 'Specialization', value: user?.specialization ?? 'General', desc: 'Used for QA, UAT, or role-based gates.' },
            ].map((item) => (
              <div key={item.label} className="group rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all duration-300 hover:border-white/20 hover:bg-white/[0.05]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1rem] bg-black/20 shadow-inner">
                  {item.icon}
                </div>
                <p className="text-xs font-bold uppercase tracking-[0.1em] text-slate-400">{item.label}</p>
                <p className="mt-1 text-2xl font-extrabold text-white drop-shadow-sm">{item.value}</p>
                <p className="mt-2 text-[12px] font-medium leading-relaxed text-slate-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>
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
      if (!tokens?.accessToken) { setIsLoading(false); return; }
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
                return { space, projects, spaceMembers: spaceMembersResponse.items, projectMembers: projectMembersGroups.flatMap((g) => g.items) };
              })
            );
            return {
              workspace, workspaceMembers: workspaceMembersResponse.items,
              spaces: nested.map((i) => i.space), projects: nested.flatMap((i) => i.projects),
              spaceMembers: nested.flatMap((i) => i.spaceMembers), projectMembers: nested.flatMap((i) => i.projectMembers)
            };
          })
        );
        const nextSummary: SuperAdminSummary = {
          workspaces: workspaces.length,
          activeWorkspaces: workspaces.filter((i) => i.isActive).length,
          spaces: perWorkspace.flatMap((i) => i.spaces).length,
          activeSpaces: perWorkspace.flatMap((i) => i.spaces).filter((i) => i.isActive).length,
          projects: perWorkspace.flatMap((i) => i.projects).length,
          archivedProjects: perWorkspace.flatMap((i) => i.projects).filter((i) => i.isArchived).length,
          workspaceMembers: perWorkspace.flatMap((i) => i.workspaceMembers),
          spaceMembers: perWorkspace.flatMap((i) => i.spaceMembers),
          projectMembers: perWorkspace.flatMap((i) => i.projectMembers),
          workspaceNames: workspaces.map((i) => i.name),
          spaceNames: perWorkspace.flatMap((i) => i.spaces).map((i) => i.name),
          projectNames: perWorkspace.flatMap((i) => i.projects).map((i) => i.name)
        };
        if (!cancelled) setSummary(nextSummary);
      } catch (nextError) {
        if (!cancelled) setError(nextError instanceof Error ? nextError.message : 'Failed to load system dashboard');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [tokens?.accessToken]);

  const roleSignal = useMemo(() => {
    if (!summary) return { workspaceAdmins: 0, spaceOwners: 0, pms: 0, projectAdmins: 0 };
    return {
      workspaceAdmins: summary.workspaceMembers.filter((i) => i.role === 'WORKSPACE_ADMIN' && i.status === 'ACTIVE').length,
      spaceOwners: summary.spaceMembers.filter((i) => i.role === 'OWNER' && i.status === 'ACTIVE').length,
      pms: summary.projectMembers.filter((i) => i.role === 'PM' && i.status === 'ACTIVE').length,
      projectAdmins: summary.projectMembers.filter((i) => i.role === 'PROJECT_ADMIN' && i.status === 'ACTIVE').length
    };
  }, [summary]);

  if (isLoading) return <LoadingState label="Loading super admin dashboard..." />;
  if (error) return <EmptyState title="System dashboard unavailable" description={error} />;
  if (!summary) return <EmptyState title="No system overview yet" description="Create workspaces and spaces to populate the super admin control tower." />;

  return (
    <div className="relative space-y-8 dashboard-fade-in p-2">
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-[#f43f5e] opacity-[0.1] blur-[150px] mix-blend-screen" />
        <div className="absolute bottom-0 left-0 h-[500px] w-[500px] rounded-full bg-[#6366f1] opacity-[0.12] blur-[120px] mix-blend-screen" />
      </div>

      <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.01] p-10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-3xl">
        <div className="absolute -right-20 -top-20 z-0 h-64 w-64 rounded-full bg-gradient-to-br from-rose-500/20 to-violet-500/20 blur-[80px]" />
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-widest text-slate-400">{new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date())}</p>
            <h2 className="mt-4 text-[2.5rem] font-extrabold tracking-[-0.03em] text-white drop-shadow-md sm:text-[3.2rem]">
              {getGreeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">{user?.fullName ?? 'Super Admin'}</span>
            </h2>
            <p className="mt-3 max-w-xl text-base font-medium leading-relaxed text-slate-300">Full platform overview — workspaces, spaces, projects, and memberships across every governed scope.</p>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-4 py-2 text-sm font-bold text-rose-200 shadow-sm backdrop-blur-md">SUPER_ADMIN</span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric icon={<DashboardIcon name="workspace" className="h-7 w-7" />} label="Workspaces" value={summary.workspaces} note={`${summary.activeWorkspaces} active boundaries.`} accentColor="rgba(165,180,252,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="space" className="h-7 w-7" />} label="Spaces" value={summary.spaces} note={`${summary.activeSpaces} operating areas.`} accentColor="rgba(56,189,248,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="coverage" className="h-7 w-7" />} label="Projects" value={summary.projects} note={`${summary.archivedProjects} archived.`} accentColor="rgba(251,146,60,0.2)" />
        <SummaryMetric icon={<DashboardIcon name="members" className="h-7 w-7" />} label="Memberships" value={summary.workspaceMembers.length + summary.spaceMembers.length + summary.projectMembers.length} note="Total role assignments." accentColor="rgba(244,114,182,0.2)" />
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.3fr_0.7fr]">
        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#38bdf8] mb-8">Governance visibility</p>
          <div className="grid gap-6 sm:grid-cols-2">
            {[
              { icon: <DashboardIcon name="governance" className="h-8 w-8" />, title: 'Workspace admin', desc: 'Manage every top-level boundary.' },
              { icon: <DashboardIcon name="topology" className="h-8 w-8" />, title: 'Space topology', desc: 'See how delivery areas are grouped.' },
              { icon: <DashboardIcon name="hierarchy" className="h-8 w-8" />, title: 'Membership hierarchy', desc: 'Track comprehensive access.' },
              { icon: <DashboardIcon name="coverage" className="h-8 w-8" />, title: 'Project coverage', desc: 'Observe global footprint.' },
            ].map((item) => (
              <div key={item.title} className="group rounded-[1.5rem] border border-white/5 bg-white/[0.02] p-5 shadow-[0_8px_20px_rgba(0,0,0,0.2)] transition-all hover:bg-white/[0.05] hover:-translate-y-1 hover:border-white/20">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[1rem] bg-black/20 shadow-inner">
                  {item.icon}
                </div>
                <p className="text-lg font-bold text-white drop-shadow-sm">{item.title}</p>
                <p className="mt-2 text-sm font-medium text-slate-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard>
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#a78bfa] mb-8">Role coverage</p>
          <div className="space-y-4">
            {[
              { label: 'Workspace admins', value: roleSignal.workspaceAdmins, color: '#a78bfa' },
              { label: 'Space owners', value: roleSignal.spaceOwners, color: '#38bdf8' },
              { label: 'Project admins', value: roleSignal.projectAdmins, color: '#fcd34d' },
              { label: 'PMs in system', value: roleSignal.pms, color: '#c084fc' },
            ].map((item) => {
              const total = Math.max(1, roleSignal.workspaceAdmins + roleSignal.spaceOwners + roleSignal.projectAdmins + roleSignal.pms);
              return <StatusBar key={item.label} label={item.label} value={item.value} total={total} color={item.color} />;
            })}
          </div>
          <div className="mt-8 flex items-center gap-6 rounded-[1.5rem] border border-white/5 bg-black/20 p-6 shadow-inner">
            <CircularProgress percent={summary.activeWorkspaces > 0 ? Math.round((summary.activeWorkspaces / summary.workspaces) * 100) : 0} size={80} strokeWidth={8} />
            <div>
              <p className="text-lg font-extrabold text-white drop-shadow-sm">Active rate</p>
              <p className="mt-1 text-sm font-medium text-slate-400">{summary.activeWorkspaces} of {summary.workspaces} active</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {[
          { icon: <DashboardIcon name="workspace" className="h-7 w-7" />, label: 'Workspaces observed', names: summary.workspaceNames, emptyMsg: 'No workspaces found.' },
          { icon: <DashboardIcon name="space" className="h-7 w-7" />, label: 'Spaces observed', names: summary.spaceNames, emptyMsg: 'No spaces found.' },
          { icon: <DashboardIcon name="coverage" className="h-7 w-7" />, label: 'Projects observed', names: summary.projectNames, emptyMsg: 'No projects found.' },
        ].map((section) => (
          <GlassCard key={section.label}>
            <div className="flex items-center gap-4 mb-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-[1rem] bg-black/20 shadow-inner">
                {section.icon}
              </div>
              <p className="text-xs font-bold uppercase tracking-[0.15em] text-slate-300">{section.label}</p>
            </div>
            <div className="space-y-3">
              {section.names.length > 0 ? section.names.slice(0, 5).map((name) => (
                <div key={name} className="flex items-center gap-3 rounded-[1rem] border border-white/5 bg-white/[0.02] p-3 text-sm font-bold text-white shadow-sm transition-all hover:bg-white/[0.05]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 text-[11px] font-extrabold">{name.charAt(0).toUpperCase()}</span>
                  <span className="truncate drop-shadow-sm">{name}</span>
                </div>
              )) : <p className="text-sm font-medium text-slate-400">{section.emptyMsg}</p>}
            </div>
          </GlassCard>
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
