import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import { MOCK_ALERTS } from '../lib/mockData'

// ─── usePermits hook ──────────────────────────────────────────────────────────
// INTEGRATION POINT: replace with real API call when endpoint is ready
// GET /api/permits?status=&permit_type=&limit=50

function usePermits(filters = {}) {
  const [permits, setPermits] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchPermits = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.permit_type) params.set('permit_type', filters.permit_type)
      params.set('limit', filters.limit || 50)
      const data = await api.get(`/api/permits?${params.toString()}`)
      setPermits(data?.permits || data || [])
    } catch (err) {
      setError(err.message || 'Failed to load permits.')
      setPermits(MOCK_PERMITS)
    } finally {
      setLoading(false)
    }
  }, [filters.status, filters.permit_type, filters.limit])

  useEffect(() => {
    fetchPermits()
  }, [fetchPermits])

  return { permits, loading, error, refetch: fetchPermits }
}

// ─── Mock permits data ────────────────────────────────────────────────────────
// INTEGRATION POINT: replace with real API call when endpoint is ready
const MOCK_PERMITS = [
  {
    permit_uid: 'PTW-2026-0847',
    permit_type: 'HOT_WORK',
    zone_name: 'Zone B - Hot Strip Mill',
    status: 'active',
    issued_by: 'ENG-001',
    crew_count: 5,
    risk_score: 82.3,
    ai_recommendation: 'deny',
    remaining_minutes: -30,
    is_overdue: true,
    has_conflict: true,
    conflict_details: 'CONFLICT: Overlapping CONFINED_SPACE permit PTW-2026-0812 in same zone.\nRisk amplification: combined risk score exceeds safe threshold (>80).\nRegulatory ref: OISD-GDN-105 §6.1',
  },
  {
    permit_uid: 'PTW-2026-0812',
    permit_type: 'CONFINED_SPACE',
    zone_name: 'Zone B - Hot Strip Mill',
    status: 'active',
    issued_by: 'ENG-002',
    crew_count: 3,
    risk_score: 75.0,
    ai_recommendation: 'approve_with_conditions',
    remaining_minutes: 90,
    is_overdue: false,
    has_conflict: true,
    conflict_details: 'CONFLICT: Overlapping HOT_WORK permit PTW-2026-0847 in same zone.\nEnsure standby rescue team is available before work commences.',
  },
  {
    permit_uid: 'PTW-2026-0901',
    permit_type: 'ELECTRICAL',
    zone_name: 'Zone A - Blast Furnace',
    status: 'active',
    issued_by: 'ENG-003',
    crew_count: 2,
    risk_score: 35.2,
    ai_recommendation: 'approve',
    remaining_minutes: 240,
    is_overdue: false,
    has_conflict: false,
    conflict_details: null,
  },
  {
    permit_uid: 'PTW-2026-0888',
    permit_type: 'WORKING_AT_HEIGHT',
    zone_name: 'Zone C - Coke Oven Battery',
    status: 'suspended',
    issued_by: 'ENG-004',
    crew_count: 4,
    risk_score: 60.1,
    ai_recommendation: null,
    remaining_minutes: 180,
    is_overdue: false,
    has_conflict: false,
    conflict_details: null,
  },
]

// ─── Shared sub-components ────────────────────────────────────────────────────
import PermitTable from '../components/permits/PermitTable'
import AssessmentForm from '../components/permits/AssessmentForm'

const PERMIT_TYPES = [
  '', 'HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL',
  'WORKING_AT_HEIGHT', 'EXCAVATION', 'RADIOGRAPHY', 'CRITICAL_LIFT',
]

const STATUSES = ['', 'active', 'suspended', 'expired', 'pending', 'revoked']

// ─── Permits Page ─────────────────────────────────────────────────────────────

export default function Permits() {
  const [filters, setFilters] = useState({ status: '', permit_type: '', limit: 50 })
  const { permits, loading, error, refetch } = usePermits(filters)

  const activeCount = permits.filter((p) => p.status === 'active').length
  const conflictCount = permits.filter((p) => p.has_conflict).length

  async function handleAction(actionType, permitUid) {
    if (actionType === 'suspend') {
      try {
        // INTEGRATION POINT: replace with real API call when endpoint is ready
        await api.post(`/api/permits/${permitUid}/suspend`, {})
        refetch()
      } catch (err) {
        console.error('Suspend failed:', err)
      }
    }
  }

  function handleAssessmentResult(result) {
    // Optionally refresh permits after a new assessment leads to a new permit
    refetch()
  }

  return (
    <div className="space-y-4">
      {/* Header strip */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="panel px-4 py-2 text-sm text-slate-400">
            Active:{' '}
            <span className="font-mono text-emerald-400">{loading ? '—' : activeCount}</span>
          </div>
          <div className="panel px-4 py-2 text-sm text-slate-400">
            Conflicts:{' '}
            <span
              className={
                conflictCount > 0
                  ? 'font-mono text-amber-400 flash-warn'
                  : 'font-mono text-slate-400'
              }
            >
              {loading ? '—' : conflictCount}
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 flex-wrap">
          <select
            value={filters.status}
            onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
            className="select-field text-xs py-1.5 px-2"
          >
            <option value="">All Statuses</option>
            {STATUSES.filter(Boolean).map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>

          <select
            value={filters.permit_type}
            onChange={(e) => setFilters((f) => ({ ...f, permit_type: e.target.value }))}
            className="select-field text-xs py-1.5 px-2"
          >
            <option value="">All Types</option>
            {PERMIT_TYPES.filter(Boolean).map((t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="panel overflow-hidden">
        <PermitTable
          permits={permits}
          loading={loading}
          error={error}
          onAction={handleAction}
        />
      </div>

      {/* Assessment form */}
      <AssessmentForm onResult={handleAssessmentResult} />
    </div>
  )
}
