import { NavLink } from 'react-router-dom';
import {
  Shield,
  LayoutDashboard,
  SearchCode,
  FileCheck2,
  GitFork,
  FolderOpen,
  BellRing,
  Settings2,
} from 'lucide-react';
import { useStore } from '../../lib/store';
import ConnectionBadge from './ConnectionBadge';

// ─── Nav route definitions ────────────────────────────────────────────────────
const NAV_ITEMS = [
  { to: '/dashboard',    icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/investigation', icon: SearchCode,     label: 'Investigation' },
  { to: '/permits',      icon: FileCheck2,      label: 'Permits',        badge: 'permits' },
  { to: '/graph',        icon: GitFork,         label: 'Knowledge Graph' },
  { to: '/documents',    icon: FolderOpen,      label: 'Documents' },
  { to: '/alerts',       icon: BellRing,        label: 'Alerts',         badge: 'alerts' },
  { to: '/settings',     icon: Settings2,       label: 'Settings' },
];

// ─── Sidebar ──────────────────────────────────────────────────────────────────
export default function Sidebar() {
  const liveAlerts = useStore((s) => s.liveAlerts);
  const zones      = useStore((s) => s.zones);

  // Permit conflict count — zones that have more than 1 active permit
  const conflictCount = zones.filter((z) => z.active_permits > 1).length;
  // Alert count — unresolved live alerts
  const alertCount = liveAlerts.filter((a) => a.status !== 'resolved').length;

  const getBadge = (key) => {
    if (key === 'alerts'  && alertCount   > 0) return alertCount;
    if (key === 'permits' && conflictCount > 0) return conflictCount;
    return null;
  };

  return (
    <aside className="w-64 flex-shrink-0 h-full bg-slate-900 border-r border-slate-800 flex flex-col">
      {/* ── Logo area ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-slate-800">
          <Shield className="h-5 w-5 text-sky-400" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-100 tracking-tight">
            SafetyNexus AI
          </span>
          <span className="text-xs text-slate-500 font-mono">IntelliPlant</span>
        </div>
      </div>

      {/* ── Navigation links ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-0.5">
        {NAV_ITEMS.map(({ to, icon: Icon, label, badge }) => {
          const badgeCount = badge ? getBadge(badge) : null;
          const isAlerts   = badge === 'alerts';

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between gap-3 rounded-sm px-3 py-2 text-sm transition-colors duration-150',
                  isActive
                    ? 'bg-slate-800 border-l-2 border-sky-500 text-slate-100 pl-[10px]'
                    : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border-l-2 border-transparent pl-[10px]',
                ].join(' ')
              }
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{label}</span>
              </span>

              {/* Badge */}
              {badgeCount !== null && (
                <span
                  className={[
                    'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-[10px] font-mono font-bold',
                    isAlerts
                      ? 'bg-red-600 text-white'
                      : 'bg-amber-600 text-white',
                  ].join(' ')}
                >
                  {badgeCount}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Bottom: connection status ──────────────────────────────────────── */}
      <div className="border-t border-slate-800 px-4 py-3">
        <ConnectionBadge />
      </div>
    </aside>
  );
}
