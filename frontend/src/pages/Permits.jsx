import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import PermitTable from '../components/permits/PermitTable'
import AssessmentForm from '../components/permits/AssessmentForm'
import { MOCK_ALERTS } from '../lib/mockData'

const PERMIT_TYPES = [
  '', 'HOT_WORK', 'CONFINED_SPACE', 'ELECTRICAL',
  'WORKING_AT_HEIGHT', 'EXCAVATION', 'RADIOGRAPHY', 'CRITICAL_LIFT',
]

const STATUSES = ['', 'active', 'suspended', 'expired', 'pending', 'revoked']

// ─── Mock permits data ────────────────────────────────────────────────────────
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


export default function Permits() {
  const [filters, setFilters] = useState({ status: '', permit_type: '', limit: 50 })
  const { permits, loading, error, refetch } = usePermits(filters)

  const activeCount = permits.filter((p) => p.status === 'active').length
  const conflictCount = permits.filter((p) => p.has_conflict).length

  async function handleAction(actionType, permitUid) {
    if (actionType === 'suspend') {
      try {
        await api.post(`/api/permits/${permitUid}/suspend`, {})
        refetch()
      } catch (err) {
        console.error('Suspend failed:', err)
      }
    }
  }

  function handleAssessmentResult(result) {
    refetch()
  }

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="w-full h-full bg-cover bg-center mix-blend-luminosity bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuANv02cV342C7CLpTP0i1MquLmmFbJHbQVMGN5Snr9IZ-c7KoJK6Vo0wTzAnBGLIYwNYbxZXE5d2EFYvrbEYmvnekZDecpwgIpfnqSlkFRf3MW8XusSUPW1a0J5KjA2nnOvTBIrnopmuHlntbxGuEHUOoZpYtp3uoG2wZO60Rookvd5Xw2sRMbFWTUHX8dMQ8DWdquxqxiWi1YLtyfe7KaQyfZkcRzOpFn3oM1e_Vu8uYjrheVNVGtF7Q')]" />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10 border-l-2 border-primary pl-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tighter">Permit To Work</h1>
          <p className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">Zone Control & Safety Clearances</p>
        </div>
      </div>

      <div className="flex flex-col h-full gap-6 relative z-10 flex-1 min-h-0 overflow-y-auto no-scrollbar pb-6">
        <div className="flex items-center justify-between flex-wrap gap-4 bg-surface-container border border-outline-variant p-4">
          <div className="flex items-center gap-6">
            <div className="flex flex-col">
              <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Active Permits</span>
              <span className="font-mono text-primary font-bold text-lg">{loading ? '—' : activeCount}</span>
            </div>
            <div className="flex flex-col border-l border-outline-variant pl-6">
              <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Conflicts</span>
              <span className={conflictCount > 0 ? "font-mono text-error font-bold text-lg flash-warn" : "font-mono text-on-surface-variant font-bold text-lg"}>
                {loading ? '—' : conflictCount}
              </span>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <select
              value={filters.status}
              onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
              className="appearance-none bg-[#0a0a0a] border border-primary/50 text-primary text-xs font-mono py-2 px-4 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">ALL STATUSES</option>
              {STATUSES.filter(Boolean).map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>

            <select
              value={filters.permit_type}
              onChange={(e) => setFilters((f) => ({ ...f, permit_type: e.target.value }))}
              className="appearance-none bg-[#0a0a0a] border border-primary/50 text-primary text-xs font-mono py-2 px-4 focus:outline-none focus:border-primary cursor-pointer"
            >
              <option value="">ALL TYPES</option>
              {PERMIT_TYPES.filter(Boolean).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-surface-container border border-outline-variant overflow-hidden p-0">
          <PermitTable
            permits={permits}
            loading={loading}
            error={error}
            onAction={handleAction}
          />
        </div>

        <div className="bg-surface-container border border-outline-variant">
          <AssessmentForm onResult={handleAssessmentResult} />
        </div>
      </div>
    </div>
  )
}
