import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { Project, Space, Workspace } from '../features/admin/types';
import { type ApiTask } from '../features/projects/api/projectsApi';
import { formatShortDate, prettyStatus, priorityTone } from '../features/projects/task-helpers';
import { loadVisibleWorkGraph } from '../features/workspaces/api/visible-work-graph';

type TaskSurface = {
  task: ApiTask;
  workspace: Workspace;
  space: Space;
  project: Project;
};

type FilterKey = 'all' | 'assigned' | 'today' | 'overdue' | 'active' | 'done';

const FILTERS: Array<{ key: FilterKey; label: string }> = [
  { key: 'assigned', label: 'Assigned' },
  { key: 'active', label: 'Active' },
  { key: 'today', label: 'Today' },
  { key: 'overdue', label: 'Overdue' },
  { key: 'done', label: 'Done' },
  { key: 'all', label: 'All' }
];

function startOfToday() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

export function MyTasksPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, tokens } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<TaskSurface[]>([]);
  const initialFilter = (searchParams.get('filter') as FilterKey | null);
  const [filter, setFilter] = useState<FilterKey>(FILTERS.some((item) => item.key === initialFilter) ? (initialFilter as FilterKey) : 'assigned');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!tokens?.accessToken || !user?.id) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const graph = await loadVisibleWorkGraph(tokens.accessToken);
        const workspaceById = new Map(graph.workspaces.map((workspace) => [workspace.id, workspace]));
        const spaceById = new Map(graph.spaces.map((space) => [space.id, space]));
        const projectById = new Map(graph.projects.map((project) => [project.id, project]));

        const nextItems: TaskSurface[] = graph.tasks
          .filter((task) => task.createdBy === user.id || task.assigneeId === user.id || task.reporterId === user.id)
          .flatMap((task) => {
            const project = projectById.get(task.projectId);
            const space = project ? spaceById.get(project.spaceId) : undefined;
            const workspace = project ? workspaceById.get(project.workspaceId) : undefined;

            if (!project || !space || !workspace) {
              return [];
            }

            return [{ task, project, space, workspace }];
          });

        if (!cancelled) {
          setItems(nextItems);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load your tasks');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken, user?.id]);

  useEffect(() => {
    const nextFilter = searchParams.get('filter') as FilterKey | null;
    if (nextFilter && FILTERS.some((item) => item.key === nextFilter) && nextFilter !== filter) {
      setFilter(nextFilter);
    }
  }, [filter, searchParams]);

  const today = useMemo(() => startOfToday(), []);

  const metrics = useMemo(() => {
    const total = items.length;
    const assigned = items.filter((item) => item.task.assigneeId === user?.id && item.task.status !== 'DONE').length;
    const overdue = items.filter((item) => item.task.status !== 'DONE' && item.task.dueDate && new Date(item.task.dueDate).getTime() < today.getTime()).length;
    const todayCount = items.filter((item) => {
      if (!item.task.dueDate || item.task.status === 'DONE') return false;
      const due = new Date(item.task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() == today.getTime();
    }).length;
    const done = items.filter((item) => item.task.status === 'DONE').length;
    return { total, assigned, overdue, todayCount, done };
  }, [items, today, user?.id]);

  const filteredItems = useMemo(() => {
    const term = search.trim().toLowerCase();

    return items
      .filter((item) => {
        const task = item.task;
        const matchesSearch = !term || `${task.title} ${task.description} ${item.project.name} ${item.space.name} ${item.workspace.name}`.toLowerCase().includes(term);
        if (!matchesSearch) return false;

        if (filter === 'done') return task.status === 'DONE';
        if (filter === 'assigned') return task.assigneeId === user?.id && task.status !== 'DONE';
        if (filter === 'active') return task.status !== 'DONE';
        if (filter === 'overdue') {
          const dueDate = task.dueDate;
          if (!dueDate || task.status === 'DONE') return false;
          return new Date(dueDate).getTime() < today.getTime();
        }
        if (filter === 'today') {
          if (!task.dueDate || task.status === 'DONE') return false;
          const due = new Date(task.dueDate);
          due.setHours(0, 0, 0, 0);
          return due.getTime() == today.getTime();
        }
        return true;
      })
      .sort((left, right) => {
        if (left.task.status === 'DONE' && right.task.status != 'DONE') return 1;
        if (left.task.status != 'DONE' && right.task.status === 'DONE') return -1;
        const leftDue = left.task.dueDate;
        const rightDue = right.task.dueDate;
        if (!leftDue && !rightDue) return 0;
        if (!leftDue) return 1;
        if (!rightDue) return -1;
        return new Date(leftDue).getTime() - new Date(rightDue).getTime();
      });
  }, [filter, items, search, today]);

  function openProjectSurface(item: TaskSurface) {
    navigate('/projects?view=board', {
      state: {
        preferredWorkspaceId: item.workspace.id,
        preferredSpaceId: item.space.id,
        preferredProjectId: item.project.id
      }
    });
  }

  function openTaskSurface(item: TaskSurface) {
    navigate('/projects?view=board', {
      state: {
        preferredWorkspaceId: item.workspace.id,
        preferredSpaceId: item.space.id,
        preferredProjectId: item.project.id,
        preferredTaskId: item.task.id
      }
    });
  }

  if (isLoading) {
    return <LoadingState label="Loading your tasks..." />;
  }

  if (error) {
    return <EmptyState title="My tasks unavailable" description={error} />;
  }

  return (
    <div className="space-y-6 pb-6">
      <PageHeader
        eyebrow="Work inbox"
        title="My tasks"
        subtitle="Your personal work inbox across every project: what you own, what is due, and what needs your next move."
        actions={<Badge tone="info">{metrics.assigned} assigned now</Badge>}
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Assigned</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics.assigned}</p>
          <p className="mt-2 text-sm text-slate-200">Active tasks owned by you.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Due today</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics.todayCount}</p>
          <p className="mt-2 text-sm text-slate-200">Things to close out today.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Overdue</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics.overdue}</p>
          <p className="mt-2 text-sm text-slate-200">Work that needs attention now.</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Done</p>
          <p className="mt-3 text-3xl font-semibold text-white">{metrics.done}</p>
          <p className="mt-2 text-sm text-slate-200">Completed tasks linked to you.</p>
        </Card>
      </div>

      <Card className="space-y-4">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Task focus</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Your working queue</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const active = item.key === filter;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => { setFilter(item.key); setSearchParams((current) => { const next = new URLSearchParams(current); next.set('filter', item.key); return next; }); }}
                  className={active ? 'rounded-xl border border-[#8f9cff]/40 bg-[#8f9cff]/18 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(111,132,255,0.16)]' : 'rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white'}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search your tasks"
            className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60"
          />
          <div className="rounded-xl border border-white/10 bg-[#0d1628] px-4 py-3 text-sm text-slate-200">
            Inbox shows <span className="font-semibold text-white">{filteredItems.length}</span>
          </div>
        </div>

        <div className="space-y-3">
          {filteredItems.length > 0 ? filteredItems.map((item) => {
            const task = item.task;
            const isAssignedToYou = task.assigneeId === user?.id;
            const isCreatedByYou = task.createdBy === user?.id;
            const isReporter = task.reporterId === user?.id;
            return (
              <div key={task.id} className="rounded-[1.5rem] border border-white/10 bg-[#101a2d] p-5 shadow-[0_16px_34px_rgba(0,0,0,0.16)]">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">#{task.sequenceNumber}</span>
                      <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                      <Badge>{prettyStatus(task.status)}</Badge>
                      {isAssignedToYou ? <Badge tone="success">Assigned to you</Badge> : null}
                      {isCreatedByYou ? <Badge tone="info">Created by you</Badge> : null}
                      {!isCreatedByYou && isReporter ? <Badge>Reported by you</Badge> : null}
                    </div>
                    <h3 className="mt-3 text-lg font-semibold text-white">{task.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{task.description || 'No description added yet.'}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {task.labels.slice(0, 3).map((label) => <Badge key={label}>{label}</Badge>)}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2 xl:w-[420px]">
                    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Project</p>
                      <p className="mt-2 text-sm font-semibold text-white">{item.project.name}</p>
                      <p className="mt-1 text-xs text-slate-300">{item.space.name} / {item.workspace.name}</p>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">Due</p>
                      <p className="mt-2 text-sm font-semibold text-white">{formatShortDate(task.dueDate, 'No due date')}</p>
                      <p className="mt-1 text-xs text-slate-300">{task.dueDate && task.status !== 'DONE' && new Date(task.dueDate).getTime() < today.getTime() ? 'Overdue' : 'On track'}</p>
                    </div>
                    <div className="md:col-span-2 flex flex-wrap gap-2 xl:justify-end">
                      <Button onClick={() => openTaskSurface(item)}>Open task</Button>
                      <Button variant="secondary" onClick={() => openProjectSurface(item)}>Open project</Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }) : <EmptyState title="No tasks match this view" description="Try another filter or clear your search." />}
        </div>
      </Card>
    </div>
  );
}
