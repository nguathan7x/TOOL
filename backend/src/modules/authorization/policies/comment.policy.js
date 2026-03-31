import { authorizationService } from '../services/authorization.service.js';
import { PERMISSIONS } from '../authorization.constants.js';

export class CommentPolicyService {
  canCreate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.COMMENT_CREATE, resource);
  }

  canUpdate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.COMMENT_UPDATE_OWN, {
      ...resource,
      ownership: {
        commentAuthorOnly: true
      }
    });
  }

  async canDelete(user, resource) {
    const anyDecision = await authorizationService.can(user, PERMISSIONS.COMMENT_DELETE_ANY, resource);

    if (anyDecision.allowed) {
      return anyDecision;
    }

    return authorizationService.can(user, PERMISSIONS.COMMENT_DELETE_OWN, {
      ...resource,
      ownership: {
        commentAuthorOnly: true
      }
    });
  }
}

export const CommentPolicy = new CommentPolicyService();
