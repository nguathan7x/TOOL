import { HTTP_STATUS } from '../../constants/http-status.js';
import { sendSuccess } from '../../shared/http/response.js';
import { authService } from './auth.service.js';

export class AuthController {
  constructor(service) {
    this.service = service;
  }

  async register(req, res) {
    const session = await this.service.register(req.validated.body);
    return sendSuccess(res, HTTP_STATUS.CREATED, session);
  }

  async login(req, res) {
    const session = await this.service.login(req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, session);
  }

  async googleLogin(req, res) {
    const session = await this.service.loginWithGoogle(req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, session);
  }

  googleConfig(req, res) {
    const config = this.service.getGoogleClientConfig();
    return sendSuccess(res, HTTP_STATUS.OK, config);
  }

  async refresh(req, res) {
    const session = await this.service.refresh(req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, session);
  }

  async logout(req, res) {
    const result = await this.service.logout(req.auth.userId);
    return sendSuccess(res, HTTP_STATUS.OK, result);
  }

  async me(req, res) {
    const user = await this.service.getCurrentUser(req.auth.userId);
    return sendSuccess(res, HTTP_STATUS.OK, user);
  }

  async updateProfile(req, res) {
    const user = await this.service.updateCurrentUser(req.auth.userId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, user);
  }

  async changePassword(req, res) {
    const session = await this.service.changeCurrentUserPassword(req.auth.userId, req.validated.body);
    return sendSuccess(res, HTTP_STATUS.OK, session);
  }
}

export const authController = new AuthController(authService);

