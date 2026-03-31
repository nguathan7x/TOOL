import { CommentPolicy, TaskPolicy } from '../authorization/policies/index.js';
import { buildPagination } from '../../shared/utils/pagination.js';
import { assertPolicy, requireDocument } from '../../shared/http/service-helpers.js';
import { auditLogService } from '../audit-logs/audit-log.service.js';
import { commentRepository } from './comment.repository.js';
import { commentMapper } from './comment.mapper.js';

export class CommentService {
  constructor(repository, mapper, auditService) {
    this.repository = repository;
    this.mapper = mapper;
    this.auditService = auditService;
  }

  async listTaskComments(currentUser, taskId, query) {
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

    const pagination = buildPagination(query);
    const [items, total] = await Promise.all([
      this.repository.findCommentsByTask(taskId, pagination),
      this.repository.countCommentsByTask(taskId)
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

  async createTaskComment(currentUser, taskId, payload) {
    const task = await this.#getTaskOrThrow(taskId);
    const project = await this.#getProjectOrThrow(task.projectId);
    const createDecision = await CommentPolicy.canCreate(currentUser, {
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      task,
      project
    });
    assertPolicy(createDecision);

    const comment = await this.repository.createComment({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      taskId: task.id,
      authorId: currentUser.id,
      content: payload.content
    });

    await this.auditService.record({
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      user: currentUser.id,
      action: 'comment.create',
      entity: 'Comment',
      entityId: comment.id,
      after: {
        id: comment.id,
        taskId: String(comment.taskId),
        content: comment.content
      }
    });

    const hydrated = await this.repository.findCommentById(comment.id);
    return this.mapper.toDto(requireDocument(hydrated, 'Comment not found after creation'));
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

export const commentService = new CommentService(commentRepository, commentMapper, auditLogService);
