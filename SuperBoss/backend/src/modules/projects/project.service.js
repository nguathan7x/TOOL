import { PROJECT_LIFECYCLE_STATUSES } from './project.model.js';
import { ProjectPolicy, SpacePolicy } from '../authorization/policies/index.js';
import { GLOBAL_ROLES } from '../../constants/user.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { projectRepository } from './project.repository.js';
import { projectMapper } from './project.mapper.js';

export class ProjectService {
  constructor(repository, mapper, auditService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
  }

  async createProject(currentUser, payload) {
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(payload.workspaceId),
      this.#getSpaceInWorkspaceOrThrow(payload.spaceId, payload.workspaceId)
    ]);

    const policyDecision = await SpacePolicy.canCreateProject(currentUser, {
      workspaceId: payload.workspaceId,
      spaceId: payload.spaceId,
      workspace,
      space
    });
    assertPolicy(policyDecision);

    const project = await this.repository.createProject({
      workspaceId: payload.workspaceId,
      spaceId: payload.spaceId,
      name: payload.name,
      key: payload.key,
      description: payload.description ?? '',
      status: PROJECT_LIFECYCLE_STATUSES.ACTIVE,
      startDate: null,
      targetEndDate: null,
      completedAt: null,
      archivedAt: null,
      completionNote: '',
      createdBy: currentUser.id,
      statusColumns: payload.statusColumns,
      workflowTransitions: payload.workflowTransitions,
      supportedTaskTypes: payload.supportedTaskTypes,
      defaultTaskType: payload.defaultTaskType,
      isArchived: false
    });

    await this.repository.ensureCreatorProjectMembership(currentUser.id, payload.workspaceId, payload.spaceId, project.id);

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: 'project.create',
      entity: 'Project',
      entityId: project.id,
      after: this.mapper.toDto(project)
    });

    return this.mapper.toDto(project);
  }

  async listProjects(currentUser, query) {
    const pagination = buildPagination(query);
    const filter = await this.#buildListFilter(currentUser, query);

    const [items, total] = await Promise.all([
      this.repository.findProjects(filter, pagination),
      this.repository.countProjects(filter)
    ]);

    return {
      items: items.map((item) => this.mapper.toDto(item)),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total,
        totalPages: Math.ceil(total / pagination.limit) || 0
      }
    };
  }

  async getProjectById(currentUser, projectId) {
    const project = await this.#getProjectOrThrow(projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceInWorkspaceOrThrow(project.spaceId, project.workspaceId)
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

    return this.mapper.toDto(project);
  }

  async updateProject(currentUser, projectId, payload) {
    const project = await this.#getProjectOrThrow(projectId);
    const [workspace, space] = await Promise.all([
      this.#getWorkspaceOrThrow(project.workspaceId),
      this.#getSpaceInWorkspaceOrThrow(project.spaceId, project.workspaceId)
    ]);
    const decision = await ProjectPolicy.canUpdate(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      workspace,
      space,
      project
    });
    assertPolicy(decision);

    const before = this.mapper.toDto(project);
    this.#applyLifecyclePayload(project, payload);
    await this.repository.saveProject(project);
    const after = this.mapper.toDto(project);

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: 'project.update',
      entity: 'Project',
      entityId: project.id,
      before,
      after
    });

    return after;
  }

  async #buildListFilter(currentUser, query) {
    const conditions = [{ workspaceId: query.workspaceId }];
    const search = query.search?.trim();

    if (query.spaceId) {
      conditions.push({ spaceId: query.spaceId });
    }

    if (search) {
      conditions.push({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { key: { $regex: search, $options: 'i' } }
        ]
      });
    }

    if (currentUser.globalRole !== GLOBAL_ROLES.SUPER_ADMIN) {
      const [workspaceMembership, ownedWorkspace, spaceMemberships, projectMemberships, ownedSpaces] = await Promise.all([
        this.repository.findWorkspaceMembership(currentUser.id, query.workspaceId),
        this.repository.findOwnedWorkspace(query.workspaceId, currentUser.id),
        this.repository.findActiveSpaceMemberships(currentUser.id, query.workspaceId, query.spaceId),
        this.repository.findActiveProjectMemberships(currentUser.id, query.workspaceId),
        this.repository.findOwnedSpaces(query.workspaceId, currentUser.id, query.spaceId)
      ]);

      const spaceIds = [...new Set([...spaceMemberships.map((item) => String(item.spaceId)), ...ownedSpaces.map((item) => String(item._id))])];
      const projectIds = projectMemberships.map((item) => item.projectId);

      if (!workspaceMembership && !ownedWorkspace && spaceIds.length === 0 && projectIds.length === 0) {
        throw new ApiError(HTTP_STATUS.FORBIDDEN, 'Workspace membership is required');
      }

      if (!ownedWorkspace) {
        conditions.push({
          $or: [
            ...(spaceIds.length > 0 ? [{ spaceId: { $in: spaceIds } }] : []),
            ...(projectIds.length > 0 ? [{ _id: { $in: projectIds } }] : []),
            { createdBy: currentUser.id }
          ]
        });
      }
    }

    return conditions.length === 1 ? conditions[0] : { $and: conditions };
  }

  async #getWorkspaceOrThrow(workspaceId) {
    const workspace = await this.repository.findWorkspaceById(workspaceId);
    return requireDocument(workspace, 'Workspace not found');
  }

  async #getSpaceInWorkspaceOrThrow(spaceId, workspaceId) {
    const space = await this.repository.findSpaceInWorkspace(spaceId, workspaceId);
    return requireDocument(space, 'Space was not found in the specified workspace');
  }

  async #getProjectOrThrow(projectId) {
    const project = await this.repository.findProjectById(projectId);
    return requireDocument(project, 'Project not found');
  }

  #normalizeDateInput(value) {
    if (value === undefined) {
      return undefined;
    }

    if (value === null || value === '') {
      return null;
    }

    return value instanceof Date ? value : new Date(value);
  }

  #assertLifecycleWindow(startDate, targetEndDate) {
    if (startDate && targetEndDate && startDate.getTime() > targetEndDate.getTime()) {
      throw new ApiError(HTTP_STATUS.UNPROCESSABLE_ENTITY, 'Target end date must be on or after the start date');
    }
  }

  #applyLifecyclePayload(project, payload) {
    if (payload.name !== undefined) project.name = payload.name;
    if (payload.description !== undefined) project.description = payload.description;
    if (payload.statusColumns !== undefined) project.statusColumns = payload.statusColumns;
    if (payload.workflowTransitions !== undefined) project.workflowTransitions = payload.workflowTransitions;
    if (payload.supportedTaskTypes !== undefined) project.supportedTaskTypes = payload.supportedTaskTypes;
    if (payload.defaultTaskType !== undefined) project.defaultTaskType = payload.defaultTaskType;
    if (payload.completionNote !== undefined) project.completionNote = payload.completionNote ?? '';

    const nextStartDate = this.#normalizeDateInput(payload.startDate);
    const nextTargetEndDate = this.#normalizeDateInput(payload.targetEndDate);
    const nextCompletedAt = this.#normalizeDateInput(payload.completedAt);
    const nextArchivedAt = this.#normalizeDateInput(payload.archivedAt);

    if (nextStartDate !== undefined) project.startDate = nextStartDate;
    if (nextTargetEndDate !== undefined) project.targetEndDate = nextTargetEndDate;

    this.#assertLifecycleWindow(project.startDate, project.targetEndDate);

    if (payload.status !== undefined) project.status = payload.status;
    if (nextCompletedAt !== undefined) project.completedAt = nextCompletedAt;
    if (nextArchivedAt !== undefined) project.archivedAt = nextArchivedAt;

    switch (project.status) {
      case PROJECT_LIFECYCLE_STATUSES.ACTIVE:
        project.isArchived = false;
        project.archivedAt = null;
        project.completedAt = null;
        break;
      case PROJECT_LIFECYCLE_STATUSES.ON_HOLD:
        project.isArchived = false;
        project.archivedAt = null;
        break;
      case PROJECT_LIFECYCLE_STATUSES.COMPLETED:
        project.isArchived = false;
        project.archivedAt = null;
        project.completedAt = project.completedAt ?? new Date();
        break;
      case PROJECT_LIFECYCLE_STATUSES.ARCHIVED:
        project.isArchived = true;
        project.completedAt = project.completedAt ?? new Date();
        project.archivedAt = project.archivedAt ?? new Date();
        break;
      default:
        break;
    }

    if (payload.isArchived !== undefined && payload.status === undefined) {
      project.isArchived = payload.isArchived;
      if (!payload.isArchived) {
        project.archivedAt = null;
        if (project.status === PROJECT_LIFECYCLE_STATUSES.ARCHIVED) {
          project.status = PROJECT_LIFECYCLE_STATUSES.ACTIVE;
        }
      } else {
        project.status = PROJECT_LIFECYCLE_STATUSES.ARCHIVED;
        project.archivedAt = project.archivedAt ?? new Date();
        project.completedAt = project.completedAt ?? new Date();
      }
    }
  }
}

export const projectService = new ProjectService(projectRepository, projectMapper, auditLogService);
