export const WORKSPACE_AUDIT_ACTIONS = {
  CREATE: 'workspace.create',
  UPDATE: 'workspace.update',
  DELETE: 'workspace.delete'
};

export const SPACE_AUDIT_ACTIONS = {
  CREATE: 'space.create',
  UPDATE: 'space.update',
  DELETE: 'space.delete'
};

export const MEMBERSHIP_AUDIT_ACTIONS = {
  WORKSPACE_ADD: 'workspace.member.add',
  WORKSPACE_UPDATE: 'workspace.member.update',
  WORKSPACE_REMOVE: 'workspace.member.remove',
  SPACE_ADD: 'space.member.add',
  SPACE_UPDATE: 'space.member.update',
  SPACE_REMOVE: 'space.member.remove',
  PROJECT_ADD: 'project.member.add',
  PROJECT_UPDATE: 'project.member.update',
  PROJECT_REMOVE: 'project.member.remove'
};
