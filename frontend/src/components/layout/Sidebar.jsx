import { NavLink } from 'react-router-dom';
import { useStore } from '../../lib/store';

const NAV_ITEMS = [
  { to: '/dashboard',    icon: 'dashboard',   label: 'DASHBOARD' },
  { to: '/alerts',       icon: 'bia',         label: 'TELEMETRY', badge: 'alerts' },
  { to: '/permits',      icon: 'map',         label: 'ZONES',     badge: 'permits' },
  { to: '/investigation', icon: 'warning',     label: 'INCIDENTS' },
  { to: '/graph',        icon: 'query_stats', label: 'ANALYTICS' },
];

export default function Sidebar() {
  const liveAlerts = useStore((s) => s.liveAlerts);
  const zones      = useStore((s) => s.zones);

  const conflictCount = zones.filter((z) => z.active_permits > 1).length;
  const alertCount = liveAlerts.filter((a) => a.status !== 'resolved').length;

  const getBadge = (key) => {
    if (key === 'alerts'  && alertCount   > 0) return alertCount;
    if (key === 'permits' && conflictCount > 0) return conflictCount;
    return null;
  };

  const handleEmergencyStop = () => {
    alert("CRITICAL ALARM: Emergency Stop Initiated. Evacuating all active zones.");
  };

  const openModal = useStore((s) => s.openModal);

  return (
    <aside className="fixed left-0 top-16 h-[calc(100vh-64px)] w-64 bg-surface-container-low border-r border-outline-variant flex flex-col py-4 gap-2 hidden md:flex z-40">
      <div className="px-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-outline-variant rounded-sm flex items-center justify-center overflow-hidden">
            <img className="w-full h-full object-cover" alt="Safety Director" src="https://lh3.googleusercontent.com/aida-public/AB6AXuC00pfhjXLx7ccmJbZFFfiEJxj6NnMtBPLRhHSkgsQuK7sn_n7o4kLd0OVhDe-G8QwXL31adhoIg5h_oqIiXLuKiZRHcIqYrPXdGMJLwqX1PhYb8W7Q1H6qe_nhTq6p6jBwWoM8fWtxBadcdFA2HRc5tY7u0X84Vl5-TCod0hBK8-OyrGKbcFDByRknlgEZwSSSIMMrMGbpK94QOfu5oDSRhtHAgLuA_Nwf7gwIFrzNVURMo6RgGvcv5g"/>
          </div>
          <div>
            <p className="font-display text-lg font-bold text-primary leading-none">Command Center</p>
            <p className="font-mono text-[10px] text-on-surface-variant uppercase tracking-tighter mt-1">Coke Oven Battery Alpha - Active</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 space-y-1">
        {NAV_ITEMS.map(({ to, icon, label, badge }) => {
          const badgeCount = badge ? getBadge(badge) : null;
          const isAlerts   = badge === 'alerts';

          return (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  'flex items-center justify-between px-6 py-3 font-mono text-sm uppercase transition-all',
                  isActive
                    ? 'bg-secondary-container text-on-secondary-container border-l-4 border-primary active:translate-x-1 font-bold'
                    : 'text-on-surface-variant hover:bg-surface-container-high group',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <span className="flex items-center gap-3">
                    <span 
                      className="material-symbols-outlined text-xl" 
                      style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
                    >
                      {icon}
                    </span>
                    <span>{label}</span>
                  </span>

                  {badgeCount !== null && (
                    <span
                      className={[
                        'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-sm text-[10px] font-mono font-bold',
                        isAlerts
                          ? 'bg-error text-on-error'
                          : 'bg-tertiary text-on-tertiary',
                      ].join(' ')}
                    >
                      {badgeCount}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
      <div className="mt-auto px-4 space-y-1">
        <button 
          onClick={() => openModal('drone')}
          className="w-full bg-primary/10 text-primary py-2 px-4 font-mono text-[10px] uppercase font-bold tracking-widest border border-primary/30 flex items-center justify-center gap-2 mb-4 hover:bg-primary/20 transition-colors animate-pulse"
        >
          <span className="material-symbols-outlined text-sm">flight</span> DRONE FEED
        </button>
        <button 
          onClick={() => openModal('emergency')}
          className="w-full bg-error-container text-on-error-container py-3 px-4 font-mono text-xs uppercase font-bold tracking-widest border border-error/20 flex items-center justify-center gap-2 mb-4 hover:bg-error hover:text-on-error transition-colors"
        >
          <span className="material-symbols-outlined text-lg">emergency_home</span> Emergency Stop
        </button>
        <NavLink to="/documents" className="flex items-center gap-3 px-2 py-2 text-on-surface-variant font-mono text-xs uppercase hover:bg-surface-container-high transition-colors">
          <span className="material-symbols-outlined text-lg">help</span> SUPPORT
        </NavLink>
        <button onClick={() => openModal('logs')} className="w-full flex items-center gap-3 px-2 py-2 text-on-surface-variant font-mono text-xs uppercase hover:bg-surface-container-high transition-colors text-left">
          <span className="material-symbols-outlined text-lg">history</span> LOGS
        </button>
      </div>
    </aside>
  );
}
