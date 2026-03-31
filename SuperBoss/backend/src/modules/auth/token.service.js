import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';
import { AUTH_TOKEN_TYPES } from '../../constants/auth.js';

export class AuthTokenService {
  createAccessToken(user) {
    return this.#signToken(
      {
        sub: user.id,
        email: user.email,
        type: AUTH_TOKEN_TYPES.ACCESS
      },
      env.JWT_ACCESS_SECRET,
      env.JWT_ACCESS_EXPIRES_IN
    );
  }

  createRefreshToken(user) {
    return this.#signToken(
      {
        sub: user.id,
        version: user.refreshTokenVersion,
        type: AUTH_TOKEN_TYPES.REFRESH
      },
      env.JWT_REFRESH_SECRET,
      env.JWT_REFRESH_EXPIRES_IN
    );
  }

  verifyAccessToken(token) {
    return jwt.verify(token, env.JWT_ACCESS_SECRET);
  }

  verifyRefreshToken(token) {
    return jwt.verify(token, env.JWT_REFRESH_SECRET);
  }

  #signToken(payload, secret, expiresIn) {
    return jwt.sign(payload, secret, { expiresIn });
  }
}

export const authTokenService = new AuthTokenService();
