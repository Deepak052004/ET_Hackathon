import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

// ─── usePermits ───────────────────────────────────────────────────────────────
// Fetches GET /api/permits with optional filter params.
// Returns { data: { permits, active_count, conflict_count }, loading, error, refetch }
// No mock fallback — returns empty array on error with error state set.

export default function usePermits(params = {}) {
  const [data,    setData]    = useState({ permits: [], active_count: 0, conflict_count: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const buildQuery = (p) => {
    const q = new URLSearchParams();
    if (p.status)       q.set('status',       p.status);
    if (p.zone_id)      q.set('zone_id',      p.zone_id);
    if (p.permit_type)  q.set('permit_type',  p.permit_type);
    const qs = q.toString();
    return qs ? `/api/permits?${qs}` : '/api/permits';
  };

  const fetchPermits = useCallback(async () => {
    setLoading(true);
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get(buildQuery(params));
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[usePermits] fetch failed', err);
      setError(err?.message || 'Failed to load permits');
      setData({ permits: [], active_count: 0, conflict_count: 0 });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchPermits();
  }, [fetchPermits]);

  return { data, loading, error, refetch: fetchPermits };
}
