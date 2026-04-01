import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { useAuth } from '../features/auth/hooks/useAuth';
import type { Project } from '../features/admin/types';
import { type ApiTask } from '../features/projects/api/projectsApi';
import { getSharedProjectAcceptedAt, isRecentlyAcceptedSharedProject } from '../features/projects/shared-projects';
import { loadVisibleWorkGraph } from '../features/workspaces/api/visible-work-graph';
import { setStoredWorkspaceId } from '../features/workspaces/store/workspaceSelection';
import { useWorkspaceData } from '../features/workspaces/store/WorkspaceDataContext';
import { cn } from '../lib/cn';
import { FavoritesSection, SidebarFooter } from './FavoritesSection';
import { ProjectTree } from './ProjectTree';
import { SharedProjectsSection } from './SharedProjectsSection';
import { SidebarHeader } from './SidebarHeader';
import { SidebarNavItem } from './SidebarNavItem';
import { SidebarSection } from './SidebarSection';
import { WorkspaceSwitcher } from './WorkspaceSwitcher';

const SIDEBAR_COLLAPSED_STORAGE_KEY = 'superboss.sidebar.collapsed';

type QuickView = {
  label: string;
  description: string;
  count: number;
  to: string;
  icon: 'assigned' | 'today' | 'overdue' | 'completed' | 'important';
};


export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, tokens } = useAuth();
  const { workspaces, spaces, projects, selectedWorkspaceId, selectedWorkspace, setSelectedWorkspaceId } = useWorkspaceData();
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === 'undefined') {
      return false;
    }
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === 'true';
  });
  const [tasks, setTasks] = useState<ApiTask[]>([]);
  const [sharedProjectsIndex, setSharedProjectsIndex] = useState<Array<{
    id: string;
    name: string;
    key: string;
    workspaceId: string;
    workspaceName: string;
    spaceId: string;
    spaceName: string;
    createdByCurrentUser: boolean;
    acceptedAt: number | null;
    isNew: boolean;
  }>>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, String(collapsed));
    }
  }, [collapsed]);



  useEffect(() => {
    let cancelled = false;

    async function loadSidebarGraph() {
      if (!tokens?.accessToken) {
        setSharedProjectsIndex([]);
        setTasks([]);
        return;
      }

      try {
        const graph = await loadVisibleWorkGraph(tokens.accessToken);

        if (!cancelled) {
          const workspaceNameById = new Map(graph.workspaces.map((workspace) => [workspace.id, workspace.name]));
          const spaceNameById = new Map(graph.spaces.map((space) => [space.id, space.name]));
          const dedupedProjects = Array.from(
            new Map(
              graph.projects.map((project) => [
                project.id,
                {
                  id: project.id,
                  name: project.name,
                  key: project.key,
                  workspaceId: project.workspaceId,
                  workspaceName: workspaceNameById.get(project.workspaceId) ?? 'Unknown workspace',
                  spaceId: project.spaceId,
                  spaceName: spaceNameById.get(project.spaceId) ?? 'Unknown space',
                  createdByCurrentUser: project.createdBy === user?.id,
                  acceptedAt: getSharedProjectAcceptedAt(project.id),
                  isNew: isRecentlyAcceptedSharedProject(project.id)
                }
              ])
            ).values()
          );

          setSharedProjectsIndex(dedupedProjects);
          setTasks(graph.tasks);
        }
      } catch {
        if (!cancelled) {
          setSharedProjectsIndex([]);
          setTasks([]);
        }
      }
    }

    void loadSidebarGraph();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken, user?.id]);



  const navItems = useMemo(
    () => [
      {
        label: 'Dashboard',
        description: 'Overview and current work health.',
        to: '/dashboard',
        icon: 'dashboard' as const
      },
      {
        label: 'My tasks',
        description: 'Personal work inbox across every project.',
        to: '/my-tasks?filter=assigned',
        icon: 'assigned' as const,
        badge: tasks.filter((task) => task.assigneeId === user?.id && task.status !== 'DONE').length
      },
      {
        label: 'Projects',
        description: 'Boards, backlog, calendar, members, and workflow.',
        to: '/projects?view=board',
        icon: 'projects' as const
      },
      {
        label: user?.globalRole === 'SUPER_ADMIN' ? 'Admin' : 'Control',
        description: 'Scopes, invites, and access control.',
        to: '/admin',
        icon: 'control' as const
      },
      {
        label: 'Notifications',
        description: 'Signals and invite updates.',
        to: '/notifications',
        icon: 'notifications' as const
      },
      {
        label: 'Profile',
        description: 'Identity and account details.',
        to: '/profile',
        icon: 'profile' as const
      }
    ],
    [tasks, user?.globalRole, user?.id]
  );

  const quickViews = useMemo<QuickView[]>(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const activeTasks = tasks.filter((task) => task.status !== 'DONE');
    const assignedToMe = activeTasks.filter((task) => task.assigneeId === user?.id).length;
    const dueToday = activeTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() === today.getTime();
    }).length;
    const overdue = activeTasks.filter((task) => {
      if (!task.dueDate) {
        return false;
      }
      const due = new Date(task.dueDate);
      due.setHours(0, 0, 0, 0);
      return due.getTime() < today.getTime();
    }).length;
    const completed = tasks.filter((task) => task.status === 'DONE').length;
    const important = activeTasks.filter((task) => task.priority === 'HIGH' || task.priority === 'CRITICAL').length;

    return [
      { label: 'Assigned to me', description: 'Tasks you actively own', count: assignedToMe, to: '/my-tasks?filter=assigned', icon: 'assigned' },
      { label: 'Due today', description: 'Deadlines landing today', count: dueToday, to: '/my-tasks?filter=today', icon: 'today' },
      { label: 'Overdue', description: 'Needs action now', count: overdue, to: '/my-tasks?filter=overdue', icon: 'overdue' },
      { label: 'Completed', description: 'Already closed out', count: completed, to: '/my-tasks?filter=done', icon: 'completed' },
      { label: 'Important', description: 'High-priority work', count: important, to: '/my-tasks?filter=active', icon: 'important' }
    ];
  }, [tasks, user?.id]);

  const sharedProjects = useMemo(() => sharedProjectsIndex, [sharedProjectsIndex]);

  const taskCountByProject = useMemo(() => {
    const counts = new Map<string, number>();

    for (const task of tasks) {
      counts.set(task.projectId, (counts.get(task.projectId) ?? 0) + 1);
    }

    return counts;
  }, [tasks]);

  const locationState = (location.state as { preferredProjectId?: string } | null) ?? null;

  const favoriteItems = useMemo(
    () => [
      { label: 'Board in focus', description: 'Open the live board.', to: '/projects?view=board', icon: 'pin' as const },
      { label: 'Planning backlog', description: 'Plan and assign work.', to: '/projects?view=backlog', icon: 'folder' as const },
      { label: 'Signals center', description: 'Invites and notifications.', to: '/notifications', icon: 'notifications' as const }
    ],
    []
  );

  const activeProjectIds = useMemo(() => {
    if (location.pathname !== '/projects') {
      return [];
    }

    if (locationState?.preferredProjectId && projects.some((project) => project.id === locationState.preferredProjectId)) {
      return [locationState.preferredProjectId];
    }

    return projects.length > 0 ? [projects[0].id] : [];
  }, [location.pathname, locationState?.preferredProjectId, projects]);
  const controlLabel = user?.globalRole === 'SUPER_ADMIN' ? 'Admin console' : 'Workspace control';

  function handleWorkspaceChange(workspaceId: string | null) {
    setSelectedWorkspaceId(workspaceId);
    setStoredWorkspaceId(workspaceId);
  }

  function handleSelectProject(workspaceId: string | null, spaceId: string, projectId: string) {
    setSelectedWorkspaceId(workspaceId);
    setStoredWorkspaceId(workspaceId);
    navigate('/projects?view=board', {
      state: {
        preferredWorkspaceId: workspaceId,
        preferredSpaceId: spaceId,
        preferredProjectId: projectId
      }
    });
  }

  return (
    <aside
      className={cn(
        'sticky top-0 hidden h-screen shrink-0 flex-col border-r border-white/10 bg-[linear-gradient(180deg,rgba(6,10,20,0.94)_0%,rgba(8,12,24,0.92)_100%)] px-4 py-5 backdrop-blur-2xl transition-[width] duration-300 lg:flex',
        collapsed ? 'w-[6.75rem]' : 'w-[21rem]'
      )}
    >
      <SidebarHeader collapsed={collapsed} onToggle={() => setCollapsed((value) => !value)} />

      <div className="mt-4 space-y-4 overflow-y-auto pb-4">
        <WorkspaceSwitcher collapsed={collapsed} workspaces={workspaces} selectedWorkspace={selectedWorkspace} onSelect={handleWorkspaceChange} />

        <SidebarSection eyebrow={collapsed ? undefined : 'Identity'} title={collapsed ? 'You' : 'You'} collapsed={collapsed}>
          <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
            <Avatar name={user?.fullName ?? 'Guest'} src={user?.avatarUrl} />
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{user?.fullName ?? 'Guest'}</p>
                <p className="truncate text-xs text-slate-300">{user?.email ?? 'No active session'}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge tone="info">{user?.globalRole ?? 'Scoped access'}</Badge>
                  <Badge>{user?.specialization ?? 'Unknown'}</Badge>
                </div>
              </div>
            ) : null}
          </div>
        </SidebarSection>

        <SidebarSection eyebrow={collapsed ? undefined : 'Main navigation'} title={collapsed ? 'Nav' : 'Navigation'} collapsed={collapsed}>
          <div className="space-y-2">
            {navItems.map((item) => (
              <SidebarNavItem key={item.label} to={item.to} label={item.label} description={item.description} icon={item.icon} badge={item.badge} collapsed={collapsed} />
            ))}
          </div>
        </SidebarSection>

        <SidebarSection eyebrow={collapsed ? undefined : 'My work'} title={collapsed ? 'Inbox' : 'Inbox views'} collapsed={collapsed}>
          <div className="space-y-2">
            {quickViews.map((view) => (
              <SidebarNavItem key={view.label} to={view.to} label={view.label} description={view.description} icon={view.icon} badge={view.count} collapsed={collapsed} />
            ))}
          </div>
        </SidebarSection>

        <SharedProjectsSection collapsed={collapsed} projects={sharedProjects} activeProjectIds={activeProjectIds} onSelectProject={handleSelectProject} />

        <ProjectTree collapsed={collapsed} spaces={spaces} projects={projects} activeProjectIds={activeProjectIds} taskCountByProject={taskCountByProject} onSelectProject={(spaceId, projectId) => handleSelectProject(selectedWorkspaceId, spaceId, projectId)} />

        <FavoritesSection collapsed={collapsed} items={favoriteItems} />
      </div>

      <SidebarFooter collapsed={collapsed} controlLabel={controlLabel} />
    </aside>
  );
}

