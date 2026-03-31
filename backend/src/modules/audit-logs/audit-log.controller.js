import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { auditLogQueryService } from './audit-log.query.service.js';

export class AuditLogController {
  constructor(queryService) {
    this.queryService = queryService;
  }

  async listTaskActivity(req, res) {
    const result = await this.queryService.listTaskActivity(req.currentUser, req.validated.params.taskId, req.validated.query);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }
}

export const auditLogController = new AuditLogController(auditLogQueryService);
