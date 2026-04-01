import { adminApi } from '../../admin/api/adminApi';
import type { Project, ProjectMembership, Space, Workspace } from '../../admin/types';
import { projectsApi, type ApiTask } from '../../projects/api/projectsApi';
import { createScopedRequestCache } from '../../../services/requestCache';

export type VisibleWorkGraph = {
  workspaces: Workspace[];
  spaces: Space[];
  projects: Project[];
  tasks: ApiTask[];
  projectMemberships: ProjectMembership[];
};

const visibleWorkGraphCache = createScopedRequestCache('visible-work-graph');

export async function loadVisibleWorkGraph(token: string, options?: { includeProjectMemberships?: boolean }) {
  const includeProjectMemberships = options?.includeProjectMemberships ?? false;
  return visibleWorkGraphCache.read(
    `${token}:${includeProjectMemberships ? 'with-memberships' : 'base'}`,
    async () => {
      const workspaceResponse = await adminApi.listWorkspaces(token);
      const workspaces = workspaceResponse.items;

      const nested = await Promise.all(
        workspaces.map(async (workspace) => {
          const spacesResponse = await adminApi.listSpaces(token, workspace.id);
          const spaces = spacesResponse.items.filter((item) => item.isActive);

          const perSpace = await Promise.all(
            spaces.map(async (space) => {
              const projectsResponse = await adminApi.listProjects(token, workspace.id, space.id);
              const projects = projectsResponse.items.filter((item) => !item.isArchived);

              const taskAndMembershipGroups = await Promise.all(
                projects.map(async (project) => {
                  const tasksPromise = projectsApi.listTasks(token, project.id);
                  const membersPromise = includeProjectMemberships
                    ? adminApi.listProjectMembers(token, project.id)
                    : Promise.resolve({ items: [] as ProjectMembership[] });
                  const [tasksResponse, membersResponse] = await Promise.all([tasksPromise, membersPromise]);

                  return {
                    project,
                    tasks: tasksResponse.items,
                    memberships: membersResponse.items
                  };
                })
              );

              return {
                space,
                projects,
                tasks: taskAndMembershipGroups.flatMap((item) => item.tasks),
                memberships: taskAndMembershipGroups.flatMap((item) => item.memberships)
              };
            })
          );

          return {
            workspace,
            spaces,
            projects: perSpace.flatMap((item) => item.projects),
            tasks: perSpace.flatMap((item) => item.tasks),
            memberships: perSpace.flatMap((item) => item.memberships)
          };
        })
      );

      return {
        workspaces,
        spaces: nested.flatMap((item) => item.spaces),
        projects: nested.flatMap((item) => item.projects),
        tasks: nested.flatMap((item) => item.tasks),
        projectMemberships: nested.flatMap((item) => item.memberships)
      } satisfies VisibleWorkGraph;
    },
    20_000
  );
}
