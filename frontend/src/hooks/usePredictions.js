import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { MOCK_PREDICTIONS } from '../lib/mockData';

// ─── usePredictions ───────────────────────────────────────────────────────────
// Polls GET /api/predictions/failures every 10 seconds.
// Returns { predictions, summary, loading, error }
// On error: falls back to MOCK_PREDICTIONS with a derived summary.

const MOCK_SUMMARY = {
  total_equipment:    4,
  immediate_attention: 1,
  short_term_risk:    1,
  degrading_trend:    2,
  healthy:            1,
};

export default function usePredictions() {
  const [predictions, setPredictions] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);

  const fetchPredictions = useCallback(async () => {
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get('/api/predictions/failures');
      // Backend may return { predictions, summary } or a flat array
      if (Array.isArray(result)) {
        setPredictions(result);
        setSummary(deriveSummary(result));
      } else {
        setPredictions(result.predictions ?? []);
        setSummary(result.summary ?? deriveSummary(result.predictions ?? []));
      }
      setError(null);
    } catch (err) {
      console.warn('[usePredictions] fetch failed — falling back to mock data', err);
      setError(err?.message || 'Failed to load predictions');
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      setPredictions(MOCK_PREDICTIONS);
      setSummary(MOCK_SUMMARY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 10_000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  return { predictions, summary, loading, error };
}

// ── Derive summary stats from a flat predictions array ────────────────────────
function deriveSummary(predictions) {
  return {
    total_equipment:     predictions.length,
    immediate_attention: predictions.filter((p) => p.urgency === 'immediate').length,
    short_term_risk:     predictions.filter((p) => p.urgency === 'short_term').length,
    degrading_trend:     predictions.filter((p) => p.trend === 'degrading').length,
    healthy:             predictions.filter((p) => p.urgency === 'healthy').length,
  };
}
