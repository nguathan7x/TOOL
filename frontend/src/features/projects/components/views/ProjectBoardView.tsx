import { Avatar } from '../../../../components/ui/Avatar';
import { Badge } from '../../../../components/ui/Badge';
import { Button } from '../../../../components/ui/Button';
import type { ProjectMembership } from '../../../admin/types';
import type { ApiTask } from '../../api/projectsApi';
import { formatLongDate, normalizeStatus, priorityTone } from '../../task-helpers';

type BoardColumn = { key: string; name: string; color?: string | null };
type MemberSurface = { name: string; email: string; avatarUrl: string | null; role: ProjectMembership['role']; specialization: string | null };

type ProjectBoardViewProps = {
  boardColumns: BoardColumn[];
  tasks: ApiTask[];
  boardGridTemplate: string;
  draggedBoardTaskId: string | null;
  dragOverColumnKey: string | null;
  dragOverTaskId: string | null;
  memberMap: Map<string, MemberSurface>;
  userId?: string;
  currentRole?: ProjectMembership['role'];
  isProjectCreator: boolean;
  projectExecutionLocked: boolean;
  canMoveTask: (task: ApiTask | null, userId?: string, role?: ProjectMembership['role'], isProjectCreator?: boolean, isExecutionLocked?: boolean) => boolean;
  onTaskOpen: (taskId: string) => void;
  onDragStart: (taskId: string, columnKey: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onDragEnd: () => void;
  onTaskDragOver: (columnKey: string, taskId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onTaskDragLeave: (taskId: string) => void;
  onTaskDrop: (columnKey: string, taskId: string, event: React.DragEvent<HTMLButtonElement>) => void;
  onColumnDragOver: (columnKey: string, event: React.DragEvent<HTMLElement>) => void;
  onColumnDragLeave: (columnKey: string) => void;
  onColumnDrop: (columnKey: string, event: React.DragEvent<HTMLElement>) => void;
  onTailDrop: (columnKey: string, event: React.DragEvent<HTMLDivElement>) => void;
};

export function ProjectBoardView(props: ProjectBoardViewProps) {
  const { boardColumns, tasks, boardGridTemplate, draggedBoardTaskId, dragOverColumnKey, dragOverTaskId, memberMap, userId, currentRole, isProjectCreator, projectExecutionLocked, canMoveTask, onTaskOpen, onDragStart, onDragEnd, onTaskDragOver, onTaskDragLeave, onTaskDrop, onColumnDragOver, onColumnDragLeave, onColumnDrop, onTailDrop } = props;

  return (
    <div className="space-y-3">
      <div className="mb-3 flex shrink-0 items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div>
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Board</p>
          <h2 className="mt-1 text-base font-semibold text-white">Observe execution across delivery stages</h2>
        </div>
        <div className="rounded-xl border border-white/10 bg-[#0d1628] px-4 py-3 text-right">
          <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Visible stages</p>
          <p className="mt-1 text-lg font-semibold text-white">{boardColumns.length}</p>
        </div>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-2">
        <div className="grid w-max items-start gap-4" style={{ gridTemplateColumns: boardGridTemplate }}>
          {boardColumns.map((column) => {
            const columnTasks = tasks.filter((task) => normalizeStatus(task.status) === normalizeStatus(column.key));
            return (
              <section key={column.key} className={`rounded-[1.5rem] border p-4 text-white shadow-[0_18px_50px_rgba(0,0,0,0.22)] transition-all duration-200 ${dragOverColumnKey === column.key ? 'border-[#8f9cff]/55 bg-[linear-gradient(180deg,rgba(20,31,56,0.96)_0%,rgba(10,18,33,0.92)_100%)] ring-2 ring-[#8f9cff]/20 ring-offset-0' : 'border-white/10 bg-[linear-gradient(180deg,rgba(11,17,30,0.92)_0%,rgba(8,13,24,0.88)_100%)]'}`} onDragOver={(event) => onColumnDragOver(column.key, event)} onDragLeave={() => onColumnDragLeave(column.key)} onDrop={(event) => onColumnDrop(column.key, event)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">{column.key.split('_').join(' ')}</p>
                    <h3 className="mt-1 text-base font-semibold text-white">{column.name}</h3>
                  </div>
                  <span className="inline-flex h-9 min-w-9 items-center justify-center rounded-xl border border-white/10 px-3 text-sm font-semibold text-[#07111f]" style={{ backgroundColor: column.color ?? '#8f9cff' }}>{columnTasks.length}</span>
                </div>
                <div className="mt-4 space-y-3">
                  {draggedBoardTaskId && dragOverColumnKey === column.key ? <div className="rounded-2xl border border-dashed border-[#8f9cff]/60 bg-[#13203a]/80 px-4 py-3 text-sm font-medium text-[#d9e0ff] shadow-[inset_0_0_0_1px_rgba(143,156,255,0.18)]">{dragOverTaskId ? 'Release to place the task here' : 'Release to move the task into this stage'}</div> : null}
                  {columnTasks.length > 0 ? columnTasks.map((task) => {
                    const assignee = task.assigneeId ? memberMap.get(task.assigneeId) : null;
                    const creator = task.createdBy ? memberMap.get(task.createdBy) : null;
                    return (
                      <button key={task.id} type="button" draggable={canMoveTask(task, userId, currentRole, isProjectCreator, projectExecutionLocked)} onDragStart={(event) => onDragStart(task.id, column.key, event)} onDragEnd={onDragEnd} onDragOver={(event) => onTaskDragOver(column.key, task.id, event)} onDragLeave={() => onTaskDragLeave(task.id)} onDrop={(event) => onTaskDrop(column.key, task.id, event)} className={`w-full rounded-2xl border p-4 text-left transition-all duration-200 ${dragOverTaskId === task.id && draggedBoardTaskId !== task.id ? 'border-dashed border-[#8f9cff]/60 bg-[#16233d] shadow-[0_0_0_1px_rgba(143,156,255,0.22)]' : 'border-white/10 bg-[#101a2d] hover:border-[#8f9cff]/45 hover:bg-[#142038]'}`} onClick={() => onTaskOpen(task.id)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs uppercase tracking-[0.14em] text-slate-400">#{task.sequenceNumber}</p>
                            <h4 className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-white">{task.title}</h4>
                          </div>
                          <Badge tone={priorityTone(task.priority)}>{task.priority}</Badge>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {task.createdBy === userId ? <Badge tone="success">Created by you</Badge> : null}
                          {task.labels.slice(0, 2).map((label) => <Badge key={label}>{label}</Badge>)}
                        </div>
                        <p className="mt-3 text-xs text-slate-400">Created by <span className="font-medium text-slate-200">{task.createdBy === userId ? 'you' : creator?.name ?? creator?.email ?? 'Unknown creator'}</span></p>
                        <div className="mt-4 grid gap-3 text-xs text-slate-300 sm:grid-cols-2">
                          <div>
                            <p className="uppercase tracking-[0.14em] text-slate-400">Assignee</p>
                            <div className="mt-2 flex items-center gap-2">
                              {assignee ? <Avatar name={assignee.name} src={assignee.avatarUrl} size="sm" /> : null}
                              <span className="truncate text-sm text-white">{assignee?.name ?? 'Unassigned'}</span>
                            </div>
                          </div>
                          <div className="sm:text-right">
                            <p className="uppercase tracking-[0.14em] text-slate-400">Due</p>
                            <p className="mt-2 text-sm text-white">{formatLongDate(task.dueDate)}</p>
                          </div>
                        </div>
                      </button>
                    );
                  }) : <div className={`flex min-h-[260px] items-center justify-center rounded-2xl border border-dashed px-5 py-10 text-center text-sm transition-all duration-200 ${dragOverColumnKey === column.key ? 'border-[#8f9cff]/70 bg-[#13203a]/88 text-[#d9e0ff] shadow-[inset_0_0_0_1px_rgba(143,156,255,0.2)]' : 'border-white/10 bg-[#101a2d] text-slate-300'}`} onDragOver={(event) => onColumnDragOver(column.key, event)} onDrop={(event) => onColumnDrop(column.key, event)}><div className="max-w-[220px] space-y-3"><div className={`mx-auto h-12 w-12 rounded-2xl border ${dragOverColumnKey === column.key ? 'border-[#8f9cff]/60 bg-[#8f9cff]/14' : 'border-white/10 bg-white/[0.04]'}`} /><p className="font-medium">{dragOverColumnKey === column.key ? 'Release to move the task into this empty stage' : 'This stage is empty for now'}</p><p className={`text-xs leading-6 ${dragOverColumnKey === column.key ? 'text-[#d9e0ff]' : 'text-slate-400'}`}>Drag a task card anywhere into this panel to drop it straight into {column.name}.</p></div></div>}
                  {columnTasks.length > 0 ? <div className={`rounded-2xl border border-dashed px-4 py-3 text-center text-xs font-medium transition-all duration-200 ${dragOverColumnKey === column.key && !dragOverTaskId ? 'border-[#8f9cff]/60 bg-[#13203a]/75 text-[#d9e0ff]' : 'border-white/10 bg-white/[0.03] text-slate-400'}`} onDragOver={(event) => onColumnDragOver(column.key, event)} onDrop={(event) => onTailDrop(column.key, event)}>{dragOverColumnKey === column.key && !dragOverTaskId ? 'Release to place the task at the end of this stage' : 'Drop here to place a task at the end of this column'}</div> : null}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
