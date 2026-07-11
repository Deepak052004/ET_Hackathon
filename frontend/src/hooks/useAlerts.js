import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { useStore } from '../lib/store';
import { MOCK_ALERTS } from '../lib/mockData';

// ─── useAlerts ────────────────────────────────────────────────────────────────
// Fetches GET /api/alerts with optional filter params.
// Merges liveAlerts from the Zustand socket store as a real-time overlay.
// Returns { data: { alerts, counts }, loading, error, refetch }

const MOCK_COUNTS = { total: 4, critical: 1, high: 2, warning: 1 };

export default function useAlerts(params = {}) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // Socket overlay — live alerts pushed via WebSocket
  const liveAlerts = useStore((s) => s.liveAlerts);

  const buildQuery = (p) => {
    const q = new URLSearchParams();
    if (p.status)    q.set('status',    p.status);
    if (p.severity)  q.set('severity',  p.severity);
    if (p.zone_id)   q.set('zone_id',   p.zone_id);
    if (p.limit)     q.set('limit',     p.limit);
    const qs = q.toString();
    return qs ? `/api/alerts?${qs}` : '/api/alerts';
  };

  const fetchAlerts = useCallback(async () => {
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get(buildQuery(params));
      setData(result);
      setError(null);
    } catch (err) {
      console.warn('[useAlerts] fetch failed — falling back to mock data', err);
      setError(err?.message || 'Failed to load alerts');
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      setData({ alerts: MOCK_ALERTS, counts: MOCK_COUNTS });
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(params)]);

  useEffect(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Merge socket liveAlerts on top of fetched data.
  // De-duplicate by alert_uid; live alerts take precedence.
  const mergedAlerts = (() => {
    const base = data?.alerts ?? [];
    if (!liveAlerts || liveAlerts.length === 0) return base;
    const liveIds = new Set(liveAlerts.map((a) => a.alert_uid));
    const filtered = base.filter((a) => !liveIds.has(a.alert_uid));
    return [...liveAlerts, ...filtered];
  })();

  const mergedCounts = data?.counts ?? MOCK_COUNTS;

  return {
    data: { alerts: mergedAlerts, counts: mergedCounts },
    loading,
    error,
    refetch: fetchAlerts,
  };
}
