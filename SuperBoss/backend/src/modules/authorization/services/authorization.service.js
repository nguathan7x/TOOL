import { GLOBAL_ROLES } from '../../../constants/user.js';
import { ROLE_PERMISSION_MAP } from '../role-permission.map.js';
import { PERMISSIONS, WORKSPACE_ROLES } from '../authorization.constants.js';
import { accessContextService } from './access-context.service.js';

export class AuthorizationService {
  async can(user, action, resource = {}) {
    if (!user?.id || user.isActive === false) {
      return this.#buildDeniedDecision('Authenticated active user is required');
    }

    if (user.globalRole === GLOBAL_ROLES.SUPER_ADMIN) {
      return {
        allowed: true,
        reason: 'Allowed via SUPER_ADMIN override',
        source: 'super_admin',
        debug: {
          globalRole: user.globalRole,
          requiredPermission: action
        }
      };
    }

    if (action === PERMISSIONS.WORKSPACE_CREATE) {
      return {
        allowed: true,
        reason: 'Allowed for authenticated users to create their own workspace',
        source: 'policy',
        debug: {
          globalRole: user.globalRole ?? null,
          requiredPermission: action,
          selfProvisioned: true
        }
      };
    }

    const context = await accessContextService.resolveAccessContext(user.id, resource);
    const creatorDecision = this.#evaluateCreatorAccess(user.id, action, resource);
    const debug = {
      globalRole: user.globalRole ?? null,
      workspaceRole: context.workspaceRole,
      spaceRole: context.spaceRole,
      projectRole: context.projectRole,
      requiredPermission: action,
      isCreator: creatorDecision.allowed,
      creatorScope: creatorDecision.creatorScope,
      membershipCheck: {
        workspace: Boolean(context.workspaceMembership),
        space: Boolean(context.spaceMembership),
        project: Boolean(context.projectMembership)
      }
    };

    if (creatorDecision.allowed) {
      return {
        allowed: true,
        reason: `Allowed via ${creatorDecision.creatorScope} creator ownership`,
        source: 'creator',
        debug
      };
    }

    const isWorkspaceAdmin = context.workspaceRole === WORKSPACE_ROLES.WORKSPACE_ADMIN;
    const hasWorkspaceTransitAccess = Boolean(context.workspaceMembership || context.spaceMembership || context.projectMembership);
    const hasSpaceTransitAccess = Boolean(context.spaceMembership || context.projectMembership || isWorkspaceAdmin);

    if (context.workspaceId && !hasWorkspaceTransitAccess) {
      return this.#buildDeniedDecision('Workspace membership is required', debug);
    }

    if (context.spaceId && !hasSpaceTransitAccess) {
      return this.#buildDeniedDecision('Space membership is required', debug);
    }

    if (context.projectId && !context.projectMembership && !context.spaceMembership && !isWorkspaceAdmin) {
      return this.#buildDeniedDecision('Project access requires space or project membership', debug);
    }

    const roleMatches = [
      {
        scope: 'workspace',
        role: context.workspaceRole,
        allowed: this.#hasPermission('workspace', context.workspaceRole, action)
      },
      {
        scope: 'space',
        role: context.spaceRole,
        allowed: this.#hasPermission('space', context.spaceRole, action)
      },
      {
        scope: 'project',
        role: context.projectRole,
        allowed: this.#hasPermission('project', context.projectRole, action)
      }
    ];

    const matchedRole = roleMatches.find((entry) => entry.allowed);

    if (!matchedRole) {
      return this.#buildDeniedDecision('Permission denied by role mapping', debug);
    }

    if (this.#isOwnAction(action)) {
      const isOwner = this.#evaluateOwnership(user.id, resource);

      if (!isOwner) {
        return this.#buildDeniedDecision('Ownership requirement was not satisfied', {
          ...debug,
          isOwner
        });
      }

      return {
        allowed: true,
        reason: `Allowed via ${matchedRole.scope} role with ownership check`,
        source: 'ownership',
        debug: {
          ...debug,
          matchedScope: matchedRole.scope,
          matchedRole: matchedRole.role,
          isOwner
        }
      };
    }

    return {
      allowed: true,
      reason: `Allowed via ${matchedRole.scope} role`,
      source: 'role',
      debug: {
        ...debug,
        matchedScope: matchedRole.scope,
        matchedRole: matchedRole.role,
        workspaceAdminOverride: isWorkspaceAdmin
      }
    };
  }

  #hasPermission(scope, role, action) {
    if (!role) {
      return false;
    }

    return ROLE_PERMISSION_MAP[scope]?.[role]?.includes(action) ?? false;
  }

  #readId(value) {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      if (value._id) {
        return String(value._id);
      }

      if (value.id) {
        return String(value.id);
      }
    }

    return String(value);
  }

  #isOwnAction(action) {
    return action.endsWith('.own');
  }

  #evaluateOwnership(userId, resource = {}) {
    const comment = resource.comment ?? null;
    const task = resource.task ?? null;
    const ownershipConfig = resource.ownership ?? {};

    const authorId = this.#readId(comment?.authorId ?? resource.authorId);
    const assigneeId = this.#readId(task?.assigneeId ?? resource.assigneeId);
    const reporterId = this.#readId(task?.reporterId ?? resource.reporterId);
    const creatorId = this.#readId(task?.createdBy ?? resource.createdBy);

    const matchesAuthor = authorId === userId;
    const matchesAssignee = assigneeId === userId;
    const matchesReporter = reporterId === userId;
    const matchesCreator = creatorId === userId;

    if (ownershipConfig.commentAuthorOnly) {
      return matchesAuthor;
    }

    if (ownershipConfig.taskAssigneeOnly) {
      return matchesAssignee;
    }

    if (ownershipConfig.taskReporterOnly) {
      return matchesReporter;
    }

    if (ownershipConfig.taskCreatorOnly) {
      return matchesCreator;
    }

    return matchesAuthor || matchesAssignee || matchesReporter || matchesCreator;
  }

  #buildDeniedDecision(reason, debug = {}) {
    return {
      allowed: false,
      reason,
      source: 'policy',
      debug
    };
  }

  #isWorkspaceCreator(userId, resource = {}) {
    const workspaceCreatorId = this.#readId(resource.workspace?.createdBy ?? resource.workspaceCreatedBy);
    return workspaceCreatorId === userId;
  }

  #isSpaceCreator(userId, resource = {}) {
    const spaceCreatorId = this.#readId(resource.space?.createdBy ?? resource.spaceCreatedBy);
    return spaceCreatorId === userId;
  }

  #isProjectCreator(userId, resource = {}) {
    const projectCreatorId = this.#readId(resource.project?.createdBy ?? resource.projectCreatedBy);
    return projectCreatorId === userId;
  }

  #isTaskCreator(userId, resource = {}) {
    const taskCreatorId = this.#readId(resource.task?.createdBy ?? resource.createdBy);
    return taskCreatorId === userId;
  }

  #evaluateCreatorAccess(userId, action, resource = {}) {
    const workspaceCreator = this.#isWorkspaceCreator(userId, resource);
    const spaceCreator = this.#isSpaceCreator(userId, resource);
    const projectCreator = this.#isProjectCreator(userId, resource);
    const taskCreator = this.#isTaskCreator(userId, resource);

    const workspaceCreatorPermissions = new Set([
      PERMISSIONS.WORKSPACE_READ,
      PERMISSIONS.WORKSPACE_UPDATE,
      PERMISSIONS.WORKSPACE_DELETE,
      PERMISSIONS.WORKSPACE_MEMBER_ADD,
      PERMISSIONS.WORKSPACE_MEMBER_REMOVE,
      PERMISSIONS.SPACE_CREATE,
      PERMISSIONS.SPACE_READ,
      PERMISSIONS.SPACE_UPDATE,
      PERMISSIONS.SPACE_DELETE,
      PERMISSIONS.SPACE_MEMBER_ADD,
      PERMISSIONS.SPACE_MEMBER_REMOVE,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_MEMBER_ADD,
      PERMISSIONS.PROJECT_MEMBER_REMOVE
    ]);

    const spaceCreatorPermissions = new Set([
      PERMISSIONS.SPACE_READ,
      PERMISSIONS.SPACE_UPDATE,
      PERMISSIONS.SPACE_DELETE,
      PERMISSIONS.SPACE_MEMBER_ADD,
      PERMISSIONS.SPACE_MEMBER_REMOVE,
      PERMISSIONS.PROJECT_CREATE,
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_MEMBER_ADD,
      PERMISSIONS.PROJECT_MEMBER_REMOVE
    ]);

    const projectCreatorPermissions = new Set([
      PERMISSIONS.PROJECT_READ,
      PERMISSIONS.PROJECT_UPDATE,
      PERMISSIONS.PROJECT_MEMBER_ADD,
      PERMISSIONS.PROJECT_MEMBER_REMOVE
    ]);

    if (workspaceCreator && workspaceCreatorPermissions.has(action)) {
      return {
        allowed: true,
        creatorScope: 'workspace'
      };
    }

    if (spaceCreator && spaceCreatorPermissions.has(action)) {
      return {
        allowed: true,
        creatorScope: 'space'
      };
    }

    if (projectCreator && projectCreatorPermissions.has(action)) {
      return {
        allowed: true,
        creatorScope: 'project'
      };
    }

    if (taskCreator && this.#isOwnAction(action)) {
      return {
        allowed: true,
        creatorScope: 'task'
      };
    }

    return {
      allowed: false,
      creatorScope: null
    };
  }
}

export const authorizationService = new AuthorizationService();

