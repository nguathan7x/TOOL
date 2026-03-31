import { Router } from 'express';
import { spaceMemberController } from './space-member.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createSpaceMemberSchema,
  listSpaceMembersSchema,
  spaceMemberIdParamSchema,
  updateSpaceMemberSchema
} from './space-member.validator.js';

export class SpaceMemberRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router({ mergeParams: true });

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.get('/', validateRequest(listSpaceMembersSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.post('/', validateRequest(createSpaceMemberSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.patch('/:membershipId', validateRequest(updateSpaceMemberSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:membershipId', validateRequest(spaceMemberIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));

    return router;
  }
}

export const spaceMemberRouter = new SpaceMemberRouterBuilder(spaceMemberController).build();
