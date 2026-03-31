import { useEffect, useMemo, useState } from 'react';
import { Avatar } from '../components/ui/Avatar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input } from '../components/ui/Input';
import { LoadingState } from '../components/ui/LoadingState';
import { PageHeader } from '../components/ui/PageHeader';
import { Select } from '../components/ui/Select';
import { useAuth } from '../features/auth/hooks/useAuth';
import { usePermission } from '../features/auth/hooks/usePermission';
import {
  getStoredWorkspaceId,
  resolveWorkspaceSelection,
  setStoredWorkspaceId,
  WORKSPACE_SELECTION_EVENT
} from '../features/workspaces/store/workspaceSelection';
import { adminApi } from '../features/admin/api/adminApi';
import type {
  MembershipStatus,
  Project,
  ProjectMembership,
  ProjectRole,
  Space,
  SpaceMembership,
  SpaceRole,
  Workspace,
  WorkspaceMembership,
  WorkspaceRole,
  Invite
} from '../features/admin/types';

const workspaceRoleOptions: WorkspaceRole[] = ['WORKSPACE_ADMIN', 'WORKSPACE_MEMBER', 'WORKSPACE_VIEWER'];
const spaceRoleOptions: SpaceRole[] = ['OWNER', 'ADMIN', 'MEMBER', 'GUEST'];
const projectRoleOptions: ProjectRole[] = ['PROJECT_ADMIN', 'PM', 'MEMBER', 'VIEWER'];
const membershipStatusOptions: MembershipStatus[] = ['ACTIVE', 'INVITED', 'SUSPENDED'];
const defaultStatusColumns = [
  { key: 'BACKLOG', name: 'Backlog', color: '#7DD3FC', position: 1 },
  { key: 'PLANNED', name: 'Planned', color: '#CBD5E1', position: 2 },
  { key: 'IN_PROGRESS', name: 'In Progress', color: '#60A5FA', position: 3 },
  { key: 'REVIEW', name: 'Review', color: '#A78BFA', position: 4 },
  { key: 'QA', name: 'QA', color: '#F59E0B', position: 5 },
  { key: 'UAT', name: 'UAT', color: '#14B8A6', position: 6 },
  { key: 'DONE', name: 'Done', color: '#22C55E', position: 7 }
];
const defaultWorkflowTransitions = [
  { from: 'BACKLOG', to: 'PLANNED', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'PLANNED', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM', 'MEMBER'] },
  { from: 'IN_PROGRESS', to: 'REVIEW', allowedRoles: ['PROJECT_ADMIN', 'PM', 'MEMBER'] },
  { from: 'REVIEW', to: 'QA', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'QA', to: 'UAT', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'UAT', to: 'DONE', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'REVIEW', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'QA', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'UAT', to: 'IN_PROGRESS', allowedRoles: ['PROJECT_ADMIN', 'PM'] },
  { from: 'PLANNED', to: 'BACKLOG', allowedRoles: ['PROJECT_ADMIN', 'PM'] }
];

function SummaryCard({ label, value, note }: { label: string; value: number | string; note: string }) {
  return (
    <Card>
      <p className="text-xs uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm text-slate-300">{note}</p>
    </Card>
  );
}

function OwnershipBadge({ show }: { show: boolean }) {
  if (!show) {
    return null;
  }

  return <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700">Created by you</Badge>;
}

function InviteRow({ invite, canManage, onRevoke }: { invite: Invite; canManage: boolean; onRevoke: (inviteId: string) => Promise<void> }) {
  const [isSaving, setIsSaving] = useState(false);

  const revoke = async () => {
    setIsSaving(true);
    try {
      await onRevoke(invite.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[1.25rem] border border-white/10 bg-white/6 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{invite.email}</p>
          <p className="mt-1 text-xs text-slate-300">Role on accept: {invite.role}</p>
          {invite.message ? <p className="mt-2 text-sm text-slate-300">{invite.message}</p> : null}
        </div>
        <Badge tone="warning">Pending</Badge>
      </div>
      <div className="mt-3 flex justify-end">
        <Button variant="ghost" className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-45" disabled={!canManage || isSaving} onClick={revoke}>
          Revoke invite
        </Button>
      </div>
    </div>
  );
}
function MembershipRow({
  membership,
  roleOptions,
  canManage,
  onSave,
  onRemove
}: {
  membership: WorkspaceMembership | SpaceMembership | ProjectMembership;
  roleOptions: string[];
  canManage: boolean;
  onSave: (membershipId: string, role: string, status: MembershipStatus) => Promise<void>;
  onRemove: (membershipId: string) => Promise<void>;
}) {
  const [role, setRole] = useState(membership.role);
  const [status, setStatus] = useState(membership.status);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setRole(membership.role);
    setStatus(membership.status);
  }, [membership.role, membership.status]);

  const save = async () => {
    setIsSaving(true);
    try {
      await onSave(membership.id, role, status);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsSaving(true);
    try {
      await onRemove(membership.id);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-[1.5rem] border border-[#dfe6de] bg-white p-4 shadow-[0_16px_34px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <Avatar name={membership.user?.fullName ?? 'Member'} size="sm" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[#10241a]">{membership.user?.fullName ?? 'Unknown user'}</p>
          <p className="truncate text-xs text-slate-500">{membership.user?.email ?? membership.userId}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Role</p>
          <Select
            theme="light"
            value={role}
            disabled={!canManage || isSaving}
            className="border-[#d8e3d7] bg-[#fbfcfa] text-[#10241a] shadow-none focus:border-[#8f9cff]"
            onChange={(event) => setRole(event.target.value as typeof role)}
          >
            {roleOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">Status</p>
          <Select
            theme="light"
            value={status}
            disabled={!canManage || isSaving}
            className="border-[#d8e3d7] bg-[#fbfcfa] text-[#10241a] shadow-none focus:border-[#8f9cff]"
            onChange={(event) => setStatus(event.target.value as MembershipStatus)}
          >
            {membershipStatusOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button variant="secondary" className="border border-[#c8d2ff] bg-[#eef1ff] text-[#314073] shadow-[0_10px_24px_rgba(127,140,255,0.12)] hover:bg-[#e3e8ff] disabled:border-[#d7dcf4] disabled:bg-[#e8ecfa] disabled:text-[#7b86a8] disabled:shadow-none" disabled={!canManage || isSaving} onClick={save}>
          Save changes
        </Button>
        <Button variant="ghost" className="border border-slate-200 bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700 disabled:border-slate-200 disabled:bg-slate-100 disabled:text-slate-400 disabled:shadow-none" disabled={!canManage || isSaving} onClick={remove}>
          Remove member
        </Button>
      </div>
    </div>
  );
}

export function AdminConsolePage() {
  const { user, tokens } = useAuth();
  const { isSuperAdmin } = usePermission();
  const token = tokens?.accessToken ?? '';
  const currentUserId = user?.id ?? '';

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [workspaceMembers, setWorkspaceMembers] = useState<WorkspaceMembership[]>([]);
  const [spaceMembers, setSpaceMembers] = useState<SpaceMembership[]>([]);
  const [projectMembers, setProjectMembers] = useState<ProjectMembership[]>([]);
  const [workspaceInvites, setWorkspaceInvites] = useState<Invite[]>([]);
  const [spaceInvites, setSpaceInvites] = useState<Invite[]>([]);
  const [projectInvites, setProjectInvites] = useState<Invite[]>([]);

  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState(() => getStoredWorkspaceId() ?? '');
  const [selectedSpaceId, setSelectedSpaceId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  const [workspaceForm, setWorkspaceForm] = useState({ name: '', slug: '', description: '' });
  const [spaceForm, setSpaceForm] = useState({ name: '', key: '', description: '' });
  const [projectForm, setProjectForm] = useState({ name: '', key: '', description: '' });
  const [workspaceMemberForm, setWorkspaceMemberForm] = useState({ email: '', role: 'WORKSPACE_MEMBER' as WorkspaceRole, status: 'ACTIVE' as MembershipStatus });
  const [spaceMemberForm, setSpaceMemberForm] = useState({ email: '', role: 'MEMBER' as SpaceRole, status: 'ACTIVE' as MembershipStatus });
  const [projectMemberForm, setProjectMemberForm] = useState({ email: '', role: 'MEMBER' as ProjectRole, status: 'ACTIVE' as MembershipStatus });

  const selectedWorkspace = workspaces.find((item) => item.id === selectedWorkspaceId) ?? null;
  const selectedSpace = spaces.find((item) => item.id === selectedSpaceId) ?? null;
  const selectedProject = projects.find((item) => item.id === selectedProjectId) ?? null;

  const isWorkspaceCreator = Boolean(selectedWorkspace && selectedWorkspace.createdBy === currentUserId);
  const isSpaceCreator = Boolean(selectedSpace && selectedSpace.createdBy === currentUserId);
  const isProjectCreator = Boolean(selectedProject && selectedProject.createdBy === currentUserId);

  const canArchiveWorkspace = Boolean(selectedWorkspace && (isSuperAdmin || isWorkspaceCreator));
  const canArchiveSpace = Boolean(selectedSpace && (isSuperAdmin || isSpaceCreator));
  const canArchiveProject = Boolean(selectedProject && (isSuperAdmin || isProjectCreator));

  const canManageWorkspaceMembers = Boolean(selectedWorkspace && (isSuperAdmin || isWorkspaceCreator));
  const canManageSpaceMembers = Boolean(selectedSpace && (isSuperAdmin || isWorkspaceCreator || isSpaceCreator));
  const canManageProjectMembers = Boolean(selectedProject && (isSuperAdmin || isWorkspaceCreator || isSpaceCreator || isProjectCreator));

  async function refreshAll(preferredWorkspaceId?: string, preferredSpaceId?: string, preferredProjectId?: string) {
    const workspacesResponse = await adminApi.listWorkspaces(token);
    const workspaceItems = workspacesResponse.items;
    setWorkspaces(workspaceItems);

    const nextWorkspaceId = resolveWorkspaceSelection(workspaceItems, preferredWorkspaceId || selectedWorkspaceId) ?? '';
    setSelectedWorkspaceId(nextWorkspaceId);
    if (typeof window !== 'undefined') {
      if (nextWorkspaceId) {
        window.localStorage.setItem('superboss.currentWorkspaceId', nextWorkspaceId);
      } else {
        window.localStorage.removeItem('superboss.currentWorkspaceId');
      }
    }

    const workspace = workspaceItems.find((item) => item.id === nextWorkspaceId);
    setWorkspaceForm({
      name: workspace?.name ?? '',
      slug: workspace?.slug ?? '',
      description: workspace?.description ?? ''
    });

    if (!nextWorkspaceId) {
      setSpaces([]);
      setProjects([]);
      setWorkspaceMembers([]);
      setSpaceMembers([]);
      setProjectMembers([]);
      setWorkspaceInvites([]);
      setSpaceInvites([]);
      setProjectInvites([]);
      setSelectedSpaceId('');
      setSelectedProjectId('');
      setSpaceForm({ name: '', key: '', description: '' });
      setProjectForm({ name: '', key: '', description: '' });
      return;
    }

    const [spacesResponse, workspaceMembersResponse, workspaceInvitesResponse] = await Promise.all([
      adminApi.listSpaces(token, nextWorkspaceId),
      adminApi.listWorkspaceMembers(token, nextWorkspaceId),
      adminApi.listInvites(token, 'WORKSPACE', nextWorkspaceId, 'PENDING')
    ]);

    const spaceItems = spacesResponse.items;
    setSpaces(spaceItems);
    setWorkspaceMembers(workspaceMembersResponse.items);
    setWorkspaceInvites(workspaceInvitesResponse.items);

    const nextSpaceId = preferredSpaceId && spaceItems.some((item) => item.id === preferredSpaceId)
      ? preferredSpaceId
      : spaceItems[0]?.id ?? '';
    setSelectedSpaceId(nextSpaceId);

    const space = spaceItems.find((item) => item.id === nextSpaceId);
    setSpaceForm({
      name: space?.name ?? '',
      key: space?.key ?? '',
      description: space?.description ?? ''
    });

    if (!nextSpaceId) {
      setProjects([]);
      setSpaceMembers([]);
      setProjectMembers([]);
      setSpaceInvites([]);
      setProjectInvites([]);
      setSelectedProjectId('');
      setProjectForm({ name: '', key: '', description: '' });
      return;
    }

    const [projectsResponse, spaceMembersResponse, spaceInvitesResponse] = await Promise.all([
      adminApi.listProjects(token, nextWorkspaceId, nextSpaceId),
      adminApi.listSpaceMembers(token, nextSpaceId),
      adminApi.listInvites(token, 'SPACE', nextSpaceId, 'PENDING')
    ]);

    const projectItems = projectsResponse.items;
    setProjects(projectItems);
    setSpaceMembers(spaceMembersResponse.items);
    setSpaceInvites(spaceInvitesResponse.items);

    const nextProjectId = preferredProjectId && projectItems.some((item) => item.id === preferredProjectId)
      ? preferredProjectId
      : projectItems[0]?.id ?? '';
    setSelectedProjectId(nextProjectId);

    const project = projectItems.find((item) => item.id === nextProjectId);
    setProjectForm({
      name: project?.name ?? '',
      key: project?.key ?? '',
      description: project?.description ?? ''
    });

    if (!nextProjectId) {
      setProjectMembers([]);
      setProjectInvites([]);
      return;
    }

    const [projectMembersResponse, projectInvitesResponse] = await Promise.all([
      adminApi.listProjectMembers(token, nextProjectId),
      adminApi.listInvites(token, 'PROJECT', nextProjectId, 'PENDING')
    ]);
    setProjectMembers(projectMembersResponse.items);
    setProjectInvites(projectInvitesResponse.items);
  }

  useEffect(() => {
    function handleWorkspaceSelection(event: Event) {
      const nextWorkspaceId = (event as CustomEvent<string | null>).detail ?? '';
      if (!token) {
        setSelectedWorkspaceId(nextWorkspaceId);
        return;
      }

      withMutation(async () => {
        await refreshAll(nextWorkspaceId);
      });
    }

    window.addEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);

    if (!token) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    refreshAll()
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : 'Failed to load control console');
      })
      .finally(() => {
        setIsLoading(false);
      });
    return () => {
      window.removeEventListener(WORKSPACE_SELECTION_EVENT, handleWorkspaceSelection as EventListener);
    };
  }, [token]);

  useEffect(() => {
    if (!selectedWorkspace) {
      return;
    }

    setWorkspaceForm({
      name: selectedWorkspace.name,
      slug: selectedWorkspace.slug,
      description: selectedWorkspace.description
    });
  }, [selectedWorkspace]);

  useEffect(() => {
    if (!selectedSpace) {
      return;
    }

    setSpaceForm({
      name: selectedSpace.name,
      key: selectedSpace.key,
      description: selectedSpace.description
    });
  }, [selectedSpace]);

  useEffect(() => {
    if (!selectedProject) {
      return;
    }

    setProjectForm({
      name: selectedProject.name,
      key: selectedProject.key,
      description: selectedProject.description
    });
  }, [selectedProject]);

  async function withMutation(action: () => Promise<void>) {
    setIsMutating(true);
    setError(null);
    try {
      await action();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'Control action failed');
    } finally {
      setIsMutating(false);
    }
  }

  const consoleTitle = isSuperAdmin ? 'Admin Console' : 'Workspace Control';
  const consoleSubtitle = isSuperAdmin
    ? 'Operate the full workspace hierarchy and observe creator ownership across the system.'
    : 'Create your own workspace, shape child spaces and projects, and manage the scopes you own or were invited into.';

  const ownershipStats = useMemo(
    () => ({
      ownedWorkspaces: workspaces.filter((item) => item.createdBy === currentUserId).length,
      ownedSpaces: spaces.filter((item) => item.createdBy === currentUserId).length,
      ownedProjects: projects.filter((item) => item.createdBy === currentUserId).length
    }),
    [currentUserId, projects, spaces, workspaces]
  );

  if (isLoading) {
    return <LoadingState label="Loading control console..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={isSuperAdmin ? 'System control' : 'Creator workspace'}
        title={consoleTitle}
        subtitle={consoleSubtitle}
        actions={
          <>
            {isSuperAdmin ? <Badge tone="danger">SUPER_ADMIN</Badge> : <Badge tone="info">CREATOR MODE</Badge>}
            <Badge tone="info">{user?.email ?? 'No session'}</Badge>
          </>
        }
      />

      {error ? (
        <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Visible workspaces" value={workspaces.length} note={`You currently own ${ownershipStats.ownedWorkspaces} workspace scopes.`} />
        <SummaryCard label="Visible spaces" value={spaces.length} note={`You currently own ${ownershipStats.ownedSpaces} space scopes.`} />
        <SummaryCard label="Visible projects" value={projects.length} note={`You currently own ${ownershipStats.ownedProjects} project scopes.`} />
        <SummaryCard label="Membership assignments" value={workspaceMembers.length + spaceMembers.length + projectMembers.length} note="Invited roles that refine access when the scope belongs to someone else." />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <Card className="space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Workspaces</p>
              <h3 className="mt-2 text-xl font-semibold text-white">Select or create a parent workspace</h3>
              <p className="mt-2 text-sm text-slate-300">Everything on the right is scoped under the workspace selected here.</p>
            </div>
            {selectedWorkspace ? <Badge tone={selectedWorkspace.isActive ? 'success' : 'warning'}>{selectedWorkspace.isActive ? 'Active' : 'Inactive'}</Badge> : null}
          </div>

          <Select theme="light" labelClassName="text-slate-200" label="Active workspace" value={selectedWorkspaceId} onChange={(event) => {
            const nextWorkspaceId = event.target.value;
            setStoredWorkspaceId(nextWorkspaceId || null);
          }}>
            {workspaces.map((workspace) => (
              <option key={workspace.id} value={workspace.id}>
                {workspace.name}
              </option>
            ))}
          </Select>

          <div className="flex flex-wrap gap-2">
            {selectedWorkspace ? <OwnershipBadge show={isWorkspaceCreator} /> : null}
            {selectedWorkspace ? <Badge>{selectedWorkspace.slug}</Badge> : null}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Input theme="light" labelClassName="text-slate-200" label="Workspace name" value={workspaceForm.name} onChange={(event) => setWorkspaceForm((current) => ({ ...current, name: event.target.value }))} />
            <Input theme="light" labelClassName="text-slate-200" label="Slug" value={workspaceForm.slug} onChange={(event) => setWorkspaceForm((current) => ({ ...current, slug: event.target.value.toLowerCase() }))} />
          </div>

          <label className="flex flex-col gap-2 text-sm font-medium text-slate-200">
            <span>Description</span>
            <textarea className="min-h-[120px] rounded-2xl border border-[#d8e3d7] bg-white px-3 py-3 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15" value={workspaceForm.description} onChange={(event) => setWorkspaceForm((current) => ({ ...current, description: event.target.value }))} />
          </label>

          <div className="flex flex-wrap gap-3">
            <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating} onClick={() => withMutation(async () => {
              const created = await adminApi.createWorkspace(token, workspaceForm);
              await refreshAll(created.id);
            })}>
              Create workspace
            </Button>
            <Button variant="secondary" className="border border-[#c8d2ff] bg-[#eef1ff] text-[#314073] shadow-[0_10px_24px_rgba(127,140,255,0.12)] hover:bg-[#e3e8ff] disabled:opacity-45" disabled={isMutating || !selectedWorkspace} onClick={() => withMutation(async () => {
              if (!selectedWorkspace) return;
              await adminApi.updateWorkspace(token, selectedWorkspace.id, workspaceForm);
              await refreshAll(selectedWorkspace.id, selectedSpaceId, selectedProjectId);
            })}>
              Save workspace
            </Button>
            {canArchiveWorkspace ? (
              <Button variant="ghost" className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-45" disabled={isMutating || !selectedWorkspace} onClick={() => withMutation(async () => {
                if (!selectedWorkspace) return;
                await adminApi.deleteWorkspace(token, selectedWorkspace.id);
                await refreshAll();
              })}>
                Archive workspace
              </Button>
            ) : null}
          </div>
        </Card>

        <div className="space-y-6">
          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Workspace detail</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Spaces inside this workspace</h3>
                <p className="mt-2 text-sm text-slate-300">Manage child spaces under <span className="font-semibold text-white">{selectedWorkspace?.name ?? 'no workspace selected'}</span>.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSpace ? <Badge tone={selectedSpace.isActive ? 'success' : 'warning'}>{selectedSpace.isActive ? 'Active' : 'Inactive'}</Badge> : null}
                {selectedSpace ? <OwnershipBadge show={isSpaceCreator} /> : null}
              </div>
            </div>

            {selectedWorkspace ? (
              <>
                <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                  <div className="rounded-[1.5rem] border border-line bg-[#fbfcfa] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Available spaces</p>
                    <div className="mt-4 space-y-3">
                      {spaces.length > 0 ? spaces.map((space) => {
                        const isOwned = space.createdBy === currentUserId;
                        return (
                          <button
                            key={space.id}
                            type="button"
                            className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedSpaceId === space.id ? 'border-brand-300 bg-brand-50' : 'border-line bg-white hover:border-brand-200'}`}
                            onClick={() => withMutation(async () => {
                              await refreshAll(selectedWorkspaceId, space.id);
                            })}
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-sm font-semibold text-[#10241a]">{space.name}</p>
                                <p className="text-xs text-slate-400">{space.key}</p>
                              </div>
                              <div className="flex flex-wrap justify-end gap-2">
                                <Badge tone={space.isActive ? 'success' : 'warning'}>{space.isActive ? 'Active' : 'Inactive'}</Badge>
                                <OwnershipBadge show={isOwned} />
                              </div>
                            </div>
                          </button>
                        );
                      }) : <EmptyState theme="light" title="No spaces yet" description="Create the first space inside this workspace to start structuring delivery areas." />}
                    </div>
                  </div>

                  <div className="space-y-4 rounded-[1.5rem] border border-line bg-[#fbfcfa] p-4">
                    <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Space editor</p>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Input theme="light" label="Space name" value={spaceForm.name} onChange={(event) => setSpaceForm((current) => ({ ...current, name: event.target.value }))} />
                      <Input theme="light" label="Key" value={spaceForm.key} onChange={(event) => setSpaceForm((current) => ({ ...current, key: event.target.value.toUpperCase() }))} />
                    </div>
                    <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                      <span>Description</span>
                      <textarea className="min-h-[120px] rounded-2xl border border-[#d8e3d7] bg-white px-3 py-3 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15" value={spaceForm.description} onChange={(event) => setSpaceForm((current) => ({ ...current, description: event.target.value }))} />
                    </label>
                    <div className="flex flex-wrap gap-3">
                      <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating || !selectedWorkspaceId} onClick={() => withMutation(async () => {
                        const created = await adminApi.createSpace(token, { workspaceId: selectedWorkspaceId, ...spaceForm });
                        await refreshAll(selectedWorkspaceId, created.id);
                      })}>
                        Create space in this workspace
                      </Button>
                      <Button variant="secondary" className="border border-[#c8d2ff] bg-[#eef1ff] text-[#314073] shadow-[0_10px_24px_rgba(127,140,255,0.12)] hover:bg-[#e3e8ff] disabled:opacity-45" disabled={isMutating || !selectedSpace} onClick={() => withMutation(async () => {
                        if (!selectedSpace) return;
                        await adminApi.updateSpace(token, selectedSpace.id, spaceForm);
                        await refreshAll(selectedWorkspaceId, selectedSpace.id, selectedProjectId);
                      })}>
                        Save selected space
                      </Button>
                      {canArchiveSpace ? (
                        <Button variant="ghost" className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-45" disabled={isMutating || !selectedSpace} onClick={() => withMutation(async () => {
                          if (!selectedSpace) return;
                          await adminApi.deleteSpace(token, selectedSpace.id);
                          await refreshAll(selectedWorkspaceId);
                        })}>
                          Archive selected space
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-200">Workspace: {selectedWorkspace?.slug ?? 'None selected'}</span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-200">Selected space: {selectedSpace?.key ?? 'None selected'}</span>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1.5 text-sm text-slate-200">Project: {selectedProject?.key ?? 'None selected'}</span>
                </div>
              </>
            ) : (
              <EmptyState title="Select or create a workspace" description="Once a workspace is active, its spaces will appear here as child resources." />
            )}
          </Card>

          <Card className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Project scope inside selected space</p>
                <h3 className="mt-2 text-xl font-semibold text-white">Projects under {selectedSpace?.name ?? 'the selected space'}</h3>
              </div>
              {selectedProject ? <OwnershipBadge show={isProjectCreator} /> : null}
            </div>

            {selectedSpace ? (
              <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
                <div className="rounded-[1.5rem] border border-line bg-[#fbfcfa] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Available projects</p>
                  <div className="mt-4 space-y-3">
                    {projects.length > 0 ? projects.map((project) => {
                      const isOwned = project.createdBy === currentUserId;
                      return (
                        <button
                          key={project.id}
                          type="button"
                          className={`w-full rounded-2xl border px-4 py-3 text-left transition ${selectedProjectId === project.id ? 'border-brand-300 bg-brand-50' : 'border-line bg-white hover:border-brand-200'}`}
                          onClick={() => withMutation(async () => {
                            await refreshAll(selectedWorkspaceId, selectedSpaceId, project.id);
                          })}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <p className="text-sm font-semibold text-[#10241a]">{project.name}</p>
                              <p className="text-xs text-slate-400">{project.key}</p>
                            </div>
                            <div className="flex flex-wrap justify-end gap-2">
                              <Badge tone={project.isArchived ? 'warning' : 'success'}>{project.isArchived ? 'Archived' : 'Active'}</Badge>
                              <OwnershipBadge show={isOwned} />
                            </div>
                          </div>
                        </button>
                      );
                    }) : <EmptyState theme="light" title="No projects yet" description="Create the first project inside this space to turn structure into delivery execution." />}
                  </div>
                </div>

                <div className="space-y-4 rounded-[1.5rem] border border-line bg-[#fbfcfa] p-4">
                  <p className="text-xs uppercase tracking-[0.16em] text-slate-400">Project editor</p>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input theme="light" label="Project name" value={projectForm.name} onChange={(event) => setProjectForm((current) => ({ ...current, name: event.target.value }))} />
                    <Input theme="light" label="Key" value={projectForm.key} onChange={(event) => setProjectForm((current) => ({ ...current, key: event.target.value.toUpperCase() }))} />
                  </div>
                  <label className="flex flex-col gap-2 text-sm font-medium text-slate-600">
                    <span>Description</span>
                    <textarea className="min-h-[120px] rounded-2xl border border-[#d8e3d7] bg-white px-3 py-3 text-sm text-[#10241a] outline-none transition focus:border-[#8f9cff] focus:ring-4 focus:ring-[#8f9cff]/15" value={projectForm.description} onChange={(event) => setProjectForm((current) => ({ ...current, description: event.target.value }))} />
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating || !selectedWorkspaceId || !selectedSpaceId} onClick={() => withMutation(async () => {
                      const created = await adminApi.createProject(token, {
                        workspaceId: selectedWorkspaceId,
                        spaceId: selectedSpaceId,
                        name: projectForm.name,
                        key: projectForm.key,
                        description: projectForm.description,
                        statusColumns: defaultStatusColumns,
                        workflowTransitions: defaultWorkflowTransitions,
                        supportedTaskTypes: ['TASK', 'BUG', 'STORY', 'SPIKE'],
                        defaultTaskType: 'TASK'
                      });
                      await refreshAll(selectedWorkspaceId, selectedSpaceId, created.id);
                    })}>
                      Create project in this space
                    </Button>
                    <Button variant="secondary" className="border border-[#c8d2ff] bg-[#eef1ff] text-[#314073] shadow-[0_10px_24px_rgba(127,140,255,0.12)] hover:bg-[#e3e8ff] disabled:opacity-45" disabled={isMutating || !selectedProject} onClick={() => withMutation(async () => {
                      if (!selectedProject) return;
                      await adminApi.updateProject(token, selectedProject.id, projectForm);
                      await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProject.id);
                    })}>
                      Save selected project
                    </Button>
                    {canArchiveProject ? (
                      <Button variant="ghost" className="border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 hover:text-rose-800 disabled:opacity-45" disabled={isMutating || !selectedProject} onClick={() => withMutation(async () => {
                        if (!selectedProject) return;
                        await adminApi.updateProject(token, selectedProject.id, { isArchived: true });
                        await refreshAll(selectedWorkspaceId, selectedSpaceId);
                      })}>
                        Archive selected project
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : (
              <EmptyState title="Select a space first" description="Projects are children of a space, so the editor unlocks after a space is active." />
            )}
          </Card>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Workspace members</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Invite people into the parent workspace</h3>
            <p className="mt-2 text-sm text-slate-300">People become active members only after they accept the invite in Notifications.</p>
          </div>
          <Input theme="light" labelClassName="text-slate-200" label="User email" value={workspaceMemberForm.email} onChange={(event) => setWorkspaceMemberForm((current) => ({ ...current, email: event.target.value }))} />
          <Select theme="light" labelClassName="text-slate-200" label="Role on accept" value={workspaceMemberForm.role} disabled={!canManageWorkspaceMembers} onChange={(event) => setWorkspaceMemberForm((current) => ({ ...current, role: event.target.value as WorkspaceRole }))}>
            {workspaceRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating || !selectedWorkspaceId || !canManageWorkspaceMembers} onClick={() => withMutation(async () => {
            await adminApi.createInvite(token, { scopeType: "WORKSPACE", scopeId: selectedWorkspaceId, email: workspaceMemberForm.email, role: workspaceMemberForm.role });
            setWorkspaceMemberForm({ email: "", role: "WORKSPACE_MEMBER", status: "INVITED" });
            await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
          })}>
            Send workspace invite
          </Button>
          {workspaceInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Pending invites</p>
              {workspaceInvites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} canManage={canManageWorkspaceMembers} onRevoke={(inviteId) => withMutation(async () => {
                  await adminApi.revokeInvite(token, inviteId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })} />
              ))}
            </div>
          ) : null}
          <div className="space-y-3">
            {workspaceMembers.length > 0 ? workspaceMembers.map((membership) => (
              <MembershipRow
                key={membership.id}
                membership={membership}
                roleOptions={workspaceRoleOptions}
                canManage={canManageWorkspaceMembers}
                onSave={(membershipId, role, status) => withMutation(async () => {
                  await adminApi.updateWorkspaceMember(token, selectedWorkspaceId, membershipId, { role: role as WorkspaceRole, status });
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
                onRemove={(membershipId) => withMutation(async () => {
                  await adminApi.removeWorkspaceMember(token, selectedWorkspaceId, membershipId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
              />
            )) : <EmptyState title="No active workspace members" description="Send an invite first. People appear here only after they accept and become active members." />}
          </div>
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Space members</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Invite people into {selectedSpace?.name ?? "the selected space"}</h3>
            <p className="mt-2 text-sm text-slate-300">A space invite becomes active only after the recipient accepts it.</p>
          </div>
          <Input theme="light" labelClassName="text-slate-200" label="User email" value={spaceMemberForm.email} onChange={(event) => setSpaceMemberForm((current) => ({ ...current, email: event.target.value }))} />
          <Select theme="light" labelClassName="text-slate-200" label="Role on accept" value={spaceMemberForm.role} disabled={!canManageSpaceMembers} onChange={(event) => setSpaceMemberForm((current) => ({ ...current, role: event.target.value as SpaceRole }))}>
            {spaceRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating || !selectedSpaceId || !canManageSpaceMembers} onClick={() => withMutation(async () => {
            await adminApi.createInvite(token, { scopeType: "SPACE", scopeId: selectedSpaceId, email: spaceMemberForm.email, role: spaceMemberForm.role });
            setSpaceMemberForm({ email: "", role: "MEMBER", status: "INVITED" });
            await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
          })}>
            Send space invite
          </Button>
          {spaceInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Pending invites</p>
              {spaceInvites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} canManage={canManageSpaceMembers} onRevoke={(inviteId) => withMutation(async () => {
                  await adminApi.revokeInvite(token, inviteId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })} />
              ))}
            </div>
          ) : null}
          <div className="space-y-3">
            {spaceMembers.length > 0 ? spaceMembers.map((membership) => (
              <MembershipRow
                key={membership.id}
                membership={membership}
                roleOptions={spaceRoleOptions}
                canManage={canManageSpaceMembers}
                onSave={(membershipId, role, status) => withMutation(async () => {
                  await adminApi.updateSpaceMember(token, selectedSpaceId, membershipId, { role: role as SpaceRole, status });
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
                onRemove={(membershipId) => withMutation(async () => {
                  await adminApi.removeSpaceMember(token, selectedSpaceId, membershipId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
              />
            )) : <EmptyState title="No active space members" description="Send an invite first. Accepted invites turn into active space memberships here." />}
          </div>
        </Card>
        <Card className="space-y-4">
          <div>
            <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Project members</p>
            <h3 className="mt-2 text-xl font-semibold text-white">Invite delivery roles into {selectedProject?.name ?? "the selected project"}</h3>
            <p className="mt-2 text-sm text-slate-300">Project access is invite-first. The user becomes active only after accepting the invite.</p>
          </div>
          <Input theme="light" labelClassName="text-slate-200" label="User email" value={projectMemberForm.email} onChange={(event) => setProjectMemberForm((current) => ({ ...current, email: event.target.value }))} />
          <Select theme="light" labelClassName="text-slate-200" label="Role on accept" value={projectMemberForm.role} disabled={!canManageProjectMembers} onChange={(event) => setProjectMemberForm((current) => ({ ...current, role: event.target.value as ProjectRole }))}>
            {projectRoleOptions.map((role) => <option key={role} value={role}>{role}</option>)}
          </Select>
          <Button className="bg-[linear-gradient(135deg,#7f8cff_0%,#63ddcf_100%)] text-[#07111f] shadow-[0_14px_30px_rgba(99,221,207,0.22)] hover:brightness-105" disabled={isMutating || !selectedProjectId || !canManageProjectMembers} onClick={() => withMutation(async () => {
            await adminApi.createInvite(token, { scopeType: "PROJECT", scopeId: selectedProjectId, email: projectMemberForm.email, role: projectMemberForm.role });
            setProjectMemberForm({ email: "", role: "MEMBER", status: "INVITED" });
            await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
          })}>
            Send project invite
          </Button>
          {projectInvites.length > 0 ? (
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-[0.16em] text-slate-300">Pending invites</p>
              {projectInvites.map((invite) => (
                <InviteRow key={invite.id} invite={invite} canManage={canManageProjectMembers} onRevoke={(inviteId) => withMutation(async () => {
                  await adminApi.revokeInvite(token, inviteId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })} />
              ))}
            </div>
          ) : null}
          <div className="space-y-3">
            {projectMembers.length > 0 ? projectMembers.map((membership) => (
              <MembershipRow
                key={membership.id}
                membership={membership}
                roleOptions={projectRoleOptions}
                canManage={canManageProjectMembers}
                onSave={(membershipId, role, status) => withMutation(async () => {
                  await adminApi.updateProjectMember(token, selectedProjectId, membershipId, { role: role as ProjectRole, status });
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
                onRemove={(membershipId) => withMutation(async () => {
                  await adminApi.removeProjectMember(token, selectedProjectId, membershipId);
                  await refreshAll(selectedWorkspaceId, selectedSpaceId, selectedProjectId);
                })}
              />
            )) : <EmptyState title="No active project members" description="Send an invite first. Accepted invites become active project memberships here." />}
          </div>
        </Card>
    </div>
    </div>
  );
}












