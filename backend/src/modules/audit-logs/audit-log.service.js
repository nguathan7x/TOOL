import { auditLogRepository } from './audit-log.repository.js';

export class AuditLogService {
  constructor(repository) {
    this.repository = repository;
  }

  async record(payload) {
    return this.repository.createAuditLog({
      workspaceId: payload.workspaceId ?? null,
      spaceId: payload.spaceId ?? null,
      projectId: payload.projectId ?? null,
      user: payload.user,
      action: payload.action,
      entity: payload.entity,
      entityId: payload.entityId,
      before: payload.before ?? null,
      after: payload.after ?? null,
      timestamp: payload.timestamp ?? new Date()
    });
  }
}

export const auditLogService = new AuditLogService(auditLogRepository);
