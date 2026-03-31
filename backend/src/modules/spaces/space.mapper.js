export class SpaceMapper {
  toDto(space) {
    return {
      id: space.id,
      workspaceId: String(space.workspaceId),
      name: space.name,
      key: space.key,
      description: space.description,
      createdBy: space.createdBy ? String(space.createdBy) : null,
      isActive: space.isActive,
      createdAt: space.createdAt,
      updatedAt: space.updatedAt
    };
  }
}

export const spaceMapper = new SpaceMapper();
