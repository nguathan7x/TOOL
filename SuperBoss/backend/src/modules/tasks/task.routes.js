import { Router } from 'express';
import { taskController } from './task.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  assignTaskSchema,
  createTaskSchema,
  listTasksSchema,
  reorderTasksSchema,
  taskIdParamSchema,
  transitionTaskSchema,
  updateTaskSchema
} from './task.validator.js';
import { commentRouter } from '../comments/comment.routes.js';
import { auditLogRouter } from '../audit-logs/audit-log.routes.js';

export class TaskRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.post('/', validateRequest(createTaskSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.get('/', validateRequest(listTasksSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.post('/reorder', validateRequest(reorderTasksSchema), asyncHandler(this.controller.reorder.bind(this.controller)));
    router.use('/:taskId/comments', commentRouter);
    router.use('/:taskId/activity', auditLogRouter);
    router.get('/:taskId', validateRequest(taskIdParamSchema), asyncHandler(this.controller.getById.bind(this.controller)));
    router.patch('/:taskId', validateRequest(updateTaskSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:taskId', validateRequest(taskIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));
    router.post('/:taskId/assign', validateRequest(assignTaskSchema), asyncHandler(this.controller.assign.bind(this.controller)));
    router.post('/:taskId/status', validateRequest(transitionTaskSchema), asyncHandler(this.controller.transition.bind(this.controller)));

    return router;
  }
}

export const taskRouter = new TaskRouterBuilder(taskController).build();
