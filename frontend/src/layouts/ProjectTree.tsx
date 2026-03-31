import { Link } from 'react-router-dom';
import type { Project, Space } from '../features/admin/types';
import { cn } from '../lib/cn';
import { SidebarGlyph } from './SidebarNavItem';
import { SidebarSection } from './SidebarSection';

type ProjectTreeProps = {
  collapsed: boolean;
  spaces: Space[];
  projects: Project[];
  activeProjectIds: string[];
  taskCountByProject: Map<string, number>;
  onSelectProject: (spaceId: string, projectId: string) => void;
};

const projectPalette = ['#8f9cff', '#6ee9d8', '#ffd36f', '#f39fe1', '#8ff0b5', '#7dd3fc'];

export function ProjectTree({
  collapsed,
  spaces,
  projects,
  activeProjectIds,
  taskCountByProject,
  onSelectProject
}: ProjectTreeProps) {
  const groupedSpaces = spaces
    .map((space) => ({
      space,
      projects: projects.filter((project) => project.spaceId === space.id).slice(0, 4)
    }))
    .filter((entry) => entry.projects.length > 0);

  if (groupedSpaces.length === 0) {
    return null;
  }

  if (collapsed) {
    return (
      <SidebarSection title="Projects" collapsed>
        <div className="space-y-2">
          {groupedSpaces.flatMap((entry) => entry.projects).slice(0, 6).map((project, index) => {
            const active = activeProjectIds.includes(project.id);
            return (
              <button
                key={project.id}
                type="button"
                title={`${project.name} (${project.key})`}
                onClick={() => onSelectProject(project.spaceId, project.id)}
                className={cn(
                  'flex w-full items-center justify-center rounded-[1.15rem] border p-3 transition',
                  active
                    ? 'border-white/14 bg-white/[0.1] shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
                    : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                )}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: projectPalette[index % projectPalette.length] }} />
              </button>
            );
          })}
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection eyebrow="Projects" title="Workspace projects">
      <div className="space-y-4">
        {groupedSpaces.map(({ space, projects: spaceProjects }) => (
          <div key={space.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.03] p-3">
            <div className="flex items-center gap-2 text-slate-200">
              <span className="inline-flex rounded-xl border border-white/10 bg-white/[0.05] p-2">
                <SidebarGlyph name="folder" className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{space.name}</p>
                <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{space.key}</p>
              </div>
            </div>

            <div className="mt-3 space-y-2">
              {spaceProjects.map((project, index) => {
                const active = activeProjectIds.includes(project.id);
                return (
                  <button
                    key={project.id}
                    type="button"
                    onClick={() => onSelectProject(space.id, project.id)}
                    className={cn(
                      'flex w-full items-start gap-3 rounded-[1rem] border px-3 py-3 text-left transition',
                      active
                        ? 'border-white/14 bg-white/[0.1]'
                        : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                    )}
                  >
                    <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: projectPalette[index % projectPalette.length] }} />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-3">
                        <span className="truncate text-sm font-semibold text-white">{project.name}</span>
                        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[0.68rem] font-semibold text-slate-200">
                          {taskCountByProject.get(project.id) ?? 0}
                        </span>
                      </span>
                      <span className="mt-1 block text-xs leading-5 text-slate-400">
                        {project.key} · {project.description || 'Board, backlog, members, settings.'}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              <Link to="/projects?view=board" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/[0.08]">Board</Link>
              <Link to="/projects?view=backlog" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/[0.08]">Backlog</Link>
              <Link to="/projects?view=members" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/[0.08]">Members</Link>
              <Link to="/projects?view=settings" className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-slate-200 transition hover:bg-white/[0.08]">Settings</Link>
            </div>
          </div>
        ))}
      </div>
    </SidebarSection>
  );
}

