import { Invite } from './invite.model.js';
import { User } from '../users/user.model.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { Space } from '../spaces/space.model.js';
import { Project } from '../projects/project.model.js';
import { WorkspaceMember } from '../workspace-members/workspace-member.model.js';
import { SpaceMember } from '../space-members/space-member.model.js';
import { ProjectMember } from '../project-members/project-member.model.js';
import { MEMBERSHIP_STATUS } from '../../constants/membership.js';

export class InviteRepository {
  findInviteById(inviteId) {
    return Invite.findById(inviteId);
  }

  findUserByEmail(email) {
    return User.findOne({ email }).select('_id').lean();
  }

  findInviterById(userId) {
    return User.findById(userId).select('fullName email avatarUrl').lean();
  }

  findWorkspaceById(workspaceId) {
    return Workspace.findById(workspaceId);
  }

  findSpaceById(spaceId) {
    return Space.findById(spaceId);
  }

  findProjectById(projectId) {
    return Project.findById(projectId);
  }

  findPendingInvite(filter) {
    return Invite.findOne({ ...filter, status: 'PENDING' });
  }

  createInvite(payload) {
    return Invite.create(payload);
  }

  saveInvite(invite) {
    return invite.save();
  }

  findInvites(filter, pagination) {
    return Invite.find(filter).sort({ createdAt: -1 }).skip(pagination.skip).limit(pagination.limit);
  }

  countInvites(filter) {
    return Invite.countDocuments(filter);
  }

  findMyPendingInvites(userId, email) {
    return Invite.find({
      status: 'PENDING',
      $or: [{ userId }, { email }]
    }).sort({ createdAt: -1 });
  }

  activateWorkspaceMembership(invite, currentUserId) {
    return WorkspaceMember.findOneAndUpdate(
      { workspaceId: invite.workspaceId, userId: currentUserId },
      { $set: { role: invite.role, status: MEMBERSHIP_STATUS.ACTIVE, joinedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  activateSpaceMembership(invite, currentUserId) {
    return SpaceMember.findOneAndUpdate(
      { workspaceId: invite.workspaceId, spaceId: invite.spaceId, userId: currentUserId },
      { $set: { role: invite.role, status: MEMBERSHIP_STATUS.ACTIVE, joinedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }

  activateProjectMembership(invite, currentUserId) {
    return ProjectMember.findOneAndUpdate(
      { workspaceId: invite.workspaceId, spaceId: invite.spaceId, projectId: invite.projectId, userId: currentUserId },
      { $set: { role: invite.role, status: MEMBERSHIP_STATUS.ACTIVE, joinedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
}

export const inviteRepository = new InviteRepository();
