import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import type { ProjectMembership } from '../../admin/types';
import type { ApiTask } from '../api/projectsApi';
import type { TaskEditorState } from '../task-editor';

type TaskEditorPanelProps = {
  state: TaskEditorState;
  members: ProjectMembership[];
  workflowColumns: Array<{ key: string; name: string; color?: string }>;
  canAssign: boolean;
  isSaving: boolean;
  onChange: (updater: (current: TaskEditorState) => TaskEditorState) => void;
  onSave: () => void;
  onCancel: () => void;
};

export function TaskEditorPanel({ state, members, workflowColumns, canAssign, isSaving, onChange, onSave, onCancel }: TaskEditorPanelProps) {
  return (
    <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(12,19,33,0.92)_0%,rgba(9,15,27,0.88)_100%)] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Task editor</p>
          <h3 className="mt-1 text-lg font-semibold text-white">Refine task details right from the board</h3>
        </div>
        <Badge tone="info">Live edit</Badge>
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <input
          value={state.title}
          onChange={(event) => onChange((current) => ({ ...current, title: event.target.value }))}
          placeholder="Task title"
          className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 md:col-span-2"
        />
        <textarea
          value={state.description}
          onChange={(event) => onChange((current) => ({ ...current, description: event.target.value }))}
          rows={4}
          placeholder="Task description"
          className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 md:col-span-2"
        />
        <select
          value={state.priority}
          onChange={(event) => onChange((current) => ({ ...current, priority: event.target.value as ApiTask['priority'] }))}
          className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
        >
          {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((option) => (
            <option key={option} value={option} className="bg-white text-[#10241a]">
              {option}
            </option>
          ))}
        </select>
        <select
          value={state.status}
          onChange={(event) => onChange((current) => ({ ...current, status: event.target.value }))}
          className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
        >
          {workflowColumns
            .filter((column) => column.key !== 'BACKLOG')
            .map((column) => (
              <option key={column.key} value={column.key} className="bg-white text-[#10241a]">
                {column.name}
              </option>
            ))}
        </select>
        <input
          value={state.labelsInput}
          onChange={(event) => onChange((current) => ({ ...current, labelsInput: event.target.value }))}
          placeholder="Labels, comma separated"
          className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
        />
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Start date</p>
          <input
            type="date"
            value={state.startDate}
            onChange={(event) => onChange((current) => ({ ...current, startDate: event.target.value }))}
            className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Due date</p>
          <input
            type="date"
            value={state.dueDate}
            onChange={(event) => onChange((current) => ({ ...current, dueDate: event.target.value }))}
            className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
          />
        </div>
        <div>
          <p className="mb-2 text-xs uppercase tracking-[0.14em] text-slate-400">Estimate</p>
          <input
            type="number"
            min="0.5"
            step="0.5"
            value={state.estimateHours}
            onChange={(event) => onChange((current) => ({ ...current, estimateHours: event.target.value }))}
            placeholder="Hours"
            className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60"
          />
        </div>
        <select
          value={state.assigneeId}
          disabled={!canAssign}
          onChange={(event) => onChange((current) => ({ ...current, assigneeId: event.target.value }))}
          className="h-11 rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 disabled:opacity-60 md:col-span-2"
        >
          <option value="" className="bg-white text-[#10241a]">Assign later</option>
          {members.map((member) => (
            <option key={member.id} value={member.userId} className="bg-white text-[#10241a]">
              {member.user?.fullName ?? member.user?.email ?? member.userId}
            </option>
          ))}
        </select>
        <textarea
          value={state.checklistInput}
          onChange={(event) => onChange((current) => ({ ...current, checklistInput: event.target.value }))}
          rows={5}
          placeholder="Checklist items, one per line"
          className="rounded-2xl border border-white/10 bg-white px-4 py-3 text-sm text-[#10241a] outline-none focus:border-[#8f9cff]/60 md:col-span-2"
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Button onClick={onSave} disabled={isSaving}>{isSaving ? 'Saving task...' : 'Save task changes'}</Button>
        <Button variant="secondary" onClick={onCancel} disabled={isSaving}>Cancel</Button>
      </div>
    </div>
  );
}
