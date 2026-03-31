import { AuditLog } from './audit-log.model.js';
import { Task } from '../tasks/task.model.js';
import { Project } from '../projects/project.model.js';

const ACTOR_POPULATE_SELECT = 'fullName email avatarUrl globalRole userType specialization isActive';

export class AuditLogRepository {
  createAuditLog(payload) {
    return AuditLog.create(payload);
  }

  findTaskById(taskId) {
    return Task.findById(taskId);
  }

  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  findTaskActivity(filter, pagination) {
    return AuditLog.find(filter)
      .populate('user', ACTOR_POPULATE_SELECT)
      .sort({ timestamp: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countTaskActivity(filter) {
    return AuditLog.countDocuments(filter);
  }
}

export const auditLogRepository = new AuditLogRepository();
