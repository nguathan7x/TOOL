import { ProjectPolicy } from '../authorization/policies/index.js';
import { MEMBERSHIP_AUDIT_ACTIONS } from '../../constants/audit.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { resolveMembershipUser, toMembershipDto } from '../../shared/memberships/membership-helpers.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { projectMemberRepository } from './project-member.repository.js';

export class ProjectMemberService {
  constructor(repository, auditService) {
    this.repository = repository;
    this.auditService = auditService;
  }

  async listMembers(currentUser, params, query) {
    const project = await this.#getProjectOrThrow(params.projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceOrThrow(project.spaceId)
    ]);
    const decision = await ProjectPolicy.canRead(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      workspace,
      space,
      project
    });
    assertPolicy(decision);

    const pagination = buildPagination(query);
    const filter = {
      projectId: params.projectId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.status ? { status: query.status } : {})
    };

    const [items, total] = await Promise.all([
      this.repository.findMembers(filter, pagination),
      this.repository.countMembers(filter)
    ]);

    return {
      items: items.map((item) => toMembershipDto(item, ['workspaceId', 'spaceId', 'projectId'])),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async addMember(currentUser, projectId, payload) {
    const project = await this.#getProjectOrThrow(projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceOrThrow(project.spaceId)
    ]);
    const decision = await ProjectPolicy.canAddMember(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      workspace,
      space,
      project
    });
    assertPolicy(decision);

    const user = await resolveMembershipUser(payload);
    const spaceMembership = await this.repository.findActiveSpaceMembership(project.workspaceId, project.spaceId, user.id);

    if (!spaceMembership) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'User must be an active space member before joining a project');
    }

    const membership = await this.repository.upsertMember(project, user.id, payload);
    const after = toMembershipDto(membership, ['workspaceId', 'spaceId', 'projectId']);

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.PROJECT_ADD,
      entity: 'ProjectMember',
      entityId: membership.id,
      after
    });

    return after;
  }

  async updateMember(currentUser, projectId, membershipId, payload) {
    const project = await this.#getProjectOrThrow(projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceOrThrow(project.spaceId)
    ]);
    const decision = await ProjectPolicy.canAddMember(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      workspace,
      space,
      project
    });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(projectId, membershipId);
    const before = toMembershipDto(membership, ['workspaceId', 'spaceId', 'projectId']);

    if (payload.role !== undefined) membership.role = payload.role;
    if (payload.status !== undefined) membership.status = payload.status;
    await this.repository.saveMember(membership);
    await this.repository.repopulateMember(membership);
    const after = toMembershipDto(membership, ['workspaceId', 'spaceId', 'projectId']);

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.PROJECT_UPDATE,
      entity: 'ProjectMember',
      entityId: membership.id,
      before,
      after
    });

    return after;
  }

  async removeMember(currentUser, projectId, membershipId) {
    const project = await this.#getProjectOrThrow(projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceOrThrow(project.spaceId)
    ]);
    const decision = await ProjectPolicy.canRemoveMember(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      workspace,
      space,
      project
    });
    assertPolicy(decision);

    const membership = await this.#getMembershipOrThrow(projectId, membershipId);
    const before = toMembershipDto(membership, ['workspaceId', 'spaceId', 'projectId']);
    await this.repository.deleteMember(membership.id);

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: MEMBERSHIP_AUDIT_ACTIONS.PROJECT_REMOVE,
      entity: 'ProjectMember',
      entityId: membership.id,
      before
    });

    return before;
  }

  async #getProjectOrThrow(projectId) {
    const project = await this.repository.findProjectById(projectId);
    return requireDocument(project, 'Project not found');
  }

  async #getSpaceOrThrow(spaceId) {
    const space = await this.repository.findSpaceById(spaceId);
    return requireDocument(space, 'Space not found');
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #getMembershipOrThrow(projectId, membershipId) {
    const membership = await this.repository.findMembershipById(projectId, membershipId);
    return requireDocument(membership, 'Project membership not found');
  }
}

export const projectMemberService = new ProjectMemberService(projectMemberRepository, auditLogService);
