import { Router } from 'express';
import { workspaceController } from './workspace.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createWorkspaceSchema,
  listWorkspacesSchema,
  updateWorkspaceSchema,
  workspaceIdParamSchema
} from './workspace.validator.js';

export class WorkspaceRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.post('/', validateRequest(createWorkspaceSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.get('/', validateRequest(listWorkspacesSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.get('/:workspaceId', validateRequest(workspaceIdParamSchema), asyncHandler(this.controller.getById.bind(this.controller)));
    router.patch('/:workspaceId', validateRequest(updateWorkspaceSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:workspaceId', validateRequest(workspaceIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));

    return router;
  }
}

export const workspaceRouter = new WorkspaceRouterBuilder(workspaceController).build();
