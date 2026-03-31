export type ProfileGender = 'MALE' | 'FEMALE' | 'NON_BINARY' | 'PREFER_NOT_TO_SAY';

export type SessionUser = {
  id: string;
  fullName: string;
  email: string;
  avatarUrl: string | null;
  phone: string | null;
  birthday: string | null;
  gender: ProfileGender | null;
  address: string | null;
  bio: string | null;
  globalRole: 'SUPER_ADMIN' | null;
  userType: 'INTERNAL' | 'CLIENT' | 'EXTERNAL_SUPPORT';
  specialization: 'DEV' | 'QA' | 'TESTER' | 'DESIGNER' | 'BA';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AuthSession = {
  user: SessionUser;
  tokens: AuthTokens;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type RegisterPayload = {
  fullName: string;
  email: string;
  password: string;
  userType?: SessionUser['userType'];
  specialization?: SessionUser['specialization'];
};

export type UpdateProfilePayload = {
  fullName: string;
  specialization: SessionUser['specialization'];
  avatarUrl?: string | null;
  phone: string | null;
  birthday: string | null;
  gender: ProfileGender | null;
  address: string | null;
  bio: string | null;
};

export type ChangePasswordPayload = {
  currentPassword: string;
  newPassword: string;
};

export type AuthState = {
  user: SessionUser | null;
  tokens: AuthTokens | null;
  isBootstrapping: boolean;
  isAuthenticated: boolean;
};
