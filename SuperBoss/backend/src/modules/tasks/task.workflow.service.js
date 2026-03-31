import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { BoardList } from '../board-lists/board-list.model.js';
import { Task } from './task.model.js';

export class TaskWorkflowService {
  normalizeWorkflowStatus(value) {
    return String(value ?? '').trim().toUpperCase();
  }

  projectStatuses(project) {
    const statuses = (project.statusColumns ?? []).map((item) => this.normalizeWorkflowStatus(item.key || item.name));
    if (!statuses.includes('BACKLOG')) {
      return ['BACKLOG', ...statuses];
    }

    return statuses;
  }

  transitionExists(project, fromStatus, toStatus) {
    const normalizedFrom = this.normalizeWorkflowStatus(fromStatus);
    const normalizedTo = this.normalizeWorkflowStatus(toStatus);

    if (
      (normalizedFrom === 'BACKLOG' && normalizedTo === 'PLANNED') ||
      (normalizedFrom === 'PLANNED' && normalizedTo === 'BACKLOG')
    ) {
      return true;
    }

    return (project.workflowTransitions ?? []).some(
      (item) =>
        this.normalizeWorkflowStatus(item.from) === normalizedFrom &&
        this.normalizeWorkflowStatus(item.to) === normalizedTo
    );
  }

  hasIncompleteChecklist(task) {
    return (task?.checklist ?? []).some((item) => item?.isCompleted !== true);
  }

  isQaStatus(status) {
    return this.normalizeWorkflowStatus(status) === 'QA';
  }

  isUatStatus(status) {
    return this.normalizeWorkflowStatus(status) === 'UAT';
  }

  isDoneStatus(status) {
    return this.normalizeWorkflowStatus(status) === 'DONE';
  }

  ensureTaskTypeAllowed(project, taskType) {
    if (!taskType) {
      return;
    }

    if (!(project.supportedTaskTypes ?? []).includes(taskType)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Task type is not enabled for this project');
    }
  }

  ensureStatusExists(project, status) {
    const allowedStatuses = this.projectStatuses(project);

    if (!allowedStatuses.includes(this.normalizeWorkflowStatus(status))) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Status is not configured for this project', {
        allowedStatuses
      });
    }
  }

  async ensureBoardListBelongsToProject(boardListId, projectId) {
    if (!boardListId) {
      return null;
    }

    const boardList = await BoardList.findOne({ _id: boardListId, projectId });

    if (!boardList) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Board list does not belong to the project');
    }

    return boardList;
  }

  async ensureParentTaskBelongsToProject(parentTaskId, projectId) {
    if (!parentTaskId) {
      return null;
    }

    const parentTask = await Task.findOne({ _id: parentTaskId, projectId }).select('_id');

    if (!parentTask) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Parent task does not belong to the project');
    }

    return parentTask;
  }

  async ensureDependenciesBelongToProject(dependencyTaskIds = [], projectId) {
    if (!dependencyTaskIds.length) {
      return [];
    }

    const tasks = await Task.find({ _id: { $in: dependencyTaskIds }, projectId }).select('_id status');

    if (tasks.length !== dependencyTaskIds.length) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'One or more dependency tasks do not belong to the project');
    }

    return tasks;
  }

  async hasUnresolvedDependencies(task) {
    if (!(task?.dependencyTaskIds ?? []).length) {
      return false;
    }

    const dependencies = await Task.find({ _id: { $in: task.dependencyTaskIds } }).select('status');
    return dependencies.some((item) => this.normalizeWorkflowStatus(item.status) !== 'DONE');
  }

  ensureTransitionAllowed(project, fromStatus, toStatus) {
    if (!this.transitionExists(project, fromStatus, toStatus)) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Workflow transition is not allowed', {
        from: fromStatus,
        to: toStatus
      });
    }
  }
}

export const taskWorkflowService = new TaskWorkflowService();
