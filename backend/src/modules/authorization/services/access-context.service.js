import { accessContextRepository } from './access-context.repository.js';

export class AccessContextService {
  constructor(repository) {
    this.repository = repository;
  }

  normalizeResourceContext(resource = {}) {
    const task = resource.task ?? null;
    const comment = resource.comment ?? null;
    const project = resource.project ?? null;
    const space = resource.space ?? null;
    const workspace = resource.workspace ?? null;

    return {
      workspaceId:
        this.#readId(resource.workspaceId) ??
        this.#readId(workspace) ??
        this.#readId(space?.workspaceId) ??
        this.#readId(project?.workspaceId) ??
        this.#readId(task?.workspaceId) ??
        this.#readId(comment?.workspaceId),
      spaceId:
        this.#readId(resource.spaceId) ??
        this.#readId(space) ??
        this.#readId(project?.spaceId) ??
        this.#readId(task?.spaceId) ??
        this.#readId(comment?.spaceId),
      projectId:
        this.#readId(resource.projectId) ??
        this.#readId(project) ??
        this.#readId(task?.projectId) ??
        this.#readId(comment?.projectId)
    };
  }

  async resolveAccessContext(userId, resource = {}) {
    const normalized = this.normalizeResourceContext(resource);
    const [workspaceMembership, spaceMembership, projectMembership] = await Promise.all([
      this.repository.findWorkspaceMembership(userId, normalized.workspaceId),
      this.repository.findSpaceMembership(userId, normalized.spaceId),
      this.repository.findProjectMembership(userId, normalized.projectId)
    ]);

    return {
      ...normalized,
      workspaceMembership,
      spaceMembership,
      projectMembership,
      workspaceRole: workspaceMembership?.role ?? null,
      spaceRole: spaceMembership?.role ?? null,
      projectRole: projectMembership?.role ?? null
    };
  }

  #readId(value) {
    if (!value) {
      return null;
    }

    if (typeof value === 'string') {
      return value;
    }

    if (typeof value === 'object') {
      if (value._id) {
        return String(value._id);
      }

      if (value.id) {
        return String(value.id);
      }
    }

    return String(value);
  }
}

export const accessContextService = new AccessContextService(accessContextRepository);
