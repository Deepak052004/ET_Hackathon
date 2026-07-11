import { X } from 'lucide-react'

// ─── Shared: EmptyState ───────────────────────────────────────────────────────
function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-2 text-slate-500">
      <p className="text-sm">{message || 'No data.'}</p>
    </div>
  )
}

// ─── Shared: Skeleton ─────────────────────────────────────────────────────────
function Skeleton({ h = 4, w = 'full' }) {
  return (
    <div className={`animate-pulse bg-slate-800 rounded-sm h-${h} w-${w}`} />
  )
}

// ─── RiskGauge (inline SVG) ───────────────────────────────────────────────────
function RiskGauge({ score }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const circumference = 2 * Math.PI * 32 // r=32 → ~201
  const strokeColor =
    pct >= 75 ? '#DC2626' : pct >= 50 ? '#F59E0B' : pct >= 25 ? '#EAB308' : '#10B981'

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={80} height={80} viewBox="0 0 80 80">
        {/* background track */}
        <circle cx={40} cy={40} r={32} fill="none" stroke="#1E293B" strokeWidth={8} />
        {/* progress arc */}
        <circle
          cx={40}
          cy={40}
          r={32}
          fill="none"
          stroke={strokeColor}
          strokeWidth={8}
          strokeLinecap="round"
          strokeDasharray={`${(pct / 100) * circumference} ${circumference}`}
          transform="rotate(-90 40 40)"
        />
        <text
          x={40}
          y={44}
          textAnchor="middle"
          fontSize={14}
          fontFamily="JetBrains Mono, monospace"
          fontWeight="600"
          fill={strokeColor}
        >
          {pct.toFixed(0)}
        </text>
      </svg>
      <span className="text-xs text-slate-500">Risk Score</span>
    </div>
  )
}

// ─── Content renderers per node type ─────────────────────────────────────────

function EquipmentContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Equipment Tag" value={details.equipment_tag} />
      <Row label="Zone" value={details.zone} />
      {details.active_risks?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Risks</p>
          <ul className="space-y-1">
            {details.active_risks.map((r, i) => (
              <li key={i} className="text-xs text-red-400 bg-red-950/40 rounded-sm px-2 py-1">{r}</li>
            ))}
          </ul>
        </div>
      )}
      {details.related_incidents?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Related Incidents</p>
          {details.related_incidents.map((inc, i) => (
            <p key={i} className="text-xs font-mono text-slate-300">{inc}</p>
          ))}
        </div>
      )}
      {details.active_permits?.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Active Permits</p>
          {details.active_permits.map((p, i) => (
            <p key={i} className="text-xs font-mono text-amber-400">{p}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function IncidentContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Title" value={details.title} />
      <Row label="Severity" value={details.severity} />
      <Row label="Zone" value={details.zone} />
      <Row label="Occurred At" value={details.occurred_at ? new Date(details.occurred_at).toLocaleString() : '—'} />
      <Row label="Workers Affected" value={details.workers_affected} />
      <Row label="Injuries" value={details.injuries} valueClass={details.injuries > 0 ? 'text-red-400' : 'text-slate-300'} />
      <Row label="Fatalities" value={details.fatalities} valueClass={details.fatalities > 0 ? 'text-red-500' : 'text-slate-300'} />
      {details.root_cause && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Root Cause</p>
          <p className="text-xs text-slate-300 bg-slate-950 border border-slate-700 rounded-sm p-2">{details.root_cause}</p>
        </div>
      )}
    </div>
  )
}

function ZoneContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Zone Name" value={details.zone_name} />
      <Row label="Classification" value={details.classification} />
      <RiskGauge score={details.risk_score} />
      <Row label="Workers On Site" value={details.workers} />
      <Row label="Active Permits" value={details.permits} />
    </div>
  )
}

function WorkerContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Worker ID" value={details.worker_id} />
      <Row label="Zone" value={details.zone} />
      <Row label="PPE Status" value={details.ppe_status} valueClass={details.ppe_status === 'compliant' ? 'text-emerald-400' : 'text-red-400'} />
    </div>
  )
}

function PermitContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Permit UID" value={details.permit_uid} mono />
      <Row label="Type" value={details.permit_type} />
      <Row label="Status" value={details.status} />
      <Row label="Issued By" value={details.issued_by} />
      <Row label="AI Recommendation" value={details.ai_recommendation} />
      {details.conflict_details && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Conflict Details</p>
          <p className="text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 rounded-sm p-2 font-mono whitespace-pre-wrap">{details.conflict_details}</p>
        </div>
      )}
    </div>
  )
}

function RegulationContent({ details }) {
  return (
    <div className="space-y-3">
      <Row label="Rule ID" value={details.rule_id} mono />
      <Row label="Title" value={details.title} />
      <Row label="Severity" value={details.severity} />
      {details.description && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Description</p>
          <p className="text-xs text-slate-300 bg-slate-950 border border-slate-700 rounded-sm p-2 leading-relaxed">{details.description}</p>
        </div>
      )}
    </div>
  )
}

// ─── Row helper ───────────────────────────────────────────────────────────────
function Row({ label, value, mono, valueClass }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-xs text-slate-500 shrink-0">{label}</span>
      <span className={`text-xs text-right truncate ${mono ? 'font-mono' : ''} ${valueClass || 'text-slate-200'}`}>
        {value ?? '—'}
      </span>
    </div>
  )
}

// ─── NodeDetailDrawer ─────────────────────────────────────────────────────────
// Slide-in drawer that shows contextual details for a selected graph node.

export default function NodeDetailDrawer({ node, details, loading, onClose }) {
  if (!node) return null

  const nodeType = node.type || 'Unknown'
  const label = node.data?.label || node.id

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-slate-950/60"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div className="fixed right-0 top-0 h-full w-80 z-50 bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col animate-slide-in-right">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider">{nodeType}</p>
            <p className="text-sm font-medium text-slate-100 truncate">{label}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton h={4} />
              <Skeleton h={4} w="3/4" />
              <Skeleton h={4} w="1/2" />
              <Skeleton h={16} />
              <Skeleton h={4} w="2/3" />
              <Skeleton h={4} />
            </div>
          ) : !details ? (
            <EmptyState message="No detail data available for this node." />
          ) : (
            <>
              {nodeType === 'Equipment'  && <EquipmentContent  details={details} />}
              {nodeType === 'Incident'   && <IncidentContent   details={details} />}
              {nodeType === 'Zone'       && <ZoneContent       details={details} />}
              {nodeType === 'Worker'     && <WorkerContent     details={details} />}
              {nodeType === 'Permit'     && <PermitContent     details={details} />}
              {nodeType === 'Regulation' && <RegulationContent details={details} />}
            </>
          )}
        </div>
      </div>
    </>
  )
}
