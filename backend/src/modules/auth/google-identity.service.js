import { ApiError } from '../../shared/errors/api-error.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { env } from '../../config/env.js';

const GOOGLE_AUTH_BASE_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const GOOGLE_USERINFO_URL = 'https://openidconnect.googleapis.com/v1/userinfo';

export class GoogleIdentityService {
  constructor(clientId, clientSecret, redirectUri) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
  }

  getClientConfig() {
    return {
      enabled: Boolean(this.clientId && this.clientSecret && this.redirectUri),
      clientId: this.clientId ?? null,
      redirectUri: this.redirectUri ?? null,
      authorizeUrl: this.clientId && this.redirectUri
        ? this.#buildAuthorizeUrl()
        : null
    };
  }

  async exchangeAuthorizationCode(code) {
    this.#assertConfigured();

    const tokenResponse = await this.#fetchToken(code);
    const userProfile = await this.#fetchUserProfile(tokenResponse.access_token);

    if (!userProfile.email_verified) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Google account email must be verified');
    }

    return {
      subject: String(userProfile.sub),
      email: String(userProfile.email).trim().toLowerCase(),
      fullName: String(userProfile.name ?? userProfile.email ?? '').trim(),
      avatarUrl: userProfile.picture ? String(userProfile.picture) : null
    };
  }

  #buildAuthorizeUrl() {
    const searchParams = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'consent'
    });

    return `${GOOGLE_AUTH_BASE_URL}?${searchParams.toString()}`;
  }

  #assertConfigured() {
    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      throw new ApiError(HTTP_STATUS.SERVICE_UNAVAILABLE, 'Google sign-in is not configured');
    }
  }

  async #fetchToken(code) {
    let response;

    try {
      response = await fetch(GOOGLE_TOKEN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          code,
          client_id: this.clientId,
          client_secret: this.clientSecret,
          redirect_uri: this.redirectUri,
          grant_type: 'authorization_code'
        })
      });
    } catch {
      throw new ApiError(HTTP_STATUS.BAD_GATEWAY, 'Unable to reach Google token endpoint');
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.access_token) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, payload?.error_description ?? 'Invalid Google authorization code');
    }

    return payload;
  }

  async #fetchUserProfile(accessToken) {
    let response;

    try {
      response = await fetch(GOOGLE_USERINFO_URL, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
    } catch {
      throw new ApiError(HTTP_STATUS.BAD_GATEWAY, 'Unable to fetch Google user profile');
    }

    const payload = await response.json().catch(() => null);

    if (!response.ok || !payload?.sub || !payload?.email) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Unable to resolve Google user profile');
    }

    return payload;
  }
}

export const googleIdentityService = new GoogleIdentityService(
  env.GOOGLE_CLIENT_ID,
  env.GOOGLE_CLIENT_SECRET,
  env.GOOGLE_REDIRECT_URI
);
