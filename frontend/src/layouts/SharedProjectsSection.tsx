import { cn } from '../lib/cn';
import { SidebarSection } from './SidebarSection';

type SharedProjectItem = {
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
};

type SharedProjectsSectionProps = {
  collapsed: boolean;
  projects: SharedProjectItem[];
  activeProjectIds: string[];
  onSelectProject: (workspaceId: string, spaceId: string, projectId: string) => void;
};

const sharedPalette = ['#8f9cff', '#6ee9d8', '#ffd36f', '#f39fe1'];

export function SharedProjectsSection({ collapsed, projects, activeProjectIds, onSelectProject }: SharedProjectsSectionProps) {
  const visibleProjects = projects
    .filter((project) => !project.createdByCurrentUser)
    .sort((left, right) => {
      const leftAcceptedAt = left.acceptedAt ?? 0;
      const rightAcceptedAt = right.acceptedAt ?? 0;
      if (leftAcceptedAt != rightAcceptedAt) {
        return rightAcceptedAt - leftAcceptedAt;
      }
      return left.name.localeCompare(right.name);
    });

  if (collapsed) {
    return (
      <SidebarSection title="Shared" collapsed>
        <div className="space-y-2">
          {visibleProjects.slice(0, 6).map((project, index) => {
            const active = activeProjectIds.includes(project.id);
            return (
              <button
                key={project.id}
                type="button"
                title={`${project.name} (${project.spaceName} / ${project.workspaceName})`}
                onClick={() => onSelectProject(project.workspaceId, project.spaceId, project.id)}
                className={cn(
                  'relative flex w-full items-center justify-center rounded-[1.15rem] border p-3 transition',
                  active
                    ? 'border-white/14 bg-white/[0.1] shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
                    : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
                )}
              >
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: sharedPalette[index % sharedPalette.length] }} />
                {project.isNew ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[#8f9cff]" /> : null}
              </button>
            );
          })}
          {visibleProjects.length === 0 ? <div className="rounded-[1rem] border border-dashed border-white/10 bg-white/[0.03] px-3 py-4 text-center text-[0.7rem] uppercase tracking-[0.16em] text-slate-500">0</div> : null}
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection eyebrow="Shared" title="Shared with you">
      <div className="space-y-2">
        {visibleProjects.length === 0 ? (
          <div className="rounded-[1.05rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm leading-6 text-slate-400">
            Accepted projects from teammates will stay here so you can jump back in without reopening invites.
          </div>
        ) : null}
        {visibleProjects.slice(0, 6).map((project, index) => {
          const active = activeProjectIds.includes(project.id);
          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.workspaceId, project.spaceId, project.id)}
              className={cn(
                'flex w-full items-start gap-3 rounded-[1.05rem] border px-3 py-3 text-left transition',
                active
                  ? 'border-white/14 bg-white/[0.1]'
                  : 'border-transparent bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.06]'
              )}
            >
              <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: sharedPalette[index % sharedPalette.length] }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate text-sm font-semibold text-white">{project.name}</span>
                  <span className={cn(
                    'rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold uppercase tracking-[0.12em]',
                    project.isNew
                      ? 'border-[#8f9cff]/30 bg-[#8f9cff]/16 text-[#dbe2ff]'
                      : 'border-white/10 bg-white/[0.05] text-slate-200'
                  )}>
                    {project.isNew ? 'New' : 'Shared'}
                  </span>
                </span>
                <span className="mt-1 block text-xs leading-5 text-slate-400">
                  {project.workspaceName} / {project.spaceName}
                </span>
                <span className="mt-0.5 block text-[0.72rem] uppercase tracking-[0.14em] text-slate-500">
                  {project.key}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </SidebarSection>
  );
}
