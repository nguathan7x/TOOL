import { PROJECT_LIFECYCLE_STATUSES } from '../projects/project.model.js';
import { TaskPolicy } from '../authorization/policies/index.js';
import { PROJECT_ROLES } from '../authorization/authorization.constants.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { notificationService } from '../notifications/notification.service.js';
import { taskWorkflowService } from './task.workflow.service.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { taskRepository } from './task.repository.js';
import { taskMapper } from './task.mapper.js';

export class TaskService {
  constructor(repository, mapper, auditService, notifications, workflowService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
    this.notifications = notifications;
    this.workflowService = workflowService;
  }

  async createTask(currentUser, payload) {
    const project = await this.#getProjectOrThrow(payload.projectId);

    if (String(project.workspaceId) !== payload.workspaceId || String(project.spaceId) !== payload.spaceId) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Project scope does not match workspace or space');
    }

    this.#assertProjectAllowsTaskExecution(project, 'Creating tasks');

    const createDecision = await TaskPolicy.canCreate(currentUser, {
      workspaceId: payload.workspaceId,
      spaceId: payload.spaceId,
      projectId: payload.projectId,
      project
    });
    assertPolicy(createDecision);

    const currentMembership = await this.repository.findActiveProjectMembership(payload.projectId, currentUser.id);

    if (payload.assigneeId) {
      const assignDecision = await TaskPolicy.canAssign(currentUser, {
        workspaceId: payload.workspaceId,
        spaceId: payload.spaceId,
        projectId: payload.projectId,
        project
      });
      assertPolicy(assignDecision);
      await this.#ensureProjectMember(payload.projectId, payload.assigneeId);
    }

    this.#assertValidSchedule(payload.startDate, payload.dueDate);
    this.workflowService.ensureTaskTypeAllowed(project, payload.taskType ?? project.defaultTaskType);
    this.workflowService.ensureStatusExists(project, payload.status);
    await this.workflowService.ensureBoardListBelongsToProject(payload.boardListId ?? null, payload.projectId);
    await this.workflowService.ensureParentTaskBelongsToProject(payload.parentTaskId ?? null, payload.projectId);
    await this.workflowService.ensureDependenciesBelongToProject(payload.dependencyTaskIds ?? [], payload.projectId);

    const sequenceNumber = await this.#nextSequenceNumber(payload.projectId);
    const task = await this.repository.createTask({
      workspaceId: payload.workspaceId,
      spaceId: payload.spaceId,
      projectId: payload.projectId,
      boardListId: payload.boardListId ?? null,
      parentTaskId: payload.parentTaskId ?? null,
      taskType: payload.taskType ?? project.defaultTaskType,
      title: payload.title,
      description: payload.description ?? '',
      createdBy: currentUser.id,
      status: payload.status,
      priority: payload.priority ?? 'MEDIUM',
      assigneeId: payload.assigneeId ?? null,
      reporterId: currentUser.id,
      labels: payload.labels ?? [],
      startDate: payload.startDate ? new Date(payload.startDate) : null,
      dueDate: payload.dueDate ? new Date(payload.dueDate) : null,
      estimateHours: typeof payload.estimateHours === 'number' ? payload.estimateHours : null,
      checklist: (payload.checklist ?? []).map((item) => ({
        title: item.title,
        isCompleted: item.isCompleted ?? false,
        completedAt: item.completedAt ? new Date(item.completedAt) : null
      })),
      dependencyTaskIds: payload.dependencyTaskIds ?? [],
      sequenceNumber,
      backlogRank: sequenceNumber
    });

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'task.create',
      entity: 'Task',
      entityId: task.id,
      after: this.mapper.toDto(task)
    });

    if (currentMembership?.role === PROJECT_ROLES.MEMBER && String(task.status).toUpperCase() === 'BACKLOG') {
      await this.#notifyAuthoritiesAboutBacklogTask(task, project, currentUser);
    }

    return this.mapper.toDto(task);
  }

  async listTasks(currentUser, query) {
    const pagination = buildPagination(query);
    const project = await this.#getProjectOrThrow(query.projectId);
    const readDecision = await TaskPolicy.canRead(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      project
    });
    assertPolicy(readDecision);

    const filter = { projectId: query.projectId };
    if (query.status) filter.status = query.status;
    if (query.boardListId) filter.boardListId = query.boardListId;
    if (query.assigneeId) filter.assigneeId = query.assigneeId;

    const [items, total] = await Promise.all([
      this.repository.findTasks(filter, pagination),
      this.repository.countTasks(filter)
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

  async reorderTasks(currentUser, payload) {
    const project = await this.#getProjectOrThrow(payload.projectId);
    this.#assertProjectAllowsTaskExecution(project, 'Reordering backlog work');

    const assignDecision = await TaskPolicy.canAssign(currentUser, {
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      project
    });
    assertPolicy(assignDecision);

    const orderedIds = payload.orderedTaskIds.map(String);
    const tasks = await this.repository.findTasksByIds(payload.projectId, orderedIds);

    if (tasks.length !== orderedIds.length) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'One or more backlog tasks were not found in this project');
    }

    const taskById = new Map(tasks.map((task) => [String(task.id), task]));
    await Promise.all(orderedIds.map((taskId, index) => this.#updateBacklogRank(taskById.get(taskId), index + 1)));

    await this.auditService.record({
      workspaceId: project.workspaceId,
      spaceId: project.spaceId,
      projectId: project.id,
      user: currentUser.id,
      action: 'task.reorder',
      entity: 'Project',
      entityId: project.id,
      after: { orderedTaskIds: orderedIds }
    });

    const refreshedTasks = await this.repository.findRefreshedOrderedTasks(payload.projectId, orderedIds);
    return refreshedTasks.map((item) => this.mapper.toDto(item));
  }

  async getTaskById(currentUser, taskId) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    const readDecision = await TaskPolicy.canRead(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project
    });
    assertPolicy(readDecision);

    return this.mapper.toDto(task);
  }

  async updateTask(currentUser, taskId, payload) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    this.#assertProjectAllowsTaskExecution(project, 'Updating tasks');

    const updateDecision = await TaskPolicy.canUpdate(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project
    });
    assertPolicy(updateDecision);

    if (payload.boardListId !== undefined) {
      await this.workflowService.ensureBoardListBelongsToProject(payload.boardListId, task.projectId);
    }
    if (payload.dependencyTaskIds !== undefined) {
      await this.workflowService.ensureDependenciesBelongToProject(payload.dependencyTaskIds, task.projectId);
    }

    const before = this.mapper.toDto(task);
    const nextStartDate = payload.startDate !== undefined ? payload.startDate : (task.startDate ? task.startDate.toISOString() : null);
    const nextDueDate = payload.dueDate !== undefined ? payload.dueDate : (task.dueDate ? task.dueDate.toISOString() : null);
    this.#assertValidSchedule(nextStartDate, nextDueDate);

    if (payload.title !== undefined) task.title = payload.title;
    if (payload.description !== undefined) task.description = payload.description;
    if (payload.priority !== undefined) task.priority = payload.priority;
    if (payload.labels !== undefined) task.labels = payload.labels;
    if (payload.startDate !== undefined) task.startDate = payload.startDate ? new Date(payload.startDate) : null;
    if (payload.dueDate !== undefined) task.dueDate = payload.dueDate ? new Date(payload.dueDate) : null;
    if (payload.estimateHours !== undefined) task.estimateHours = typeof payload.estimateHours === 'number' ? payload.estimateHours : null;
    if (payload.boardListId !== undefined) task.boardListId = payload.boardListId ?? null;
    if (payload.dependencyTaskIds !== undefined) task.dependencyTaskIds = payload.dependencyTaskIds;
    if (payload.checklist !== undefined) {
      task.checklist = payload.checklist.map((item) => ({
        title: item.title,
        isCompleted: item.isCompleted ?? false,
        completedAt: item.completedAt ? new Date(item.completedAt) : null
      }));
    }

    await this.repository.saveTask(task);
    const after = this.mapper.toDto(task);

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'task.update',
      entity: 'Task',
      entityId: task.id,
      before,
      after
    });

    return after;
  }

  async assignTask(currentUser, taskId, assigneeId) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    this.#assertProjectAllowsTaskExecution(project, 'Assigning tasks');

    const assignDecision = await TaskPolicy.canAssign(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project
    });
    assertPolicy(assignDecision);
    await this.#ensureProjectMember(task.projectId, assigneeId);

    const before = this.mapper.toDto(task);
    task.assigneeId = assigneeId;
    await this.repository.saveTask(task);
    const after = this.mapper.toDto(task);

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'task.assign',
      entity: 'Task',
      entityId: task.id,
      before,
      after
    });

    return after;
  }

  async transitionTask(currentUser, taskId, payload) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    const hasUnresolvedDependencies = await this.workflowService.hasUnresolvedDependencies(task);

    this.#assertProjectAllowsTaskExecution(project, 'Moving tasks across the workflow');

    const transitionDecision = await TaskPolicy.canChangeStatus(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project,
      nextStatus: payload.status,
      hasUnresolvedDependencies,
      requireClientApproval: payload.requireClientApproval,
      uatApprovedByClient: payload.uatApprovedByClient
    });
    assertPolicy(transitionDecision);

    this.workflowService.ensureStatusExists(project, payload.status);
    this.workflowService.ensureTransitionAllowed(project, task.status, payload.status);

    const before = this.mapper.toDto(task);
    task.status = payload.status;
    await this.repository.saveTask(task);
    const after = this.mapper.toDto(task);

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'task.transition',
      entity: 'Task',
      entityId: task.id,
      before,
      after
    });

    return after;
  }

  async deleteTask(currentUser, taskId) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    const deleteDecision = await TaskPolicy.canDelete(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project
    });
    assertPolicy(deleteDecision);

    const before = this.mapper.toDto(task);
    await this.repository.removeDeletedTaskReferences(task);

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'task.delete',
      entity: 'Task',
      entityId: task.id,
      before,
      after: null
    });

    return { id: task.id, deleted: true };
  }

  async #getProjectOrThrow(projectId) {
    const project = await this.repository.findProjectById(projectId);
    return requireDocument(project, 'Project not found');
  }

  async #getTaskOrThrow(taskId) {
    const task = await this.repository.findTaskById(taskId);
    return requireDocument(task, 'Task not found');
  }

  async #ensureProjectMember(projectId, userId) {
    if (!userId) {
      return;
    }

    const membership = await this.repository.findActiveProjectMember(projectId, userId);
    if (!membership) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Assignee must be an active member of the project');
    }
  }

  async #notifyAuthoritiesAboutBacklogTask(task, project, actor) {
    const memberships = await this.repository.findPlanningAuthorities(project.id, project.createdBy);
    const recipientIds = new Set(memberships.map((item) => String(item.userId)));

    if (project.createdBy) {
      recipientIds.add(String(project.createdBy));
    }

    await this.notifications.createTaskPlanningReviewNotifications({
      task,
      project,
      actor,
      recipientIds: [...recipientIds]
    });
  }

  #assertValidSchedule(startDate, dueDate) {
    if (!startDate || !dueDate) {
      return;
    }

    const start = new Date(startDate);
    const due = new Date(dueDate);
    if (start.getTime() > due.getTime()) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Start date must be on or before due date');
    }
  }

  #assertProjectAllowsTaskExecution(project, actionLabel) {
    const lifecycleStatus = String(project.status ?? PROJECT_LIFECYCLE_STATUSES.ACTIVE).toUpperCase();
    if (lifecycleStatus === PROJECT_LIFECYCLE_STATUSES.COMPLETED || lifecycleStatus === PROJECT_LIFECYCLE_STATUSES.ARCHIVED) {
      throw new ApiError(HTTP_STATUS.CONFLICT, `Project is ${lifecycleStatus.toLowerCase().split('_').join(' ')}. ${actionLabel} is locked.`);
    }
  }

  async #nextSequenceNumber(projectId) {
    const latestTask = await this.repository.findLatestTaskSequence(projectId);
    return (latestTask?.sequenceNumber ?? 0) + 1;
  }

  async #updateBacklogRank(task, rank) {
    if (!task) {
      return;
    }

    task.backlogRank = rank;
    await this.repository.saveTask(task);
  }
}

export const taskService = new TaskService(taskRepository, taskMapper, auditLogService, notificationService, taskWorkflowService);
