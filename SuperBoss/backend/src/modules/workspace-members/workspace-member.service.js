import { WorkspacePolicy } from '../authorization/policies/index.js';
import { MEMBERSHIP_AUDIT_ACTIONS } from '../../constants/audit.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { resolveMembershipUser, toMembershipDto } from '../../shared/memberships/membership-helpers.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { workspaceMemberRepository } from './workspace-member.repository.js';

export class WorkspaceMemberService {
  constructor(repository, auditService) {
    this.repository = repository;
    this.auditService = auditService;
  }

  async listMembers(currentUser, params, query) {
    const workspace = await this.#getWorkspaceOrThrow(params.workspaceId);
    const decision = await WorkspacePolicy.canRead(currentUser, { workspaceId: workspace.id, workspace });
    assertPolicy(decision);

    const pagination = buildPagination(query);
    const filter = {
      workspaceId: params.workspaceId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.repository.findMembers(filter, pagination),
      this.repository.countMembers(filter)
    ]);

    return {
      items: items.map((item) => toMembershipDto(item, ['workspaceId'])),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async addMember(currentUser, workspaceId, payload) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canAddMember(currentUser, { workspaceId: workspace.id, workspace });
    assertPolicy(decision);

    const user = await resolveMembershipUser(payload);
    const membership = await this.repository.upsertMember(workspaceId, user.id, payload);
    const after = toMembershipDto(membership, ['workspaceId']);

    await this.auditService.record({
      workspaceId,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.WORKSPACE_ADD,
      entity: 'WorkspaceMember',
      entityId: membership.id,
      after
    });

    return after;
  }

  async updateMember(currentUser, workspaceId, membershipId, payload) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canAddMember(currentUser, { workspaceId: workspace.id, workspace });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(workspaceId, membershipId);
    const before = toMembershipDto(membership, ['workspaceId']);

    if (payload.role !== undefined) membership.role = payload.role;
    if (payload.status !== undefined) membership.status = payload.status;
    await this.repository.saveMember(membership);
    await this.repository.repopulateMember(membership);
    const after = toMembershipDto(membership, ['workspaceId']);

    await this.auditService.record({
      workspaceId,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.WORKSPACE_UPDATE,
      entity: 'WorkspaceMember',
      entityId: membership.id,
      before,
      after
    });

    return after;
  }

  async removeMember(currentUser, workspaceId, membershipId) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canRemoveMember(currentUser, { workspaceId: workspace.id, workspace });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(workspaceId, membershipId);
    const memberUserId = membership.userId._id ?? membership.userId;
    const hasChildMemberships = await this.repository.hasActiveChildMemberships(workspaceId, memberUserId);

    if (hasChildMemberships.some(Boolean)) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Remove child space or project memberships before removing workspace membership');
    }

    const before = toMembershipDto(membership, ['workspaceId']);
    await this.repository.deleteMember(membership.id);

    await this.auditService.record({
      workspaceId,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.WORKSPACE_REMOVE,
      entity: 'WorkspaceMember',
      entityId: membership.id,
      before
    });

    return before;
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #getMembershipOrThrow(workspaceId, membershipId) {
    const membership = await this.repository.findMembershipById(workspaceId, membershipId);
    return requireDocument(membership, 'Workspace membership not found');
  }
}

export const workspaceMemberService = new WorkspaceMemberService(workspaceMemberRepository, auditLogService);
