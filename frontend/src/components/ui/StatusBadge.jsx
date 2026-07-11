// ─── StatusBadge ──────────────────────────────────────────────────────────────
// Inline pill badge mapping status strings to design-system color classes.
// Props:
//   status  — string (e.g. 'critical', 'warning', 'normal', 'active', …)
//   size    — 'sm' | 'md' (default 'sm')
//   label   — optional label override (defaults to status text)

const STATUS_MAP = {
  // Danger tier
  critical:    'bg-red-950 text-red-400 border border-red-800',
  red:         'bg-red-950 text-red-400 border border-red-800',

  // High / orange tier
  high:        'bg-orange-950 text-orange-400 border border-orange-800',
  orange:      'bg-orange-950 text-orange-400 border border-orange-800',

  // Warning tier
  warning:     'bg-amber-950 text-amber-400 border border-amber-800',
  warn:        'bg-amber-950 text-amber-400 border border-amber-800',
  amber:       'bg-amber-950 text-amber-400 border border-amber-800',
  yellow:      'bg-amber-950 text-amber-400 border border-amber-800',

  // Safe / normal tier
  normal:      'bg-emerald-950 text-emerald-400 border border-emerald-800',
  safe:        'bg-emerald-950 text-emerald-400 border border-emerald-800',
  green:       'bg-emerald-950 text-emerald-400 border border-emerald-800',
  compliant:   'bg-emerald-950 text-emerald-400 border border-emerald-800',

  // Active / info
  active:      'bg-blue-950 text-blue-400 border border-blue-800',

  // Acknowledged
  acknowledged: 'bg-slate-800 text-slate-400 border border-slate-700',

  // Resolved
  resolved:    'bg-slate-900 text-slate-500 border border-slate-800',
};

const SIZE_MAP = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-3 py-1 text-xs',
};

export default function StatusBadge({ status = '', size = 'sm', label }) {
  const key      = (status || '').toLowerCase();
  const classes  = STATUS_MAP[key] ?? 'bg-slate-800 text-slate-400 border border-slate-700';
  const sizeClasses = SIZE_MAP[size] ?? SIZE_MAP.sm;
  const displayLabel = label ?? status;

  return (
    <span
      className={`inline-flex items-center rounded-sm font-medium uppercase tracking-wide ${sizeClasses} ${classes}`}
    >
      {displayLabel}
    </span>
  );
}
