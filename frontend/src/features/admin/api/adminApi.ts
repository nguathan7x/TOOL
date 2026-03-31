import { http } from '../../../services/http';
import { createScopedRequestCache } from '../../../services/requestCache';
import type {
  PaginatedResponse,
  Project,
  ProjectMembership,
  ProjectRole,
  Space,
  SpaceMembership,
  SpaceRole,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
  Invite,
  InviteScopeType,
  AppNotification
} from '../types';

const adminCache = createScopedRequestCache('admin');

export const adminApi = {
  listWorkspaces(token: string) {
    return adminCache.read(`workspaces:${token}`, () => http<PaginatedResponse<Workspace>>('/workspaces?limit=100', { method: 'GET', token }), 20_000);
  },

  createWorkspace(token: string, payload: { name: string; slug: string; description: string }) {
    const request = http<Workspace>('/workspaces', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateWorkspace(token: string, workspaceId: string, payload: Partial<Pick<Workspace, 'name' | 'slug' | 'description' | 'isActive'>>) {
    const request = http<Workspace>(`/workspaces/${workspaceId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  deleteWorkspace(token: string, workspaceId: string) {
    const request = http<Workspace>(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  getWorkspace(token: string, workspaceId: string) {
    return adminCache.read(`workspace:${token}:${workspaceId}`, () => http<Workspace>(`/workspaces/${workspaceId}`, { method: 'GET', token }), 20_000);
  },

  listSpaces(token: string, workspaceId: string) {
    return adminCache.read(`spaces:${token}:${workspaceId}`, () => http<PaginatedResponse<Space>>(`/spaces?workspaceId=${workspaceId}&limit=100`, { method: 'GET', token }), 20_000);
  },

  createSpace(token: string, payload: { workspaceId: string; name: string; key: string; description: string }) {
    const request = http<Space>('/spaces', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateSpace(token: string, spaceId: string, payload: Partial<Pick<Space, 'name' | 'key' | 'description' | 'isActive'>>) {
    const request = http<Space>(`/spaces/${spaceId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  deleteSpace(token: string, spaceId: string) {
    const request = http<Space>(`/spaces/${spaceId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  getSpace(token: string, spaceId: string) {
    return adminCache.read(`space:${token}:${spaceId}`, () => http<Space>(`/spaces/${spaceId}`, { method: 'GET', token }), 20_000);
  },

  listProjects(token: string, workspaceId: string, spaceId?: string) {
    const params = new URLSearchParams({ workspaceId, limit: '100' });
    if (spaceId) params.set('spaceId', spaceId);
    const query = params.toString();
    return adminCache.read(`projects:${token}:${query}`, () => http<PaginatedResponse<Project>>(`/projects?${query}`, { method: 'GET', token }), 20_000);
  },

  createProject(
    token: string,
    payload: {
      workspaceId: string;
      spaceId: string;
      name: string;
      key: string;
      description: string;
      statusColumns: Array<{ key: string; name: string; color: string; position: number }>;
      workflowTransitions: Array<{ from: string; to: string; allowedRoles: string[] }>;
      supportedTaskTypes: string[];
      defaultTaskType: string;
    }
  ) {
    const request = http<Project>('/projects', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateProject(
    token: string,
    projectId: string,
    payload: Partial<Pick<Project, 'name' | 'description' | 'status' | 'startDate' | 'targetEndDate' | 'completedAt' | 'archivedAt' | 'completionNote' | 'isArchived' | 'statusColumns' | 'workflowTransitions' | 'supportedTaskTypes' | 'defaultTaskType'>>
  ) {
    const request = http<Project>(`/projects/${projectId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  getProject(token: string, projectId: string) {
    return adminCache.read(`project:${token}:${projectId}`, () => http<Project>(`/projects/${projectId}`, { method: 'GET', token }), 20_000);
  },

  listInvites(token: string, scopeType: InviteScopeType, scopeId: string, status?: string) {
    const params = new URLSearchParams({ scopeType, scopeId, limit: '100' });
    if (status) params.set('status', status);
    const query = params.toString();
    return adminCache.read(`invites:${token}:${query}`, () => http<PaginatedResponse<Invite>>(`/invites?${query}`, { method: 'GET', token }), 8_000);
  },

  createInvite(token: string, payload: { scopeType: InviteScopeType; scopeId: string; email: string; role: string; message?: string }) {
    const request = http<Invite>('/invites', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  listMyInvites(token: string) {
    return adminCache.read(`my-invites:${token}`, () => http<Invite[]>('/invites/my', { method: 'GET', token }), 8_000);
  },

  listMyNotifications(token: string, unreadOnly = false) {
    const params = new URLSearchParams({ limit: '20' });
    if (unreadOnly) params.set('unreadOnly', 'true');
    const query = params.toString();
    return adminCache.read(`my-notifications:${token}:${query}`, () => http<PaginatedResponse<AppNotification>>(`/notifications/my?${query}`, { method: 'GET', token }), 8_000);
  },

  markNotificationRead(token: string, notificationId: string) {
    const request = http<AppNotification>(`/notifications/${notificationId}/read`, { method: 'POST', token });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  acceptInvite(token: string, inviteId: string) {
    const request = http<Invite>(`/invites/${inviteId}/accept`, {
      method: 'POST',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  declineInvite(token: string, inviteId: string) {
    const request = http<Invite>(`/invites/${inviteId}/decline`, {
      method: 'POST',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  revokeInvite(token: string, inviteId: string) {
    const request = http<Invite>(`/invites/${inviteId}/revoke`, {
      method: 'POST',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  listWorkspaceMembers(token: string, workspaceId: string) {
    return adminCache.read(`workspace-members:${token}:${workspaceId}`, () => http<PaginatedResponse<WorkspaceMembership>>(`/workspaces/${workspaceId}/members?limit=100`, {
      method: 'GET',
      token
    }), 15_000);
  },

  addWorkspaceMember(token: string, workspaceId: string, payload: { email: string; role: WorkspaceRole; status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<WorkspaceMembership>(`/workspaces/${workspaceId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateWorkspaceMember(token: string, workspaceId: string, membershipId: string, payload: { role?: WorkspaceRole; status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<WorkspaceMembership>(`/workspaces/${workspaceId}/members/${membershipId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  removeWorkspaceMember(token: string, workspaceId: string, membershipId: string) {
    const request = http<WorkspaceMembership>(`/workspaces/${workspaceId}/members/${membershipId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  listSpaceMembers(token: string, spaceId: string) {
    return adminCache.read(`space-members:${token}:${spaceId}`, () => http<PaginatedResponse<SpaceMembership>>(`/spaces/${spaceId}/members?limit=100`, {
      method: 'GET',
      token
    }), 15_000);
  },

  addSpaceMember(token: string, spaceId: string, payload: { email: string; role: SpaceRole; status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<SpaceMembership>(`/spaces/${spaceId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateSpaceMember(token: string, spaceId: string, membershipId: string, payload: { role?: SpaceRole; status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<SpaceMembership>(`/spaces/${spaceId}/members/${membershipId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  removeSpaceMember(token: string, spaceId: string, membershipId: string) {
    const request = http<SpaceMembership>(`/spaces/${spaceId}/members/${membershipId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  listProjectMembers(token: string, projectId: string) {
    return adminCache.read(`project-members:${token}:${projectId}`, () => http<PaginatedResponse<ProjectMembership>>(`/projects/${projectId}/members?limit=100`, {
      method: 'GET',
      token
    }), 15_000);
  },

  addProjectMember(token: string, projectId: string, payload: { email: string; role: ProjectRole; status: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<ProjectMembership>(`/projects/${projectId}/members`, {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  updateProjectMember(token: string, projectId: string, membershipId: string, payload: { role?: ProjectRole; status?: 'ACTIVE' | 'INVITED' | 'SUSPENDED' }) {
    const request = http<ProjectMembership>(`/projects/${projectId}/members/${membershipId}`, {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  },

  removeProjectMember(token: string, projectId: string, membershipId: string) {
    const request = http<ProjectMembership>(`/projects/${projectId}/members/${membershipId}`, {
      method: 'DELETE',
      token
    });
    void request.finally(() => adminCache.invalidate());
    return request;
  }
};
