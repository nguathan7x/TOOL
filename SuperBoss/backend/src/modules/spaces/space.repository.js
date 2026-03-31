import { Space } from './space.model.js';
import { Project } from '../projects/project.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { SPACE_ROLES } from '../authorization/authorization.constants.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';

export class SpaceRepository {
  findSpaceById(spaceId) {
    return Space.findById(spaceId);
  }

  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findSpaceKeyInWorkspace(workspaceId, key, excludedSpaceId = null) {
    return Space.findOne({
      workspaceId,
      key,
      ...(excludedSpaceId ? { _id: { $ne: excludedSpaceId } } : {})
    }).select('_id').lean();
  }

  createSpace(payload) {
    return Space.create(payload);
  }

  saveSpace(space) {
    return space.save();
  }

  async ensureCreatorSpaceMembership(userId, workspaceId, spaceId) {
    return SpaceMember.findOneAndUpdate(
      { userId, spaceId },
      {
        $set: {
          workspaceId,
          role: SPACE_ROLES.OWNER,
          status: MEMBERSHIP_STATUS.ACTIVE,
          joinedAt: new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  findOwnedWorkspace(workspaceId, userId) {
    return Workspace.findOne({ _id: workspaceId, createdBy: userId }).select('_id').lean();
  }

  findActiveSpaceMemberships(userId, workspaceId) {
    return SpaceMember.find({
      userId,
      workspaceId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select('spaceId').lean();
  }

  findActiveProjectMemberships(userId, workspaceId) {
    return ProjectMember.find({
      userId,
      workspaceId,
      status: MEMBERSHIP_STATUS.ACTIVE
    }).select('spaceId').lean();
  }

  findSpaces(filter, pagination) {
    return Space.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  }

  countSpaces(filter) {
    return Space.countDocuments(filter);
  }

  hasActiveProjects(spaceId) {
    return Project.exists({ spaceId, isArchived: false });
  }
}

export const spaceRepository = new SpaceRepository();
