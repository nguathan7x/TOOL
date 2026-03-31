import type { AuthSession, ChangePasswordPayload, LoginPayload, RegisterPayload, SessionUser, UpdateProfilePayload } from '../store/auth.types';
import { http } from '../../../services/http';

export type GoogleAuthConfig = {
  enabled: boolean;
  clientId: string | null;
  redirectUri: string | null;
  authorizeUrl: string | null;
};

export const authApi = {
  register(payload: RegisterPayload) {
    return http<AuthSession>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  login(payload: LoginPayload) {
    return http<AuthSession>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  loginWithGoogleCode(code: string) {
    return http<AuthSession>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ code })
    });
  },

  getGoogleConfig() {
    return http<GoogleAuthConfig>('/auth/google/config', {
      method: 'GET',
      skipAuthRefresh: true,
      retryOnUnauthorized: false
    });
  },

  refresh(refreshToken: string) {
    return http<AuthSession>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
      skipAuthRefresh: true
    });
  },

  logout(token: string) {
    return http<{ revoked: boolean }>('/auth/logout', {
      method: 'POST',
      token,
      body: JSON.stringify({}),
      skipAuthRefresh: true,
      retryOnUnauthorized: false
    });
  },

  me(token: string) {
    return http<SessionUser>('/auth/me', {
      method: 'GET',
      token
    });
  },

  updateProfile(token: string, payload: UpdateProfilePayload) {
    return http<SessionUser>('/auth/me', {
      method: 'PATCH',
      token,
      body: JSON.stringify(payload)
    });
  },

  changePassword(token: string, payload: ChangePasswordPayload) {
    return http<AuthSession>('/auth/me/password', {
      method: 'POST',
      token,
      body: JSON.stringify(payload)
    });
  }
};
