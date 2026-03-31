export const WORKSPACE_ROLES = {
  WORKSPACE_ADMIN: 'WORKSPACE_ADMIN',
  WORKSPACE_MEMBER: 'WORKSPACE_MEMBER',
  WORKSPACE_VIEWER: 'WORKSPACE_VIEWER'
};

export const SPACE_ROLES = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST'
};

export const PROJECT_ROLES = {
  PROJECT_ADMIN: 'PROJECT_ADMIN',
  PM: 'PM',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER'
};

export const PERMISSIONS = {
  WORKSPACE_CREATE: 'workspace.create',
  WORKSPACE_READ: 'workspace.read',
  WORKSPACE_UPDATE: 'workspace.update',
  WORKSPACE_DELETE: 'workspace.delete',
  WORKSPACE_MEMBER_ADD: 'workspace.member.add',
  WORKSPACE_MEMBER_REMOVE: 'workspace.member.remove',
  SPACE_CREATE: 'space.create',

  SPACE_READ: 'space.read',
  SPACE_UPDATE: 'space.update',
  SPACE_DELETE: 'space.delete',
  SPACE_MEMBER_ADD: 'space.member.add',
  SPACE_MEMBER_REMOVE: 'space.member.remove',
  PROJECT_CREATE: 'project.create',

  PROJECT_READ: 'project.read',
  PROJECT_UPDATE: 'project.update',
  PROJECT_MEMBER_ADD: 'project.member.add',
  PROJECT_MEMBER_REMOVE: 'project.member.remove',
  BOARDLIST_MANAGE: 'boardlist.manage',

  TASK_CREATE: 'task.create',
  TASK_READ: 'task.read',
  TASK_UPDATE_OWN: 'task.update.own',
  TASK_UPDATE_ANY: 'task.update.any',
  TASK_DELETE_OWN: 'task.delete.own',
  TASK_DELETE_ANY: 'task.delete.any',
  TASK_ASSIGN: 'task.assign',
  TASK_CHANGE_STATUS: 'task.change_status',
  TASK_CHANGE_STATUS_LIMITED: 'task.change_status.limited',
  TASK_MANAGE_DEPENDENCIES: 'task.manage_dependencies',

  COMMENT_CREATE: 'comment.create',
  COMMENT_UPDATE_OWN: 'comment.update.own',
  COMMENT_DELETE_OWN: 'comment.delete.own',
  COMMENT_DELETE_ANY: 'comment.delete.any',

  NOTIFICATION_READ_OWN: 'notification.read.own',

  AUDIT_READ_PROJECT: 'audit.read.project',
  AUDIT_READ_SPACE: 'audit.read.space',
  AUDIT_READ_WORKSPACE: 'audit.read.workspace'
};

export const WORKSPACE_ROLE_VALUES = Object.values(WORKSPACE_ROLES);
export const SPACE_ROLE_VALUES = Object.values(SPACE_ROLES);
export const PROJECT_ROLE_VALUES = Object.values(PROJECT_ROLES);
export const PERMISSION_VALUES = Object.values(PERMISSIONS);
