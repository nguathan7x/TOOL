import type { ApiTask } from './api/projectsApi';
import type { ProjectMembership } from '../admin/types';

export type TaskEditorState = {
  title: string;
  description: string;
  priority: ApiTask['priority'];
  assigneeId: string;
  status: string;
  labelsInput: string;
  startDate: string;
  dueDate: string;
  estimateHours: string;
  checklistInput: string;
};

export function canDeleteTask(task: ApiTask | null, userId?: string, role?: ProjectMembership['role']) {
  if (!task) {
    return false;
  }

  return task.createdBy === userId || role === 'PROJECT_ADMIN' || role === 'PM';
}

export function canEditTask(task: ApiTask | null, userId?: string, role?: ProjectMembership['role']) {
  if (!task || !userId) {
    return false;
  }

  return role === 'PROJECT_ADMIN' || role === 'PM' || task.createdBy === userId || task.assigneeId === userId || task.reporterId === userId;
}

export function createTaskEditorState(task: ApiTask | null): TaskEditorState {
  if (!task) {
    return {
      title: '',
      description: '',
      priority: 'MEDIUM',
      assigneeId: '',
      status: 'PLANNED',
      labelsInput: '',
      startDate: '',
      dueDate: '',
      estimateHours: '',
      checklistInput: ''
    };
  }

  return {
    title: task.title,
    description: task.description,
    priority: task.priority,
    assigneeId: task.assigneeId ?? '',
    status: task.status,
    labelsInput: task.labels.join(', '),
    startDate: task.startDate ? task.startDate.slice(0, 10) : '',
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : '',
    estimateHours: typeof task.estimateHours === 'number' ? String(task.estimateHours) : '',
    checklistInput: task.checklist.map((item) => item.title).join('\n')
  };
}

export function parseLabelsInput(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

export function buildChecklistFromInput(input: string, existing: ApiTask['checklist']) {
  const existingMap = new Map(existing.map((item) => [item.title.trim().toLowerCase(), item]));

  return input
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
    .map((title) => {
      const previous = existingMap.get(title.toLowerCase());
      return {
        title,
        isCompleted: previous?.isCompleted ?? false,
        completedAt: previous?.completedAt ?? null
      };
    });
}
