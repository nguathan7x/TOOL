import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { projectMemberService } from './project-member.service.js';

export class ProjectMemberController {
  constructor(service) {
    this.service = service;
  }

  async list(req, res) {
    const result = await this.service.listMembers(req.currentUser, req.validated.params, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async create(req, res) {
    const member = await this.service.addMember(req.currentUser, req.validated.params.projectId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, member);
  }

  async update(req, res) {
    const member = await this.service.updateMember(
      req.currentUser,
      req.validated.params.projectId,
      req.validated.params.membershipId,
      req.validated.body
    );
    return sendSuccess(res, HTTP_STATUS.OK, member);
  }

  async remove(req, res) {
    const member = await this.service.removeMember(
      req.currentUser,
      req.validated.params.projectId,
      req.validated.params.membershipId
    );
    return sendSuccess(res, HTTP_STATUS.OK, member);
  }
}

export const projectMemberController = new ProjectMemberController(projectMemberService);
