import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { adminApi } from '../../admin/api/adminApi';
import type { Project, Space, Workspace } from '../../admin/types';
import { useAuth } from '../../auth/hooks/useAuth';
import {
  getStoredWorkspaceId,
  resolveWorkspaceSelection,
  setStoredWorkspaceId,
  WORKSPACE_SELECTION_EVENT
} from './workspaceSelection';

type WorkspaceDataContextValue = {
  workspaces: Workspace[];
  spaces: Space[];
  projects: Project[];
  selectedWorkspaceId: string | null;
  selectedWorkspace: Workspace | null;
  isLoading: boolean;
  setSelectedWorkspaceId: (workspaceId: string | null) => void;
  refresh: () => Promise<void>;
};

const WorkspaceDataContext = createContext<WorkspaceDataContextValue | undefined>(undefined);

export function WorkspaceDataProvider({ children }: PropsWithChildren) {
  const { tokens } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceIdState] = useState<string | null>(() => getStoredWorkspaceId());
  const [isLoading, setIsLoading] = useState(true);

  async function loadWorkspaceSurface(preferredWorkspaceId?: string | null) {
    if (!tokens?.accessToken) {
      setWorkspaces([]);
      setSpaces([]);
      setProjects([]);
      setSelectedWorkspaceIdState(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const workspacesResponse = await adminApi.listWorkspaces(tokens.accessToken);
      const workspaceItems = workspacesResponse.items;
      const resolvedWorkspaceId = resolveWorkspaceSelection(workspaceItems, preferredWorkspaceId ?? getStoredWorkspaceId());

      setWorkspaces(workspaceItems);
      setSelectedWorkspaceIdState(resolvedWorkspaceId);

      if (!resolvedWorkspaceId) {
        setSpaces([]);
        setProjects([]);
        return;
      }

      const [spacesResponse, projectsResponse] = await Promise.all([
        adminApi.listSpaces(tokens.accessToken, resolvedWorkspaceId),
        adminApi.listProjects(tokens.accessToken, resolvedWorkspaceId)
      ]);

      setSpaces(spacesResponse.items.filter((space) => space.isActive));
      setProjects(projectsResponse.items.filter((project) => !project.isArchived));
    } catch {
      setWorkspaces([]);
      setSpaces([]);
      setProjects([]);
      setSelectedWorkspaceIdState(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadWorkspaceSurface(selectedWorkspaceId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  useEffect(() => {
    function handleWorkspaceSelection(event: Event) {
      const nextId = (event as CustomEvent<string | null>).detail ?? null;
      setSelectedWorkspaceIdState(nextId);
      void loadWorkspaceSurface(nextId);
    }

    window.addEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);
    return () => window.removeEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens?.accessToken]);

  const selectedWorkspace = useMemo(
    () => workspaces.find((workspace) => workspace.id === selectedWorkspaceId) ?? null,
    [workspaces, selectedWorkspaceId]
  );

  function handleSetSelectedWorkspaceId(workspaceId: string | null) {
    setSelectedWorkspaceIdState(workspaceId);
    setStoredWorkspaceId(workspaceId);
  }

  const value = useMemo<WorkspaceDataContextValue>(
    () => ({
      workspaces,
      spaces,
      projects,
      selectedWorkspaceId,
      selectedWorkspace,
      isLoading,
      setSelectedWorkspaceId: handleSetSelectedWorkspaceId,
      refresh: () => loadWorkspaceSurface(selectedWorkspaceId)
    }),
    [isLoading, projects, selectedWorkspace, selectedWorkspaceId, spaces, workspaces]
  );

  return <WorkspaceDataContext.Provider value={value}>{children}</WorkspaceDataContext.Provider>;
}

export function useWorkspaceData() {
  const context = useContext(WorkspaceDataContext);

  if (!context) {
    throw new Error('useWorkspaceData must be used within WorkspaceDataProvider');
  }

  return context;
}
