import type { Workspace } from '../../admin/types';

export const WORKSPACE_SELECTION_STORAGE_KEY = 'superboss.currentWorkspaceId';
export const WORKSPACE_SELECTION_EVENT = 'superboss:workspace-selection-updated';

export function getStoredWorkspaceId() {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.localStorage.getItem(WORKSPACE_SELECTION_STORAGE_KEY);
}

export function setStoredWorkspaceId(workspaceId: string | null | undefined) {
  if (typeof window === 'undefined') {
    return;
  }

  if (workspaceId) {
    window.localStorage.setItem(WORKSPACE_SELECTION_STORAGE_KEY, workspaceId);
  } else {
    window.localStorage.removeItem(WORKSPACE_SELECTION_STORAGE_KEY);
  }

  window.dispatchEvent(new CustomEvent(WORKSPACE_SELECTION_EVENT, { detail: workspaceId ?? null }));
}

export function resolveWorkspaceSelection(workspaces: Workspace[], preferredWorkspaceId: string | null | undefined) {
  if (!Array.isArray(workspaces) || workspaces.length === 0) {
    return null;
  }

  if (preferredWorkspaceId && workspaces.some((workspace) => workspace.id === preferredWorkspaceId)) {
    return preferredWorkspaceId;
  }

  return workspaces[0]?.id ?? null;
}
