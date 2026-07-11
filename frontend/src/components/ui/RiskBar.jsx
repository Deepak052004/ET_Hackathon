// ─── RiskBar ──────────────────────────────────────────────────────────────────
// Horizontal progress bar for risk/score values, colored by severity.

export default function RiskBar({ value = 0, max = 100, color, className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));

  const barColor =
    color ??
    (pct >= 80 ? 'bg-red-500' :
     pct >= 60 ? 'bg-amber-500' :
     pct >= 40 ? 'bg-amber-400' :
                 'bg-emerald-500');

  return (
    <div className={`h-1.5 w-full bg-slate-800 rounded-sm overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-sm transition-all duration-500 ${barColor}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}
