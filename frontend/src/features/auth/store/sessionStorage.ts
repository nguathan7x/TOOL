import type { AuthSession } from './auth.types';

export const STORAGE_KEY = 'superboss.auth.session';
export const AUTH_EXPIRED_EVENT = 'superboss:auth-expired';
export const SESSION_UPDATED_EVENT = 'superboss:session-updated';

type SessionStorageMode = 'local' | 'session' | 'auto';

function readSession(storage: Storage) {
  const rawSession = storage.getItem(STORAGE_KEY);
  if (!rawSession) {
    return null;
  }

  try {
    return JSON.parse(rawSession) as AuthSession;
  } catch {
    storage.removeItem(STORAGE_KEY);
    return null;
  }
}


function compactSessionForStorage(session: AuthSession): AuthSession {
  const avatarUrl = session.user.avatarUrl;

  if (!avatarUrl || !avatarUrl.startsWith('data:image/')) {
    return session;
  }

  if (avatarUrl.length <= 150_000) {
    return session;
  }

  return {
    ...session,
    user: {
      ...session.user,
      avatarUrl: null
    }
  };
}

function getActiveStorageMode(): Exclude<SessionStorageMode, 'auto'> | null {
  if (window.localStorage.getItem(STORAGE_KEY)) {
    return 'local';
  }

  if (window.sessionStorage.getItem(STORAGE_KEY)) {
    return 'session';
  }

  return null;
}

export function loadStoredSession(): AuthSession | null {
  return readSession(window.localStorage) ?? readSession(window.sessionStorage);
}

export function persistSession(session: AuthSession | null, mode: SessionStorageMode = 'auto') {
  if (!session) {
    window.localStorage.removeItem(STORAGE_KEY);
    window.sessionStorage.removeItem(STORAGE_KEY);
    return;
  }

  const resolvedMode = mode === 'auto' ? getActiveStorageMode() ?? 'local' : mode;
  const targetStorage = resolvedMode === 'session' ? window.sessionStorage : window.localStorage;
  const alternateStorage = resolvedMode === 'session' ? window.localStorage : window.sessionStorage;

  const serializedSession = JSON.stringify(compactSessionForStorage(session));
  targetStorage.setItem(STORAGE_KEY, serializedSession);
  alternateStorage.removeItem(STORAGE_KEY);
}

export function dispatchSessionUpdated(session: AuthSession) {
  window.dispatchEvent(new CustomEvent(SESSION_UPDATED_EVENT, { detail: session }));
}

export function dispatchAuthExpired() {
  window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
}

