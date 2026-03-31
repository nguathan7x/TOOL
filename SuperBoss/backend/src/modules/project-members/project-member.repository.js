import { Project } from '../projects/project.model.js';
import { Space } from '../spaces/space.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { ProjectMember } from './project-member.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';
import { membershipUserPopulate } from '../../shared/memberships/membership-helpers.js';

export class ProjectMemberRepository {
  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  findSpaceById(spaceId) {
    return Space.findById(spaceId);
  }

  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findMembershipById(projectId, membershipId) {
    return ProjectMember.findOne({ _id: membershipId, projectId }).populate(membershipUserPopulate);
  }

  findMembers(filter, pagination) {
    return ProjectMember.find(filter)
      .populate(membershipUserPopulate)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit);
  }

  countMembers(filter) {
    return ProjectMember.countDocuments(filter);
  }

  findActiveSpaceMembership(workspaceId, spaceId, userId) {
    return SpaceMember.findOne({ workspaceId, spaceId, userId, status: MEMBERSHIP_STATUS.ACTIVE }).select('_id');
  }

  upsertMember(project, userId, payload) {
    return ProjectMember.findOneAndUpdate(
      { projectId: project.id, userId },
      {
        $set: {
          workspaceId: project.workspaceId,
          spaceId: project.spaceId,
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
    return ProjectMember.deleteOne({ _id: membershipId });
  }
}

export const projectMemberRepository = new ProjectMemberRepository();
