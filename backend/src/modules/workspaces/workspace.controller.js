import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { workspaceService } from './workspace.service.js';

export class WorkspaceController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    const workspace = await this.service.createWorkspace(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, workspace);
  }

  async list(req, res) {
    const result = await this.service.listWorkspaces(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async getById(req, res) {
    const workspace = await this.service.getWorkspaceById(req.currentUser, req.validated.params.workspaceId);
    return sendSuccess(res, HTTP_STATUS.OK, workspace);
  }

  async update(req, res) {
    const workspace = await this.service.updateWorkspace(req.currentUser, req.validated.params.workspaceId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, workspace);
  }

  async remove(req, res) {
    const workspace = await this.service.deleteWorkspace(req.currentUser, req.validated.params.workspaceId);
    return sendSuccess(res, HTTP_STATUS.OK, workspace);
  }
}

export const workspaceController = new WorkspaceController(workspaceService);
