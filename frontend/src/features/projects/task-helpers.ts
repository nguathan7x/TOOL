import type { ApiTask } from './api/projectsApi';

export type PriorityTone = 'danger' | 'warning' | 'info' | 'neutral';
export type RangeSegmentTone = 'single' | 'start' | 'middle' | 'end';

export function formatShortDate(value: string | null, fallback = 'No date') {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric'
  }).format(new Date(value));
}

export function formatLongDate(value: string | null, fallback = 'No date set') {
  if (!value) {
    return fallback;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(new Date(value));
}

export function formatDateTime(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(value));
}

export function monthLabel(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric'
  }).format(date);
}

export function buildMonthGrid(anchor: Date) {
  const start = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  const startDay = start.getDay();
  start.setDate(start.getDate() - startDay);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
}

export function normalizeStatus(value: string) {
  return String(value ?? '').trim().toUpperCase();
}

export function prettyStatus(status: string) {
  return status.split('_').join(' ');
}

export function priorityTone(priority: ApiTask['priority']): PriorityTone {
  switch (priority) {
    case 'CRITICAL':
      return 'danger';
    case 'HIGH':
      return 'warning';
    case 'MEDIUM':
      return 'info';
    default:
      return 'neutral';
  }
}

export function isValidScheduleInput(startDate: string, dueDate: string) {
  if (!startDate || !dueDate) {
    return true;
  }

  return new Date(startDate).getTime() <= new Date(dueDate).getTime();
}

export function taskScheduleWindow(task: ApiTask) {
  if (task.startDate && task.dueDate) {
    return `${formatShortDate(task.startDate)} - ${formatShortDate(task.dueDate)}`;
  }

  if (task.startDate) {
    return `Starts ${formatShortDate(task.startDate)}`;
  }

  if (task.dueDate) {
    return `Due ${formatShortDate(task.dueDate)}`;
  }

  return 'No schedule yet';
}

export function formatEstimate(hours: number | null) {
  if (typeof hours !== 'number' || Number.isNaN(hours) || hours <= 0) {
    return 'No estimate';
  }

  return Number.isInteger(hours) ? `${hours}h planned` : `${hours.toFixed(1)}h planned`;
}

export function taskScheduleRange(task: ApiTask): Date[] {
  const anchor = task.startDate ?? task.dueDate;
  const end = task.dueDate ?? task.startDate;

  if (!anchor || !end) {
    return [];
  }

  const start = new Date(anchor);
  const finish = new Date(end);
  start.setHours(0, 0, 0, 0);
  finish.setHours(0, 0, 0, 0);

  if (start.getTime() > finish.getTime()) {
    return [finish, start];
  }

  return [start, finish];
}

export function taskRangeSegmentTone(task: ApiTask, date: Date): RangeSegmentTone {
  const range = taskScheduleRange(task);
  if (range.length === 0) {
    return 'single';
  }

  const [start, finish] = range;
  const current = new Date(date);
  current.setHours(0, 0, 0, 0);

  if (start.getTime() == finish.getTime()) {
    return 'single';
  }

  if (current.getTime() == start.getTime()) {
    return 'start';
  }

  if (current.getTime() == finish.getTime()) {
    return 'end';
  }

  return 'middle';
}
