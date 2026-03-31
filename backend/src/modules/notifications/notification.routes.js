import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { notificationController } from './notification.controller.js';
import { listMyNotificationsSchema, notificationIdParamSchema } from './notification.validator.js';

export class NotificationRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.get('/my', validateRequest(listMyNotificationsSchema), asyncHandler(this.controller.listMine.bind(this.controller)));
    router.post('/:notificationId/read', validateRequest(notificationIdParamSchema), asyncHandler(this.controller.markRead.bind(this.controller)));

    return router;
  }
}

export const notificationRouter = new NotificationRouterBuilder(notificationController).build();
