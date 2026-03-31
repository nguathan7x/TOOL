export class AuthMapper {
  toUserDto(user) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl ?? null,
      phone: user.phone ?? null,
      birthday: user.birthday ?? null,
      gender: user.gender ?? null,
      address: user.address ?? null,
      bio: user.bio ?? null,
      globalRole: user.globalRole ?? null,
      userType: user.userType,
      specialization: user.specialization,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };
  }

  toSessionDto(user, tokens) {
    return {
      user: this.toUserDto(user),
      tokens
    };
  }
}

export const authMapper = new AuthMapper();
