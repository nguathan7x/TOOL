import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { projectService } from './project.service.js';

export class ProjectController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    const project = await this.service.createProject(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, project);
  }

  async list(req, res) {
    const result = await this.service.listProjects(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async getById(req, res) {
    const project = await this.service.getProjectById(req.currentUser, req.validated.params.projectId);
    return sendSuccess(res, HTTP_STATUS.OK, project);
  }

  async update(req, res) {
    const project = await this.service.updateProject(req.currentUser, req.validated.params.projectId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, project);
  }
}

export const projectController = new ProjectController(projectService);
