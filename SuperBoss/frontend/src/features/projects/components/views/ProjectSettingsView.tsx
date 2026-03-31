import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { Project, ProjectLifecycleStatus, Space, Workspace } from '../../../admin/types';
import { formatLongDate, normalizeStatus } from '../../task-helpers';

type WorkflowStage = { key: string; name: string };
type LifecycleDraft = { startDate: string; targetEndDate: string; completionNote: string };

type ProjectSettingsViewProps = {
  selectedWorkspace: Workspace;
  selectedSpace: Space;
  selectedProject: Project;
  workflowStages: WorkflowStage[];
  workflowDraft: Array<{ from: string; to: string; allowedRoles?: string[] }>;
  workflowTransitionSet: Set<string>;
  lifecycleDraft: LifecycleDraft;
  ownedProject: boolean;
  canManageProjectLifecycle: boolean;
  canManageWorkflowSettings: boolean;
  isSavingLifecycle: boolean;
  isSavingWorkflow: boolean;
  lifecycleMessage: string | null;
  workflowMessage: string | null;
  projectLifecycleLabel: (status: ProjectLifecycleStatus) => string;
  projectLifecycleTone: (status: ProjectLifecycleStatus) => 'success' | 'warning' | 'info' | 'neutral';
  onLifecycleDraftChange: (updater: (current: LifecycleDraft) => LifecycleDraft) => void;
  onProjectStatusChange: (status: ProjectLifecycleStatus) => void;
  onSaveLifecycle: () => void;
  onToggleWorkflowTransition: (from: string, to: string) => void;
  onResetWorkflow: () => void;
  onSaveWorkflow: () => void;
};

export function ProjectSettingsView(props: ProjectSettingsViewProps) {
  const { selectedWorkspace, selectedSpace, selectedProject, workflowStages, workflowDraft, workflowTransitionSet, lifecycleDraft, ownedProject, canManageProjectLifecycle, canManageWorkflowSettings, isSavingLifecycle, isSavingWorkflow, lifecycleMessage, workflowMessage, projectLifecycleLabel, projectLifecycleTone, onLifecycleDraftChange, onProjectStatusChange, onSaveLifecycle, onToggleWorkflowTransition, onResetWorkflow, onSaveWorkflow } = props;

  return (
    <div className="space-y-4">
      <div className="mb-3 shrink-0 border-b border-white/10 pb-3">
        <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Settings</p>
        <h2 className="mt-1 text-base font-semibold text-white">Scope, ownership, and workflow configuration</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="text-xs uppercase tracking-[0.16em] text-[#8ae6d9]">Project lifecycle</p><h3 className="mt-2 text-lg font-semibold text-white">Run the project from kickoff to archive</h3><p className="mt-2 text-sm leading-6 text-slate-300">Track the live state, timing window, and closeout note without losing the rest of the project record.</p></div>
              <Badge tone={projectLifecycleTone(selectedProject.status)}>{projectLifecycleLabel(selectedProject.status)}</Badge>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.16em] text-[#b8c4ff]">Start</p><p className="mt-2 text-sm font-semibold text-white">{formatLongDate(selectedProject.startDate)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.16em] text-[#b8c4ff]">Target end</p><p className="mt-2 text-sm font-semibold text-white">{formatLongDate(selectedProject.targetEndDate)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.16em] text-[#b8c4ff]">Completed</p><p className="mt-2 text-sm font-semibold text-white">{formatLongDate(selectedProject.completedAt)}</p></div>
              <div className="rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><p className="text-[11px] uppercase tracking-[0.16em] text-[#b8c4ff]">Archived</p><p className="mt-2 text-sm font-semibold text-white">{formatLongDate(selectedProject.archivedAt)}</p></div>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              <label className="space-y-2"><span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Start date</span><input type="date" value={lifecycleDraft.startDate} disabled={!canManageProjectLifecycle || isSavingLifecycle} onChange={(event) => onLifecycleDraftChange((current) => ({ ...current, startDate: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff]/60 disabled:cursor-not-allowed disabled:opacity-70" /></label>
              <label className="space-y-2"><span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Target end date</span><input type="date" value={lifecycleDraft.targetEndDate} disabled={!canManageProjectLifecycle || isSavingLifecycle} onChange={(event) => onLifecycleDraftChange((current) => ({ ...current, targetEndDate: event.target.value }))} className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff]/60 disabled:cursor-not-allowed disabled:opacity-70" /></label>
            </div>
            <label className="mt-4 block space-y-2"><span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Completion note</span><textarea value={lifecycleDraft.completionNote} disabled={!canManageProjectLifecycle || isSavingLifecycle} onChange={(event) => onLifecycleDraftChange((current) => ({ ...current, completionNote: event.target.value }))} rows={4} placeholder="Capture delivery outcome, handoff notes, or archive context..." className="w-full rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-[#10241a] outline-none transition placeholder:text-slate-500 focus:border-[#8f9cff]/60 disabled:cursor-not-allowed disabled:opacity-70" /></label>
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedProject.status === 'ACTIVE' ? <><Button variant="secondary" disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('ON_HOLD')}>Put on hold</Button><Button disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('COMPLETED')}>Mark as completed</Button></> : null}
              {selectedProject.status === 'ON_HOLD' ? <><Button variant="secondary" disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('ACTIVE')}>Resume project</Button><Button disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('COMPLETED')}>Mark as completed</Button></> : null}
              {selectedProject.status === 'COMPLETED' ? <><Button variant="secondary" disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('ACTIVE')}>Reopen project</Button><Button disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('ARCHIVED')}>Archive project</Button></> : null}
              {selectedProject.status === 'ARCHIVED' ? <Button disabled={!canManageProjectLifecycle || isSavingLifecycle} onClick={() => onProjectStatusChange('ACTIVE')}>Restore project</Button> : null}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><div><p className="text-sm font-medium text-white">Lifecycle save state</p><p className="mt-1 text-sm text-slate-300">{lifecycleMessage ?? (canManageProjectLifecycle ? 'Adjust dates or the closeout note, then save the lifecycle card.' : 'You can review the lifecycle here, but only the project creator, PM, or project admin can change it.')}</p></div>{canManageProjectLifecycle ? <Button disabled={isSavingLifecycle} onClick={onSaveLifecycle}>{isSavingLifecycle ? 'Saving lifecycle...' : 'Save lifecycle details'}</Button> : null}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Scope details</p><div className="mt-4 space-y-3 text-sm text-slate-200"><p>Workspace: <span className="font-semibold text-white">{selectedWorkspace.name}</span></p><p>Space: <span className="font-semibold text-white">{selectedSpace.name}</span></p><p>Project key: <span className="font-semibold text-white">{selectedProject.key}</span></p><p>Ownership: <span className="font-semibold text-white">{ownedProject ? 'Created by you' : 'Joined project'}</span></p><p>Description: <span className="text-slate-300">{selectedProject.description || 'No description provided.'}</span></p></div></div>
          <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Workflow stages</p><div className="mt-4 flex flex-wrap gap-2">{workflowStages.map((column) => <Badge key={column.key}>{column.name}</Badge>)}</div><p className="mt-4 text-sm text-slate-300">Toggle the exact routes this project can use. The board will obey this matrix, including whether work can move backward for rework.</p></div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-[#101a2d] p-5">
          <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Workflow routes</p><h3 className="mt-2 text-lg font-semibold text-white">Choose which transitions are allowed</h3><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">Each row is the current stage, each column is the destination. Turn a route on when you want the project board to accept that move.</p></div><div className="rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-3 text-right"><p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Active routes</p><p className="mt-1 text-lg font-semibold text-white">{workflowDraft.length}</p></div></div>
          <div className="mt-5 overflow-x-auto"><div className="min-w-[760px] space-y-3"><div className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#b8c4ff]"><div className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3">From \ To</div>{workflowStages.map((column) => <div key={column.key} className="rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-center">{column.name}</div>)}</div>{workflowStages.map((fromColumn) => <div key={fromColumn.key} className="grid grid-cols-[180px_repeat(7,minmax(0,1fr))] gap-2"><div className="flex items-center rounded-xl border border-white/10 bg-white/[0.03] px-3 py-3 text-sm font-medium text-white">{fromColumn.name}</div>{workflowStages.map((toColumn) => { const isSameStage = normalizeStatus(fromColumn.key) === normalizeStatus(toColumn.key); const isEnabled = workflowTransitionSet.has(`${normalizeStatus(fromColumn.key)}->${normalizeStatus(toColumn.key)}`); const baseClassName = `flex h-[54px] items-center justify-center rounded-xl border text-sm font-semibold transition ${isSameStage ? 'border-white/8 bg-white/[0.02] text-slate-500' : isEnabled ? 'border-emerald-400/35 bg-emerald-400/14 text-emerald-200' : 'border-white/10 bg-[#0d1628] text-slate-300'}`; if (!canManageWorkflowSettings || isSameStage) { return <div key={`${fromColumn.key}-${toColumn.key}`} className={baseClassName}>{isSameStage ? '—' : isEnabled ? 'Allowed' : 'Blocked'}</div>; } return <button key={`${fromColumn.key}-${toColumn.key}`} type="button" onClick={() => onToggleWorkflowTransition(fromColumn.key, toColumn.key)} className={`${baseClassName} hover:border-[#8f9cff]/45 hover:bg-[#13203a] ${isEnabled ? 'hover:bg-emerald-400/20' : ''}`}>{isEnabled ? 'Allowed' : 'Blocked'}</button>; })}</div>)}</div></div>
          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d1628] px-4 py-4"><div><p className="text-sm font-medium text-white">Workflow save state</p><p className="mt-1 text-sm text-slate-300">{workflowMessage ?? (canManageWorkflowSettings ? 'Switch routes on or off, then save the matrix.' : 'You can view the matrix here, but only project owners or delivery managers can change it.')}</p></div>{canManageWorkflowSettings ? <div className="flex flex-wrap gap-2"><Button variant="secondary" disabled={isSavingWorkflow} onClick={onResetWorkflow}>Reset matrix</Button><Button disabled={isSavingWorkflow} onClick={onSaveWorkflow}>{isSavingWorkflow ? 'Saving workflow...' : 'Save workflow settings'}</Button></div> : null}</div>
        </div>
      </div>
    </div>
  );
}
