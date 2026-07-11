import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

// ─── useIncidents ─────────────────────────────────────────────────────────────
// Fetches GET /api/incidents with optional filter params.
// Returns { data: { incidents, stats }, loading, error, refetch }
// On error: returns empty incidents with zeroed stats.

const EMPTY_STATS = { total: 0, fatalities: 0, injuries: 0, near_misses: 0 };

export default function useIncidents(params = {}) {
  const [data,    setData]    = useState({ incidents: [], stats: EMPTY_STATS });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const buildQuery = (p) => {
    const q = new URLSearchParams();
    if (p.severity)      q.set('severity',      p.severity);
    if (p.incident_type) q.set('incident_type', p.incident_type);
    if (p.zone_id)       q.set('zone_id',       p.zone_id);
    if (p.limit)         q.set('limit',         p.limit);
    const qs = q.toString();
    return qs ? `/api/incidents?${qs}` : '/api/incidents';
  };

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get(buildQuery(params));
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[useIncidents] fetch failed', err);
      setError(err?.message || 'Failed to load incidents');
      setData({ incidents: [], stats: EMPTY_STATS });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchIncidents();
  }, [fetchIncidents]);

  return { data, loading, error, refetch: fetchIncidents };
}
