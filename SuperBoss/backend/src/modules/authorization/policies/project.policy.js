import { authorizationService } from '../services/authorization.service.js';
import { PERMISSIONS } from '../authorization.constants.js';

export class ProjectPolicyService {
  canRead(user, resource) {
    return authorizationService.can(user, PERMISSIONS.PROJECT_READ, resource);
  }

  canUpdate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.PROJECT_UPDATE, resource);
  }

  canAddMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.PROJECT_MEMBER_ADD, resource);
  }

  canRemoveMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.PROJECT_MEMBER_REMOVE, resource);
  }

  canManageBoardLists(user, resource) {
    return authorizationService.can(user, PERMISSIONS.BOARDLIST_MANAGE, resource);
  }
}

export const ProjectPolicy = new ProjectPolicyService();
