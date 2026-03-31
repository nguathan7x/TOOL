import { Router } from 'express';
import { spaceController } from './space.controller.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import {
  createSpaceSchema,
  listSpacesSchema,
  spaceIdParamSchema,
  updateSpaceSchema
} from './space.validator.js';

export class SpaceRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.post('/', validateRequest(createSpaceSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.get('/', validateRequest(listSpacesSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.get('/:spaceId', validateRequest(spaceIdParamSchema), asyncHandler(this.controller.getById.bind(this.controller)));
    router.patch('/:spaceId', validateRequest(updateSpaceSchema), asyncHandler(this.controller.update.bind(this.controller)));
    router.delete('/:spaceId', validateRequest(spaceIdParamSchema), asyncHandler(this.controller.remove.bind(this.controller)));

    return router;
  }
}

export const spaceRouter = new SpaceRouterBuilder(spaceController).build();
