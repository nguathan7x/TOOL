import { Router } from 'express';
import { projectController } from './project.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createProjectSchema,
  listProjectsSchema,
  projectIdParamSchema,
  updateProjectSchema
} from './project.validator.js';

export class ProjectRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.post('/', validateRequest(createProjectSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.get('/', validateRequest(listProjectsSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.get('/:projectId', validateRequest(projectIdParamSchema), asyncHandler(this.controller.getById.bind(this.controller)));
    router.patch('/:projectId', validateRequest(updateProjectSchema), asyncHandler(this.controller.update.bind(this.controller)));

    return router;
  }
}

export const projectRouter = new ProjectRouterBuilder(projectController).build();
