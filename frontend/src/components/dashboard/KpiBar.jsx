import {
  AlertTriangle, AlertCircle, Users, FileText,
  FileMinus2, Activity, BarChart3
} from 'lucide-react';

// ─── KpiBar ───────────────────────────────────────────────────────────────────
// Six KPI summary cards rendered across the top of the dashboard.
// Props:
//   data    — dashboard summary object (from useDashboardSummary)
//   loading — bool

function kpiCards(data) {
  const risk = data?.overall_risk_score ?? 0;
  const riskColor =
    risk >= 80 ? 'text-red-400' :
    risk >= 60 ? 'text-amber-400' :
                 'text-emerald-400';
  const riskFlash = risk >= 80 ? 'flash-critical' : risk >= 60 ? 'flash-warn' : '';

  const alerts   = data?.active_alerts   ?? 0;
  const critical = data?.critical_alerts ?? 0;
  const permits  = data?.active_permits  ?? 0;
  const workers  = data?.workers_on_site ?? 0;
  const conflict = data?.conflict_permits ?? 0;

  return [
    {
      label:      'Overall Risk Score',
      value:      risk.toFixed(1),
      unit:       '/100',
      color:      riskColor,
      flash:      riskFlash,
      Icon:       BarChart3,
      iconColor:  riskColor,
    },
    {
      label:      'Active Alerts',
      value:      alerts,
      unit:       null,
      color:      alerts > 0 ? 'text-amber-400' : 'text-emerald-400',
      flash:      '',
      Icon:       AlertCircle,
      iconColor:  alerts > 0 ? 'text-amber-500' : 'text-emerald-500',
    },
    {
      label:      'Critical Alerts',
      value:      critical,
      unit:       null,
      color:      critical > 0 ? 'text-red-400' : 'text-emerald-400',
      flash:      critical > 0 ? 'flash-critical' : '',
      Icon:       AlertTriangle,
      iconColor:  critical > 0 ? 'text-red-500' : 'text-emerald-500',
    },
    {
      label:      'Workers On Site',
      value:      workers,
      unit:       null,
      color:      'text-slate-100',
      flash:      '',
      Icon:       Users,
      iconColor:  'text-slate-400',
    },
    {
      label:      'Active Permits',
      value:      permits,
      unit:       null,
      color:      'text-slate-100',
      flash:      '',
      Icon:       FileText,
      iconColor:  'text-slate-400',
    },
    {
      label:      'Conflict Permits',
      value:      conflict,
      unit:       null,
      color:      conflict > 0 ? 'text-amber-400' : 'text-emerald-400',
      flash:      '',
      Icon:       FileMinus2,
      iconColor:  conflict > 0 ? 'text-amber-500' : 'text-emerald-500',
    },
  ];
}

// ── Skeleton card ──────────────────────────────────────────────────────────────
function KpiSkeleton() {
  return (
    <div className="animate-pulse bg-slate-900 border border-slate-800 rounded-sm h-24 p-4 flex flex-col gap-2">
      <div className="flex justify-between items-start">
        <div className="h-2 w-24 bg-slate-800 rounded-sm" />
        <div className="h-4 w-4 bg-slate-800 rounded-sm" />
      </div>
      <div className="h-7 w-16 bg-slate-800 rounded-sm mt-1" />
    </div>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, unit, color, flash, Icon, iconColor }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 flex flex-col gap-1 relative">
      {/* Icon top-right */}
      <div className={`absolute top-3 right-3 ${iconColor}`}>
        <Icon size={16} />
      </div>

      {/* Label */}
      <span className="text-xs uppercase tracking-wider text-slate-400 font-sans pr-5">
        {label}
      </span>

      {/* Value */}
      <div className={`flex items-baseline gap-1 mt-1 ${flash}`}>
        <span className={`font-mono font-semibold text-2xl leading-none ${color}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs text-slate-500">{unit}</span>
        )}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function KpiBar({ data, loading }) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => <KpiSkeleton key={i} />)}
      </div>
    );
  }

  const cards = kpiCards(data);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
      {cards.map((card) => (
        <KpiCard key={card.label} {...card} />
      ))}
    </div>
  );
}
