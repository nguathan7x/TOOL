import { Workspace } from '../workspaces/workspace.model.js';
import { WorkspaceMember } from './workspace-member.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { membershipUserPopulate } from '../../shared/memberships/membership-helpers.js';

export class WorkspaceMemberRepository {
  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findMembershipById(workspaceId, membershipId) {
    return WorkspaceMember.findOne({ _id: membershipId, workspaceId }).populate(membershipUserPopulate);
  }

  findMembers(filter, pagination) {
    return WorkspaceMember.find(filter)
      .populate(membershipUserPopulate)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countMembers(filter) {
    return WorkspaceMember.countDocuments(filter);
  }

  upsertMember(workspaceId, userId, payload) {
    return WorkspaceMember.findOneAndUpdate(
      { workspaceId, userId },
      {
        $set: {
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
    return WorkspaceMember.deleteOne({ _id: membershipId });
  }

  hasActiveChildMemberships(workspaceId, userId) {
    return Promise.all([
      SpaceMember.exists({ workspaceId, userId, status: MEMBERSHIP_STATUS.ACTIVE }),
      ProjectMember.exists({ workspaceId, userId, status: MEMBERSHIP_STATUS.ACTIVE })
    ]);
  }
}

export const workspaceMemberRepository = new WorkspaceMemberRepository();
