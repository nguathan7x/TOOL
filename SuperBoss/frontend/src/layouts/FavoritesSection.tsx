import { Link, type To } from 'react-router-dom';
import { SidebarNavItem, type SidebarIconName, SidebarGlyph } from './SidebarNavItem';
import { SidebarSection } from './SidebarSection';

type FavoriteItem = {
  label: string;
  description: string;
  to: To;
  icon: SidebarIconName;
};

type FavoritesSectionProps = {
  collapsed: boolean;
  items: FavoriteItem[];
};

type SidebarFooterProps = {
  collapsed: boolean;
  controlLabel: string;
};

export function FavoritesSection({ collapsed, items }: FavoritesSectionProps) {
  return (
    <SidebarSection eyebrow={collapsed ? undefined : 'Pinned'} title={collapsed ? 'Pinned' : 'Favorites'} collapsed={collapsed}>
      <div className="space-y-2">
        {items.map((item) => (
          <SidebarNavItem
            key={item.label}
            to={item.to}
            label={item.label}
            description={item.description}
            icon={item.icon}
            collapsed={collapsed}
          />
        ))}
      </div>
    </SidebarSection>
  );
}

export function SidebarFooter({ collapsed, controlLabel }: SidebarFooterProps) {
  if (collapsed) {
    return (
      <SidebarSection title="Settings" collapsed>
        <div className="space-y-2">
          <Link title="Profile settings" to="/profile" className="flex items-center justify-center rounded-[1.15rem] border border-transparent bg-white/[0.03] p-3 text-slate-200 transition hover:border-white/10 hover:bg-white/[0.06]">
            <SidebarGlyph name="settings" />
          </Link>
          <Link title={controlLabel} to="/admin" className="flex items-center justify-center rounded-[1.15rem] border border-transparent bg-white/[0.03] p-3 text-slate-200 transition hover:border-white/10 hover:bg-white/[0.06]">
            <SidebarGlyph name="workspace" />
          </Link>
        </div>
      </SidebarSection>
    );
  }

  return (
    <SidebarSection eyebrow="Operations" title="Settings">
      <div className="space-y-2">
        <Link to="/profile" className="flex items-center gap-3 rounded-[1.1rem] border border-transparent bg-white/[0.03] px-3 py-3 text-slate-200 transition hover:border-white/10 hover:bg-white/[0.06]">
          <span className="rounded-xl border border-white/10 bg-white/[0.05] p-2">
            <SidebarGlyph name="settings" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">Profile settings</span>
            <span className="mt-1 block text-xs text-slate-400">Avatar, password, and account details.</span>
          </span>
        </Link>
        <Link to="/admin" className="flex items-center gap-3 rounded-[1.1rem] border border-transparent bg-white/[0.03] px-3 py-3 text-slate-200 transition hover:border-white/10 hover:bg-white/[0.06]">
          <span className="rounded-xl border border-white/10 bg-white/[0.05] p-2">
            <SidebarGlyph name="workspace" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold text-white">{controlLabel}</span>
            <span className="mt-1 block text-xs text-slate-400">Scopes, invites, and access control.</span>
          </span>
        </Link>
      </div>
      <div className="mt-4 rounded-[1.2rem] border border-white/10 bg-[linear-gradient(135deg,rgba(143,156,255,0.12)_0%,rgba(110,233,216,0.08)_100%)] px-4 py-3 text-xs uppercase tracking-[0.16em] text-slate-200">
        Constellation OS · v1.0.0
      </div>
    </SidebarSection>
  );
}

