import { Router } from 'express';
import { authController } from './auth.controller.js';
import { asyncHandler } from '../../shared/utils/async-handler.js';
import { validateRequest } from '../../middlewares/validate-request.js';
import { requireAuth } from '../../middlewares/require-auth.js';
import {
  changePasswordSchema,
  googleLoginSchema,
  loginSchema,
  logoutSchema,
  refreshSchema,
  registerSchema,
  updateProfileSchema
} from './auth.validator.js';

export class AuthRouterBuilder {
  constructor(controller) {
    this.controller = controller;
  }

  build() {
    const router = Router();

    router.get('/google/config', this.controller.googleConfig.bind(this.controller));
    router.post('/google', validateRequest(googleLoginSchema), asyncHandler(this.controller.googleLogin.bind(this.controller)));
    router.post('/register', validateRequest(registerSchema), asyncHandler(this.controller.register.bind(this.controller)));
    router.post('/login', validateRequest(loginSchema), asyncHandler(this.controller.login.bind(this.controller)));
    router.post('/refresh', validateRequest(refreshSchema), asyncHandler(this.controller.refresh.bind(this.controller)));
    router.post('/logout', requireAuth, validateRequest(logoutSchema), asyncHandler(this.controller.logout.bind(this.controller)));
    router.get('/me', requireAuth, asyncHandler(this.controller.me.bind(this.controller)));
    router.patch('/me', requireAuth, validateRequest(updateProfileSchema), asyncHandler(this.controller.updateProfile.bind(this.controller)));
    router.post('/me/password', requireAuth, validateRequest(changePasswordSchema), asyncHandler(this.controller.changePassword.bind(this.controller)));

    return router;
  }
}

export const authRouter = new AuthRouterBuilder(authController).build();
