import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { inviteService } from './invite.service.js';

export class InviteController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    const invite = await this.service.createInvite(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, invite);
  }

  async list(req, res) {
    const result = await this.service.listInvites(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async listMine(req, res) {
    const result = await this.service.listMyInvites(req.currentUser);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async accept(req, res) {
    const result = await this.service.acceptInvite(req.currentUser, req.validated.params.inviteId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async revoke(req, res) {
    const result = await this.service.revokeInvite(req.currentUser, req.validated.params.inviteId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async decline(req, res) {
    const result = await this.service.declineInvite(req.currentUser, req.validated.params.inviteId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }
}

export const inviteController = new InviteController(inviteService);
