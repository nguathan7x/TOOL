import { randomUUID } from 'node:crypto';
import { AUTH_ERRORS, AUTH_TOKEN_TYPES } from '../../constants/auth.js';
import { HTTP_STATUS } from '../../constants/http-status.js';
import { ApiError } from '../../shared/errors/api-error.js';
import { authRepository } from './auth.repository.js';
import { passwordService } from './password.service.js';
import { authTokenService } from './token.service.js';
import { authMapper } from './auth.mapper.js';
import { AuthSessionFactory } from './auth-session.factory.js';
import { googleIdentityService } from './google-identity.service.js';

export class AuthService {
  constructor(repository, passwordServiceInstance, authTokenServiceInstance, authMapperInstance, sessionFactory, googleService) {
    this.repository = repository;
    this.passwordService = passwordServiceInstance;
    this.authTokenService = authTokenServiceInstance;
    this.authMapper = authMapperInstance;
    this.sessionFactory = sessionFactory;
    this.googleService = googleService;
  }

  async register(payload) {
    await this.#ensureEmailAvailable(payload.email);

    const passwordHash = await this.passwordService.hash(payload.password);
    const user = await this.repository.createUser({
      fullName: payload.fullName,
      email: payload.email,
      passwordHash,
      userType: payload.userType,
      specialization: payload.specialization
    });

    return this.sessionFactory.create(user);
  }

  async login(payload) {
    const user = await this.#validateCredentials(payload.email, payload.password);
    return this.sessionFactory.create(user);
  }

  async loginWithGoogle(payload) {
    const googleProfile = await this.googleService.exchangeAuthorizationCode(payload.code);
    const user = await this.#resolveGoogleUser(googleProfile);
    return this.sessionFactory.create(user);
  }

  getGoogleClientConfig() {
    return this.googleService.getClientConfig();
  }

  async refresh(payload) {
    const user = await this.#validateRefreshSession(payload.refreshToken);
    return this.sessionFactory.create(user);
  }

  async logout(userId) {
    const user = await this.#getActiveUserOrThrow(userId);
    user.refreshTokenVersion += 1;
    await this.repository.save(user);
    return { revoked: true };
  }

  async getCurrentUser(userId) {
    const user = await this.#getActiveUserOrThrow(userId);
    return this.authMapper.toUserDto(user);
  }

  async updateCurrentUser(userId, payload) {
    const user = await this.#getActiveUserOrThrow(userId);

    user.fullName = payload.fullName;
    user.specialization = payload.specialization;
    user.phone = payload.phone ?? null;
    user.birthday = payload.birthday ?? null;
    user.gender = payload.gender ?? null;
    user.address = payload.address ?? null;
    user.bio = payload.bio ?? null;

    if (payload.avatarUrl !== undefined) {
      user.avatarUrl = payload.avatarUrl;
    }

    await this.repository.save(user);
    return this.authMapper.toUserDto(user);
  }

  async changeCurrentUserPassword(userId, payload) {
    const user = await this.#getActiveUserOrThrow(userId);
    await this.#ensureCurrentPasswordMatches(user, payload.currentPassword);
    await this.#ensureNewPasswordIsDifferent(user, payload.newPassword);

    user.passwordHash = await this.passwordService.hash(payload.newPassword);
    user.refreshTokenVersion += 1;
    await this.repository.save(user);

    return this.sessionFactory.create(user);
  }

  async getCurrentUserContext(userId) {
    const user = await this.#getActiveUserOrThrow(userId);

    return {
      id: user.id,
      email: user.email,
      globalRole: user.globalRole ?? null,
      userType: user.userType,
      specialization: user.specialization,
      isActive: user.isActive
    };
  }

  async #resolveGoogleUser(googleProfile) {
    const userBySubject = await this.repository.findByGoogleSubject(googleProfile.subject);

    if (userBySubject) {
      this.#assertUserActive(userBySubject);
      await this.#syncGoogleProfile(userBySubject, googleProfile);
      return userBySubject;
    }

    const userByEmail = await this.repository.findByEmail(googleProfile.email);
    if (userByEmail) {
      this.#assertUserActive(userByEmail);

      if (userByEmail.googleSubject && userByEmail.googleSubject !== googleProfile.subject) {
        throw new ApiError(HTTP_STATUS.CONFLICT, 'This email is already linked to another Google account');
      }

      userByEmail.googleSubject = googleProfile.subject;
      await this.#syncGoogleProfile(userByEmail, googleProfile);
      return userByEmail;
    }

    const passwordHash = await this.passwordService.hash(randomUUID());
    return this.repository.createUser({
      fullName: googleProfile.fullName,
      email: googleProfile.email,
      passwordHash,
      googleSubject: googleProfile.subject,
      avatarUrl: googleProfile.avatarUrl,
      userType: 'INTERNAL',
      specialization: 'DEV'
    });
  }

  async #syncGoogleProfile(user, googleProfile) {
    let shouldSave = false;

    if (!user.googleSubject) {
      user.googleSubject = googleProfile.subject;
      shouldSave = true;
    }

    if ((!user.fullName || user.fullName.trim().length < 2) && googleProfile.fullName) {
      user.fullName = googleProfile.fullName;
      shouldSave = true;
    }

    if (!user.avatarUrl && googleProfile.avatarUrl) {
      user.avatarUrl = googleProfile.avatarUrl;
      shouldSave = true;
    }

    if (shouldSave) {
      await this.repository.save(user);
    }
  }

  async #ensureEmailAvailable(email) {
    const exists = await this.repository.existsByEmail(email);
    if (exists) {
      throw new ApiError(HTTP_STATUS.CONFLICT, 'Email is already registered');
    }
  }

  async #validateCredentials(email, password) {
    const user = await this.repository.findByEmail(email);

    if (!user || !user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    const isValidPassword = await this.passwordService.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_CREDENTIALS);
    }

    return user;
  }

  async #validateRefreshSession(refreshToken) {
    let payload;

    try {
      payload = this.authTokenService.verifyRefreshToken(refreshToken);
    } catch {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_TOKEN);
    }

    if (payload.type !== AUTH_TOKEN_TYPES.REFRESH) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_TOKEN);
    }

    const user = await this.repository.findById(payload.sub);
    if (!user || !user.isActive || user.refreshTokenVersion !== payload.version) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.INVALID_TOKEN);
    }

    return user;
  }

  async #getActiveUserOrThrow(userId) {
    const user = await this.repository.findById(userId);
    if (!user || !user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.UNAUTHORIZED);
    }

    return user;
  }

  #assertUserActive(user) {
    if (!user.isActive) {
      throw new ApiError(HTTP_STATUS.UNAUTHORIZED, AUTH_ERRORS.UNAUTHORIZED);
    }
  }

  async #ensureCurrentPasswordMatches(user, currentPassword) {
    const isValidCurrentPassword = await this.passwordService.compare(currentPassword, user.passwordHash);
    if (!isValidCurrentPassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'Current password is incorrect');
    }
  }

  async #ensureNewPasswordIsDifferent(user, newPassword) {
    const isSamePassword = await this.passwordService.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      throw new ApiError(HTTP_STATUS.BAD_REQUEST, 'New password must be different from the current password');
    }
  }
}

const authSessionFactory = new AuthSessionFactory(authTokenService, authMapper);
export const authService = new AuthService(authRepository, passwordService, authTokenService, authMapper, authSessionFactory, googleIdentityService);
