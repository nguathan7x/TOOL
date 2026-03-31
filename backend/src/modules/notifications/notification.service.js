import { buildPagination } from '../../shared/utils/pagination.js';
import { requireDocument } from '../../shared/http/service-helpers.js';
import { notificationRepository } from './notification.repository.js';
import { notificationMapper } from './notification.mapper.js';

export class NotificationService {
  constructor(repository, mapper) {
    this.repository = repository;
    this.mapper = mapper;
    this.NOTIFICATION_TYPES = {
      TASK_PLANNING_REVIEW_REQUESTED: 'TASK_PLANNING_REVIEW_REQUESTED'
    };
  }

  async createTaskPlanningReviewNotifications({ task, project, actor, recipientIds = [] }) {
    const uniqueRecipientIds = [...new Set(recipientIds.map((id) => String(id)).filter(Boolean))].filter((id) => id !== String(actor.id));

    if (uniqueRecipientIds.length === 0) {
      return [];
    }

    const now = new Date();
    const docs = uniqueRecipientIds.map((userId) => ({
      userId,
      actorId: actor.id,
      workspaceId: task.workspaceId,
      spaceId: task.spaceId,
      projectId: task.projectId,
      type: this.NOTIFICATION_TYPES.TASK_PLANNING_REVIEW_REQUESTED,
      title: 'Backlog task needs planning review',
      message: `${actor.fullName} created "${task.title}" and it is waiting for planning approval.`,
      entity: 'Task',
      entityId: task.id,
      metadata: {
        taskTitle: task.title,
        projectName: project.name,
        projectKey: project.key,
        requestedStatus: task.status
      },
      isRead: false,
      createdAt: now,
      updatedAt: now
    }));

    await this.repository.insertMany(docs);
    return docs;
  }

  async listMyNotifications(currentUser, query) {
    const pagination = buildPagination(query);
    const [items, total] = await Promise.all([
      this.repository.findNotificationsForUser(currentUser.id, query.unreadOnly, pagination),
      this.repository.countNotificationsForUser(currentUser.id, query.unreadOnly)
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

  async markRead(currentUser, notificationId) {
    const item = await this.repository.findNotificationForUser(notificationId, currentUser.id);
    const notification = requireDocument(item, 'Notification not found');

    notification.isRead = true;
    await this.repository.save(notification);

    return this.mapper.toDto(notification);
  }
}

export const notificationService = new NotificationService(notificationRepository, notificationMapper);
