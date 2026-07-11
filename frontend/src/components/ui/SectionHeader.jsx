// ─── SectionHeader ────────────────────────────────────────────────────────────
// Consistent section title row used above panels and card groups.
// Props:
//   title    — string (required)
//   subtitle — string (optional)
//   icon     — Lucide component (optional, rendered at 16px)
//   action   — ReactNode (optional, rendered right-aligned)

export default function SectionHeader({ title, subtitle, icon: Icon, action }) {
  return (
    <div className="flex items-center justify-between mb-3">
      {/* ── Left: icon + title + subtitle ──────────────────────────────── */}
      <div className="flex items-center gap-2">
        {Icon && (
          <Icon className="h-4 w-4 text-slate-400 flex-shrink-0" />
        )}
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold text-slate-200">
            {title}
          </span>
          {subtitle && (
            <span className="text-xs text-slate-400">{subtitle}</span>
          )}
        </div>
      </div>

      {/* ── Right: action slot ──────────────────────────────────────────── */}
      {action && (
        <div className="flex items-center gap-2">
          {action}
        </div>
      )}
    </div>
  );
}
