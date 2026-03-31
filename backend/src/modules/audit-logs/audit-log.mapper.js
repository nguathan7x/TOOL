export class AuditLogMapper {
  toActorSummary(user) {
    if (!user) {
      return null;
    }

    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      globalRole: user.globalRole ?? null,
      userType: user.userType,
      specialization: user.specialization,
      isActive: user.isActive
    };
  }

  toDto(item) {
    return {
      id: item.id,
      workspaceId: item.workspaceId ? String(item.workspaceId) : null,
      spaceId: item.spaceId ? String(item.spaceId) : null,
      projectId: item.projectId ? String(item.projectId) : null,
      userId: String(item.user?._id ?? item.user),
      user: this.toActorSummary(item.user?._id ? item.user : null),
      action: item.action,
      entity: item.entity,
      entityId: String(item.entityId),
      before: item.before,
      after: item.after,
      timestamp: item.timestamp
    };
  }
}

export const auditLogMapper = new AuditLogMapper();
