import { Task } from './task.model.js';
import { Project } from '../projects/project.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { Comment } from '../comments/comment.model.js';
import { AuditLog } from '../audit-logs/audit-log.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { PROJECT_ROLES } from '../authorization/authorization.constants.js';

export class TaskRepository {
  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  findTaskById(taskId) {
    return Task.findById(taskId);
  }

  findActiveProjectMember(projectId, userId) {
    return ProjectMember.findOne({ projectId, userId, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id');
  }

  findActiveProjectMembership(projectId, userId) {
    return ProjectMember.findOne({ projectId, userId, status: MEMBERSHIP_STATUS.ACTIVE }).select('role').lean();
  }

  findPlanningAuthorities(projectId, createdBy) {
    return ProjectMember.find({
      projectId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      role: { $in: [PROJECT_ROLES.PROJECT_ADMIN, PROJECT_ROLES.PM] }
    }).select('userId').lean();
  }

  findLatestTaskSequence(projectId) {
    return Task.findOne({ projectId }).sort({ sequenceNumber: -1 }).select('sequenceNumber').lean();
  }

  createTask(payload) {
    return Task.create(payload);
  }

  saveTask(task) {
    return task.save();
  }

  findTasks(filter, pagination) {
    return Task.find(filter).sort({ backlogRank: 1, sequenceNumber: 1, updatedAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  }

  countTasks(filter) {
    return Task.countDocuments(filter);
  }

  findTasksByIds(projectId, orderedIds) {
    return Task.find({ projectId, _id: { $in: orderedIds } });
  }

  findRefreshedOrderedTasks(projectId, orderedIds) {
    return Task.find({ projectId, _id: { $in: orderedIds } }).sort({ backlogRank: 1, sequenceNumber: 1 });
  }

  removeDeletedTaskReferences(task) {
    return Promise.all([
      Task.updateMany({ projectId: task.projectId, dependencyTaskIds: task._id }, { $pull: { dependencyTaskIds: task._id } }),
      Comment.deleteMany({ taskId: task._id }),
      AuditLog.deleteMany({ entity: 'Task', entityId: task._id }),
      task.deleteOne()
    ]);
  }
}

export const taskRepository = new TaskRepository();
