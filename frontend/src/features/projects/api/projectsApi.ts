import { http } from '../../../services/http';
import { createScopedRequestCache } from '../../../services/requestCache';

const projectsCache = createScopedRequestCache('projects');

export type ApiTask = {
  id: string;
  workspaceId: string;
  spaceId: string;
  projectId: string;
  boardListId: string | null;
  parentTaskId: string | null;
  taskType: string;
  title: string;
  description: string;
  createdBy: string | null;
  status: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assigneeId: string | null;
  reporterId: string;
  labels: string[];
  startDate: string | null;
  dueDate: string | null;
  estimateHours: number | null;
  checklist: Array<{ title: string; isCompleted: boolean; completedAt?: string | null }>;
  dependencyTaskIds: string[];
  sequenceNumber: number;
  backlogRank: number | null;
  createdAt: string;
  updatedAt: string;
};

export type ApiActor = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  globalRole: string | null;
  userType: 'INTERNAL' | 'CLIENT' | 'EXTERNAL_SUPPORT';
  specialization: 'DEV' | 'QA' | 'TESTER' | 'DESIGNER' | 'BA';
  isActive: boolean;
};

export type ApiComment = {
  id: string;
  workspaceId: string;
  spaceId: string;
  projectId: string;
  taskId: string;
  authorId: string;
  author: ApiActor | null;
  content: string;
  createdAt: string;
  updatedAt: string;
};

export type ApiActivity = {
  id: string;
  workspaceId: string | null;
  spaceId: string | null;
  projectId: string | null;
  userId: string;
  user: ApiActor | null;
  action: string;
  entity: string;
  entityId: string;
  before: unknown;
  after: unknown;
  timestamp: string;
};

export type PaginatedResponse<T> = {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export const projectsApi = {
  listTasks(token: string, projectId: string) {
    return projectsCache.read(`tasks:${token}:${projectId}`, () => http<PaginatedResponse<ApiTask>>(`/tasks?projectId=${projectId}&limit=100`, {
      method: 'GET',
      token
    }), 15_000);
  },

  createTask(
    token: string,
    payload: {
      workspaceId: string;
      spaceId: string;
      projectId: string;
      title: string;
      description?: string;
      status: string;
      taskType?: 'TASK' | 'BUG' | 'STORY' | 'SPIKE';
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      assigneeId?: string | null;
      labels?: string[];
      startDate?: string | null;
      dueDate?: string | null;
      estimateHours?: number | null;
      checklist?: Array<{ title: string; isCompleted?: boolean; completedAt?: string | null }>;
      dependencyTaskIds?: string[];
    }
  ) {
    const request = http<ApiTask>('/tasks', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  updateTask(
    token: string,
    taskId: string,
    payload: {
      title?: string;
      description?: string;
      priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
      labels?: string[];
      startDate?: string | null;
      dueDate?: string | null;
      estimateHours?: number | null;
      checklist?: Array<{ title: string; isCompleted?: boolean; completedAt?: string | null }>;
      dependencyTaskIds?: string[];
    }
  ) {
    const request = http<ApiTask>(`/tasks/${taskId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  assignTask(token: string, taskId: string, assigneeId: string | null) {
    const request = http<ApiTask>(`/tasks/${taskId}/assign`, {
      method: 'POST',
      token,
      body: JSON.stringify({ assigneeId })
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  deleteTask(token: string, taskId: string) {
    const request = http<{ id: string; deleted: boolean }>(`/tasks/${taskId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  reorderTasks(token: string, projectId: string, orderedTaskIds: string[]) {
    const request = http<ApiTask[]>('/tasks/reorder', {
      method: 'POST',
      token,
      body: JSON.stringify({ projectId, orderedTaskIds })
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  transitionTask(
    token: string,
    taskId: string,
    payload: { status: string; requireClientApproval?: boolean; uatApprovedByClient?: boolean }
  ) {
    const request = http<ApiTask>(`/tasks/${taskId}/status`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  getTaskById(token: string, taskId: string) {
    return projectsCache.read(`task:${token}:${taskId}`, () => http<ApiTask>(`/tasks/${taskId}`, {
      method: 'GET',
      token
    }), 15_000);
  },

  listTaskComments(token: string, taskId: string) {
    return projectsCache.read(`task-comments:${token}:${taskId}`, () => http<PaginatedResponse<ApiComment>>(`/tasks/${taskId}/comments?limit=100`, {
      method: 'GET',
      token
    }), 10_000);
  },

  createTaskComment(token: string, taskId: string, payload: { content: string }) {
    const request = http<ApiComment>(`/tasks/${taskId}/comments`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => projectsCache.invalidate());
    return request;
  },

  listTaskActivity(token: string, taskId: string) {
    return projectsCache.read(`task-activity:${token}:${taskId}`, () => http<PaginatedResponse<ApiActivity>>(`/tasks/${taskId}/activity?limit=100`, {
      method: 'GET',
      token
    }), 10_000);
  }
};
