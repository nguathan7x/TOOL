import { WorkspacePolicy, SpacePolicy, ProjectPolicy } from '../authorization/policies/index.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { inviteRepository } from './invite.repository.js';
import { inviteMapper } from './invite.mapper.js';

export class InviteService {
  constructor(repository, mapper, auditService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
    this.INVITE_STATUSES = {
      PENDING: 'PENDING',
      ACCEPTED: 'ACCEPTED',
      DECLINED: 'DECLINED',
      REVOKED: 'REVOKED',
      EXPIRED: 'EXPIRED'
    };
  }

  async createInvite(currentUser, payload) {
    const scope = await this.#resolveScope(payload.scopeType, payload.scopeId);
    await this.#assertInvitePermission(currentUser, payload.scopeType, scope);

    const email = payload.email.trim().toLowerCase();
    const user = await this.repository.findUserByEmail(email);
    const existing = await this.repository.findPendingInvite({
      email,
      scopeType: payload.scopeType,
      workspaceId: scope.workspace?.id ?? null,
      spaceId: scope.space?.id ?? null,
      projectId: scope.project?.id ?? null
    });

    if (existing) {
      existing.role = payload.role;
      existing.message = payload.message ?? '';
      existing.userId = user?._id ?? null;
      existing.invitedBy = currentUser.id;
      existing.expiresAt = this.#buildExpiryDate();
      await this.repository.saveInvite(existing);
      return this.#toInviteDto(existing, scope);
    }

    const invite = await this.repository.createInvite({
      email,
      userId: user?._id ?? null,
      scopeType: payload.scopeType,
      workspaceId: scope.workspace?.id ?? null,
      spaceId: scope.space?.id ?? null,
      projectId: scope.project?.id ?? null,
      role: payload.role,
      status: this.INVITE_STATUSES.PENDING,
      invitedBy: currentUser.id,
      message: payload.message ?? '',
      expiresAt: this.#buildExpiryDate()
    });

    await this.auditService.record({
      workspaceId: scope.workspace?.id ?? null,
      spaceId: scope.space?.id ?? null,
      projectId: scope.project?.id ?? null,
      user: currentUser.id,
      action: 'invite.create',
      entity: 'Invite',
      entityId: invite.id,
      after: await this.#toInviteDto(invite, scope)
    });

    return this.#toInviteDto(invite, scope);
  }

  async listInvites(currentUser, query) {
    if (!query.scopeType || !query.scopeId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'scopeType and scopeId are required');
    }

    const scope = await this.#resolveScope(query.scopeType, query.scopeId);
    await this.#assertInvitePermission(currentUser, query.scopeType, scope);

    const pagination = buildPagination(query);
    const filter = {
      scopeType: query.scopeType,
      workspaceId: scope.workspace?.id ?? null,
      spaceId: scope.space?.id ?? null,
      projectId: scope.project?.id ?? null,
      ...(query.status ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.repository.findInvites(filter, pagination),
      this.repository.countInvites(filter)
    ]);

    return {
      items: await Promise.all(items.map(async (invite) => this.#toInviteDto(invite, await this.#resolveScopeSafely(invite)))),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async listMyInvites(currentUser) {
    const now = new Date();
    const invites = await this.repository.findMyPendingInvites(currentUser.id, currentUser.email.toLowerCase());
    const normalized = [];

    for (const invite of invites) {
      if (invite.expiresAt && invite.expiresAt < now) {
        invite.status = this.INVITE_STATUSES.EXPIRED;
        invite.respondedAt = now;
        await this.repository.saveInvite(invite);
        continue;
      }

      normalized.push(await this.#toInviteDto(invite, await this.#resolveScopeSafely(invite)));
    }

    return normalized;
  }

  async acceptInvite(currentUser, inviteId) {
    const invite = await this.#getInviteOrThrow(inviteId);
    const scope = await this.#resolveScopeFromInvite(invite);

    this.#assertInvitePending(invite);
    await this.#assertInviteOwnership(invite, currentUser);
    await this.#expireInviteIfNeeded(invite);

    await this.#activateMembership(invite, currentUser.id);

    invite.status = this.INVITE_STATUSES.ACCEPTED;
    invite.userId = currentUser.id;
    invite.respondedAt = new Date();
    await this.repository.saveInvite(invite);

    await this.auditService.record({
      workspaceId: invite.workspaceId,
      spaceId: invite.spaceId,
      projectId: invite.projectId,
      user: currentUser.id,
      action: 'invite.accept',
      entity: 'Invite',
      entityId: invite.id,
      after: await this.#toInviteDto(invite, scope)
    });

    return this.#toInviteDto(invite, scope);
  }

  async declineInvite(currentUser, inviteId) {
    const invite = await this.#getInviteOrThrow(inviteId);
    const scope = await this.#resolveScopeFromInvite(invite);

    this.#assertInvitePending(invite);
    await this.#assertInviteOwnership(invite, currentUser);
    await this.#expireInviteIfNeeded(invite);

    invite.status = this.INVITE_STATUSES.DECLINED;
    invite.userId = currentUser.id;
    invite.respondedAt = new Date();
    await this.repository.saveInvite(invite);

    await this.auditService.record({
      workspaceId: invite.workspaceId,
      spaceId: invite.spaceId,
      projectId: invite.projectId,
      user: currentUser.id,
      action: 'invite.decline',
      entity: 'Invite',
      entityId: invite.id,
      after: await this.#toInviteDto(invite, scope)
    });

    return this.#toInviteDto(invite, scope);
  }

  async revokeInvite(currentUser, inviteId) {
    const invite = await this.#getInviteOrThrow(inviteId);
    const scope = await this.#resolveScopeFromInvite(invite);
    await this.#assertInvitePermission(currentUser, invite.scopeType, scope);

    if (invite.status !== this.INVITE_STATUSES.PENDING) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Only pending invites can be revoked');
    }

    invite.status = this.INVITE_STATUSES.REVOKED;
    invite.respondedAt = new Date();
    await this.repository.saveInvite(invite);

    await this.auditService.record({
      workspaceId: invite.workspaceId,
      spaceId: invite.spaceId,
      projectId: invite.projectId,
      user: currentUser.id,
      action: 'invite.revoke',
      entity: 'Invite',
      entityId: invite.id,
      after: await this.#toInviteDto(invite, scope)
    });

    return this.#toInviteDto(invite, scope);
  }

  async #toInviteDto(invite, scope) {
    const inviter = invite.invitedBy ? await this.#resolveInviterSafely(invite.invitedBy) : null;
    return this.mapper.toDto(invite, scope, inviter);
  }

  #buildExpiryDate() {
    return new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
  }

  async #resolveInviterSafely(invitedBy) {
    try {
      return await this.repository.findInviterById(invitedBy);
    } catch {
      return null;
    }
  }

  async #resolveScope(scopeType, scopeId) {
    if (scopeType === 'WORKSPACE') {
      const workspace = await this.repository.findWorkspaceById(scopeId);
      return { workspace: requireDocument(workspace, 'Workspace not found'), space: null, project: null };
    }

    if (scopeType === 'SPACE') {
      const space = await this.repository.findSpaceById(scopeId);
      const resolvedSpace = requireDocument(space, 'Space not found');
      const workspace = await this.repository.findWorkspaceById(resolvedSpace.workspaceId);
      return { workspace: requireDocument(workspace, 'Workspace not found'), space: resolvedSpace, project: null };
    }

    const project = await this.repository.findProjectById(scopeId);
    const resolvedProject = requireDocument(project, 'Project not found');
    const [space, workspace] = await Promise.all([
      this.repository.findSpaceById(resolvedProject.spaceId),
      this.repository.findWorkspaceById(resolvedProject.workspaceId)
    ]);

    return {
      workspace: requireDocument(workspace, 'Workspace not found'),
      space: requireDocument(space, 'Space not found'),
      project: resolvedProject
    };
  }

  async #resolveScopeFromInvite(invite) {
    const scopeId = invite.scopeType === 'WORKSPACE' ? String(invite.workspaceId) : invite.scopeType === 'SPACE' ? String(invite.spaceId) : String(invite.projectId);
    return this.#resolveScope(invite.scopeType, scopeId);
  }

  async #resolveScopeSafely(invite) {
    try {
      return await this.#resolveScopeFromInvite(invite);
    } catch {
      return null;
    }
  }

  async #assertInvitePermission(currentUser, scopeType, scope) {
    if (scopeType === 'WORKSPACE') {
      return assertPolicy(await WorkspacePolicy.canAddMember(currentUser, { workspaceId: scope.workspace.id, workspace: scope.workspace }));
    }

    if (scopeType === 'SPACE') {
      return assertPolicy(await SpacePolicy.canAddMember(currentUser, { workspaceId: scope.workspace.id, spaceId: scope.space.id, workspace: scope.workspace, space: scope.space }));
    }

    return assertPolicy(await ProjectPolicy.canAddMember(currentUser, { workspaceId: scope.workspace.id, spaceId: scope.space.id, projectId: scope.project.id, workspace: scope.workspace, space: scope.space, project: scope.project }));
  }

  async #getInviteOrThrow(inviteId) {
    const invite = await this.repository.findInviteById(inviteId);
    return requireDocument(invite, 'Invite not found');
  }

  #assertInvitePending(invite) {
    if (invite.status !== this.INVITE_STATUSES.PENDING) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Invite is no longer pending');
    }
  }

  async #assertInviteOwnership(invite, currentUser) {
    if (invite.email !== currentUser.email.toLowerCase() && String(invite.userId ?? '') !== String(currentUser.id)) {
      throw new ApiError(HTTP_STATUS.FORBIDDEN, 'This invite does not belong to your account');
    }
  }

  async #expireInviteIfNeeded(invite) {
    if (invite.expiresAt && invite.expiresAt < new Date()) {
      invite.status = this.INVITE_STATUSES.EXPIRED;
      invite.respondedAt = new Date();
      await this.repository.saveInvite(invite);
      throw new ApiError(HTTP_STATUS.GONE, 'Invite has expired');
    }
  }

  async #activateMembership(invite, currentUserId) {
    if (invite.scopeType === 'WORKSPACE') {
      return this.repository.activateWorkspaceMembership(invite, currentUserId);
    }
    if (invite.scopeType === 'SPACE') {
      return this.repository.activateSpaceMembership(invite, currentUserId);
    }
    return this.repository.activateProjectMembership(invite, currentUserId);
  }
}

export const inviteService = new InviteService(inviteRepository, inviteMapper, auditLogService);

