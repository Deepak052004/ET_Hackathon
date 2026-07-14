import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { MOCK_PERMITS_DATA } from '../lib/mockData';

// ─── usePermits ───────────────────────────────────────────────────────────────
// Fetches GET /api/permits with optional filter params.
// Returns { data: { permits, active_count, conflict_count }, loading, error, refetch }
// Falls back to MOCK_PERMITS_DATA if backend is unavailable.

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
      console.warn('[usePermits] fetch failed — falling back to mock data', err);
      setError(null); // Clear error so the UI shows the mock data instead of "Load failed"
      setData(MOCK_PERMITS_DATA);
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
