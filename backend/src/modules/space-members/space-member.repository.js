import { Space } from '../spaces/space.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { SpaceMember } from './space-member.model.js';
import { WorkspaceMember } from '../workspace-members/workspace-member.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { membershipUserPopulate } from '../../shared/memberships/membership-helpers.js';

export class SpaceMemberRepository {
  findSpaceById(spaceId) {
    return Space.findById(spaceId);
  }

  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findMembershipById(spaceId, membershipId) {
    return SpaceMember.findOne({ _id: membershipId, spaceId }).populate(membershipUserPopulate);
  }

  findMembers(filter, pagination) {
    return SpaceMember.find(filter)
      .populate(membershipUserPopulate)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countMembers(filter) {
    return SpaceMember.countDocuments(filter);
  }

  findActiveWorkspaceMembership(workspaceId, userId) {
    return WorkspaceMember.findOne({ workspaceId, userId, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id');
  }

  upsertMember(space, userId, payload) {
    return SpaceMember.findOneAndUpdate(
      { spaceId: space.id, userId },
      {
        $set: {
          workspaceId: space.workspaceId,
          role: payload.role,
          status: payload.status ?? MEMBERSHIP_STATUS.ACTIVE,
          joinedAt: payload.joinedAt ? new Date(payload.joinedAt) : new Date()
        }
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).populate(membershipUserPopulate);
  }

  saveMember(membership) {
    return membership.save();
  }

  repopulateMember(membership) {
    return membership.populate(membershipUserPopulate);
  }

  deleteMember(membershipId) {
    return SpaceMember.deleteOne({ _id: membershipId });
  }

  hasActiveProjectMemberships(spaceId, userId) {
    return ProjectMember.exists({ spaceId, userId, status: MEMBERSHIP_STATUS.ACTIVE });
  }
}

export const spaceMemberRepository = new SpaceMemberRepository();
