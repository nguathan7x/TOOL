import { User } from '../../modules/users/user.model.js';
import { requireDocument } from '../http/service-helpers.js';

const USER_SUMMARY_SELECT = 'fullName email avatarUrl globalRole userType specialization isActive';

export async function resolveMembershipUser(input) {
  const user = input.userId
    ? await User.findById(input.userId).select(USER_SUMMARY_SELECT)
    : await User.findOne({ email: input.email?.toLowerCase() }).select(USER_SUMMARY_SELECT);

  return requireDocument(user, 'User not found');
}

export function toUserSummary(user) {
  if (!user) {
    return null;
  }

  return {
    id: user.id ?? String(user._id),
    fullName: user.fullName,
    email: user.email,
    avatarUrl: user.avatarUrl ?? null,
    globalRole: user.globalRole ?? null,
    userType: user.userType,
    specialization: user.specialization,
    isActive: user.isActive
  };
}

export function toMembershipDto(membership, scopeKeys = []) {
  const dto = {
    id: membership.id,
    userId: typeof membership.userId === 'object' ? String(membership.userId._id ?? membership.userId.id) : String(membership.userId),
    role: membership.role,
    status: membership.status,
    joinedAt: membership.joinedAt,
    createdAt: membership.createdAt,
    updatedAt: membership.updatedAt,
    user: typeof membership.userId === 'object' ? toUserSummary(membership.userId) : null
  };

  for (const scopeKey of scopeKeys) {
    dto[scopeKey] = String(membership[scopeKey]);
  }

  return dto;
}

export const membershipUserPopulate = {
  path: 'userId',
  select: USER_SUMMARY_SELECT
};
