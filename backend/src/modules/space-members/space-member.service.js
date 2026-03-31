import { SpacePolicy } from '../authorization/policies/index.js';
import { MEMBERSHIP_AUDIT_ACTIONS } from '../../constants/audit.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { resolveMembershipUser, toMembershipDto } from '../../shared/memberships/membership-helpers.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { spaceMemberRepository } from './space-member.repository.js';

export class SpaceMemberService {
  constructor(repository, auditService) {
    this.repository = repository;
    this.auditService = auditService;
  }

  async listMembers(currentUser, params, query) {
    const space = await this.#getSpaceOrThrow(params.spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canRead(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    const pagination = buildPagination(query);
    const filter = {
      spaceId: params.spaceId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.repository.findMembers(filter, pagination),
      this.repository.countMembers(filter)
    ]);

    return {
      items: items.map((item) => toMembershipDto(item, ['workspaceId', 'spaceId'])),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async addMember(currentUser, spaceId, payload) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canAddMember(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    const user = await resolveMembershipUser(payload);
    const workspaceMembership = await this.repository.findActiveWorkspaceMembership(space.workspaceId, user.id);

    if (!workspaceMembership) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User must be an active workspace member before joining a space');
    }

    const membership = await this.repository.upsertMember(space, user.id, payload);
    const after = toMembershipDto(membership, ['workspaceId', 'spaceId']);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.SPACE_ADD,
      entity: 'SpaceMember',
      entityId: membership.id,
      after
    });

    return after;
  }

  async updateMember(currentUser, spaceId, membershipId, payload) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canAddMember(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(spaceId, membershipId);
    const before = toMembershipDto(membership, ['workspaceId', 'spaceId']);

    if (payload.role !== undefined) membership.role = payload.role;
    if (payload.status !== undefined) membership.status = payload.status;
    await this.repository.saveMember(membership);
    await this.repository.repopulateMember(membership);
    const after = toMembershipDto(membership, ['workspaceId', 'spaceId']);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.SPACE_UPDATE,
      entity: 'SpaceMember',
      entityId: membership.id,
      before,
      after
    });

    return after;
  }

  async removeMember(currentUser, spaceId, membershipId) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canRemoveMember(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(spaceId, membershipId);
    const memberUserId = membership.userId._id ?? membership.userId;
    const hasProjectMemberships = await this.repository.hasActiveProjectMemberships(space.id, memberUserId);

    if (hasProjectMemberships) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Remove project memberships before removing space membership');
    }

    const before = toMembershipDto(membership, ['workspaceId', 'spaceId']);
    await this.repository.deleteMember(membership.id);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.SPACE_REMOVE,
      entity: 'SpaceMember',
      entityId: membership.id,
      before
    });

    return before;
  }

  async #getSpaceOrThrow(spaceId) {
    const space = await this.repository.findSpaceById(spaceId);
    return requireDocument(space, 'Space not found');
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #getMembershipOrThrow(spaceId, membershipId) {
    const membership = await this.repository.findMembershipById(spaceId, membershipId);
    return requireDocument(membership, 'Space membership not found');
  }
}

export const spaceMemberService = new SpaceMemberService(spaceMemberRepository, auditLogService);
