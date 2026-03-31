import type { AuthSession } from '../features/auth/store/auth.types';
import {
  dispatchAuthExpired,
  dispatchSessionUpdated,
  loadStoredSession,
  persistSession
} from '../features/auth/store/sessionStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

let refreshPromise: Promise<AuthSession | null> | null = null;

type RequestOptions = RequestInit & {
  token?: string | null;
  skipAuthRefresh?: boolean;
  retryOnUnauthorized?: boolean;
};

async function parsePayload(response: Response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function refreshSession(): Promise<AuthSession | null> {
  const storedSession = loadStoredSession();
  const refreshToken = storedSession?.tokens.refreshToken;

  if (!refreshToken) {
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ refreshToken })
  });

  const payload = await parsePayload(response);

  if (!response.ok || !payload?.success) {
    return null;
  }

  const session = payload.data as AuthSession;
  persistSession(session);
  dispatchSessionUpdated(session);
  return session;
}

async function getRefreshedSession() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export async function http<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const attemptRequest = async (token: string | null | undefined) => {
    const headers = new Headers(options.headers);
    headers.set('Content-Type', 'application/json');

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers
    });

    const payload = await parsePayload(response);
    return { response, payload };
  };

  const initialToken = options.token ?? null;
  let { response, payload } = await attemptRequest(initialToken);

  const shouldRefresh =
    response.status === 401 &&
    !options.skipAuthRefresh &&
    options.retryOnUnauthorized !== false &&
    path !== '/auth/login' &&
    path !== '/auth/register' &&
    path !== '/auth/refresh';

  if (shouldRefresh) {
    const session = await getRefreshedSession();

    if (session?.tokens.accessToken) {
      const retryResult = await attemptRequest(session.tokens.accessToken);
      response = retryResult.response;
      payload = retryResult.payload;
    } else {
      persistSession(null);
      dispatchAuthExpired();
    }
  }

  if (response.status === 401) {
    persistSession(null);
    dispatchAuthExpired();
  }

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.error?.message ?? 'Request failed');
  }

  return payload.data as T;
}

