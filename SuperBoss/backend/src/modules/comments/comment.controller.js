import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { commentService } from './comment.service.js';

export class CommentController {
  constructor(service) {
    this.service = service;
  }

  async listByTask(req, res) {
    const result = await this.service.listTaskComments(req.currentUser, req.validated.params.taskId, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async createForTask(req, res) {
    const comment = await this.service.createTaskComment(req.currentUser, req.validated.params.taskId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, comment);
  }
}

export const commentController = new CommentController(commentService);
