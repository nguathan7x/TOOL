import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Drawer } from '../components/ui/Drawer';
import { EmptyState } from '../components/ui/EmptyState';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { useAuth } from '../features/auth/hooks/useAuth';
import { adminApi } from '../features/admin/api/adminApi';
import type { Project, ProjectLifecycleStatus, ProjectMembership, Space, Workspace } from '../features/admin/types';
import { projectsApi, type ApiActivity, type ApiComment, type ApiTask } from '../features/projects/api/projectsApi';
import { ProjectBacklogPanel } from '../features/projects/components/ProjectBacklogPanel';
import { TaskEditorPanel } from '../features/projects/components/TaskEditorPanel';
import { ProjectBoardView } from '../features/projects/components/views/ProjectBoardView';
import { ProjectCalendarView } from '../features/projects/components/views/ProjectCalendarView';
import { ProjectMembersView } from '../features/projects/components/views/ProjectMembersView';
import { ProjectSettingsView } from '../features/projects/components/views/ProjectSettingsView';
import { buildChecklistFromInput, canEditTask as canEditProjectTask, createTaskEditorState, parseLabelsInput, type TaskEditorState } from '../features/projects/task-editor';
import {
  getStoredWorkspaceId,
  setStoredWorkspaceId,
  WORKSPACE_SELECTION_EVENT
} from '../features/workspaces/store/workspaceSelection';
import { useWorkspaceData } from '../features/workspaces/store/WorkspaceDataContext';
import { buildMonthGrid, formatDateTime, formatEstimate, formatLongDate, formatShortDate, isValidScheduleInput, monthLabel, normalizeStatus, prettyStatus, priorityTone, taskRangeSegmentTone, taskScheduleRange, taskScheduleWindow } from '../features/projects/task-helpers';

type ProjectBoardState = {
  workspaces: Workspace[];
  spaces: Space[];
  projects: Project[];
  members: ProjectMembership[];
  tasks: ApiTask[];
};

type ProjectView = 'backlog' | 'board' | 'calendar' | 'members' | 'settings';

type ProjectLifecycleDraft = {
  startDate: string;
  targetEndDate: string;
  completionNote: string;
};

const PROJECT_VIEWS: Array<{ key: ProjectView; label: string; description: string }> = [
  { key: 'backlog', label: 'Backlog', description: 'Plan, prioritize, and prepare work before delivery moves on board.' },
  { key: 'board', label: 'Board', description: 'Observe execution stages and monitor active work in flow.' },
  { key: 'calendar', label: 'Calendar', description: 'Track due dates and upcoming deadlines inside this project.' },
  { key: 'members', label: 'Members', description: 'See who is in the project and what role each person holds.' },
  { key: 'settings', label: 'Settings', description: 'Review project ownership, workflow, and scope metadata.' }
];

const DEFAULT_WORKFLOW_COLUMNS = [
  { key: 'PLANNED', name: 'Planned', color: '#8f9cff' },
  { key: 'IN_PROGRESS', name: 'In Progress', color: '#6ee9d8' },
  { key: 'REVIEW', name: 'Review', color: '#ffd36f' },
  { key: 'QA', name: 'QA', color: '#ffa97a' },
  { key: 'UAT', name: 'UAT', color: '#f39fe1' },
  { key: 'DONE', name: 'Done', color: '#8ff0b5' }
];

function toDateInputValue(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  return new Date(value).toISOString().slice(0, 10);
}

function projectLifecycleLabel(status: ProjectLifecycleStatus) {
  return status.split('_').join(' ');
}

function projectLifecycleTone(status: ProjectLifecycleStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'success';
    case 'ON_HOLD':
      return 'warning';
    case 'COMPLETED':
      return 'info';
    case 'ARCHIVED':
      return 'neutral';
    default:
      return 'neutral';
  }
}

function prettyAction(action: string) {
  return action.split('.').join(' ');
}

function roleCanManageTask(role?: ProjectMembership['role']) {
  return role === 'PROJECT_ADMIN' || role === 'PM';
}

function roleCanViewBacklog(role?: ProjectMembership['role']) {
  return role === 'PROJECT_ADMIN' || role === 'PM' || role === 'MEMBER';
}

function roleCanCreateTask(role?: ProjectMembership['role']) {
  return role === 'PROJECT_ADMIN' || role === 'PM' || role === 'MEMBER';
}

function roleCanComment(role?: ProjectMembership['role']) {
  return role === 'PROJECT_ADMIN' || role === 'PM' || role === 'MEMBER';
}

function canDeleteTask(task: ApiTask | null, userId?: string, role?: ProjectMembership['role'], isProjectCreator = false) {
  if (!task) {
    return false;
  }

  return task.createdBy === userId || isProjectCreator || roleCanManageTask(role);
}

function canMoveTask(task: ApiTask | null, userId?: string, role?: ProjectMembership['role'], isProjectCreator = false, isExecutionLocked = false) {
  if (!task || !userId || isExecutionLocked) {
    return false;
  }

  return isProjectCreator || roleCanManageTask(role) || task.createdBy === userId || task.assigneeId === userId;
}

function transitionSignature(from: string, to: string) {
  return `${normalizeStatus(from)}->${normalizeStatus(to)}`;
}

export function ProjectListPage() {
  const { user, tokens } = useAuth();
  const {
    workspaces: workspaceCatalog,
    spaces: spaceCatalog,
    projects: projectCatalog,
    selectedWorkspaceId: workspaceContextId,
    setSelectedWorkspaceId: setWorkspaceContextId
  } = useWorkspaceData();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<ProjectBoardState>({
    workspaces: [],
    spaces: [],
    projects: [],
    members: [],
    tasks: []
  });
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(() => getStoredWorkspaceId());
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [comments, setComments] = useState<ApiComment[]>([]);
  const [activity, setActivity] = useState<ApiActivity[]>([]);
  const [commentDraft, setCommentDraft] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTaskMeta, setIsLoadingTaskMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [taskMetaError, setTaskMetaError] = useState<string | null>(null);
  const [taskEditor, setTaskEditor] = useState<TaskEditorState>(() => createTaskEditorState(null));
  const [isEditingTask, setIsEditingTask] = useState(false);
  const [isSavingTask, setIsSavingTask] = useState(false);
  const [draggedBoardTaskId, setDraggedBoardTaskId] = useState<string | null>(null);
  const [dragOverColumnKey, setDragOverColumnKey] = useState<string | null>(null);
  const [dragOverTaskId, setDragOverTaskId] = useState<string | null>(null);
  const [workflowDraft, setWorkflowDraft] = useState<Array<{ from: string; to: string; allowedRoles?: string[] }>>([]);
  const [calendarAnchorDate, setCalendarAnchorDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });
  const [isSavingWorkflow, setIsSavingWorkflow] = useState(false);
  const [workflowMessage, setWorkflowMessage] = useState<string | null>(null);
  const [lifecycleDraft, setLifecycleDraft] = useState<ProjectLifecycleDraft>({ startDate: '', targetEndDate: '', completionNote: '' });
  const [isSavingLifecycle, setIsSavingLifecycle] = useState(false);
  const [lifecycleMessage, setLifecycleMessage] = useState<string | null>(null);
  const navigationPreference = (location.state as { preferredWorkspaceId?: string | null; preferredSpaceId?: string; preferredProjectId?: string; preferredTaskId?: string } | null) ?? null;

  useEffect(() => {
    let cancelled = false;

    async function loadScope() {
      if (!tokens?.accessToken) {
        setIsLoading(false);
        return;
      }

      const shouldShowHardLoading =
        state.workspaces.length === 0 &&
        state.projects.length === 0 &&
        state.tasks.length === 0 &&
        !selectedProjectId;

      if (shouldShowHardLoading) {
        setIsLoading(true);
      }
      setError(null);

      try {
        const workspaces = workspaceCatalog;
        let spaces: Space[] = [];
        let projects: Project[] = [];
        let workspaceId = navigationPreference?.preferredWorkspaceId ?? workspaceContextId ?? selectedWorkspaceId;
        let spaceId: string | null = null;
        let projectId: string | null = null;
        const preferredProjectId = navigationPreference?.preferredProjectId;
        let directProject: Project | null = null;

        if (preferredProjectId) {
          try {
            directProject = await adminApi.getProject(tokens.accessToken, preferredProjectId);
            workspaceId = directProject.workspaceId;
            spaceId = directProject.spaceId;
            projectId = directProject.id;
          } catch {
            directProject = null;
          }
        }

        if (workspaceId) {
          if (workspaceId === workspaceContextId) {
            spaces = spaceCatalog;
            projects = projectCatalog;
          } else {
            try {
              const [spacesResponse, projectsResponse] = await Promise.all([
                adminApi.listSpaces(tokens.accessToken, workspaceId),
                adminApi.listProjects(tokens.accessToken, workspaceId)
              ]);
              spaces = spacesResponse.items.filter((item) => item.isActive);
              projects = projectsResponse.items.filter((item) => !item.isArchived);
            } catch {
              spaces = [];
              projects = [];
            }
          }

          if (directProject && !projects.some((item) => item.id === directProject.id)) {
            projects = [directProject, ...projects];
          }

          const preferredSpaceId = directProject?.spaceId ?? navigationPreference?.preferredSpaceId;
          spaceId = preferredSpaceId && spaces.some((item) => item.id === preferredSpaceId)
            ? preferredSpaceId
            : selectedSpaceId && spaces.some((item) => item.id === selectedSpaceId)
              ? selectedSpaceId
              : directProject?.spaceId ?? spaces[0]?.id ?? null;

          const scopedProjects = spaceId ? projects.filter((item) => item.spaceId === spaceId) : projects;
          projectId = preferredProjectId && scopedProjects.some((item) => item.id === preferredProjectId)
            ? preferredProjectId
            : selectedProjectId && scopedProjects.some((item) => item.id === selectedProjectId)
              ? selectedProjectId
              : directProject?.id ?? scopedProjects[0]?.id ?? null;

          projects = scopedProjects;
        }

        if (!cancelled) {
          setState((current) => ({
            ...current,
            workspaces,
            spaces,
            projects,
            members: projectId === selectedProjectId ? current.members : [],
            tasks: projectId === selectedProjectId ? current.tasks : []
          }));
          setSelectedWorkspaceId(workspaceId ?? null);
          setStoredWorkspaceId(workspaceId ?? null);
          if (workspaceId !== workspaceContextId) {
            setWorkspaceContextId(workspaceId ?? null);
          }
          setSelectedSpaceId(spaceId);
          setSelectedProjectId(projectId);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load project board');
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    void loadScope();

    return () => {
      cancelled = true;
    };
  }, [
    location.state,
    navigationPreference?.preferredProjectId,
    navigationPreference?.preferredSpaceId,
    navigationPreference?.preferredWorkspaceId,
    projectCatalog,
    selectedSpaceId,
    selectedWorkspaceId,
    spaceCatalog,
    state.projects.length,
    state.tasks.length,
    state.workspaces.length,
    tokens?.accessToken,
    workspaceCatalog,
    workspaceContextId,
    setWorkspaceContextId
  ]);

  useEffect(() => {
    let cancelled = false;

    async function loadProjectDetails() {
      if (!tokens?.accessToken || !selectedProjectId) {
        setState((current) => ({ ...current, members: [], tasks: [] }));
        setSelectedTaskId(null);
        return;
      }

      try {
        const [membersResponse, tasksResponse] = await Promise.all([
          adminApi.listProjectMembers(tokens.accessToken, selectedProjectId),
          projectsApi.listTasks(tokens.accessToken, selectedProjectId)
        ]);

        if (!cancelled) {
          setState((current) => ({
            ...current,
            members: membersResponse.items,
            tasks: tasksResponse.items
          }));
          setSelectedTaskId((current) => {
            const preferredTaskId = navigationPreference?.preferredTaskId;
            if (preferredTaskId && tasksResponse.items.some((task) => task.id === preferredTaskId)) {
              return preferredTaskId;
            }
            return tasksResponse.items.some((task) => task.id === current) ? current : tasksResponse.items[0]?.id ?? null;
          });
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : 'Failed to load project board');
        }
      }
    }

    loadProjectDetails();

    return () => {
      cancelled = true;
    };
  }, [navigationPreference?.preferredTaskId, tokens?.accessToken, selectedProjectId]);

  useEffect(() => {
    function handleWorkspaceSelection(event: Event) {
      const nextWorkspaceId = (event as CustomEvent<string | null>).detail ?? null;
      setSelectedWorkspaceId(nextWorkspaceId);
      setSelectedSpaceId(null);
      setSelectedProjectId(null);
    }

    window.addEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);
    return () => window.removeEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadTaskMeta() {
      if (!tokens?.accessToken || !selectedTaskId) {
        setComments([]);
        setActivity([]);
        setTaskMetaError(null);
        return;
      }

      setIsLoadingTaskMeta(true);
      setTaskMetaError(null);

      try {
        const [commentsResponse, activityResponse] = await Promise.all([
          projectsApi.listTaskComments(tokens.accessToken, selectedTaskId),
          projectsApi.listTaskActivity(tokens.accessToken, selectedTaskId)
        ]);

        if (!cancelled) {
          setComments(commentsResponse.items);
          setActivity(activityResponse.items);
        }
      } catch (nextError) {
        if (!cancelled) {
          setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to load task comments and activity');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingTaskMeta(false);
        }
      }
    }

    loadTaskMeta();

    return () => {
      cancelled = true;
    };
  }, [tokens?.accessToken, selectedTaskId]);
  const selectedWorkspace = useMemo(() => state.workspaces.find((item) => item.id === selectedWorkspaceId) ?? null, [state.workspaces, selectedWorkspaceId]);
  const selectedSpace = useMemo(() => state.spaces.find((item) => item.id === selectedSpaceId) ?? null, [state.spaces, selectedSpaceId]);
  const selectedProject = useMemo(() => state.projects.find((item) => item.id === selectedProjectId) ?? null, [state.projects, selectedProjectId]);
  const selectedTask = useMemo(() => state.tasks.find((item) => item.id === selectedTaskId) ?? null, [state.tasks, selectedTaskId]);
  const currentMembership = useMemo(() => state.members.find((item) => item.userId === user?.id && item.status === 'ACTIVE') ?? null, [state.members, user?.id]);
  const workflowColumns = useMemo(() => (selectedProject?.statusColumns && selectedProject.statusColumns.length > 0 ? selectedProject.statusColumns : DEFAULT_WORKFLOW_COLUMNS), [selectedProject]);
  const projectExecutionLocked = selectedProject?.status === 'COMPLETED' || selectedProject?.status === 'ARCHIVED';
  const workflowStages = useMemo(() => {
    const hasBacklog = workflowColumns.some((column) => normalizeStatus(column.key) === 'BACKLOG');
    return hasBacklog
      ? workflowColumns
      : [{ key: 'BACKLOG', name: 'Backlog', color: '#7DD3FC', position: 0 }, ...workflowColumns];
  }, [workflowColumns]);
  const boardColumns = useMemo(() => workflowColumns.filter((column) => normalizeStatus(column.key) !== 'BACKLOG'), [workflowColumns]);
  const boardGridTemplate = useMemo(() => `repeat(${boardColumns.length}, minmax(280px, 304px))`, [boardColumns.length]);
  const todayAtMidnight = useMemo(() => {
    const current = new Date();
    current.setHours(0, 0, 0, 0);
    return current;
  }, []);
  const scheduledProjectTasks = useMemo(
    () => state.tasks
      .filter((task) => Boolean(task.startDate || task.dueDate))
      .sort((left, right) => new Date(left.startDate ?? left.dueDate ?? '').getTime() - new Date(right.startDate ?? right.dueDate ?? '').getTime()),
    [state.tasks]
  );
  const calendarMonthGrid = useMemo(() => buildMonthGrid(calendarAnchorDate), [calendarAnchorDate]);
  const calendarTaskMap = useMemo(() => {
    const map = new Map<string, ApiTask[]>();
    for (const task of scheduledProjectTasks) {
      const range = taskScheduleRange(task);
      if (range.length === 0) {
        continue;
      }

      const [start, finish] = range;
      const cursor = new Date(start);
      while (cursor.getTime() <= finish.getTime()) {
        const key = cursor.toISOString().slice(0, 10);
        map.set(key, [...(map.get(key) ?? []), task]);
        cursor.setDate(cursor.getDate() + 1);
      }
    }
    return map;
  }, [scheduledProjectTasks]);
  const overdueProjectTasks = useMemo(
    () => scheduledProjectTasks.filter((task) => task.status !== 'DONE' && new Date(task.dueDate ?? '').getTime() < todayAtMidnight.getTime()),
    [scheduledProjectTasks, todayAtMidnight]
  );
  const dueTodayProjectTasks = useMemo(
    () => scheduledProjectTasks.filter((task) => {
      if (task.status === 'DONE') return false;
      const due = new Date(task.dueDate ?? '');
      due.setHours(0, 0, 0, 0);
      return due.getTime() === todayAtMidnight.getTime();
    }),
    [scheduledProjectTasks, todayAtMidnight]
  );
  const activeView = (searchParams.get('view') as ProjectView | null) ?? 'board';
  const availableViews = useMemo(
    () => PROJECT_VIEWS.filter((view) => view.key !== 'backlog' || roleCanViewBacklog(currentMembership?.role)),
    [currentMembership?.role]
  );
  const projectView: ProjectView = availableViews.some((view) => view.key === activeView) ? activeView : 'board';

  const memberMap = useMemo(() => {
    return new Map(
      state.members.map((member) => [
        member.userId,
        {
          name: member.user?.fullName ?? member.user?.email ?? 'Unknown member',
          email: member.user?.email ?? '',
          avatarUrl: member.user?.avatarUrl ?? null,
          role: member.role,
          specialization: member.user?.specialization ?? null
        }
      ])
    );
  }, [state.members]);

  const currentViewMeta = useMemo(
    () => availableViews.find((view) => view.key === projectView) ?? PROJECT_VIEWS[1],
    [availableViews, projectView]
  );
  const workflowTransitionSet = useMemo(() => new Set(workflowDraft.map((item) => transitionSignature(item.from, item.to))), [workflowDraft]);

  useEffect(() => {
    setTaskEditor(createTaskEditorState(selectedTask));
    setIsEditingTask(false);
  }, [selectedTask]);

  useEffect(() => {
    setWorkflowDraft(selectedProject?.workflowTransitions ?? []);
    setWorkflowMessage(null);
  }, [selectedProject?.id, selectedProject?.workflowTransitions]);

  useEffect(() => {
    setLifecycleDraft({
      startDate: toDateInputValue(selectedProject?.startDate),
      targetEndDate: toDateInputValue(selectedProject?.targetEndDate),
      completionNote: selectedProject?.completionNote ?? ''
    });
    setLifecycleMessage(null);
  }, [selectedProject?.id, selectedProject?.startDate, selectedProject?.targetEndDate, selectedProject?.completionNote]);

  useEffect(() => {
    if (!roleCanViewBacklog(currentMembership?.role) && projectView === 'backlog') {
      const next = new URLSearchParams(searchParams);
      next.set('view', 'board');
      setSearchParams(next, { replace: true });
    }
  }, [currentMembership?.role, projectView, searchParams, setSearchParams]);

  const ownedSignals = useMemo(() => {
    return {
      workspace: selectedWorkspace?.createdBy === user?.id,
      space: selectedSpace?.createdBy === user?.id,
      project: selectedProject?.createdBy === user?.id,
      task: selectedTask?.createdBy === user?.id
    };
  }, [selectedWorkspace, selectedSpace, selectedProject, selectedTask, user?.id]);

  const canManageProjectFlow = ownedSignals.project || roleCanManageTask(currentMembership?.role);
  const canCreateProjectTasks = roleCanCreateTask(currentMembership?.role) && !projectExecutionLocked;
  const canManageWorkflowSettings = Boolean(tokens?.accessToken && selectedProject && canManageProjectFlow);
  const canManageProjectLifecycle = Boolean(tokens?.accessToken && selectedProject && canManageProjectFlow);

  function applyProjectUpdate(updatedProject: Project) {
    setState((current) => ({
      ...current,
      projects: current.projects.map((project) => (project.id === updatedProject.id ? updatedProject : project))
    }));
  }

  async function persistProjectLifecycle(payload: Partial<Pick<Project, 'status' | 'startDate' | 'targetEndDate' | 'completedAt' | 'archivedAt' | 'completionNote' | 'isArchived'>>, successMessage: string) {
    if (!tokens?.accessToken || !selectedProject || !canManageProjectLifecycle) {
      return;
    }

    if (payload.startDate !== undefined || payload.targetEndDate !== undefined) {
      const nextStartDate = payload.startDate === undefined ? lifecycleDraft.startDate : (payload.startDate ?? '');
      const nextTargetEndDate = payload.targetEndDate === undefined ? lifecycleDraft.targetEndDate : (payload.targetEndDate ?? '');
      if (!isValidScheduleInput(nextStartDate, nextTargetEndDate)) {
        setLifecycleMessage('Target end date has to be on or after the start date.');
        return;
      }
    }

    setIsSavingLifecycle(true);
    setLifecycleMessage(null);

    try {
      const updatedProject = await adminApi.updateProject(tokens.accessToken, selectedProject.id, payload);
      applyProjectUpdate(updatedProject);
      setLifecycleDraft({
        startDate: toDateInputValue(updatedProject.startDate),
        targetEndDate: toDateInputValue(updatedProject.targetEndDate),
        completionNote: updatedProject.completionNote ?? ''
      });
      setLifecycleMessage(successMessage);
    } catch (nextError) {
      setLifecycleMessage(nextError instanceof Error ? nextError.message : 'Failed to update project lifecycle');
    } finally {
      setIsSavingLifecycle(false);
    }
  }

  async function handleSaveLifecycleSettings() {
    await persistProjectLifecycle({
      startDate: lifecycleDraft.startDate || null,
      targetEndDate: lifecycleDraft.targetEndDate || null,
      completionNote: lifecycleDraft.completionNote.trim()
    }, 'Project lifecycle details saved.');
  }

  async function handleProjectStatusChange(nextStatus: ProjectLifecycleStatus) {
    const payload: Partial<Pick<Project, 'status' | 'startDate' | 'targetEndDate' | 'completedAt' | 'archivedAt' | 'completionNote' | 'isArchived'>> = {
      status: nextStatus,
      startDate: lifecycleDraft.startDate || null,
      targetEndDate: lifecycleDraft.targetEndDate || null,
      completionNote: lifecycleDraft.completionNote.trim()
    };

    if (nextStatus === 'ACTIVE') {
      payload.isArchived = false;
      payload.archivedAt = null;
      payload.completedAt = null;
    }

    if (nextStatus === 'ON_HOLD') {
      payload.isArchived = false;
      payload.archivedAt = null;
    }

    if (nextStatus === 'COMPLETED') {
      payload.isArchived = false;
      payload.archivedAt = null;
    }

    if (nextStatus === 'ARCHIVED') {
      payload.isArchived = true;
    }

    const successMessage = nextStatus === 'ON_HOLD'
      ? 'Project moved to On hold.'
      : nextStatus === 'COMPLETED'
        ? 'Project marked as Completed.'
        : nextStatus === 'ARCHIVED'
          ? 'Project archived.'
          : 'Project reopened and active again.';

    await persistProjectLifecycle(payload, successMessage);
  }

  function handleToggleWorkflowTransition(from: string, to: string) {
    const signature = transitionSignature(from, to);
    setWorkflowDraft((current) => {
      if (current.some((item) => transitionSignature(item.from, item.to) == signature)) {
        return current.filter((item) => transitionSignature(item.from, item.to) != signature);
      }

      return [
        ...current,
        {
          from: normalizeStatus(from),
          to: normalizeStatus(to),
          allowedRoles: ['PROJECT_ADMIN', 'PM']
        }
      ];
    });
    setWorkflowMessage(null);
  }

  async function handleSaveWorkflowSettings() {
    if (!tokens?.accessToken || !selectedProject || !canManageWorkflowSettings) {
      return;
    }

    setIsSavingWorkflow(true);
    setWorkflowMessage(null);

    try {
      const updatedProject = await adminApi.updateProject(tokens.accessToken, selectedProject.id, {
        workflowTransitions: workflowDraft
      });

      applyProjectUpdate(updatedProject);
      setWorkflowDraft(updatedProject.workflowTransitions ?? []);
      setWorkflowMessage('Workflow settings saved. Board transitions now follow this matrix.');
    } catch (nextError) {
      setWorkflowMessage(nextError instanceof Error ? nextError.message : 'Failed to save workflow settings');
    } finally {
      setIsSavingWorkflow(false);
    }
  }

  async function handleDeleteTask(task: ApiTask) {
    if (!tokens?.accessToken || !canDeleteTask(task, user?.id, currentMembership?.role, ownedSignals.project)) {
      return;
    }

    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) {
      return;
    }

    try {
      await projectsApi.deleteTask(tokens.accessToken, task.id);
      setState((current) => ({
        ...current,
        tasks: current.tasks.filter((item) => item.id !== task.id)
      }));
      setSelectedTaskId((current) => (current === task.id ? null : current));
      setComments([]);
      setActivity([]);
      setTaskMetaError(null);
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to delete task');
    }
  }

  async function handleCreateComment() {
    if (!tokens?.accessToken || !selectedTaskId || !commentDraft.trim()) {
      return;
    }

    setIsSubmittingComment(true);
    setTaskMetaError(null);

    try {
      const nextComment = await projectsApi.createTaskComment(tokens.accessToken, selectedTaskId, {
        content: commentDraft.trim()
      });

      setComments((current) => [nextComment, ...current]);
      setCommentDraft('');

      const activityResponse = await projectsApi.listTaskActivity(tokens.accessToken, selectedTaskId);
      setActivity(activityResponse.items);
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to create comment');
    } finally {
      setIsSubmittingComment(false);
    }
  }

  function updateTaskInState(task: ApiTask) {
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((item) => (item.id === task.id ? task : item))
    }));
  }

  function mergeTasksInState(updatedTasks: ApiTask[]) {
    const map = new Map(updatedTasks.map((task) => [task.id, task]));
    setState((current) => ({
      ...current,
      tasks: current.tasks.map((item) => map.get(item.id) ?? item)
    }));
  }

  async function handleTransitionTask(task: ApiTask, nextStatus: string) {
    if (!tokens?.accessToken || projectExecutionLocked || normalizeStatus(task.status) === normalizeStatus(nextStatus)) {
      return;
    }

    setTaskMetaError(null);

    try {
      const updatedTask = await projectsApi.transitionTask(tokens.accessToken, task.id, { status: nextStatus });
      updateTaskInState(updatedTask);
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to move task to the selected stage');
    }
  }

  async function handleBoardDrop(nextStatus: string) {
    if (!draggedBoardTaskId || !tokens?.accessToken) {
      return;
    }

    const task = state.tasks.find((item) => item.id === draggedBoardTaskId);
    setDraggedBoardTaskId(null);
    setDragOverColumnKey(null);
    setDragOverTaskId(null);

    if (!task || !canMoveTask(task, user?.id, currentMembership?.role, ownedSignals.project, projectExecutionLocked)) {
      return;
    }

    await handleTransitionTask(task, nextStatus);
  }

  async function handleReorderWithinColumn(columnKey: string, targetTaskId: string) {
    if (!draggedBoardTaskId || !tokens?.accessToken || draggedBoardTaskId === targetTaskId) {
      return;
    }

    const draggedTask = state.tasks.find((item) => item.id === draggedBoardTaskId);

    if (!draggedTask || !canMoveTask(draggedTask, user?.id, currentMembership?.role, ownedSignals.project)) {
      return;
    }

    const columnTaskIds = state.tasks
      .filter((task) => normalizeStatus(task.status) === normalizeStatus(columnKey))
      .sort((a, b) => (a.backlogRank ?? a.sequenceNumber) - (b.backlogRank ?? b.sequenceNumber))
      .map((task) => task.id);

    const fromIndex = columnTaskIds.indexOf(draggedBoardTaskId);
    const targetIndex = columnTaskIds.indexOf(targetTaskId);

    if (fromIndex < 0 || targetIndex < 0) {
      return;
    }

    columnTaskIds.splice(targetIndex, 0, columnTaskIds.splice(fromIndex, 1)[0]);

    try {
      const updatedTasks = await projectsApi.reorderTasks(tokens.accessToken, selectedProject!.id, columnTaskIds);
      mergeTasksInState(updatedTasks);
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to reorder tasks in this stage');
    } finally {
      setDraggedBoardTaskId(null);
      setDragOverColumnKey(null);
      setDragOverTaskId(null);
    }
  }

  async function handleToggleChecklist(index: number) {
    if (!tokens?.accessToken || projectExecutionLocked || !selectedTask || !canEditProjectTask(selectedTask, user?.id, currentMembership?.role)) {
      return;
    }

    const nextChecklist = selectedTask.checklist.map((item, itemIndex) => itemIndex === index ? {
      ...item,
      isCompleted: !item.isCompleted,
      completedAt: item.isCompleted ? null : new Date().toISOString()
    } : item);

    try {
      const updatedTask = await projectsApi.updateTask(tokens.accessToken, selectedTask.id, { checklist: nextChecklist });
      updateTaskInState(updatedTask);
      setTaskEditor(createTaskEditorState(updatedTask));
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to update checklist');
    }
  }

  async function handleSaveTask() {
    if (!tokens?.accessToken || projectExecutionLocked || !selectedTask || !canEditProjectTask(selectedTask, user?.id, currentMembership?.role)) {
      return;
    }

    if (taskEditor.title.trim().length < 2) {
      setTaskMetaError('Task title must be at least 2 characters.');
      return;
    }

    if (!isValidScheduleInput(taskEditor.startDate, taskEditor.dueDate)) {
      setTaskMetaError('Start date must be on or before due date.');
      return;
    }

    setIsSavingTask(true);
    setTaskMetaError(null);

    try {
      let nextTask = await projectsApi.updateTask(tokens.accessToken, selectedTask.id, {
        title: taskEditor.title.trim(),
        description: taskEditor.description.trim(),
        priority: taskEditor.priority,
        labels: parseLabelsInput(taskEditor.labelsInput),
        startDate: taskEditor.startDate ? new Date(taskEditor.startDate).toISOString() : null,
        dueDate: taskEditor.dueDate ? new Date(taskEditor.dueDate).toISOString() : null,
        estimateHours: taskEditor.estimateHours ? Number(taskEditor.estimateHours) : null,
        checklist: buildChecklistFromInput(taskEditor.checklistInput, selectedTask.checklist)
      });

      if (canManageProjectFlow && (taskEditor.assigneeId || '') !== (selectedTask.assigneeId ?? '')) {
        nextTask = await projectsApi.assignTask(tokens.accessToken, selectedTask.id, taskEditor.assigneeId || null);
      }

      if (normalizeStatus(taskEditor.status) !== normalizeStatus(nextTask.status)) {
        nextTask = await projectsApi.transitionTask(tokens.accessToken, selectedTask.id, { status: taskEditor.status });
      }

      updateTaskInState(nextTask);
      setTaskEditor(createTaskEditorState(nextTask));
      setIsEditingTask(false);
    } catch (nextError) {
      setTaskMetaError(nextError instanceof Error ? nextError.message : 'Failed to update task');
    } finally {
      setIsSavingTask(false);
    }
  }


  function renderProjectView() {
    if (projectView === 'backlog') {
      return (
        <ProjectBacklogPanel
          token={tokens?.accessToken ?? ''}
          userId={user?.id}
          workspace={selectedWorkspace!}
          space={selectedSpace!}
          project={selectedProject!}
          tasks={state.tasks}
          members={state.members}
          currentRole={currentMembership?.role}
          canManageProjectFlow={canManageProjectFlow}
          projectExecutionLocked={projectExecutionLocked}
          onTaskOpen={setSelectedTaskId}
          onTaskCreated={(task) => {
            setState((current) => ({ ...current, tasks: [...current.tasks, task] }));
            setSelectedTaskId(task.id);
          }}
          onTaskUpdated={(task) => {
            setState((current) => ({ ...current, tasks: current.tasks.map((item) => (item.id === task.id ? task : item)) }));
          }}
          onTaskDeleted={(taskId) => {
            setState((current) => ({ ...current, tasks: current.tasks.filter((item) => item.id !== taskId) }));
            setSelectedTaskId((current) => (current === taskId ? null : current));
          }}
        />
      );
    }

    if (projectView === 'calendar') {
      return (
        <ProjectCalendarView
          scheduledProjectTasks={scheduledProjectTasks}
          dueTodayProjectTasks={dueTodayProjectTasks}
          overdueProjectTasks={overdueProjectTasks}
          calendarAnchorDate={calendarAnchorDate}
          todayAtMidnight={todayAtMidnight}
          calendarMonthGrid={calendarMonthGrid}
          calendarTaskMap={calendarTaskMap}
          onCalendarAnchorDateChange={setCalendarAnchorDate}
          onTaskOpen={setSelectedTaskId}
        />
      );
    }

    if (projectView === 'members') {
      return <ProjectMembersView members={state.members} />;
    }

    if (projectView === 'settings') {
      return (
        <ProjectSettingsView
          selectedWorkspace={selectedWorkspace!}
          selectedSpace={selectedSpace!}
          selectedProject={selectedProject!}
          workflowStages={workflowStages}
          workflowDraft={workflowDraft}
          workflowTransitionSet={workflowTransitionSet}
          lifecycleDraft={lifecycleDraft}
          ownedProject={ownedSignals.project}
          canManageProjectLifecycle={canManageProjectLifecycle}
          canManageWorkflowSettings={canManageWorkflowSettings}
          isSavingLifecycle={isSavingLifecycle}
          isSavingWorkflow={isSavingWorkflow}
          lifecycleMessage={lifecycleMessage}
          workflowMessage={workflowMessage}
          projectLifecycleLabel={projectLifecycleLabel}
          projectLifecycleTone={projectLifecycleTone}
          onLifecycleDraftChange={(updater) => {
            setLifecycleDraft((current) => updater(current));
            setLifecycleMessage(null);
          }}
          onProjectStatusChange={(status) => void handleProjectStatusChange(status)}
          onSaveLifecycle={() => void handleSaveLifecycleSettings()}
          onToggleWorkflowTransition={handleToggleWorkflowTransition}
          onResetWorkflow={() => {
            setWorkflowDraft(selectedProject!.workflowTransitions ?? []);
            setWorkflowMessage(null);
          }}
          onSaveWorkflow={() => void handleSaveWorkflowSettings()}
        />
      );
    }

    return (
      <ProjectBoardView
        boardColumns={boardColumns}
        tasks={state.tasks}
        boardGridTemplate={boardGridTemplate}
        draggedBoardTaskId={draggedBoardTaskId}
        dragOverColumnKey={dragOverColumnKey}
        dragOverTaskId={dragOverTaskId}
        memberMap={memberMap}
        userId={user?.id}
        currentRole={currentMembership?.role}
        isProjectCreator={ownedSignals.project}
        projectExecutionLocked={projectExecutionLocked}
        canMoveTask={canMoveTask}
        onTaskOpen={setSelectedTaskId}
        onDragStart={(taskId, columnKey, event) => {
          event.dataTransfer.effectAllowed = 'move';
          event.dataTransfer.setData('text/plain', taskId);
          setDraggedBoardTaskId(taskId);
          setDragOverColumnKey(columnKey);
          setDragOverTaskId(taskId);
        }}
        onDragEnd={() => {
          setDraggedBoardTaskId(null);
          setDragOverColumnKey(null);
          setDragOverTaskId(null);
        }}
        onTaskDragOver={(columnKey, taskId, event) => {
          if (draggedBoardTaskId) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragOverColumnKey(columnKey);
            setDragOverTaskId(taskId);
          }
        }}
        onTaskDragLeave={(taskId) => {
          if (dragOverTaskId === taskId) {
            setDragOverTaskId(null);
          }
        }}
        onTaskDrop={(columnKey, taskId, event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleReorderWithinColumn(columnKey, taskId);
        }}
        onColumnDragOver={(columnKey, event) => {
          if (draggedBoardTaskId) {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
            setDragOverColumnKey(columnKey);
            setDragOverTaskId(null);
          }
        }}
        onColumnDragLeave={(columnKey) => {
          if (dragOverColumnKey === columnKey && !dragOverTaskId) {
            setDragOverColumnKey(null);
          }
        }}
        onColumnDrop={(columnKey, event) => {
          event.preventDefault();
          void handleBoardDrop(columnKey);
        }}
        onTailDrop={(columnKey, event) => {
          event.preventDefault();
          event.stopPropagation();
          void handleBoardDrop(columnKey);
        }}
      />
    );
  }

  if (isLoading) {
    return <LoadingState label="Loading project board..." />;
  }

  if (error) {
    const fallbackWorkspaceId = state.workspaces[0]?.id ?? null;

    return (
      <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col gap-6 overflow-hidden">
        <PageHeader
          eyebrow="Project board"
          title="Project board unavailable"
          subtitle="You may no longer have access to this workspace or project. Use one of the actions below to get back to a safe screen."
        />
        <Card className="rounded-[1.75rem] p-6">
          <EmptyState title="Access blocked" description={error} />
          <div className="mt-6 flex flex-wrap gap-3">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Go back
            </Button>
            <Button variant="secondary" onClick={() => navigate('/dashboard')}>
              Open dashboard
            </Button>
            {fallbackWorkspaceId ? (
              <Button
                onClick={() => {
                  setError(null);
                  setSelectedWorkspaceId(fallbackWorkspaceId);
                  setStoredWorkspaceId(fallbackWorkspaceId);
                  setSelectedSpaceId(null);
                  setSelectedProjectId(null);
                }}
              >
                Switch to available workspace
              </Button>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }

  if (!selectedWorkspace || !selectedSpace || !selectedProject) {
    return (
      <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col overflow-hidden">
        <PageHeader
          eyebrow="Project board"
          title="No active project yet"
          subtitle="Create a workspace, then a space and project from the control console to see live work flow into the board."
        />
        <EmptyState
          title="Nothing to show yet"
          description="This board turns live once your account has access to at least one active project."
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button onClick={() => navigate('/control')}>
            Open control console
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 max-w-full flex-col gap-3 overflow-hidden">
      <Card className="min-w-0 shrink-0 p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="space-y-2">
              <p className="text-xs uppercase tracking-[0.18em] text-[#b8c4ff]">Project workspace</p>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-white">{selectedProject.name}</h1>
                <Badge tone={projectLifecycleTone(selectedProject.status)}>{projectLifecycleLabel(selectedProject.status)}</Badge>
                {currentMembership ? <Badge tone="info">{currentMembership.role}</Badge> : null}
                {ownedSignals.project ? <Badge tone="success">Created by you</Badge> : null}
                {!ownedSignals.project && ownedSignals.space ? <Badge>Inside your space</Badge> : null}
                {!ownedSignals.project && !ownedSignals.space && ownedSignals.workspace ? <Badge>Inside your workspace</Badge> : null}
              </div>
              <p className="max-w-3xl text-sm text-slate-300">{selectedProject.description || currentViewMeta.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="rounded-xl border border-white/10 bg-[#0d1628] px-3 py-2 text-sm text-slate-200">Workspace: <span className="font-semibold text-white">{selectedWorkspace.name}</span></div>
              <div className="rounded-xl border border-white/10 bg-[#0d1628] px-3 py-2 text-sm text-slate-200">Space: <span className="font-semibold text-white">{selectedSpace.name}</span></div>
              <div className="rounded-xl border border-white/10 bg-[#0d1628] px-3 py-2 text-sm text-slate-200">Open: <span className="font-semibold text-white">{state.tasks.filter((task) => task.status !== 'DONE').length}</span></div>
              <div className="rounded-xl border border-white/10 bg-[#0d1628] px-3 py-2 text-sm text-slate-200">Members: <span className="font-semibold text-white">{state.members.length}</span></div>
              <div className="rounded-xl border border-white/10 bg-[#0d1628] px-3 py-2 text-sm text-slate-200">Target end: <span className="font-semibold text-white">{formatLongDate(selectedProject.targetEndDate)}</span></div>
            </div>
          </div>

          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap gap-2">
              {availableViews.map((view) => {
                const isActive = view.key === projectView;
                return (
                  <button
                    key={view.key}
                    type="button"
                    className={isActive ? 'rounded-xl border border-[#8f9cff]/40 bg-[#8f9cff]/18 px-4 py-2 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(111,132,255,0.16)]' : 'rounded-xl border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10 hover:text-white'}
                    onClick={() => {
                      const next = new URLSearchParams(searchParams);
                      next.set('view', view.key);
                      setSearchParams(next, { replace: true });
                    }}
                  >
                    {view.label}
                  </button>
                );
              })}
            </div>
            <Button variant="secondary" disabled={!canCreateProjectTasks} onClick={() => { const next = new URLSearchParams(searchParams); next.set('view', roleCanViewBacklog(currentMembership?.role) ? 'backlog' : 'board'); setSearchParams(next, { replace: true }); }}>{projectExecutionLocked ? 'Project closed' : 'New task'}</Button>
          </div>
          {projectExecutionLocked ? (
            <div className={`rounded-[1.35rem] border px-4 py-4 ${selectedProject.status === 'ARCHIVED' ? 'border-slate-200/15 bg-slate-400/10' : 'border-amber-300/20 bg-amber-400/10'}`}>
              <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Project status</p>
                  <h3 className="mt-1 text-base font-semibold text-white">This project is {projectLifecycleLabel(selectedProject.status).toLowerCase()}.</h3>
                  <p className="mt-1 text-sm text-slate-200">Task creation, assignment, board moves, and task editing are now locked to preserve the closed project record.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge tone={projectLifecycleTone(selectedProject.status)}>{projectLifecycleLabel(selectedProject.status)}</Badge>
                  {selectedProject.completedAt ? <Badge>Completed {formatShortDate(selectedProject.completedAt)}</Badge> : null}
                  {selectedProject.archivedAt ? <Badge>Archived {formatShortDate(selectedProject.archivedAt)}</Badge> : null}
                </div>
              </div>
            </div>
          ) : null}

          <div className="grid gap-3 md:grid-cols-3">
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Workspace</span>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff]/60" value={selectedWorkspaceId ?? ''} onChange={(event) => {
                const nextWorkspaceId = event.target.value || null;
                setSelectedWorkspaceId(nextWorkspaceId);
                setStoredWorkspaceId(nextWorkspaceId);
                setSelectedSpaceId(null);
                setSelectedProjectId(null);
              }}>
                {state.workspaces.map((workspace) => (
                  <option key={workspace.id} value={workspace.id} className="bg-[#0b1322] text-white">
                    {workspace.name}
                    {workspace.createdBy === user?.id ? ' - created by you' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Space</span>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff]/60" value={selectedSpaceId ?? ''} onChange={(event) => {
                setSelectedSpaceId(event.target.value);
                setSelectedProjectId(null);
              }}>
                {state.spaces.map((space) => (
                  <option key={space.id} value={space.id} className="bg-[#0b1322] text-white">
                    {space.name}
                    {space.createdBy === user?.id ? ' - created by you' : ''}
                  </option>
                ))}
              </select>
            </label>
            <label className="block space-y-2">
              <span className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Project</span>
              <select className="h-11 w-full rounded-xl border border-white/10 bg-white px-4 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff]/60" value={selectedProjectId ?? ''} onChange={(event) => setSelectedProjectId(event.target.value)}>
                {state.projects.map((project) => (
                  <option key={project.id} value={project.id} className="bg-[#0b1322] text-white">
                    {project.name}
                    {project.createdBy === user?.id ? ' - created by you' : ''}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
      </Card>

      <Card className={`min-h-0 min-w-0 flex-1 p-4 ${projectView === 'board' ? 'overflow-hidden' : 'overflow-y-auto'}`}>
        {renderProjectView()}
      </Card>

      <Drawer
        open={Boolean(selectedTask)}
        onClose={() => setSelectedTaskId(null)}
        title={selectedTask?.title ?? ''}
        subtitle={selectedTask ? `${prettyStatus(selectedTask.status)} - ${taskScheduleWindow(selectedTask)}` : undefined}
        footer={
          selectedTask ? (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-2">
                <Badge tone={priorityTone(selectedTask.priority)}>{selectedTask.priority}</Badge>
                {currentMembership ? <Badge tone="info">{currentMembership.role}</Badge> : null}
                {ownedSignals.task ? <Badge tone="success">Created by you</Badge> : null}
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" disabled={!roleCanComment(currentMembership?.role)}>
                  {roleCanComment(currentMembership?.role) ? 'Comment access' : 'Read only'}
                </Button>
                {canEditProjectTask(selectedTask, user?.id, currentMembership?.role) && !projectExecutionLocked ? (
                  <Button variant="secondary" onClick={() => { setTaskEditor(createTaskEditorState(selectedTask)); setIsEditingTask((current) => !current); }}>
                    {isEditingTask ? 'Close editor' : 'Edit task'}
                  </Button>
                ) : null}
                {canDeleteTask(selectedTask, user?.id, currentMembership?.role, ownedSignals.project) ? (
                  <Button
                    variant="ghost"
                    className="border border-rose-400/25 bg-rose-500/10 text-rose-200 hover:bg-rose-500/16 hover:text-rose-100"
                    onClick={() => void handleDeleteTask(selectedTask)}
                  >
                    Delete task
                  </Button>
                ) : null}
              </div>
            </div>
          ) : null
        }
      >
        {selectedTask ? (
          <div className="space-y-6 text-white">
            <Card className="rounded-[1.75rem] p-5">
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Assignee</p>
                  <div className="mt-3 flex items-center gap-3">
                    {selectedTask.assigneeId && memberMap.get(selectedTask.assigneeId) ? <Avatar name={memberMap.get(selectedTask.assigneeId)!.name} src={memberMap.get(selectedTask.assigneeId)!.avatarUrl} /> : null}
                    <div>
                      <p className="text-sm font-semibold text-white">{selectedTask.assigneeId ? memberMap.get(selectedTask.assigneeId)?.name ?? 'Unassigned' : 'Unassigned'}</p>
                      <p className="text-xs text-slate-300">{selectedTask.assigneeId ? memberMap.get(selectedTask.assigneeId)?.role ?? 'No role' : 'Assignment pending'}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Reporter</p>
                  <p className="mt-3 text-sm font-semibold text-white">{memberMap.get(selectedTask.reporterId)?.name ?? 'Unknown reporter'}</p>
                  <p className="text-xs text-slate-300">Reporter stays traceable even if assignee changes</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Created by</p>
                  <p className="mt-3 text-sm font-semibold text-white">{selectedTask.createdBy === user?.id ? 'You' : memberMap.get(selectedTask.createdBy ?? '')?.name ?? memberMap.get(selectedTask.createdBy ?? '')?.email ?? 'Unknown creator'}</p>
                  <p className="text-xs text-slate-300">The person who first raised this work item.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Start date</p>
                  <p className="mt-3 text-sm font-semibold text-white">{formatLongDate(selectedTask.startDate)}</p>
                  <p className="text-xs text-slate-300">When this task is expected to begin.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Due date</p>
                  <p className="mt-3 text-sm font-semibold text-white">{formatLongDate(selectedTask.dueDate)}</p>
                  <p className="text-xs text-slate-300">Delivery target used by the board and timeline.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Estimate</p>
                  <p className="mt-3 text-sm font-semibold text-white">{formatEstimate(selectedTask.estimateHours)}</p>
                  <p className="text-xs text-slate-300">Planning effort captured for this task.</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Project ownership</p>
                  <p className="mt-3 text-sm font-semibold text-white">{ownedSignals.project ? 'Inside a project you created' : 'Invited into this project'}</p>
                  <p className="text-xs text-slate-300">Scope power depends on creator ownership plus membership role</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Permission mode</p>
                  <p className="mt-3 text-sm font-semibold text-white">
                    {canManageProjectFlow
                      ? 'Can manage task flow'
                      : roleCanComment(currentMembership?.role)
                        ? 'Can collaborate in task scope'
                        : 'Read only'}
                  </p>
                  <p className="text-xs text-slate-300">Reflects current project membership</p>
                </div>
              </div>
            </Card>

            {isEditingTask && canEditProjectTask(selectedTask, user?.id, currentMembership?.role) && !projectExecutionLocked ? (
              <TaskEditorPanel
                state={taskEditor}
                members={state.members}
                workflowColumns={workflowColumns}
                canAssign={canManageProjectFlow}
                isSaving={isSavingTask}
                onChange={(updater) => setTaskEditor((current) => updater(current))}
                onSave={() => void handleSaveTask()}
                onCancel={() => { setTaskEditor(createTaskEditorState(selectedTask)); setIsEditingTask(false); }}
              />
            ) : null}

            <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <Card className="rounded-[1.75rem] p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Description</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{selectedTask.description || 'No description provided yet.'}</p>
                <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Checklist</p>
                <div className="mt-3 space-y-3">
                  {selectedTask.checklist.length > 0 ? (
                    selectedTask.checklist.map((item, index) => (
                      <button key={item.title} type="button" onClick={() => void handleToggleChecklist(index)} disabled={!canEditProjectTask(selectedTask, user?.id, currentMembership?.role) || projectExecutionLocked} className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-left transition hover:border-[#8f9cff]/35 disabled:cursor-default disabled:opacity-70">
                        <div className="flex items-center gap-3">
                          <span className={item.isCompleted ? 'inline-flex h-5 w-5 items-center justify-center rounded-full border border-emerald-300 bg-emerald-400 text-[#07111f]' : 'inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/20 bg-transparent text-transparent'}>{item.isCompleted ? '?' : '?'}</span>
                          <p className={item.isCompleted ? 'text-sm text-slate-300 line-through' : 'text-sm text-white'}>{item.title}</p>
                        </div>
                        <Badge tone={item.isCompleted ? 'success' : 'warning'}>{item.isCompleted ? 'Done' : 'Open'}</Badge>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-slate-300">No checklist items yet.</p>
                  )}
                </div>
                <p className="mt-6 text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Dependencies</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedTask.dependencyTaskIds.length > 0 ? (
                    selectedTask.dependencyTaskIds.map((dependencyId) => {
                      const dependency = state.tasks.find((item) => item.id === dependencyId);
                      return <Badge key={dependencyId}>{dependency ? `#${dependency.sequenceNumber} ${dependency.title}` : dependencyId}</Badge>;
                    })
                  ) : (
                    <p className="text-sm text-slate-300">No blocking dependencies</p>
                  )}
                </div>
              </Card>

              <div className="space-y-6">
                <Card className="rounded-[1.75rem] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Comments</p>
                    <Badge>{comments.length} entries</Badge>
                  </div>
                  {roleCanComment(currentMembership?.role) ? (
                    <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-white/6 p-4">
                      <textarea value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} rows={4} placeholder="Add a delivery update, QA note, or review context..." className="w-full rounded-2xl border border-white/10 bg-[#0b1322] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-400 focus:border-[#8f9cff]/60" />
                      <div className="flex justify-end">
                        <Button onClick={handleCreateComment} disabled={isSubmittingComment || commentDraft.trim().length === 0}>{isSubmittingComment ? 'Posting...' : 'Post comment'}</Button>
                      </div>
                    </div>
                  ) : null}
                  {taskMetaError ? <p className="mt-4 text-sm text-rose-300">{taskMetaError}</p> : null}
                  {isLoadingTaskMeta ? <div className="mt-4 text-sm text-slate-300">Loading task conversation...</div> : null}
                  <div className="mt-4 space-y-3">
                    {comments.length > 0 ? comments.map((comment) => (
                      <div key={comment.id} className="rounded-2xl border border-white/10 bg-white/6 p-4">
                        <div className="flex items-center gap-3">
                          <Avatar name={comment.author?.fullName ?? comment.author?.email ?? comment.authorId} src={comment.author?.avatarUrl} size="sm" />
                          <div>
                            <p className="text-sm font-semibold text-white">{comment.author?.fullName ?? comment.author?.email ?? 'Unknown author'}</p>
                            <p className="text-xs text-slate-300">{formatDateTime(comment.createdAt)}</p>
                          </div>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-slate-300">{comment.content}</p>
                      </div>
                    )) : (!isLoadingTaskMeta ? <p className="text-sm text-slate-300">No comments on this task yet.</p> : null)}
                  </div>
                </Card>

                <Card className="rounded-[1.75rem] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-xs uppercase tracking-[0.16em] text-[#b8c4ff]">Activity</p>
                    <Badge tone="info">Audit trail</Badge>
                  </div>
                  <div className="mt-4 space-y-3">
                    {activity.length > 0 ? activity.map((item) => (
                      <div key={item.id} className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3">
                        <p className="text-sm font-medium text-white">{prettyAction(item.action)}</p>
                        <p className="mt-1 text-xs text-slate-300">{item.user?.fullName ?? item.user?.email ?? 'System actor'} - {formatDateTime(item.timestamp)}</p>
                      </div>
                    )) : (!isLoadingTaskMeta ? <p className="text-sm text-slate-300">No activity recorded for this task yet.</p> : null)}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}




















