import { HTTP_STATUS } from '../constants/http-status.js';
import { ApiError } from '../shared/errors/api-error.js';
import { authService } from '../modules/auth/auth.service.js';

export class CurrentUserMiddleware {
  constructor(service) {
    this.service = service;
  }

  async handle(req, res, next) {
    if (!req.auth?.userId) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authentication is required'));
    }

    try {
      req.currentUser = await this.service.getCurrentUserContext(req.auth.userId);
      return next();
    } catch (error) {
      return next(new ApiError(HTTP_STATUS.UNAUTHORIZED, 'Authenticated user is no longer active'));
    }
  }
}

const currentUserMiddleware = new CurrentUserMiddleware(authService);
export const attachCurrentUser = currentUserMiddleware.handle.bind(currentUserMiddleware);
