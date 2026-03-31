
import { useEffect, useMemo, useState } from 'react';
import { Card } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
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
  memberships: ProjectMembership[];
  tasks: ApiTask[];
};

function SummaryMetric({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-200">{note}</p>
    </Card>
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
        const graph = await loadVisibleWorkGraph(tokens.accessToken, { includeProjectMemberships: true });

        if (!cancelled) {
          setSummary({
            workspaces: graph.workspaces,
            spaces: graph.spaces,
            projects: graph.projects,
            memberships: graph.projectMemberships,
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

  const currentMembership = useMemo(() => {
    if (!summary || !user) {
      return null;
    }

    return summary.memberships.find((item) => item.userId === user.id && item.status === 'ACTIVE') ?? null;
  }, [summary, user]);

  const myTasks = useMemo(() => {
    if (!summary || !user) {
      return [];
    }

    return summary.tasks.filter(
      (task) => task.createdBy === user.id || task.assigneeId === user.id || task.reporterId === user.id
    );
  }, [summary, user]);

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
    if (!summary || !user) {
      return [];
    }

    const activeProjectIds = new Set(
      summary.memberships.filter((item) => item.userId === user.id && item.status === 'ACTIVE').map((item) => item.projectId)
    );

    return summary.projects.filter((project) => activeProjectIds.has(project.id)).slice(0, 5);
  }, [summary, user]);

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
    <div className="space-y-6">
      <PageHeader
        eyebrow="Work dashboard"
        title="Execution command center"
        subtitle="Track the work that belongs to you right now: active tasks, progress, overdue items, and the projects that currently need your attention."
        actions={
          <>
            <Badge tone="info">{currentMembership?.role ?? user?.globalRole ?? 'Contributor'}</Badge>
            <Badge tone={metrics.overdue > 0 ? 'warning' : 'success'}>{metrics.overdue > 0 ? 'Needs attention' : 'On track'}</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="My tasks" value={metrics.total} note="Tasks where you are creator, assignee, or reporter." />
        <SummaryMetric label="In progress" value={metrics.inProgress} note="Work currently moving through execution stages." />
        <SummaryMetric label="Backlog & planned" value={metrics.backlog} note="Items still waiting for commitment or execution." />
        <SummaryMetric label="At risk" value={metrics.overdue} note={metrics.overdue > 0 ? 'Overdue work that needs attention now.' : 'No overdue work in your queue.'} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">My work queue</p>
          <h3 className="mt-3 text-xl font-semibold text-white">What needs movement next</h3>
          <div className="mt-5 space-y-3">
            {myWorkQueue.length > 0 ? myWorkQueue.map((task) => (
              <div key={task.id} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white">{task.title}</p>
                    <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">{task.status.split('_').join(' ')}</p>
                  </div>
                  <Badge tone={task.priority === 'CRITICAL' ? 'danger' : task.priority === 'HIGH' ? 'warning' : task.priority === 'MEDIUM' ? 'info' : 'neutral'}>{task.priority}</Badge>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-200">
                  <span>Due {task.dueDate ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(task.dueDate)) : 'someday'}</span>
                  {task.assigneeId === user?.id ? <Badge tone="success">Assigned to you</Badge> : null}
                  {task.createdBy === user?.id ? <Badge>Created by you</Badge> : null}
                </div>
              </div>
            )) : <p className="text-sm text-slate-200">No active work in your queue right now.</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Progress signal</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-4">
              <p className="text-sm text-slate-200">Completion rate</p>
              <p className="mt-2 text-3xl font-semibold text-white">{metrics.completionRate}%</p>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div className="h-2 rounded-full bg-emerald-400" style={{ width: `${metrics.completionRate}%` }} />
              </div>
            </div>
            {statusBreakdown.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                <span className="text-sm text-slate-200">{item.label}</span>
                <span className="text-sm font-semibold text-white">{item.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Projects in focus</p>
          <div className="mt-4 space-y-2">
            {focusProjects.length > 0 ? focusProjects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                <p className="text-sm font-semibold text-white">{project.name}</p>
                <p className="mt-1 text-sm text-slate-200">{project.description || 'No project description yet.'}</p>
              </div>
            )) : <p className="text-sm text-slate-200">No active project memberships yet.</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Work context</p>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Visible workspaces</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.workspaces.length}</p>
              <p className="mt-2 text-sm text-slate-200">Scopes you can currently navigate while doing work.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Visible projects</p>
              <p className="mt-2 text-2xl font-semibold text-white">{summary.projects.length}</p>
              <p className="mt-2 text-sm text-slate-200">Execution surfaces available from your memberships and ownership.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Current role</p>
              <p className="mt-2 text-2xl font-semibold text-white">{currentMembership?.role ?? 'Contributor'}</p>
              <p className="mt-2 text-sm text-slate-200">This influences what you can move, assign, and approve.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Specialization</p>
              <p className="mt-2 text-2xl font-semibold text-white">{user?.specialization ?? 'Unknown'}</p>
              <p className="mt-2 text-sm text-slate-200">Useful when work moves through QA, UAT, or role-based review gates.</p>
            </div>
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
    <div className="space-y-6">
      <PageHeader
        eyebrow="System overview"
        title="Super admin control tower"
        subtitle="Observe the full structure of the platform: workspaces, spaces, projects, and memberships across every governed scope."
        actions={
          <>
            <Badge tone="danger">SUPER_ADMIN</Badge>
            <Badge tone="info">{user?.email ?? 'No session'}</Badge>
          </>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric label="Workspaces" value={summary.workspaces} note={`${summary.activeWorkspaces} active collaboration boundaries under system control.`} />
        <SummaryMetric label="Spaces" value={summary.spaces} note={`${summary.activeSpaces} active operating areas across all workspaces.`} />
        <SummaryMetric label="Projects" value={summary.projects} note={`${summary.archivedProjects} archived projects currently parked in the system.`} />
        <SummaryMetric label="Memberships" value={summary.workspaceMembers.length + summary.spaceMembers.length + summary.projectMembers.length} note="Total role assignments across workspace, space, and project scopes." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Governance visibility</p>
          <h3 className="mt-3 text-xl font-semibold text-white">What you can govern right now</h3>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Workspace administration</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">Create, update, archive, and inspect every top-level workspace boundary.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Space topology</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">See how delivery areas are grouped under each workspace and how many are actively operating.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Membership hierarchy</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">Track who has access at workspace, space, and project scope without leaving the admin surface.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/6 p-4">
              <p className="text-sm font-semibold text-white">Project coverage</p>
              <p className="mt-2 text-sm leading-7 text-slate-200">Observe project footprint across the platform before diving into execution-level views.</p>
            </div>
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Role coverage</p>
          <div className="mt-4 space-y-3">
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              <span className="text-sm text-slate-200">Workspace admins</span>
              <span className="text-sm font-semibold text-white">{roleSignal.workspaceAdmins}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              <span className="text-sm text-slate-200">Space owners</span>
              <span className="text-sm font-semibold text-white">{roleSignal.spaceOwners}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              <span className="text-sm text-slate-200">Project admins</span>
              <span className="text-sm font-semibold text-white">{roleSignal.projectAdmins}</span>
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
              <span className="text-sm text-slate-200">PMs in system</span>
              <span className="text-sm font-semibold text-white">{roleSignal.pms}</span>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Workspaces observed</p>
          <div className="mt-4 space-y-2">
            {summary.workspaceNames.length > 0 ? summary.workspaceNames.slice(0, 5).map((name) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white">{name}</div>
            )) : <p className="text-sm text-slate-200">No workspaces found.</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Spaces observed</p>
          <div className="mt-4 space-y-2">
            {summary.spaceNames.length > 0 ? summary.spaceNames.slice(0, 5).map((name) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white">{name}</div>
            )) : <p className="text-sm text-slate-200">No spaces found.</p>}
          </div>
        </Card>

        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Projects observed</p>
          <div className="mt-4 space-y-2">
            {summary.projectNames.length > 0 ? summary.projectNames.slice(0, 5).map((name) => (
              <div key={name} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm text-white">{name}</div>
            )) : <p className="text-sm text-slate-200">No projects found.</p>}
          </div>
        </Card>
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
