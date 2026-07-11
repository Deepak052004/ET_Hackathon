import { useState, useEffect, useCallback } from 'react'
import { Info } from 'lucide-react'
import { api } from '../lib/api'
import GraphControls from '../components/graph/GraphControls'
import GraphCanvas from '../components/graph/GraphCanvas'
import NodeDetailDrawer from '../components/graph/NodeDetailDrawer'

// ─── useKnowledgeGraph hook ───────────────────────────────────────────────────
// INTEGRATION POINT: GET /api/knowledge/graph returns statistics only.
// Real topology data comes from MOCK_GRAPH_TOPOLOGY inside GraphCanvas.

function useKnowledgeGraph() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function fetch() {
      try {
        const data = await api.get('/api/knowledge/graph')
        if (!cancelled) setStats(data)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    fetch()
    return () => { cancelled = true }
  }, [])

  return { stats, loading, error }
}

// ─── Graph Page ───────────────────────────────────────────────────────────────

export default function Graph() {
  const { stats, loading } = useKnowledgeGraph()

  const [activeFilters, setActiveFilters] = useState([])
  const [selectedNode, setSelectedNode] = useState(null)
  const [nodeDetails, setNodeDetails] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const handleNodeClick = useCallback(async (node) => {
    setSelectedNode(node)
    setNodeDetails(null)
    setDetailLoading(true)

    try {
      // INTEGRATION POINT: replace with real API call when endpoint is ready
      let data = null
      if (node.type === 'Equipment') {
        data = await api.get(`/api/knowledge/equipment/${node.id}/risks`)
      } else if (node.type === 'Zone') {
        data = await api.get(`/api/knowledge/zone/${node.id}/relationships`)
      }
      setNodeDetails(data)
    } catch {
      // Fall back to node's own data as minimal detail
      setNodeDetails({ label: node.data?.label })
    } finally {
      setDetailLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col h-full" style={{ height: 'calc(100vh - 160px)' }}>
      {/* Top toolbar */}
      <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
        <GraphControls
          onFitView={() => {}}
          onFilterChange={setActiveFilters}
          activeFilters={activeFilters}
        />

        {/* Stats panel from real API */}
        <div className="panel px-4 py-2 text-xs text-slate-400 flex gap-4 flex-wrap">
          {loading ? (
            <span className="animate-pulse bg-slate-800 rounded-sm h-3 w-24 inline-block" />
          ) : stats?.node_counts ? (
            Object.entries(stats.node_counts).map(([type, count]) => (
              <span key={type}>
                <span className="font-mono text-slate-200">{count}</span>{' '}
                <span className="text-slate-500">{type}</span>
              </span>
            ))
          ) : (
            <span className="text-slate-600">No stats available</span>
          )}
        </div>
      </div>

      {/* Demo mode banner */}
      <div className="bg-blue-950 border border-blue-900 text-blue-400 text-xs px-3 py-1.5 rounded-sm mb-3 flex items-center gap-2">
        <Info size={12} />
        Knowledge graph topology: demonstration data · Real endpoint returns statistics only
      </div>

      {/* Graph canvas */}
      <div className="flex-1 panel p-0 overflow-hidden">
        <GraphCanvas
          stats={stats}
          loading={false}
          onNodeClick={handleNodeClick}
        />
      </div>

      {/* Node detail drawer */}
      <NodeDetailDrawer
        node={selectedNode}
        details={nodeDetails}
        loading={detailLoading}
        onClose={() => setSelectedNode(null)}
      />
    </div>
  )
}
