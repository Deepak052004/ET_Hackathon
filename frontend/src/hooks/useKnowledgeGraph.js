import { useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';
import { MOCK_GRAPH_TOPOLOGY } from '../lib/mockData';

// ─── useKnowledgeGraph ────────────────────────────────────────────────────────
// Fetches GET /api/knowledge/graph (returns statistics only — NOT topology).
// Exposes helper methods that call specific knowledge endpoints on demand.
// INTEGRATION POINT: graph topology uses MOCK_GRAPH_TOPOLOGY because the backend
// does not yet expose a renderable nodes/edges payload. Swap when ready.

export default function useKnowledgeGraph() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const fetchStats = useCallback(async () => {
    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      const result = await api.get('/api/knowledge/graph');
      setStats(result);
      setError(null);
    } catch (err) {
      console.warn('[useKnowledgeGraph] fetch failed', err);
      setError(err?.message || 'Failed to load knowledge graph statistics');
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // ── On-demand helpers ─────────────────────────────────────────────────────

  /** Fetch equipment risk chain for a given sensor UID */
  const getEquipmentRisks = useCallback(async (sensorUid) => {
    // INTEGRATION POINT: replace with real API call when endpoint is ready
    return await api.get(`/api/knowledge/equipment/${encodeURIComponent(sensorUid)}/risks`);
  }, []);

  /** Fetch zone relationship data */
  const getZoneRelationships = useCallback(async (zoneId) => {
    // INTEGRATION POINT: replace with real API call when endpoint is ready
    return await api.get(`/api/knowledge/zone/${encodeURIComponent(zoneId)}/relationships`);
  }, []);

  /** Fetch full risk propagation chain for a zone */
  const getRiskChain = useCallback(async (zoneId) => {
    // INTEGRATION POINT: replace with real API call when endpoint is ready
    return await api.get(`/api/knowledge/risk-chain/${encodeURIComponent(zoneId)}`);
  }, []);

  return {
    stats,
    // INTEGRATION POINT: topology is mock-only until backend emits renderable graph
    topology: MOCK_GRAPH_TOPOLOGY,
    loading,
    error,
    getEquipmentRisks,
    getZoneRelationships,
    getRiskChain,
  };
}
