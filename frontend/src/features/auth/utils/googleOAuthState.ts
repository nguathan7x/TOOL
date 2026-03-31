const GOOGLE_OAUTH_STATE_KEY = 'superboss.google.oauth.state';

export const googleOAuthState = {
  create() {
    const state = crypto.randomUUID();
    window.sessionStorage.setItem(GOOGLE_OAUTH_STATE_KEY, state);
    return state;
  },

  consume(expectedState: string | null) {
    const storedState = window.sessionStorage.getItem(GOOGLE_OAUTH_STATE_KEY);
    window.sessionStorage.removeItem(GOOGLE_OAUTH_STATE_KEY);
    return Boolean(expectedState && storedState && expectedState === storedState);
  }
};
