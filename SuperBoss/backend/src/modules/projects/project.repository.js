import { Project } from './project.model.js';
import { Space } from '../spaces/space.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { WorkspaceMember } from '../workspace-members/workspace-member.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { PROJECT_ROLES } from '../authorization/authorization.constants.js';

export class ProjectRepository {
  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findSpaceInWorkspace(spaceId, workspaceId) {
    return Space.findOne({ _id: spaceId, workspaceId, isActive: true });
  }

  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  createProject(payload) {
    return Project.create(payload);
  }

  saveProject(project) {
    return project.save();
  }

  async ensureCreatorProjectMembership(userId, workspaceId, spaceId, projectId) {
    return ProjectMember.findOneAndUpdate(
      { userId, projectId },
      {
        $set: {
          workspaceId,
          spaceId,
          role: PROJECT_ROLES.PROJECT_ADMIN,
          status: MEMBERSHIP_STATUS.ACTIVE,
          joinedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  findWorkspaceMembership(userId, workspaceId) {
    return WorkspaceMember.findOne({ userId, workspaceId, status: MEMBERSHIP_STATUS.ACTIVE }).lean();
  }

  findOwnedWorkspace(workspaceId, userId) {
    return Workspace.findOne({ _id: workspaceId, createdBy: userId }).select('_id').lean();
  }

  findActiveSpaceMemberships(userId, workspaceId, spaceId) {
    return SpaceMember.find({
      userId,
      workspaceId,
      status: MEMBERSHIP_STATUS.ACTIVE,
      ...(spaceId ? { spaceId } : {})
    }).select('spaceId').lean();
  }

  findActiveProjectMemberships(userId, workspaceId) {
    return ProjectMember.find({ userId, workspaceId, status: MEMBERSHIP_STATUS.ACTIVE }).select('projectId').lean();
  }

  findOwnedSpaces(workspaceId, userId, spaceId) {
    return Space.find({
      workspaceId,
      createdBy: userId,
      ...(spaceId ? { _id: spaceId } : {})
    }).select('_id').lean();
  }

  findProjects(filter, pagination) {
    return Project.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  }

  countProjects(filter) {
    return Project.countDocuments(filter);
  }
}

export const projectRepository = new ProjectRepository();
