import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { auditLogController } from './audit-log.controller.js';
import { listTaskActivitySchema } from './audit-log.validator.js';

export class AuditLogRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router({ mergeParams: true });

    router.get('/', validateRequest(listTaskActivitySchema), asyncHandler(this.controller.listTaskActivity.bind(this.controller)));

    return router;
  }
}

export const auditLogRouter = new AuditLogRouterBuilder(auditLogController).build();
