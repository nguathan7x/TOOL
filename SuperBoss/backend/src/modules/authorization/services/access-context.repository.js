import { WorkspaceMember } from '../../workspace-members/workspace-member.model.js';
import { SpaceMember } from '../../space-members/space-member.model.js';
import { ProjectMember } from '../../project-members/project-member.model.js';
import { MEMBERSHIP_STATUS } from '../../../constants/membership.js';

export class AccessContextRepository {
  findWorkspaceMembership(userId, workspaceId) {
    return workspaceId
      ? WorkspaceMember.findOne({ userId, workspaceId, status: MEMBERSHIP_STATUS.ACTIVE }).lean()
      : null;
  }

  findSpaceMembership(userId, spaceId) {
    return spaceId
      ? SpaceMember.findOne({ userId, spaceId, status: MEMBERSHIP_STATUS.ACTIVE }).lean()
      : null;
  }

  findProjectMembership(userId, projectId) {
    return projectId
      ? ProjectMember.findOne({ userId, projectId, status: MEMBERSHIP_STATUS.ACTIVE }).lean()
      : null;
  }
}

export const accessContextRepository = new AccessContextRepository();
