import mongoose from 'mongoose';
import { connectDatabase } from '../config/database.js';
import { Invite } from '../modules/invites/invite.model.js';
import { Workspace } from '../modules/workspaces/workspace.model.js';
import { Space } from '../modules/spaces/space.model.js';
import { WorkspaceMember } from '../modules/workspace-members/workspace-member.model.js';
import { SpaceMember } from '../modules/space-members/space-member.model.js';

const TIME_WINDOW_MS = 5 * 60 * 1000;
const SHOULD_APPLY = process.argv.includes('--apply');

function keyFor(...parts) {
  return parts.map((value) => String(value ?? '')).join(':');
}

function toDate(value) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isWithinWindow(left, right) {
  const leftDate = toDate(left);
  const rightDate = toDate(right);

  if (!leftDate || !rightDate) {
    return false;
  }

  return Math.abs(leftDate.getTime() - rightDate.getTime()) <= TIME_WINDOW_MS;
}

function isLikelyAutoWorkspaceMembership(membership, respondedAt) {
  return (
    membership?.status === 'ACTIVE' &&
    membership?.role === 'WORKSPACE_MEMBER' &&
    (isWithinWindow(membership.joinedAt, respondedAt) || isWithinWindow(membership.createdAt, respondedAt))
  );
}

function isLikelyAutoSpaceMembership(membership, respondedAt) {
  return (
    membership?.status === 'ACTIVE' &&
    membership?.role === 'MEMBER' &&
    (isWithinWindow(membership.joinedAt, respondedAt) || isWithinWindow(membership.createdAt, respondedAt))
  );
}

async function main() {
  await connectDatabase();

  const acceptedInvites = await Invite.find({ status: 'ACCEPTED' })
    .select('scopeType userId email workspaceId spaceId projectId respondedAt')
    .lean();

  const [workspaces, spaces, workspaceMemberships, spaceMemberships] = await Promise.all([
    Workspace.find({}).select('_id createdBy').lean(),
    Space.find({}).select('_id createdBy').lean(),
    WorkspaceMember.find({ status: 'ACTIVE' }).lean(),
    SpaceMember.find({ status: 'ACTIVE' }).lean()
  ]);

  const workspaceCreatorSet = new Set(
    workspaces.filter((item) => item.createdBy).map((item) => keyFor(item._id, item.createdBy))
  );
  const spaceCreatorSet = new Set(
    spaces.filter((item) => item.createdBy).map((item) => keyFor(item._id, item.createdBy))
  );

  const acceptedWorkspaceInviteSet = new Set(
    acceptedInvites
      .filter((invite) => invite.scopeType === 'WORKSPACE' && invite.workspaceId && invite.userId)
      .map((invite) => keyFor(invite.workspaceId, invite.userId))
  );

  const acceptedSpaceInviteSet = new Set(
    acceptedInvites
      .filter((invite) => invite.scopeType === 'SPACE' && invite.spaceId && invite.userId)
      .map((invite) => keyFor(invite.spaceId, invite.userId))
  );

  const workspaceMembershipMap = new Map(
    workspaceMemberships.map((membership) => [keyFor(membership.workspaceId, membership.userId), membership])
  );
  const spaceMembershipMap = new Map(
    spaceMemberships.map((membership) => [keyFor(membership.spaceId, membership.userId), membership])
  );

  const workspaceMembershipIdsToDelete = new Set();
  const spaceMembershipIdsToDelete = new Set();

  for (const invite of acceptedInvites) {
    if (!invite.userId || !invite.respondedAt) {
      continue;
    }

    const userId = String(invite.userId);

    if (invite.scopeType === 'SPACE' && invite.workspaceId) {
      const workspaceKey = keyFor(invite.workspaceId, userId);
      if (!acceptedWorkspaceInviteSet.has(workspaceKey) && !workspaceCreatorSet.has(workspaceKey)) {
        const membership = workspaceMembershipMap.get(workspaceKey);
        if (membership && isLikelyAutoWorkspaceMembership(membership, invite.respondedAt)) {
          workspaceMembershipIdsToDelete.add(String(membership._id));
        }
      }
    }

    if (invite.scopeType === 'PROJECT') {
      if (invite.spaceId) {
        const spaceKey = keyFor(invite.spaceId, userId);
        if (!acceptedSpaceInviteSet.has(spaceKey) && !spaceCreatorSet.has(spaceKey)) {
          const membership = spaceMembershipMap.get(spaceKey);
          if (membership && isLikelyAutoSpaceMembership(membership, invite.respondedAt)) {
            spaceMembershipIdsToDelete.add(String(membership._id));
          }
        }
      }

      if (invite.workspaceId) {
        const workspaceKey = keyFor(invite.workspaceId, userId);
        if (!acceptedWorkspaceInviteSet.has(workspaceKey) && !workspaceCreatorSet.has(workspaceKey)) {
          const membership = workspaceMembershipMap.get(workspaceKey);
          if (membership && isLikelyAutoWorkspaceMembership(membership, invite.respondedAt)) {
            workspaceMembershipIdsToDelete.add(String(membership._id));
          }
        }
      }
    }
  }

  const workspaceMembershipIds = [...workspaceMembershipIdsToDelete];
  const spaceMembershipIds = [...spaceMembershipIdsToDelete];

  console.log(JSON.stringify({
    mode: SHOULD_APPLY ? 'apply' : 'dry-run',
    workspaceMembershipsToDelete: workspaceMembershipIds.length,
    spaceMembershipsToDelete: spaceMembershipIds.length,
    workspaceMembershipIds,
    spaceMembershipIds
  }, null, 2));

  if (SHOULD_APPLY) {
    if (workspaceMembershipIds.length > 0) {
      await WorkspaceMember.deleteMany({ _id: { $in: workspaceMembershipIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    }

    if (spaceMembershipIds.length > 0) {
      await SpaceMember.deleteMany({ _id: { $in: spaceMembershipIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    }

    console.log(JSON.stringify({
      applied: true,
      deletedWorkspaceMemberships: workspaceMembershipIds.length,
      deletedSpaceMemberships: spaceMembershipIds.length
    }, null, 2));
  }

  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
