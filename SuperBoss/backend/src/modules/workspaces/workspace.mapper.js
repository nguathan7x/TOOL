export class WorkspaceMapper {
  toDto(workspace) {
    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      description: workspace.description,
      createdBy: workspace.createdBy ? String(workspace.createdBy) : null,
      isActive: workspace.isActive,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt
    };
  }
}

export const workspaceMapper = new WorkspaceMapper();
