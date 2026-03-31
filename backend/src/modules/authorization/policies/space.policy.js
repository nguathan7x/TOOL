import { authorizationService } from '../services/authorization.service.js';
import { PERMISSIONS } from '../authorization.constants.js';

export class SpacePolicyService {
  canRead(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_READ, resource);
  }

  canUpdate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_UPDATE, resource);
  }

  canDelete(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_DELETE, resource);
  }

  canAddMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_MEMBER_ADD, resource);
  }

  canRemoveMember(user, resource) {
    return authorizationService.can(user, PERMISSIONS.SPACE_MEMBER_REMOVE, resource);
  }

  canCreateProject(user, resource) {
    return authorizationService.can(user, PERMISSIONS.PROJECT_CREATE, resource);
  }
}

export const SpacePolicy = new SpacePolicyService();
