export class AuthSessionFactory {
  constructor(authTokenService, authMapper) {
    this.authTokenService = authTokenService;
    this.authMapper = authMapper;
  }

  create(user) {
    return this.authMapper.toSessionDto(user, {
      accessToken: this.authTokenService.createAccessToken(user),
      refreshToken: this.authTokenService.createRefreshToken(user)
    });
  }
}
