import { Router } from 'express';
import { workspaceMemberController } from './workspace-member.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createWorkspaceMemberSchema,
  listWorkspaceMembersSchema,
  updateWorkspaceMemberSchema,
  workspaceMemberIdParamSchema
} from './workspace-member.validator.js';

export class WorkspaceMemberRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router({ mergeParams: true });

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.get('/', validateRequest(listWorkspaceMembersSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.post('/', validateRequest(createWorkspaceMemberSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.patch('/:membershipId', validateRequest(updateWorkspaceMemberSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:membershipId', validateRequest(workspaceMemberIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));

    return router;
  }
}

export const workspaceMemberRouter = new WorkspaceMemberRouterBuilder(workspaceMemberController).build();
