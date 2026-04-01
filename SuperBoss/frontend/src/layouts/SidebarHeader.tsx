import { Button } from '../components/ui/Button';
import { LogoMark } from '../features/auth/components/LogoMark';
import { SidebarGlyph } from './SidebarNavItem';

type SidebarHeaderProps = {
  collapsed: boolean;
  onToggle: () => void;
};

export function SidebarHeader({ collapsed, onToggle }: SidebarHeaderProps) {
  return (
    <div className="surface-panel-raised rounded-[1.6rem] p-4">
      <div className={`flex items-start ${collapsed ? 'justify-center' : 'justify-between gap-3'}`}>
        {!collapsed ? <LogoMark className="w-full justify-start" /> : <LogoMark compact className="justify-center bg-white/[0.06]" />}
        <Button
          variant="ghost"
          type="button"
          onClick={onToggle}
          className={`${collapsed ? 'hidden' : 'h-11 w-11 shrink-0 rounded-[1rem] border border-white/10 bg-white/[0.05] px-0'}`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <SidebarGlyph name="collapse" className="h-4 w-4" />
        </Button>
      </div>

      {collapsed ? (
        <button
          type="button"
          onClick={onToggle}
          className="mt-4 inline-flex h-11 w-full items-center justify-center rounded-[1rem] border border-white/10 bg-white/[0.05] text-slate-200 transition hover:bg-white/[0.1]"
          aria-label="Expand sidebar"
          title="Expand sidebar"
        >
          <SidebarGlyph name="expand" className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}

