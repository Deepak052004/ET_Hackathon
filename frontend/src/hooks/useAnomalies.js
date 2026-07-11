import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { MOCK_ANOMALIES } from '../lib/mockData';

// ─── useAnomalies ─────────────────────────────────────────────────────────────
// Polls GET /api/predictions/anomalies every 10 seconds.
// Returns { anomalies, summary, loading, error }
// On error: falls back to MOCK_ANOMALIES from mockData.js

export default function useAnomalies() {
  const [anomalies, setAnomalies] = useState([]);
  const [summary,   setSummary]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);

  const fetchAnomalies = useCallback(async () => {
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get('/api/predictions/anomalies');
      // Backend may return { anomalies, summary } shaped object or flat array
      if (Array.isArray(result)) {
        setAnomalies(result);
        setSummary(null);
      } else {
        setAnomalies(result.anomalies ?? []);
        setSummary(result.summary ?? null);
      }
      setError(null);
    } catch (err) {
      console.warn('[useAnomalies] fetch failed — falling back to mock data', err);
      setError(err?.message || 'Failed to load anomalies');
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      setAnomalies(MOCK_ANOMALIES.anomalies);
      setSummary(MOCK_ANOMALIES.summary);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnomalies();
    const interval = setInterval(fetchAnomalies, 10_000);
    return () => clearInterval(interval);
  }, [fetchAnomalies]);

  return { anomalies, summary, loading, error };
}
