import { useMemo, useState } from 'react';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/ui/EmptyState';
import type { ProjectMembership, Project, Space, Workspace } from '../../admin/types';
import { projectsApi, type ApiTask } from '../api/projectsApi';
import { isValidScheduleInput, normalizeStatus, priorityTone } from '../task-helpers';

type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type TaskType = 'TASK' | 'BUG' | 'STORY' | 'SPIKE';

type BacklogFormState = {
  title: string;
  description: string;
  priority: TaskPriority;
  taskType: TaskType;
  assigneeId: string;
  labels: string;
  startDate: string;
  dueDate: string;
  estimateHours: string;
};

const EMPTY_BACKLOG_FORM: BacklogFormState = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  taskType: 'TASK',
  assigneeId: '',
  labels: '',
  startDate: '',
  dueDate: '',
  estimateHours: ''
};

function parseLabels(raw: string) {
  return raw.split(',').map((item) => item.trim()).filter(Boolean);
}

export function ProjectBacklogPanel({ token, userId, workspace, space, project, tasks, members, currentRole, canManageProjectFlow, projectExecutionLocked, onTaskOpen, onTaskCreated, onTaskUpdated, onTaskDeleted }: {
  token: string;
  userId?: string;
  workspace: Workspace;
  space: Space;
  project: Project;
  tasks: ApiTask[];
  members: ProjectMembership[];
  currentRole?: ProjectMembership['role'];
  canManageProjectFlow: boolean;
  projectExecutionLocked: boolean;
  onTaskOpen: (taskId: string) => void;
  onTaskCreated: (task: ApiTask) => void;
  onTaskUpdated: (task: ApiTask) => void;
  onTaskDeleted: (taskId: string) => void;
}) {
  const canCreate = (currentRole === 'PROJECT_ADMIN' || currentRole === 'PM' || currentRole === 'MEMBER') && !projectExecutionLocked;
  const canManage = canManageProjectFlow && !projectExecutionLocked;
  const isMemberContributor = currentRole === 'MEMBER';
  const [form, setForm] = useState<BacklogFormState>(EMPTY_BACKLOG_FORM);
  const [quickTitle, setQuickTitle] = useState('');
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [assigneeFilter, setAssigneeFilter] = useState('ALL');
  const [isCreating, setIsCreating] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const memberMap = useMemo(() => new Map(members.map((member) => [member.userId, member])), [members]);
  const backlogTasks = useMemo(() => tasks.filter((task) => normalizeStatus(task.status) === 'BACKLOG').sort((a, b) => (a.backlogRank ?? a.sequenceNumber) - (b.backlogRank ?? b.sequenceNumber)), [tasks]);
  const filteredTasks = useMemo(() => backlogTasks.filter((task) => {
    const term = search.trim().toLowerCase();
    const matchesTerm = !term || `${task.title} ${task.description} ${task.labels.join(' ')}`.toLowerCase().includes(term);
    const matchesPriority = priorityFilter === 'ALL' || task.priority === priorityFilter;
    const matchesAssignee = assigneeFilter === 'ALL' || task.assigneeId === assigneeFilter;
    return matchesTerm && matchesPriority && matchesAssignee;
  }), [assigneeFilter, backlogTasks, priorityFilter, search]);

  async function quickCreate() {
    if (!canCreate || !quickTitle.trim()) return;
    setIsCreating(true); setError(null);
    try {
      const task = await projectsApi.createTask(token, { workspaceId: workspace.id, spaceId: space.id, projectId: project.id, title: quickTitle.trim(), status: 'BACKLOG', priority: 'MEDIUM', taskType: 'TASK' });
      onTaskCreated(task);
      setQuickTitle('');
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to create backlog task'); } finally { setIsCreating(false); }
  }

  async function createDetailed() {
    if (!canCreate || !form.title.trim()) return;
    if (!isValidScheduleInput(form.startDate, form.dueDate)) { setError('Start date must be on or before due date'); return; }
    setIsCreating(true); setError(null);
    try {
      const task = await projectsApi.createTask(token, {
        workspaceId: workspace.id,
        spaceId: space.id,
        projectId: project.id,
        title: form.title.trim(),
        description: form.description.trim(),
        status: 'BACKLOG',
        priority: form.priority,
        taskType: form.taskType,
        assigneeId: form.assigneeId || null,
        labels: parseLabels(form.labels),
        startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
        dueDate: form.dueDate ? new Date(form.dueDate).toISOString() : null,
        estimateHours: form.estimateHours ? Number(form.estimateHours) : null
      });
      onTaskCreated(task);
      setForm(EMPTY_BACKLOG_FORM);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to create backlog task'); } finally { setIsCreating(false); }
  }

  async function assignTask(taskId: string, assigneeId: string) {
    if (!canManage) return;
    setError(null);
    try {
      onTaskUpdated(await projectsApi.assignTask(token, taskId, assigneeId || null));
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to assign task'); }
  }

  async function reprioritize(taskId: string, priority: TaskPriority) {
    if (!canManage) return;
    setError(null);
    try {
      onTaskUpdated(await projectsApi.updateTask(token, taskId, { priority }));
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to update priority'); }
  }

  async function moveToPlanned(task: ApiTask) {
    if (!canManage || !task.assigneeId) return;
    setError(null);
    try {
      onTaskUpdated(await projectsApi.transitionTask(token, task.id, { status: 'PLANNED' }));
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to move task to Planned'); }
  }

  async function deleteTask(task: ApiTask) {
    const canDelete = canManage || task.createdBy === userId;
    if (!canDelete) return;
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    setError(null);
    try {
      await projectsApi.deleteTask(token, task.id);
      onTaskDeleted(task.id);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to delete task'); }
  }

  async function reorder(targetTaskId: string) {
    if (!canManage || !draggedTaskId || draggedTaskId === targetTaskId) { setDraggedTaskId(null); return; }
    const orderedIds = filteredTasks.map((task) => task.id);
    const from = orderedIds.indexOf(draggedTaskId);
    const to = orderedIds.indexOf(targetTaskId);
    if (from < 0 || to < 0) { setDraggedTaskId(null); return; }
    orderedIds.splice(to, 0, orderedIds.splice(from, 1)[0]);
    setIsReordering(true); setError(null);
    try {
      const reordered = await projectsApi.reorderTasks(token, project.id, orderedIds);
      reordered.forEach(onTaskUpdated);
    } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'Failed to reorder backlog'); } finally { setDraggedTaskId(null); setIsReordering(false); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Backlog</p>
          <h2 className="mt-1 text-base font-semibold text-white">Shared planning queue for the whole project</h2>
          <p className="mt-2 text-sm text-slate-300">Members can raise work here. PMs and project admins review, assign, and move approved items to Planned.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="rounded-xl border border-white/10 bg-[#0d1628] px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Queue</p><p className="mt-1 text-lg font-semibold text-white">{backlogTasks.length}</p></div>
          <div className="rounded-xl border border-white/10 bg-[#0d1628] px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Ready</p><p className="mt-1 text-lg font-semibold text-white">{backlogTasks.filter((task) => Boolean(task.assigneeId)).length}</p></div>
        </div>
      </div>

      {error ? <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{error}</div> : null}

      <div className="rounded-[1.4rem] border border-white/10 bg-[#101a2d] px-4 py-3 text-sm text-slate-300">
        {projectExecutionLocked
          ? `This project is ${String(project.status).toLowerCase().split('_').join(' ')}. Backlog execution is now read-only.`
          : canManage
            ? 'You can review the full backlog, assign owners, and move approved work to Planned.'
            : isMemberContributor
              ? 'You can see the shared backlog, add new work, and update your own items. Planning approval still belongs to PMs and project admins.'
              : 'Backlog stays hidden from viewer roles because it is an internal planning surface.'}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.5rem] border border-white/10 bg-[#101a2d] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Quick add</p><div className="mt-3 flex flex-col gap-3 sm:flex-row"><input value={quickTitle} disabled={projectExecutionLocked} onChange={(event) => setQuickTitle(event.target.value)} placeholder="Write a short task title and add it straight to backlog" className="h-11 flex-1 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60 disabled:cursor-not-allowed disabled:opacity-60" /><Button disabled={!canCreate || isCreating || quickTitle.trim().length < 2} onClick={quickCreate}>{projectExecutionLocked ? 'Project closed' : isCreating ? 'Adding...' : 'Quick add task'}</Button></div></div>
        <div className="rounded-[1.5rem] border border-white/10 bg-[#101a2d] p-4"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Filters</p><div className="mt-3 grid gap-3 md:grid-cols-3"><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search backlog" className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60" /><select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"><option value="ALL" className="bg-[#0b1322] text-white">All priorities</option><option value="LOW" className="bg-[#0b1322] text-white">Low</option><option value="MEDIUM" className="bg-[#0b1322] text-white">Medium</option><option value="HIGH" className="bg-[#0b1322] text-white">High</option><option value="CRITICAL" className="bg-[#0b1322] text-white">Critical</option></select><select value={assigneeFilter} onChange={(event) => setAssigneeFilter(event.target.value)} className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"><option value="ALL" className="bg-[#0b1322] text-white">All assignees</option>{members.map((member) => <option key={member.id} value={member.userId} className="bg-[#0b1322] text-white">{member.user?.fullName ?? member.user?.email ?? member.userId}</option>)}</select></div></div>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-[#101a2d] p-4">
        <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Create from backlog</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4"><input value={form.title} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Task title" className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60 xl:col-span-2" /><select value={form.taskType} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, taskType: event.target.value as TaskType }))} className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60">{['TASK','BUG','STORY','SPIKE'].map((option) => <option key={option} value={option} className="bg-[#0b1322] text-white">{option}</option>)}</select><select value={form.priority} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as TaskPriority }))} className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60">{['LOW','MEDIUM','HIGH','CRITICAL'].map((option) => <option key={option} value={option} className="bg-[#0b1322] text-white">{option}</option>)}</select><textarea value={form.description} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} placeholder="Description or planning note" className="min-h-[104px] rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60 md:col-span-2" /><div className="space-y-3 md:col-span-2"><input value={form.labels} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, labels: event.target.value }))} placeholder="Labels, comma separated" className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60" /><div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4"><div className="xl:col-span-2"><p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Assignee</p><select value={form.assigneeId} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, assigneeId: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"><option value="" className="bg-[#0b1322] text-white">Assign later</option>{members.map((member) => <option key={member.id} value={member.userId} className="bg-[#0b1322] text-white">{member.user?.fullName ?? member.user?.email ?? member.userId}</option>)}</select></div><div><p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Start date</p><input type="date" value={form.startDate} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, startDate: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60" /></div><div><p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Due date</p><input type="date" value={form.dueDate} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, dueDate: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60" /></div><div className="md:col-span-2 xl:col-span-4"><p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Estimate</p><input type="number" min="0.5" step="0.5" value={form.estimateHours} disabled={projectExecutionLocked} onChange={(event) => setForm((current) => ({ ...current, estimateHours: event.target.value }))} placeholder="Hours" className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none placeholder:text-slate-400 focus:border-[#8f9cff]/60" /></div></div></div></div>
        <div className="mt-4 flex flex-wrap gap-3"><Button disabled={!canCreate || isCreating || form.title.trim().length < 2} onClick={createDetailed}>{projectExecutionLocked ? 'Project closed' : isCreating ? 'Creating...' : 'Create backlog task'}</Button><Button variant="secondary" onClick={() => setForm(EMPTY_BACKLOG_FORM)}>Clear form</Button></div>
      </div>

      <div className="space-y-3">
        {filteredTasks.length > 0 ? filteredTasks.map((task) => {
          const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : null;
          const creator = task.createdBy ? memberMap.get(task.createdBy) : null;
          return <div key={task.id} draggable={canManage} onDragStart={() => setDraggedTaskId(task.id)} onDragOver={(event) => event.preventDefault()} onDrop={() => void reorder(task.id)} className="rounded-[1.5rem] border border-white/10 bg-[#101a2d] p-4 shadow-[0_16px_34px_rgba(0,0,0,0.16)]"><div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="cursor-grab rounded-lg border border-white/10 bg-white/6 px-2 py-1 text-xs uppercase tracking-[0.16em] text-slate-300">#{task.sequenceNumber}</span><Badge tone={priorityTone(task.priority)}>{task.priority}</Badge><Badge>{task.taskType}</Badge>{task.createdBy === userId ? <Badge tone="success">Created by you</Badge> : null}{!task.assigneeId ? <Badge tone="warning">Unassigned</Badge> : null}</div><button type="button" className="mt-3 text-left" onClick={() => onTaskOpen(task.id)}><h3 className="text-base font-semibold text-white">{task.title}</h3><p className="mt-1 text-sm leading-6 text-slate-300">{task.description || 'No description yet. Flesh this out before sending the work to Planned.'}</p></button><div className="mt-4 flex flex-wrap gap-2">{task.labels.length > 0 ? task.labels.map((label) => <Badge key={label}>{label}</Badge>) : <span className="text-sm text-slate-300">No labels yet</span>}</div><p className="mt-3 text-xs text-slate-400">Created by <span className="font-medium text-slate-200">{task.createdBy === userId ? 'you' : creator?.user?.fullName ?? creator?.user?.email ?? 'Unknown creator'}</span></p></div><div className="grid gap-3 md:grid-cols-3 xl:w-[560px]"><div><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Assignee</p><select value={task.assigneeId ?? ''} disabled={!canManage} onChange={(event) => void assignTask(task.id, event.target.value)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 disabled:opacity-60"><option value="" className="bg-[#0b1322] text-white">Assign later</option>{members.map((member) => <option key={member.id} value={member.userId} className="bg-[#0b1322] text-white">{member.user?.fullName ?? member.user?.email ?? member.userId}</option>)}</select><p className="mt-2 text-xs text-slate-300">{assignee?.user?.fullName ?? assignee?.user?.email ?? 'No owner yet'}</p></div><div><p className="text-xs uppercase tracking-[0.14em] text-slate-400">Priority</p><select value={task.priority} disabled={!canManage} onChange={(event) => void reprioritize(task.id, event.target.value as TaskPriority)} className="mt-2 h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 disabled:opacity-60">{['LOW','MEDIUM','HIGH','CRITICAL'].map((option) => <option key={option} value={option} className="bg-[#0b1322] text-white">{option}</option>)}</select><p className="mt-2 text-xs text-slate-300">Ready when assigned</p></div><div className="flex flex-col justify-end gap-2"><Button disabled={!canManage || !task.assigneeId} onClick={() => void moveToPlanned(task)}>Move to Planned</Button><Button variant="secondary" onClick={() => onTaskOpen(task.id)}>Open detail</Button>{canManage || task.createdBy === userId ? <Button variant="ghost" className="border border-rose-400/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/16 hover:text-rose-100" onClick={() => void deleteTask(task)}>Delete task</Button> : null}</div></div></div></div>;
        }) : <EmptyState title="No backlog work matches this view" description="Create a task, clear the filters, or start preparing work for the team here." />}
      </div>

      {isReordering ? <p className="text-sm text-slate-300">Updating backlog priority order...</p> : null}
    </div>
  );
}



