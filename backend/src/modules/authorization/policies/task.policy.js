import { authorizationService } from '../services/authorization.service.js';
import { PERMISSIONS, PROJECT_ROLES } from '../authorization.constants.js';
import { USER_SPECIALIZATIONS } from '../../../constants/user.js';
import { taskWorkflowService } from '../../tasks/task.workflow.service.js';

export class TaskPolicyService {
  canCreate(user, resource) {
    return authorizationService.can(user, PERMISSIONS.TASK_CREATE, resource);
  }

  canRead(user, resource) {
    return authorizationService.can(user, PERMISSIONS.TASK_READ, resource);
  }

  async canUpdate(user, resource) {
    const anyDecision = await authorizationService.can(user, PERMISSIONS.TASK_UPDATE_ANY, resource);

    if (anyDecision.allowed) {
      return anyDecision;
    }

    return authorizationService.can(user, PERMISSIONS.TASK_UPDATE_OWN, resource);
  }

  async canDelete(user, resource) {
    const anyDecision = await authorizationService.can(user, PERMISSIONS.TASK_DELETE_ANY, resource);

    if (anyDecision.allowed) {
      return anyDecision;
    }

    return authorizationService.can(user, PERMISSIONS.TASK_DELETE_OWN, {
      ...resource,
      ownership: {
        taskReporterOnly: true
      }
    });
  }

  canAssign(user, resource) {
    return authorizationService.can(user, PERMISSIONS.TASK_ASSIGN, resource);
  }

  canManageDependencies(user, resource) {
    return authorizationService.can(user, PERMISSIONS.TASK_MANAGE_DEPENDENCIES, resource);
  }

  async canChangeStatus(user, resource) {
    const task = resource.task ?? {};
    const project = resource.project ?? {};
    const nextStatus = resource.nextStatus;
    const currentStatus = task.status;

    const fullDecision = await authorizationService.can(user, PERMISSIONS.TASK_CHANGE_STATUS, resource);
    let baseDecision = fullDecision;

    if (!fullDecision.allowed) {
      const limitedDecision = await authorizationService.can(user, PERMISSIONS.TASK_CHANGE_STATUS_LIMITED, {
        ...resource,
        ownership: {
          taskAssigneeOnly: true
        }
      });

      if (!limitedDecision.allowed) {
        return limitedDecision;
      }

      baseDecision = limitedDecision;
    }

    if (!nextStatus) {
      return this.#allow(baseDecision, 'Status change allowed', {
        workflowCheck: 'No target status supplied'
      });
    }

    if (!taskWorkflowService.transitionExists(project, currentStatus, nextStatus)) {
      return this.#deny('Workflow transition is not allowed', {
        ...baseDecision.debug,
        workflowCheck: {
          from: currentStatus,
          to: nextStatus,
          allowed: false
        }
      });
    }

    if (taskWorkflowService.isDoneStatus(nextStatus) && taskWorkflowService.hasIncompleteChecklist(task)) {
      return this.#deny('Cannot move task to Done while checklist is incomplete', baseDecision.debug);
    }

    if (taskWorkflowService.isDoneStatus(nextStatus) && this.#hasUnresolvedDependencies(resource)) {
      return this.#deny('Cannot move task to Done while unresolved dependencies remain', baseDecision.debug);
    }

    if (
      (taskWorkflowService.isQaStatus(currentStatus) || taskWorkflowService.isQaStatus(nextStatus)) &&
      ![USER_SPECIALIZATIONS.QA, USER_SPECIALIZATIONS.TESTER].includes(user.specialization) &&
      baseDecision.debug.projectRole === PROJECT_ROLES.MEMBER
    ) {
      return this.#deny('QA stage requires QA or TESTER specialization for member-driven transitions', baseDecision.debug);
    }

    if (taskWorkflowService.isUatStatus(nextStatus) && resource.requireClientApproval && resource.uatApprovedByClient !== true) {
      return this.#deny('UAT transition requires client-facing approval', baseDecision.debug);
    }

    return this.#allow(baseDecision, 'Status change allowed by policy', {
      workflowCheck: {
        from: currentStatus,
        to: nextStatus,
        allowed: true
      }
    });
  }

  #deny(reason, debug = {}) {
    return {
      allowed: false,
      reason,
      source: 'policy',
      debug
    };
  }

  #allow(baseDecision, reason, debug = {}) {
    return {
      ...baseDecision,
      reason,
      source: 'policy',
      debug: {
        ...baseDecision.debug,
        ...debug
      }
    };
  }

  #hasUnresolvedDependencies(resource = {}) {
    if (typeof resource.hasUnresolvedDependencies === 'boolean') {
      return resource.hasUnresolvedDependencies;
    }

    return false;
  }
}

export const TaskPolicy = new TaskPolicyService();
