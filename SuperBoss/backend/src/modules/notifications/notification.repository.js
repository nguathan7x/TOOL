import { Notification } from './notification.model.js';

const ACTOR_SELECT = 'fullName email avatarUrl globalRole userType specialization isActive';

export class NotificationRepository {
  insertMany(payloads) {
    return Notification.insertMany(payloads);
  }

  findNotificationsForUser(userId, unreadOnly, pagination) {
    return Notification.find({
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    })
      .populate('actorId', ACTOR_SELECT)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countNotificationsForUser(userId, unreadOnly) {
    return Notification.countDocuments({
      userId,
      ...(unreadOnly ? { isRead: false } : {})
    });
  }

  findNotificationForUser(notificationId, userId) {
    return Notification.findOne({ _id: notificationId, userId }).populate('actorId', ACTOR_SELECT);
  }

  save(notification) {
    return notification.save();
  }
}

export const notificationRepository = new NotificationRepository();
