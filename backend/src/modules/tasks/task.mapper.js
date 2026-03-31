export class TaskMapper {
  toDto(task) {
    return {
      id: task.id,
      workspaceId: String(task.workspaceId),
      spaceId: String(task.spaceId),
      projectId: String(task.projectId),
      boardListId: task.boardListId ? String(task.boardListId) : null,
      parentTaskId: task.parentTaskId ? String(task.parentTaskId) : null,
      taskType: task.taskType,
      title: task.title,
      description: task.description,
      createdBy: task.createdBy ? String(task.createdBy) : null,
      status: task.status,
      priority: task.priority,
      assigneeId: task.assigneeId ? String(task.assigneeId) : null,
      reporterId: String(task.reporterId),
      labels: task.labels,
      startDate: task.startDate,
      dueDate: task.dueDate,
      estimateHours: typeof task.estimateHours === 'number' ? task.estimateHours : null,
      checklist: task.checklist,
      dependencyTaskIds: task.dependencyTaskIds.map((item) => String(item)),
      sequenceNumber: task.sequenceNumber,
      backlogRank: typeof task.backlogRank === 'number' ? task.backlogRank : null,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    };
  }
}

export const taskMapper = new TaskMapper();
