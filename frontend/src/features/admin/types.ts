export type Workspace = {
  id: string;
  name: string;
  slug: string;
  description: string;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type Space = {
  id: string;
  workspaceId: string;
  name: string;
  key: string;
  description: string;
  createdBy: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProjectStatusColumn = {
  key: string;
  name: string;
  color?: string;
  position: number;
};

export type WorkflowTransition = {
  from: string;
  to: string;
  allowedRoles?: string[];
};

export type ProjectLifecycleStatus = 'ACTIVE' | 'ON_HOLD' | 'COMPLETED' | 'ARCHIVED';

export type Project = {
  id: string;
  workspaceId: string;
  spaceId: string;
  name: string;
  key: string;
  description: string;
  status: ProjectLifecycleStatus;
  startDate: string | null;
  targetEndDate: string | null;
  completedAt: string | null;
  archivedAt: string | null;
  completionNote: string;
  createdBy: string | null;
  statusColumns?: ProjectStatusColumn[];
  workflowTransitions?: WorkflowTransition[];
  supportedTaskTypes?: string[];
  defaultTaskType?: string;
  isArchived: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type UserSummary = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  globalRole: string | null;
  userType: 'INTERNAL' | 'CLIENT' | 'EXTERNAL_SUPPORT';
  specialization: 'DEV' | 'QA' | 'TESTER' | 'DESIGNER' | 'BA';
  isActive: boolean;
};

export type MembershipStatus = 'ACTIVE' | 'INVITED' | 'SUSPENDED';

export type WorkspaceRole = 'WORKSPACE_ADMIN' | 'WORKSPACE_MEMBER' | 'WORKSPACE_VIEWER';
export type SpaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'GUEST';
export type ProjectRole = 'PROJECT_ADMIN' | 'PM' | 'MEMBER' | 'VIEWER';

export type WorkspaceMembership = {
  id: string;
  workspaceId: string;
  userId: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary | null;
};

export type SpaceMembership = {
  id: string;
  workspaceId: string;
  spaceId: string;
  userId: string;
  role: SpaceRole;
  status: MembershipStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary | null;
};

export type ProjectMembership = {
  id: string;
  workspaceId: string;
  spaceId: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  status: MembershipStatus;
  joinedAt: string;
  createdAt: string;
  updatedAt: string;
  user: UserSummary | null;
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

export type InviteScopeType = 'WORKSPACE' | 'SPACE' | 'PROJECT';
export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'DECLINED' | 'REVOKED' | 'EXPIRED';

export type Invite = {
  id: string;
  email: string;
  userId: string | null;
  scopeType: InviteScopeType;
  workspaceId: string | null;
  spaceId: string | null;
  projectId: string | null;
  role: string;
  status: InviteStatus;
  invitedBy: string;
  invitedByUser: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl: string | null;
  } | null;
  message: string;
  scopeName: string | null;
  workspaceName: string | null;
  spaceName: string | null;
  projectName: string | null;
  expiresAt: string | null;
  respondedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AppNotification = {
  id: string;
  userId: string;
  actorId: string | null;
  actor: UserSummary | null;
  workspaceId: string | null;
  spaceId: string | null;
  projectId: string | null;
  type: string;
  title: string;
  message: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown> | null;
  isRead: boolean;
  createdAt: string;
  updatedAt: string;
};
