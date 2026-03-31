import { TaskPolicy } from '../authorization/policies/index.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { auditLogRepository } from './audit-log.repository.js';
import { auditLogMapper } from './audit-log.mapper.js';

export class AuditLogQueryService {
  constructor(repository, mapper) {
    this.repository = repository;
    this.mapper = mapper;
  }

  async listTaskActivity(currentUser, taskId, query) {
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

    const filter = {
      $or: [
        { entity: 'Task', entityId: task.id },
        { projectId: task.projectId, 'after.taskId': String(task.id) },
        { projectId: task.projectId, 'before.taskId': String(task.id) }
      ]
    };

    const pagination = buildPagination(query);
    const [items, total] = await Promise.all([
      this.repository.findTaskActivity(filter, pagination),
      this.repository.countTaskActivity(filter)
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

  async #getTaskOrThrow(taskId) {
    const task = await this.repository.findTaskById(taskId);
    return requireDocument(task, 'Task not found');
  }

  async #getProjectOrThrow(projectId) {
    const project = await this.repository.findProjectById(projectId);
    return requireDocument(project, 'Project not found');
  }
}

export const auditLogQueryService = new AuditLogQueryService(auditLogRepository, auditLogMapper);
