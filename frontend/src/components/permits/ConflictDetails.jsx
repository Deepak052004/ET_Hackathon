import { AlertTriangle } from 'lucide-react'

// ─── ConflictDetails ──────────────────────────────────────────────────────────
// Renders a collapsible conflict detail block beneath a permit row.
// Only renders when hasConflict === true.

export default function ConflictDetails({ conflictDetails, hasConflict }) {
  if (!hasConflict) return null

  return (
    <details className="mt-2">
      <summary className="text-xs text-amber-400 cursor-pointer hover:text-amber-300 flex items-center gap-1 list-none select-none">
        <AlertTriangle size={12} />
        View Conflict Details
      </summary>
      <div className="mt-2 bg-slate-950 border border-amber-900/50 rounded-sm p-3 text-xs text-slate-300 whitespace-pre-wrap font-mono">
        {conflictDetails || 'No conflict detail text provided.'}
      </div>
    </details>
  )
}
