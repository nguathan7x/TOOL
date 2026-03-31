import { Router } from 'express';
import { requireAuth } from '../../middlewares/require-auth.js';
import { attachCurrentUser } from '../../middlewares/attach-current-user.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { inviteController } from './invite.controller.js';
import { createInviteSchema, inviteIdParamSchema, listInvitesSchema } from './invite.validator.js';

export class InviteRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.use(requireAuth, asyncHandler(attachCurrentUser));
    router.get('/my', asyncHandler(this.controller.listMine.bind(this.controller)));
    router.get('/', validateRequest(listInvitesSchema), asyncHandler(this.controller.list.bind(this.controller)));
    router.post('/', validateRequest(createInviteSchema), asyncHandler(this.controller.create.bind(this.controller)));
    router.post('/:inviteId/accept', validateRequest(inviteIdParamSchema), asyncHandler(this.controller.accept.bind(this.controller)));
    router.post('/:inviteId/revoke', validateRequest(inviteIdParamSchema), asyncHandler(this.controller.revoke.bind(this.controller)));
    router.post('/:inviteId/decline', validateRequest(inviteIdParamSchema), asyncHandler(this.controller.decline.bind(this.controller)));

    return router;
  }
}

export const inviteRouter = new InviteRouterBuilder(inviteController).build();
