import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { MOCK_DASHBOARD_SUMMARY } from '../lib/mockData';

// ─── useDashboardSummary ──────────────────────────────────────────────────────
// Polls GET /api/dashboard/summary every 30 seconds.
// Returns { data, loading, error }.
// On any fetch error falls back to MOCK_DASHBOARD_SUMMARY so the UI
// remains functional while the backend is unavailable.

export default function useDashboardSummary() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchSummary = useCallback(async () => {
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get('/api/dashboard/summary');
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[useDashboardSummary] fetch failed — falling back to mock data', err);
      setError(err?.message || 'Failed to load dashboard summary');
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      setData(MOCK_DASHBOARD_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch immediately on mount
    fetchSummary();

    // Then poll every 30 seconds
    const interval = setInterval(fetchSummary, 30_000);
    return () => clearInterval(interval);
  }, [fetchSummary]);

  return { data, loading, error };
}
