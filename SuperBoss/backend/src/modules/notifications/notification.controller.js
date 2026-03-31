import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { notificationService } from './notification.service.js';

export class NotificationController {
  constructor(service) {
    this.service = service;
  }

  async listMine(req, res) {
    const result = await this.service.listMyNotifications(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async markRead(req, res) {
    const result = await this.service.markRead(req.currentUser, req.validated.params.notificationId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }
}

export const notificationController = new NotificationController(notificationService);
