import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren
} from 'react';
import { authApi } from '../api/authApi';
import type {
  AuthSession,
  AuthState,
  ChangePasswordPayload,
  LoginPayload,
  RegisterPayload,
  UpdateProfilePayload
} from './auth.types';
import {
  AUTH_EXPIRED_EVENT,
  SESSION_UPDATED_EVENT,
  dispatchSessionUpdated,
  loadStoredSession,
  persistSession
} from './sessionStorage';

type AuthContextValue = AuthState & {
  login: (payload: LoginPayload, options?: { remember?: boolean }) => Promise<void>;
  loginWithGoogle: (code: string, options?: { remember?: boolean }) => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (payload: UpdateProfilePayload) => Promise<void>;
  changePassword: (payload: ChangePasswordPayload) => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: PropsWithChildren) {
  const [state, setState] = useState<AuthState>({
    user: null,
    tokens: null,
    isBootstrapping: true,
    isAuthenticated: false
  });

  const clearSession = useCallback(() => {
    persistSession(null);
    setState({
      user: null,
      tokens: null,
      isBootstrapping: false,
      isAuthenticated: false
    });
  }, []);

  useEffect(() => {
    const session = loadStoredSession();

    if (!session?.tokens.accessToken) {
      setState((currentState) => ({
        ...currentState,
        isBootstrapping: false
      }));
      return;
    }

    authApi
      .me(session.tokens.accessToken)
      .then((user) => {
        const nextSession = {
          user,
          tokens: session.tokens
        };
        persistSession(nextSession);
        setState({
          user,
          tokens: session.tokens,
          isBootstrapping: false,
          isAuthenticated: true
        });
      })
      .catch(() => {
        clearSession();
      });
  }, [clearSession]);

  useEffect(() => {
    function handleAuthExpired() {
      clearSession();
      if (window.location.pathname !== '/login') {
        window.location.assign('/login');
      }
    }

    function handleSessionUpdated(event: Event) {
      const customEvent = event as CustomEvent<AuthSession>;
      const session = customEvent.detail;
      if (!session) {
        return;
      }

      setState({
        user: session.user,
        tokens: session.tokens,
        isBootstrapping: false,
        isAuthenticated: true
      });
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
    window.addEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated as EventListener);

    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, handleAuthExpired);
      window.removeEventListener(SESSION_UPDATED_EVENT, handleSessionUpdated as EventListener);
    };
  }, [clearSession]);

  const login = useCallback(async (payload: LoginPayload, options?: { remember?: boolean }) => {
    const session = await authApi.login(payload);
    persistSession(session, options?.remember === false ? 'session' : 'local');
    dispatchSessionUpdated(session);
  }, []);

  const loginWithGoogle = useCallback(async (code: string, options?: { remember?: boolean }) => {
    const session = await authApi.loginWithGoogleCode(code);
    persistSession(session, options?.remember === false ? 'session' : 'local');
    dispatchSessionUpdated(session);
  }, []);

  const register = useCallback(async (payload: RegisterPayload) => {
    const session = await authApi.register(payload);
    persistSession(session, 'local');
    dispatchSessionUpdated(session);
  }, []);

  const logout = useCallback(async () => {
    const accessToken = state.tokens?.accessToken;

    try {
      if (accessToken) {
        await authApi.logout(accessToken);
      }
    } catch {
      // Clear local session even if the revoke call fails.
    } finally {
      clearSession();
    }
  }, [clearSession, state.tokens?.accessToken]);

  const updateProfile = useCallback(
    async (payload: UpdateProfilePayload) => {
      const accessToken = state.tokens?.accessToken;
      const refreshToken = state.tokens?.refreshToken;

      if (!accessToken || !refreshToken || !state.user) {
        throw new Error('No active session');
      }

      const user = await authApi.updateProfile(accessToken, payload);
      const nextSession = {
        user,
        tokens: {
          accessToken,
          refreshToken
        }
      };

      persistSession(nextSession);
      dispatchSessionUpdated(nextSession);
    },
    [state.tokens?.accessToken, state.tokens?.refreshToken, state.user]
  );

  const changePassword = useCallback(
    async (payload: ChangePasswordPayload) => {
      const accessToken = state.tokens?.accessToken;

      if (!accessToken || !state.user) {
        throw new Error('No active session');
      }

      const session = await authApi.changePassword(accessToken, payload);
      persistSession(session);
      dispatchSessionUpdated(session);
    },
    [state.tokens?.accessToken, state.user]
  );

  const value = useMemo(
    () => ({
      ...state,
      login,
      loginWithGoogle,
      register,
      logout,
      updateProfile,
      changePassword
    }),
    [changePassword, login, loginWithGoogle, logout, register, state, updateProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuthContext() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }

  return context;
}
