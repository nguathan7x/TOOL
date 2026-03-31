export class NotificationMapper {
  toDto(item) {
    return {
      id: item.id,
      userId: String(item.userId),
      actorId: item.actorId?._id ? String(item.actorId._id) : item.actorId ? String(item.actorId) : null,
      actor: item.actorId?._id ? this.#toActorSummary(item.actorId) : null,
      workspaceId: item.workspaceId ? String(item.workspaceId) : null,
      spaceId: item.spaceId ? String(item.spaceId) : null,
      projectId: item.projectId ? String(item.projectId) : null,
      type: item.type,
      title: item.title,
      message: item.message,
      entity: item.entity,
      entityId: String(item.entityId),
      metadata: item.metadata ?? null,
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt
    };
  }

  #toActorSummary(user) {
    return {
      id: user.id ?? String(user._id),
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      globalRole: user.globalRole ?? null,
      userType: user.userType,
      specialization: user.specialization,
      isActive: user.isActive
    };
  }
}

export const notificationMapper = new NotificationMapper();
