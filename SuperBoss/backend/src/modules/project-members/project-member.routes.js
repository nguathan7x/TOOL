import { Router } from 'express';
import { projectMemberController } from './project-member.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createProjectMemberSchema,
  listProjectMembersSchema,
  projectMemberIdParamSchema,
  updateProjectMemberSchema
} from './project-member.validator.js';

export class ProjectMemberRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router({ mergeParams: true });

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.get('/', validateRequest(listProjectMembersSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.post('/', validateRequest(createProjectMemberSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.patch('/:membershipId', validateRequest(updateProjectMemberSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:membershipId', validateRequest(projectMemberIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));

    return router;
  }
}

export const projectMemberRouter = new ProjectMemberRouterBuilder(projectMemberController).build();
