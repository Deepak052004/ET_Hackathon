import { FileCheck2 } from 'lucide-react'
import PermitRow from './PermitRow'

// ─── Shared: EmptyState ───────────────────────────────────────────────────────
function EmptyState({ icon: Icon, message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-500">
      {Icon && <Icon size={32} strokeWidth={1} />}
      <p className="text-sm">{message || 'No data available.'}</p>
    </div>
  )
}

// ─── Shared: ErrorBanner ──────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="bg-red-950 border border-red-800 rounded-sm px-4 py-3 text-sm text-red-400">
      ⚠ {message}
    </div>
  )
}

// ─── Column headers ───────────────────────────────────────────────────────────
const COLUMNS = [
  'Permit UID',
  'Type',
  'Zone',
  'Status',
  'Issued By',
  'Crew',
  'Risk Score',
  'AI Rec.',
  'Time Left',
  'Actions',
]

// ─── PermitTable ──────────────────────────────────────────────────────────────
// Sticky-header scrollable table for all permits.

export default function PermitTable({ permits = [], loading, error, onAction }) {
  if (error) {
    return (
      <div className="p-4">
        <ErrorBanner message={error} />
      </div>
    )
  }

  return (
    <div className="overflow-auto max-h-[calc(100vh-320px)]">
      <table className="data-table w-full border-collapse text-sm">
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th
                key={col}
                className="text-left text-xs font-medium text-slate-400 uppercase tracking-wider py-2 px-3 border-b border-slate-700 bg-slate-900 sticky top-0 z-10 whitespace-nowrap"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {loading ? (
            // 8 skeleton rows
            Array.from({ length: 8 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map((col) => (
                  <td key={col} className="py-2 px-3 border-b border-slate-800">
                    <div className="animate-pulse bg-slate-800 rounded-sm h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))
          ) : permits.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length}>
                <EmptyState icon={FileCheck2} message="No permits match current filters." />
              </td>
            </tr>
          ) : (
            permits.map((permit) => (
              <PermitRow
                key={permit.permit_uid || permit.id}
                permit={permit}
                onAction={onAction}
              />
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
