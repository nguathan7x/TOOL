import { PROJECT_LIFECYCLE_STATUSES } from './project.model.js';

export class ProjectMapper {
  toDto(project) {
    return {
      id: project.id,
      workspaceId: String(project.workspaceId),
      spaceId: String(project.spaceId),
      name: project.name,
      key: project.key,
      description: project.description,
      status: project.status ?? PROJECT_LIFECYCLE_STATUSES.ACTIVE,
      startDate: project.startDate,
      targetEndDate: project.targetEndDate,
      completedAt: project.completedAt,
      archivedAt: project.archivedAt,
      completionNote: project.completionNote ?? '',
      createdBy: project.createdBy ? String(project.createdBy) : null,
      statusColumns: project.statusColumns,
      workflowTransitions: project.workflowTransitions,
      supportedTaskTypes: project.supportedTaskTypes,
      defaultTaskType: project.defaultTaskType,
      isArchived: project.isArchived,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };
  }
}

export const projectMapper = new ProjectMapper();
