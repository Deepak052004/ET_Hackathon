import { useState } from 'react'
import { Maximize2, ChevronDown, ChevronUp } from 'lucide-react'

// ─── Node type color config ───────────────────────────────────────────────────
const NODE_TYPE_CONFIG = [
  { type: 'Equipment', color: 'bg-blue-700', dot: '#1D4ED8' },
  { type: 'Incident',  color: 'bg-red-800',   dot: '#B91C1C' },
  { type: 'Worker',    color: 'bg-slate-600',  dot: '#475569' },
  { type: 'Zone',      color: 'bg-teal-700',   dot: '#0F766E' },
  { type: 'Permit',    color: 'bg-amber-700',  dot: '#B45309' },
  { type: 'Regulation',color: 'bg-violet-700', dot: '#7C3AED' },
]

// ─── GraphControls ────────────────────────────────────────────────────────────
// Toolbar for graph canvas with fit-view button, node type filter pills, and legend.

export default function GraphControls({ onFitView, onFilterChange, activeFilters = [], nodeTypes: typeList }) {
  const [showLegend, setShowLegend] = useState(false)

  // Use NODE_TYPE_CONFIG as authoritative list; typeList prop can narrow if needed
  const types = NODE_TYPE_CONFIG.filter(
    (cfg) => !typeList || typeList.length === 0 || typeList.includes(cfg.type)
  )

  function toggleType(type) {
    const next = activeFilters.includes(type)
      ? activeFilters.filter((t) => t !== type)
      : [...activeFilters, type]
    onFilterChange?.(next)
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main toolbar */}
      <div className="bg-slate-900 border border-slate-800 rounded-sm p-2 flex items-center gap-2 flex-wrap">
        {/* Fit view */}
        <button
          type="button"
          onClick={onFitView}
          className="btn-ghost flex items-center gap-1.5 text-xs py-1 px-2"
          title="Fit to screen"
        >
          <Maximize2 size={14} />
          Fit Screen
        </button>

        {/* Divider */}
        <div className="w-px h-5 bg-slate-700" />

        {/* Node type filter pills */}
        {types.map(({ type, color }) => {
          const isActive = activeFilters.length === 0 || activeFilters.includes(type)
          return (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`text-xs px-2 py-1 rounded-sm font-medium border transition-all ${
                isActive
                  ? `${color} text-white border-transparent`
                  : 'bg-slate-900 text-slate-500 border-slate-700 hover:border-slate-600'
              }`}
            >
              {type}
            </button>
          )
        })}

        {/* Divider */}
        <div className="w-px h-5 bg-slate-700" />

        {/* Legend toggle */}
        <button
          type="button"
          onClick={() => setShowLegend((v) => !v)}
          className="btn-ghost flex items-center gap-1 text-xs py-1 px-2"
        >
          Legend
          {showLegend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Legend panel */}
      {showLegend && (
        <div className="bg-slate-900 border border-slate-800 rounded-sm p-3 animate-fade-in-down">
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Node Types</p>
          <div className="flex flex-wrap gap-3">
            {NODE_TYPE_CONFIG.map(({ type, dot }) => (
              <div key={type} className="flex items-center gap-1.5">
                <span
                  className="w-3 h-3 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: dot }}
                />
                <span className="text-xs text-slate-300">{type}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
