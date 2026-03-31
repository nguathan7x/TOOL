import { Router } from 'express';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { commentController } from './comment.controller.js';
import { createTaskCommentSchema, listTaskCommentsSchema } from './comment.validator.js';

export class CommentRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router({ mergeParams: true });

    router.get('/', validateRequest(listTaskCommentsSchema), asyncHandler(this.controller.listByTask.bind(this.controller)));
    router.post('/', validateRequest(createTaskCommentSchema), asyncHandler(this.controller.createForTask.bind(this.controller)));

    return router;
  }
}

export const commentRouter = new CommentRouterBuilder(commentController).build();
