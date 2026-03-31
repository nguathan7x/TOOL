import { Workspace } from './workspace.model.js';
import { Space } from '../spaces/space.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { WorkspaceMember } from '../workspace-members/workspace-member.model.js';
import { WORKSPACE_ROLES } from '../authorization/authorization.constants.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';

export class WorkspaceRepository {
  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findWorkspaceBySlug(slug) {
    return Workspace.findOne({ slug }).select('_id').lean();
  }

  createWorkspace(payload) {
    return Workspace.create(payload);
  }

  saveWorkspace(workspace) {
    return workspace.save();
  }

  async ensureCreatorWorkspaceMembership(userId, workspaceId) {
    return WorkspaceMember.findOneAndUpdate(
      { userId, workspaceId },
      {
        $set: {
          role: WORKSPACE_ROLES.WORKSPACE_ADMIN,
          status: MEMBERSHIP_STATUS.ACTIVE,
          joinedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  findActiveWorkspaceMemberships(userId) {
    return WorkspaceMember.find({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select('workspaceId').lean();
  }

  findActiveSpaceMemberships(userId) {
    return SpaceMember.find({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select('workspaceId').lean();
  }

  findActiveProjectMemberships(userId) {
    return ProjectMember.find({
      userId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select('workspaceId').lean();
  }

  findWorkspaces(filter, pagination) {
    return Workspace.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  }

  countWorkspaces(filter) {
    return Workspace.countDocuments(filter);
  }

  hasActiveSpaces(workspaceId) {
    return Space.exists({ workspaceId, isActive: true });
  }
}

export const workspaceRepository = new WorkspaceRepository();
