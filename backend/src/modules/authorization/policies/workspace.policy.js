import { authorizationService } from '../services/authorization.service.js';
import { PERMISSIONS } from '../authorization.constants.js';

export class WorkspacePolicyService {
  canCreate(user, resource = {}) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_CREATE, resource);
  }

  canRead(user, resource) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_READ, resource);
  }

  canUpdate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_UPDATE, resource);
  }

  canDelete(user, resource = {}) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_DELETE, resource);
  }

  canAddMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_MEMBER_ADD, resource);
  }

  canRemoveMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.WORKSPACE_MEMBER_REMOVE, resource);
  }

  canCreateSpace(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_CREATE, resource);
  }
}

export const WorkspacePolicy = new WorkspacePolicyService();
