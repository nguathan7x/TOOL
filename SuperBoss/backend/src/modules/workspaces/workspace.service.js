import { WorkspacePolicy } from '../authorization/policies/index.js';
import { GLOBAL_ROLES } from '../../constants/user.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { WORKSPACE_AUDIT_ACTIONS } from '../../constants/audit.js';
import { workspaceRepository } from './workspace.repository.js';
import { workspaceMapper } from './workspace.mapper.js';

export class WorkspaceService {
  constructor(repository, mapper, auditService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
  }

  async createWorkspace(currentUser, payload) {
    const decision = await WorkspacePolicy.canCreate(currentUser, {});
    assertPolicy(decision);

    await this.#assertUniqueSlug(payload.slug);

    const workspace = await this.repository.createWorkspace({
      name: payload.name,
      slug: payload.slug.toLowerCase(),
      description: payload.description ?? '',
      createdBy: currentUser.id,
      isActive: true
    });

    await this.repository.ensureCreatorWorkspaceMembership(currentUser.id, workspace.id);

    await this.auditService.record({
      workspaceId: workspace.id,
      user: currentUser.id,
      action: WORKSPACE_AUDIT_ACTIONS.CREATE,
      entity: 'Workspace',
      entityId: workspace.id,
      after: this.mapper.toDto(workspace)
    });

    return this.mapper.toDto(workspace);
  }

  async listWorkspaces(currentUser, query) {
    const pagination = buildPagination(query);
    const filter = await this.#buildListFilter(currentUser, query);
    const [items, total] = await Promise.all([
      this.repository.findWorkspaces(filter, pagination),
      this.repository.countWorkspaces(filter)
    ]);

    return {
      items: items.map((workspace) => this.mapper.toDto(workspace)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async getWorkspaceById(currentUser, workspaceId) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canRead(currentUser, { workspaceId, workspace });
    assertPolicy(decision);

    return this.mapper.toDto(workspace);
  }

  async updateWorkspace(currentUser, workspaceId, payload) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canUpdate(currentUser, { workspaceId, workspace });
    assertPolicy(decision);

    if (payload.slug && payload.slug.toLowerCase() !== workspace.slug) {
      await this.#assertUniqueSlug(payload.slug, workspaceId);
    }

    const before = this.mapper.toDto(workspace);
    if (payload.name !== undefined) workspace.name = payload.name;
    if (payload.slug !== undefined) workspace.slug = payload.slug.toLowerCase();
    if (payload.description !== undefined) workspace.description = payload.description;
    if (payload.isActive !== undefined) workspace.isActive = payload.isActive;
    await this.repository.saveWorkspace(workspace);
    const after = this.mapper.toDto(workspace);

    await this.auditService.record({
      workspaceId: workspace.id,
      user: currentUser.id,
      action: WORKSPACE_AUDIT_ACTIONS.UPDATE,
      entity: 'Workspace',
      entityId: workspace.id,
      before,
      after
    });

    return after;
  }

  async deleteWorkspace(currentUser, workspaceId) {
    const workspace = await this.#getWorkspaceOrThrow(workspaceId);
    const decision = await WorkspacePolicy.canDelete(currentUser, { workspaceId, workspace });
    assertPolicy(decision);

    const activeSpaces = await this.repository.hasActiveSpaces(workspaceId);
    if (activeSpaces) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Workspace still has active spaces');
    }

    const before = this.mapper.toDto(workspace);
    workspace.isActive = false;
    await this.repository.saveWorkspace(workspace);
    const after = this.mapper.toDto(workspace);

    await this.auditService.record({
      workspaceId: workspace.id,
      user: currentUser.id,
      action: WORKSPACE_AUDIT_ACTIONS.DELETE,
      entity: 'Workspace',
      entityId: workspace.id,
      before,
      after
    });

    return after;
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #assertUniqueSlug(slug, excludedWorkspaceId = null) {
    const existing = await this.repository.findWorkspaceBySlug(slug.toLowerCase());
    if (existing && String(existing._id) !== String(excludedWorkspaceId ?? '')) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Workspace slug already exists');
    }
  }

  async #buildListFilter(currentUser, query) {
    const conditions = [{ isActive: query.isActive ?? true }];
    const search = query.search?.trim();

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { slug: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (currentUser.globalRole !== GLOBAL_ROLES.SUPER_ADMIN) {
      const [workspaceMemberships, spaceMemberships, projectMemberships] = await Promise.all([
        this.repository.findActiveWorkspaceMemberships(currentUser.id),
        this.repository.findActiveSpaceMemberships(currentUser.id),
        this.repository.findActiveProjectMemberships(currentUser.id)
      ]);

      const workspaceIds = [...new Set([
        ...workspaceMemberships.map((item) => String(item.workspaceId)),
        ...spaceMemberships.map((item) => String(item.workspaceId)),
        ...projectMemberships.map((item) => String(item.workspaceId))
      ])];

      conditions.push({
        $or: [
          ...(workspaceIds.length > 0 ? [{ _id: { $in: workspaceIds } }] : []),
          { createdBy: currentUser.id }
        ]
      });
    }

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
  }
}

export const workspaceService = new WorkspaceService(workspaceRepository, workspaceMapper, auditLogService);
