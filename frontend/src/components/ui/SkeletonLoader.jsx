// ─── SkeletonLoader ───────────────────────────────────────────────────────────
// Base block and named composites for consistent skeleton loading states.
// All use animate-pulse bg-slate-800 rounded-sm — the design system standard.

// ── Base skeleton block ───────────────────────────────────────────────────────
export default function SkeletonLoader({ width = '100%', height = '20px', className = '' }) {
  return (
    <div
      className={`animate-pulse bg-slate-800 rounded-sm ${className}`}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

// ── Multiple text lines ────────────────────────────────────────────────────────
// Renders `lines` skeleton rows with a shorter last line to mimic real text.
export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-slate-800 rounded-sm h-3"
          style={{ width: i === lines - 1 ? '65%' : '100%' }}
        />
      ))}
    </div>
  );
}

// ── Card-shaped skeleton ───────────────────────────────────────────────────────
// Matches the KpiCard / panel card proportions.
export function SkeletonCard({ className = '' }) {
  return (
    <div
      className={`animate-pulse bg-slate-900 border border-slate-800 rounded-sm p-4 ${className}`}
      aria-hidden="true"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-24 bg-slate-800 rounded-sm" />
        <div className="h-4 w-4 bg-slate-800 rounded-sm" />
      </div>
      {/* Value */}
      <div className="h-7 w-20 bg-slate-800 rounded-sm mb-3" />
      {/* Subtitle */}
      <div className="h-2.5 w-32 bg-slate-800 rounded-sm" />
    </div>
  );
}

// ── Table row skeleton ─────────────────────────────────────────────────────────
// Simulates a single data table row.
export function SkeletonRow({ cols = 4, className = '' }) {
  return (
    <div
      className={`flex items-center gap-4 py-3 px-4 border-b border-slate-800 ${className}`}
      aria-hidden="true"
    >
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="animate-pulse bg-slate-800 rounded-sm h-3 flex-1"
          style={{ maxWidth: i === 0 ? '80px' : undefined }}
        />
      ))}
    </div>
  );
}
