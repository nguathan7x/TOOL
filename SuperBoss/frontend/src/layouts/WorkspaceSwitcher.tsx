import { Select } from '../components/ui/Select';
import type { Workspace } from '../features/admin/types';
import { SidebarSection } from './SidebarSection';
import { SidebarGlyph } from './SidebarNavItem';

type WorkspaceSwitcherProps = {
  collapsed: boolean;
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  onSelect: (workspaceId: string | null) => void;
};

export function WorkspaceSwitcher({
  collapsed,
  workspaces,
  selectedWorkspace,
  onSelect
}: WorkspaceSwitcherProps) {
  if (collapsed) {
    return (
      <SidebarSection title="Workspace" collapsed>
        <button
          type="button"
          title={selectedWorkspace?.name ?? 'No workspace selected'}
          className="flex w-full items-center justify-center rounded-[1.2rem] border border-white/10 bg-white/[0.05] p-3 text-slate-100 transition hover:bg-white/[0.08]"
        >
          <SidebarGlyph name="workspace" className="h-5 w-5" />
        </button>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection eyebrow="Workspace" title="Current scope">
      {workspaces.length > 1 ? (
        <Select
          value={selectedWorkspace?.id ?? ''}
          onChange={(event) => onSelect(event.target.value || null)}
          className="bg-white/[0.06]"
        >
          {workspaces.map((workspace) => (
            <option key={workspace.id} value={workspace.id}>
              {workspace.name}
            </option>
          ))}
        </Select>
      ) : (
        <div className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] px-4 py-3">
          <p className="text-base font-semibold text-white">{selectedWorkspace?.name ?? 'No workspace yet'}</p>
        </div>
      )}

    </SidebarSection>
  );
}

