import { NavLink, type To } from 'react-router-dom';
import { cn } from '../lib/cn';

export type SidebarIconName =
  | 'dashboard'
  | 'projects'
  | 'control'
  | 'notifications'
  | 'profile'
  | 'calendar'
  | 'workspace'
  | 'collapse'
  | 'expand'
  | 'assigned'
  | 'today'
  | 'overdue'
  | 'completed'
  | 'important'
  | 'pin'
  | 'folder'
  | 'settings';

export function SidebarGlyph({ name, className = 'h-4 w-4' }: { name: SidebarIconName; className?: string }) {
  switch (name) {
    case 'dashboard':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M4 4h7v7H4zM13 4h7v4h-7zM13 10h7v10h-7zM4 13h7v7H4z" /></svg>;
    case 'projects':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="4" y="5" width="16" height="14" rx="2.5" /><path d="M9 9h6M9 13h8M9 17h4M6.5 9h.01M6.5 13h.01M6.5 17h.01" /></svg>;
    case 'control':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /><circle cx="12" cy="12" r="3.5" /></svg>;
    case 'notifications':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M15 18H9" /><path d="M18 16.5H6c1.1-1.2 2-2.7 2-6a4 4 0 1 1 8 0c0 3.3.9 4.8 2 6Z" /></svg>;
    case 'profile':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>;
    case 'calendar':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16M8 14h3M8 18h3M14 14h2M14 18h2" /></svg>;
    case 'workspace':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="3.5" y="5" width="17" height="13" rx="2.5" /><path d="M8 9h8M8 13h5" /></svg>;
    case 'collapse':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M15 6 9 12l6 6" /></svg>;
    case 'expand':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="m9 6 6 6-6 6" /></svg>;
    case 'assigned':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M8 7.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" /><path d="M2.5 19a6.5 6.5 0 0 1 11 0M16 8h5M16 12h5M16 16h5" /></svg>;
    case 'today':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><rect x="4" y="5" width="16" height="15" rx="2.5" /><path d="M8 3v4M16 3v4M4 10h16M12 14h.01" /></svg>;
    case 'overdue':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><circle cx="12" cy="12" r="8" /><path d="M12 8v5l3 2M12 4v1M20 12h-1" /></svg>;
    case 'completed':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="m5 12 4.2 4.2L19 6.5" /></svg>;
    case 'important':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2L12 17.3 6.4 20.3l1.1-6.2L3 9.7l6.2-.9L12 3Z" /></svg>;
    case 'pin':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="m15 4 5 5-3 1-4 4 1.5 5.5L12 22l-2.5-2.5L15 13l1-3-5-5 4-1Z" /></svg>;
    case 'folder':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M3.5 7.5A2.5 2.5 0 0 1 6 5h4l2 2h6A2.5 2.5 0 0 1 20.5 9.5v7A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5v-9Z" /></svg>;
    case 'settings':
      return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className={className}><path d="M12 3v3M12 18v3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M3 12h3M18 12h3M4.9 19.1 7 17M17 7l2.1-2.1" /><circle cx="12" cy="12" r="3.5" /></svg>;
    default:
      return null;
  }
}

type SidebarNavItemProps = {
  to: To;
  label: string;
  description?: string;
  icon: SidebarIconName;
  badge?: string | number;
  collapsed?: boolean;
  title?: string;
  end?: boolean;
};

export function SidebarNavItem({ to, label, description, icon, badge, collapsed = false, title, end }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      title={title ?? label}
      className={({ isActive }) =>
        cn(
          'group relative flex items-center gap-3 rounded-[1.15rem] border px-3 py-3 transition',
          collapsed ? 'justify-center px-0' : '',
          isActive
            ? 'border-white/14 bg-white/[0.1] text-white shadow-[0_12px_28px_rgba(0,0,0,0.18)]'
            : 'border-transparent bg-white/[0.03] text-slate-300 hover:border-white/10 hover:bg-white/[0.06] hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span
            className={cn(
              'inline-flex shrink-0 items-center justify-center rounded-xl border p-2.5 transition',
              isActive
                ? 'border-[#8f9cff]/24 bg-[linear-gradient(135deg,rgba(143,156,255,0.18)_0%,rgba(110,233,216,0.14)_100%)] text-white'
                : 'border-white/10 bg-white/[0.05] text-slate-200 group-hover:border-white/16'
            )}
          >
            <SidebarGlyph name={icon} />
          </span>

          {!collapsed ? (
            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-semibold">{label}</span>
                {badge !== undefined ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 text-[0.68rem] font-semibold text-slate-200">
                    {badge}
                  </span>
                ) : null}
              </span>
              {description ? <span className="mt-1 block text-xs leading-5 text-slate-400 group-hover:text-slate-300">{description}</span> : null}
            </span>
          ) : null}

          {isActive && !collapsed ? <span className="pointer-events-none absolute inset-y-3 left-0 w-[3px] rounded-r-full bg-[linear-gradient(180deg,#8f9cff_0%,#6ee9d8_100%)]" /> : null}
        </>
      )}
    </NavLink>
  );
}
