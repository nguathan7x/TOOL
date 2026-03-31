import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { spaceService } from './space.service.js';

export class SpaceController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    const space = await this.service.createSpace(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, space);
  }

  async list(req, res) {
    const result = await this.service.listSpaces(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async getById(req, res) {
    const space = await this.service.getSpaceById(req.currentUser, req.validated.params.spaceId);
    return sendSuccess(res, HTTP_STATUS.OK, space);
  }

  async update(req, res) {
    const space = await this.service.updateSpace(req.currentUser, req.validated.params.spaceId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, space);
  }

  async remove(req, res) {
    const space = await this.service.deleteSpace(req.currentUser, req.validated.params.spaceId);
    return sendSuccess(res, HTTP_STATUS.OK, space);
  }
}

export const spaceController = new SpaceController(spaceService);
