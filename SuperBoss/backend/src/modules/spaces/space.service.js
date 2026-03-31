import { WorkspacePolicy, SpacePolicy } from '../authorization/policies/index.js';
import { GLOBAL_ROLES } from '../../constants/user.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { SPACE_AUDIT_ACTIONS } from '../../constants/audit.js';
import { spaceRepository } from './space.repository.js';
import { spaceMapper } from './space.mapper.js';

export class SpaceService {
  constructor(repository, mapper, auditService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
  }

  async createSpace(currentUser, payload) {
    const workspace = await this.#getWorkspaceOrThrow(payload.workspaceId);
    const decision = await WorkspacePolicy.canCreateSpace(currentUser, {
      workspaceId: payload.workspaceId,
      workspace
    });
    assertPolicy(decision);

    await this.#assertUniqueKey(payload.workspaceId, payload.key);

    const space = await this.repository.createSpace({
      workspaceId: payload.workspaceId,
      name: payload.name,
      key: payload.key.toUpperCase(),
      description: payload.description ?? '',
      createdBy: currentUser.id,
      isActive: true
    });

    await this.repository.ensureCreatorSpaceMembership(currentUser.id, payload.workspaceId, space.id);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: SPACE_AUDIT_ACTIONS.CREATE,
      entity: 'Space',
      entityId: space.id,
      after: this.mapper.toDto(space)
    });

    return this.mapper.toDto(space);
  }

  async listSpaces(currentUser, query) {
    const pagination = buildPagination(query);
    const filter = await this.#buildListFilter(currentUser, query);
    const [items, total] = await Promise.all([
      this.repository.findSpaces(filter, pagination),
      this.repository.countSpaces(filter)
    ]);

    return {
      items: items.map((space) => this.mapper.toDto(space)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async getSpaceById(currentUser, spaceId) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canRead(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    return this.mapper.toDto(space);
  }

  async updateSpace(currentUser, spaceId, payload) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canUpdate(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    if (payload.key && payload.key.toUpperCase() !== space.key) {
      await this.#assertUniqueKey(space.workspaceId, payload.key, space.id);
    }

    const before = this.mapper.toDto(space);
    if (payload.name !== undefined) space.name = payload.name;
    if (payload.key !== undefined) space.key = payload.key.toUpperCase();
    if (payload.description !== undefined) space.description = payload.description;
    if (payload.isActive !== undefined) space.isActive = payload.isActive;
    await this.repository.saveSpace(space);
    const after = this.mapper.toDto(space);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: SPACE_AUDIT_ACTIONS.UPDATE,
      entity: 'Space',
      entityId: space.id,
      before,
      after
    });

    return after;
  }

  async deleteSpace(currentUser, spaceId) {
    const space = await this.#getSpaceOrThrow(spaceId);
    const workspace = await this.#getWorkspaceOrThrow(space.workspaceId);
    const decision = await SpacePolicy.canDelete(currentUser, {
      workspaceId: space.workspaceId,
      spaceId: space.id,
      workspace,
      space
    });
    assertPolicy(decision);

    const activeProjects = await this.repository.hasActiveProjects(spaceId);
    if (activeProjects) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Space still has active projects');
    }

    const before = this.mapper.toDto(space);
    space.isActive = false;
    await this.repository.saveSpace(space);
    const after = this.mapper.toDto(space);

    await this.auditService.record({
      workspaceId: space.workspaceId,
      spaceId: space.id,
      user: currentUser.id,
      action: SPACE_AUDIT_ACTIONS.DELETE,
      entity: 'Space',
      entityId: space.id,
      before,
      after
    });

    return after;
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #getSpaceOrThrow(spaceId) {
    const space = await this.repository.findSpaceById(spaceId);
    return requireDocument(space, 'Space not found');
  }

  async #assertUniqueKey(workspaceId, key, excludedSpaceId = null) {
    const existing = await this.repository.findSpaceKeyInWorkspace(workspaceId, key.toUpperCase(), excludedSpaceId);
    if (existing) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Space key already exists in this workspace');
    }
  }

  async #buildListFilter(currentUser, query) {
    const conditions = [{ workspaceId: query.workspaceId }, { isActive: query.isActive ?? true }];
    const search = query.search?.trim();

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { key: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (currentUser.globalRole !== GLOBAL_ROLES.SUPER_ADMIN) {
      const workspace = await this.#getWorkspaceOrThrow(query.workspaceId);
      const [workspaceDecision, ownedWorkspace, spaceMemberships, projectMemberships] = await Promise.all([
        WorkspacePolicy.canRead(currentUser, { workspaceId: query.workspaceId, workspace }).catch(() => null),
        this.repository.findOwnedWorkspace(query.workspaceId, currentUser.id),
        this.repository.findActiveSpaceMemberships(currentUser.id, query.workspaceId),
        this.repository.findActiveProjectMemberships(currentUser.id, query.workspaceId)
      ]);

      const hasWorkspaceLevelAccess = Boolean(workspaceDecision?.allowed || ownedWorkspace);
      const spaceIds = [...new Set([
        ...spaceMemberships.map((item) => String(item.spaceId)),
        ...projectMemberships.map((item) => String(item.spaceId))
      ])];

      if (!hasWorkspaceLevelAccess && spaceIds.length === 0) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Workspace access is required');
      }

      if (!hasWorkspaceLevelAccess) {
        conditions.push({
          $or: [
            ...(spaceIds.length > 0 ? [{ _id: { $in: spaceIds } }] : []),
            { createdBy: currentUser.id }
          ]
        });
      }
    }

    return { $and: conditions };
  }
}

export const spaceService = new SpaceService(spaceRepository, spaceMapper, auditLogService);
