type SharedProjectStore = Record<string, string>;

const STORAGE_KEY = 'superboss.shared-projects.recent';
const RECENT_WINDOW_MS = 1000 * 60 * 60 * 48;

function readStore(): SharedProjectStore {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    const parsed = JSON.parse(raw);
    return typeof parsed === 'object' && parsed ? parsed : {};
  } catch {
    return {};
  }
}

function writeStore(store: SharedProjectStore) {
  if (typeof window === 'undefined') {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

export function markSharedProjectAccepted(projectId: string | null | undefined) {
  if (!projectId) {
    return;
  }

  const store = readStore();
  store[projectId] = new Date().toISOString();
  writeStore(store);
}

export function getSharedProjectAcceptedAt(projectId: string) {
  const value = readStore()[projectId];
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

export function isRecentlyAcceptedSharedProject(projectId: string) {
  const acceptedAt = getSharedProjectAcceptedAt(projectId);
  if (!acceptedAt) {
    return false;
  }

  return Date.now() - acceptedAt <= RECENT_WINDOW_MS;
}
