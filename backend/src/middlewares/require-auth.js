import { AUTH_ERRORS, AUTH_TOKEN_TYPES } from '../constants/auth.js';
import { HTTP_STATUS } from '../constants/http-status.js';
import { ApiError } from '../shared/errors/api-error.js';
import { authTokenService } from '../modules/auth/token.service.js';

export class RequireAuthMiddleware {
  constructor(tokenService) {
    this.tokenService = tokenService;
  }

  handle(req, res, next) {
    const authorizationHeader = req.headers.authorization;

    if (!authorizationHeader?.startsWith('Bearer ')) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.UNAUTHORIZED));
    }

    const token = authorizationHeader.replace('Bearer ', '').trim();

    try {
      const payload = this.tokenService.verifyAccessToken(token);

      if (payload.type !== AUTH_TOKEN_TYPES.ACCESS) {
        throw new Error('Invalid token type');
      }

      req.auth = {
        userId: payload.sub,
        email: payload.email
      };

      return next();
    } catch {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_TOKEN));
    }
  }
}

const requireAuthMiddleware = new RequireAuthMiddleware(authTokenService);
export const requireAuth = requireAuthMiddleware.handle.bind(requireAuthMiddleware);
