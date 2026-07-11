import RecommendationChip from './RecommendationChip'
import ConflictDetails from './ConflictDetails'

// ─── Shared sub-components (inlined to avoid extra files) ─────────────────────

function StatusBadge({ value }) {
  if (!value) return <span className="text-xs text-slate-500">—</span>

  const colorMap = {
    // permit types
    HOT_WORK: 'bg-orange-950 text-orange-400 border-orange-800',
    CONFINED_SPACE: 'bg-blue-950 text-blue-400 border-blue-800',
    ELECTRICAL: 'bg-yellow-950 text-yellow-400 border-yellow-800',
    WORKING_AT_HEIGHT: 'bg-violet-950 text-violet-400 border-violet-800',
    EXCAVATION: 'bg-stone-800 text-stone-400 border-stone-700',
    RADIOGRAPHY: 'bg-red-950 text-red-400 border-red-800',
    CRITICAL_LIFT: 'bg-pink-950 text-pink-400 border-pink-800',
    // statuses
    active: 'bg-emerald-950 text-emerald-400 border-emerald-800',
    suspended: 'bg-red-950 text-red-400 border-red-800',
    expired: 'bg-slate-800 text-slate-400 border-slate-700',
    pending: 'bg-amber-950 text-amber-400 border-amber-800',
    revoked: 'bg-red-950 text-red-500 border-red-900',
  }

  const cls = colorMap[value] || 'bg-slate-800 text-slate-400 border-slate-700'
  const display = value.replace(/_/g, ' ')

  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-medium border ${cls}`}>
      {display}
    </span>
  )
}

function RiskBar({ score }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const color =
    pct >= 75 ? 'bg-red-600' : pct >= 50 ? 'bg-amber-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-emerald-500'

  return (
    <div className="w-16 h-1.5 bg-slate-700 rounded-sm overflow-hidden">
      <div className={`h-full rounded-sm transition-all ${color}`} style={{ width: `${pct}%` }} />
    </div>
  )
}

function formatRemaining(minutes) {
  if (minutes === null || minutes === undefined) return '—'
  const h = Math.floor(Math.abs(minutes) / 60)
  const m = Math.abs(minutes) % 60
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

// ─── Row styling by AI recommendation ────────────────────────────────────────

function getRowClass(rec) {
  switch (rec) {
    case 'deny':
      return 'bg-red-950/70 border-l-4 border-red-600 flash-critical'
    case 'approve_with_conditions':
      return 'bg-amber-950/40 border-l-4 border-amber-500'
    case 'approve':
      return 'bg-slate-800/50 border-l-4 border-emerald-600'
    default:
      return 'bg-slate-800/30'
  }
}

// ─── PermitRow ────────────────────────────────────────────────────────────────
// Renders a single permit table row with all data columns + collapsible conflict.

export default function PermitRow({ permit, onAction }) {
  const {
    permit_uid,
    permit_type,
    zone_name,
    status,
    issued_by,
    crew_count,
    risk_score,
    ai_recommendation,
    remaining_minutes,
    is_overdue,
    conflict_details,
    has_conflict,
  } = permit

  const rowClass = getRowClass(ai_recommendation)

  return (
    <>
      <tr className={`transition-colors ${rowClass}`}>
        {/* 1. permit_uid */}
        <td className="py-2 px-3 border-b border-slate-800">
          <span className="font-mono text-xs text-slate-300">{permit_uid}</span>
        </td>

        {/* 2. permit_type */}
        <td className="py-2 px-3 border-b border-slate-800">
          <StatusBadge value={permit_type} />
        </td>

        {/* 3. zone_name */}
        <td className="py-2 px-3 border-b border-slate-800">
          <span className="text-xs text-slate-300">{zone_name || '—'}</span>
        </td>

        {/* 4. status */}
        <td className="py-2 px-3 border-b border-slate-800">
          <StatusBadge value={status} />
        </td>

        {/* 5. issued_by */}
        <td className="py-2 px-3 border-b border-slate-800">
          <span className="text-xs text-slate-400">{issued_by || '—'}</span>
        </td>

        {/* 6. crew_count */}
        <td className="py-2 px-3 border-b border-slate-800 text-center">
          <span className="font-mono text-sm text-slate-200">{crew_count ?? '—'}</span>
        </td>

        {/* 7. risk_score */}
        <td className="py-2 px-3 border-b border-slate-800">
          <div className="flex flex-col gap-1">
            <RiskBar score={risk_score} />
            <span className="font-mono text-xs text-slate-300">{risk_score?.toFixed(1) ?? '—'}</span>
          </div>
        </td>

        {/* 8. ai_recommendation */}
        <td className="py-2 px-3 border-b border-slate-800">
          <RecommendationChip recommendation={ai_recommendation} />
        </td>

        {/* 9. Time remaining */}
        <td className="py-2 px-3 border-b border-slate-800">
          {is_overdue ? (
            <span className="inline-flex items-center px-1.5 py-0.5 rounded-sm text-xs font-mono font-medium bg-red-950 text-red-400 border border-red-800">
              OVERDUE
            </span>
          ) : (
            <span className="font-mono text-xs text-slate-300">{formatRemaining(remaining_minutes)}</span>
          )}
        </td>

        {/* 10. Actions */}
        <td className="py-2 px-3 border-b border-slate-800">
          {status === 'active' && (
            <button
              className="btn-danger text-xs"
              onClick={() => onAction?.('suspend', permit_uid)}
            >
              Suspend
            </button>
          )}
        </td>
      </tr>

      {/* Conflict details spanning all columns */}
      {has_conflict && (
        <tr className={rowClass}>
          <td colSpan={10} className="px-4 pb-2 border-b border-slate-800">
            <ConflictDetails conflictDetails={conflict_details} hasConflict={has_conflict} />
          </td>
        </tr>
      )}
    </>
  )
}
