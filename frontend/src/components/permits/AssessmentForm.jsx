import { useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, CheckCircle, AlertTriangle } from 'lucide-react'
import { api } from '../../lib/api'
import RecommendationChip from './RecommendationChip'

// ─── Shared: ErrorBanner ──────────────────────────────────────────────────────
function ErrorBanner({ message }) {
  return (
    <div className="bg-red-950 border border-red-800 rounded-sm px-4 py-3 text-sm text-red-400">
      ⚠ {message}
    </div>
  )
}

// ─── Shared: RiskBar ─────────────────────────────────────────────────────────
function RiskBar({ score }) {
  const pct = Math.min(100, Math.max(0, score ?? 0))
  const color =
    pct >= 75 ? 'bg-red-600' : pct >= 50 ? 'bg-amber-500' : pct >= 25 ? 'bg-yellow-500' : 'bg-emerald-500'
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-slate-700 rounded-sm overflow-hidden">
        <div className={`h-full rounded-sm transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="font-mono text-xs text-slate-300 w-8 text-right">{pct.toFixed(0)}</span>
    </div>
  )
}

// ─── Permit types ─────────────────────────────────────────────────────────────
const PERMIT_TYPES = [
  'HOT_WORK',
  'CONFINED_SPACE',
  'ELECTRICAL',
  'WORKING_AT_HEIGHT',
  'EXCAVATION',
  'RADIOGRAPHY',
  'CRITICAL_LIFT',
]

// ─── AssessmentForm ───────────────────────────────────────────────────────────
// Collapsible form that calls POST /api/permits/assess and shows the AI result.

export default function AssessmentForm({ onResult }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const [form, setForm] = useState({
    permit_type: 'HOT_WORK',
    zone_id: '',
    description: '',
    crew_count: 1,
    start_time: '',
    end_time: '',
    issued_by: '',
  })

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const payload = {
        ...form,
        zone_id: form.zone_id ? parseInt(form.zone_id, 10) : undefined,
        crew_count: parseInt(form.crew_count, 10),
      }
      const data = await api.post('/api/permits/assess', payload)
      setResult(data)
      onResult?.(data)
    } catch (err) {
      setError(err.message || 'Assessment failed.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = 'input-field text-sm'
  const labelCls = 'block text-xs text-slate-400 mb-1'

  return (
    <div className="panel overflow-hidden">
      {/* Toggle header */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
      >
        <span className="font-medium">New AI Assessment</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="border-t border-slate-800 p-4 animate-fade-in-down">
          <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
            {/* permit_type */}
            <div>
              <label className={labelCls}>Permit Type</label>
              <select
                name="permit_type"
                value={form.permit_type}
                onChange={handleChange}
                className="select-field w-full"
                required
              >
                {PERMIT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t.replace(/_/g, ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* zone_id */}
            <div>
              <label className={labelCls}>Zone ID</label>
              <input
                type="number"
                name="zone_id"
                value={form.zone_id}
                onChange={handleChange}
                className={inputCls}
                placeholder="Zone ID"
                min="1"
              />
            </div>

            {/* description */}
            <div className="col-span-2">
              <label className={labelCls}>Description</label>
              <textarea
                name="description"
                value={form.description}
                onChange={handleChange}
                className={inputCls}
                rows={3}
                placeholder="Describe the work scope, hazards, and precautions..."
              />
            </div>

            {/* crew_count */}
            <div>
              <label className={labelCls}>Crew Count</label>
              <input
                type="number"
                name="crew_count"
                value={form.crew_count}
                onChange={handleChange}
                className={inputCls}
                min="1"
                required
              />
            </div>

            {/* issued_by */}
            <div>
              <label className={labelCls}>Issued By</label>
              <input
                type="text"
                name="issued_by"
                value={form.issued_by}
                onChange={handleChange}
                className={inputCls}
                placeholder="Officer name / ID"
              />
            </div>

            {/* start_time */}
            <div>
              <label className={labelCls}>Start Time</label>
              <input
                type="datetime-local"
                name="start_time"
                value={form.start_time}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* end_time */}
            <div>
              <label className={labelCls}>End Time</label>
              <input
                type="datetime-local"
                name="end_time"
                value={form.end_time}
                onChange={handleChange}
                className={inputCls}
              />
            </div>

            {/* Submit */}
            <div className="col-span-2 flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading && <Loader2 size={14} className="animate-spin" />}
                {loading ? 'Assessing…' : 'Run AI Assessment'}
              </button>
            </div>
          </form>

          {/* Error */}
          {error && (
            <div className="mt-4">
              <ErrorBanner message={error} />
            </div>
          )}

          {/* Result panel */}
          {result && (
            <div className="mt-4 border-t border-slate-700 pt-4 space-y-4 animate-fade-in-down">
              {/* Header row */}
              <div className="flex items-center gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Recommendation</p>
                  <RecommendationChip recommendation={result.recommendation} />
                </div>
                <div className="flex-1 min-w-40">
                  <p className="text-xs text-slate-500 mb-1">Risk Score</p>
                  <RiskBar score={result.risk_score} />
                </div>
                {result.regulatory_refs && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Regulatory Refs</p>
                    <p className="text-xs font-mono text-slate-300">{result.regulatory_refs}</p>
                  </div>
                )}
              </div>

              {/* Reasoning */}
              {result.reasoning && (
                <div>
                  <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">AI Reasoning</p>
                  <p className="text-xs text-slate-300 bg-slate-950 border border-slate-800 rounded-sm p-3 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>
              )}

              {/* Conditions */}
              {result.conditions && result.conditions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Conditions</p>
                  <ul className="space-y-1">
                    {result.conditions.map((c, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle size={12} className="text-emerald-500 mt-0.5 flex-shrink-0" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Conflicts detected */}
              {result.conflicts_detected && result.conflicts_detected.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Conflicts Detected</p>
                  <div className="space-y-1">
                    {result.conflicts_detected.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 text-xs text-amber-300 bg-amber-950/40 border border-amber-900/50 rounded-sm px-3 py-2"
                      >
                        <AlertTriangle size={12} className="text-amber-400 mt-0.5 flex-shrink-0" />
                        {c}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
