import { TrendingUp, TrendingDown } from 'lucide-react';
import SkeletonLoader from './SkeletonLoader';

// ─── KpiCard ──────────────────────────────────────────────────────────────────
// Props:
//   label    — string          card label (uppercase, muted)
//   value    — string|number   main displayed value
//   icon     — Lucide component  (rendered at 16px)
//   color    — 'safe'|'warn'|'danger'|'info'|'neutral'
//   trend    — number (optional) positive = up (green), negative = down (red)
//   loading  — bool
//   unit     — string (optional) displayed inline after value

const COLOR_MAP = {
  safe:    { value: 'text-emerald-400', icon: 'text-emerald-500', dot: 'bg-emerald-500' },
  warn:    { value: 'text-amber-400',   icon: 'text-amber-500',   dot: 'bg-amber-500'   },
  danger:  { value: 'text-red-400',     icon: 'text-red-500',     dot: 'bg-red-500'     },
  info:    { value: 'text-sky-400',     icon: 'text-sky-500',     dot: 'bg-sky-500'     },
  neutral: { value: 'text-slate-200',   icon: 'text-slate-400',   dot: 'bg-slate-500'   },
};

export default function KpiCard({
  label   = 'Metric',
  value   = '—',
  icon: Icon,
  color   = 'neutral',
  trend,
  loading = false,
  unit,
}) {
  const theme = COLOR_MAP[color] ?? COLOR_MAP.neutral;

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-4">
        {/* Header row skeleton */}
        <div className="flex items-center justify-between mb-3">
          <SkeletonLoader width="60%" height="10px" />
          <SkeletonLoader width="16px" height="16px" />
        </div>
        {/* Value skeleton */}
        <SkeletonLoader width="40%" height="28px" className="mb-2" />
        {/* Trend skeleton */}
        <SkeletonLoader width="30%" height="10px" />
      </div>
    );
  }

  const hasTrend  = trend !== undefined && trend !== null;
  const trendUp   = hasTrend && trend >= 0;
  const trendAbs  = hasTrend ? Math.abs(trend) : 0;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm p-4 hover:border-slate-700 transition-colors duration-150">
      {/* ── Top row: label + icon ───────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className={`h-4 w-4 ${theme.icon}`} />}
      </div>

      {/* ── Main value ─────────────────────────────────────────────────────── */}
      <div className="flex items-baseline gap-1 mb-1">
        <span className={`font-mono text-2xl font-semibold ${theme.value}`}>
          {value}
        </span>
        {unit && (
          <span className="font-mono text-sm text-slate-500">{unit}</span>
        )}
      </div>

      {/* ── Trend arrow ────────────────────────────────────────────────────── */}
      {hasTrend && (
        <div
          className={`flex items-center gap-1 text-[11px] font-mono ${
            trendUp ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {trendUp ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {trendUp ? '+' : '-'}{trendAbs}%
          </span>
        </div>
      )}
    </div>
  );
}
