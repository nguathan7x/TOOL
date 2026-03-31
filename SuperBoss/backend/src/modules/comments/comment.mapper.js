export class CommentMapper {
  toAuthorSummary(user) {
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

  toDto(comment) {
    return {
      id: comment.id,
      workspaceId: String(comment.workspaceId),
      spaceId: String(comment.spaceId),
      projectId: String(comment.projectId),
      taskId: String(comment.taskId),
      authorId: String(comment.authorId?._id ?? comment.authorId),
      content: comment.content,
      author: this.toAuthorSummary(comment.authorId?._id ? comment.authorId : null),
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt
    };
  }
}

export const commentMapper = new CommentMapper();
