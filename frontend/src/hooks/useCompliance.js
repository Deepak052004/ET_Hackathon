import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

// ─── useCompliance ────────────────────────────────────────────────────────────
// Fetches GET /api/compliance once on mount.
// Returns { data, loading, error }
// No mock fallback — error state is surfaced directly to the UI.

export default function useCompliance() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchCompliance = useCallback(async () => {
    setLoading(true);
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get('/api/compliance');
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[useCompliance] fetch failed', err);
      setError(err?.message || 'Failed to load compliance data');
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompliance();
  }, [fetchCompliance]);

  return { data, loading, error };
}
