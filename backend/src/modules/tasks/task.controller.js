import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { taskService } from './task.service.js';

export class TaskController {
  constructor(service) {
    this.service = service;
  }

  async create(req, res) {
    const task = await this.service.createTask(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, task);
  }

  async list(req, res) {
    const result = await this.service.listTasks(req.currentUser, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async reorder(req, res) {
    const result = await this.service.reorderTasks(req.currentUser, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async getById(req, res) {
    const task = await this.service.getTaskById(req.currentUser, req.validated.params.taskId);
    return sendSuccess(res, HTTP_STATUS.OK, task);
  }

  async update(req, res) {
    const task = await this.service.updateTask(req.currentUser, req.validated.params.taskId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, task);
  }

  async assign(req, res) {
    const task = await this.service.assignTask(req.currentUser, req.validated.params.taskId, req.validated.body.assigneeId ?? null);
    return sendSuccess(res, HTTP_STATUS.OK, task);
  }

  async transition(req, res) {
    const task = await this.service.transitionTask(req.currentUser, req.validated.params.taskId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, task);
  }

  async remove(req, res) {
    const result = await this.service.deleteTask(req.currentUser, req.validated.params.taskId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }
}

export const taskController = new TaskController(taskService);
