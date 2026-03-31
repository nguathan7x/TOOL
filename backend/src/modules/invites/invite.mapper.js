export class InviteMapper {
  toDto(invite, scope = null, inviter = null) {
    return {
      id: invite.id,
      email: invite.email,
      userId: invite.userId ? String(invite.userId) : null,
      scopeType: invite.scopeType,
      workspaceId: invite.workspaceId ? String(invite.workspaceId) : null,
      spaceId: invite.spaceId ? String(invite.spaceId) : null,
      projectId: invite.projectId ? String(invite.projectId) : null,
      role: invite.role,
      status: invite.status,
      invitedBy: String(invite.invitedBy),
      invitedByUser: inviter ? {
        id: String(inviter._id),
        fullName: inviter.fullName,
        email: inviter.email,
        avatarUrl: inviter.avatarUrl ?? null
      } : null,
      message: invite.message ?? '',
      expiresAt: invite.expiresAt,
      respondedAt: invite.respondedAt,
      createdAt: invite.createdAt,
      updatedAt: invite.updatedAt,
      scopeName: scope?.project?.name ?? scope?.space?.name ?? scope?.workspace?.name ?? null,
      workspaceName: scope?.workspace?.name ?? null,
      spaceName: scope?.space?.name ?? null,
      projectName: scope?.project?.name ?? null
    };
  }
}

export const inviteMapper = new InviteMapper();
