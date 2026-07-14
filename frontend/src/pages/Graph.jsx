import { useState, useEffect, useCallback } from 'react'
import { Info } from 'lucide-react'
import { api } from '../lib/api'
import GraphControls from '../components/graph/GraphControls'
import GraphCanvas from '../components/graph/GraphCanvas'
import NodeDetailDrawer from '../components/graph/NodeDetailDrawer'

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
      let data = null
      if (node.type === 'Equipment') {
        data = await api.get(`/api/knowledge/equipment/${node.id}/risks`)
      } else if (node.type === 'Zone') {
        data = await api.get(`/api/knowledge/zone/${node.id}/relationships`)
      }
      setNodeDetails(data)
    } catch {
      setNodeDetails({ label: node.data?.label })
    } finally {
      setDetailLoading(false)
    }
  }, [])

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="w-full h-full bg-cover bg-center mix-blend-luminosity bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuANv02cV342C7CLpTP0i1MquLmmFbJHbQVMGN5Snr9IZ-c7KoJK6Vo0wTzAnBGLIYwNYbxZXE5d2EFYvrbEYmvnekZDecpwgIpfnqSlkFRf3MW8XusSUPW1a0J5KjA2nnOvTBIrnopmuHlntbxGuEHUOoZpYtp3uoG2wZO60Rookvd5Xw2sRMbFWTUHX8dMQ8DWdquxqxiWi1YLtyfe7KaQyfZkcRzOpFn3oM1e_Vu8uYjrheVNVGtF7Q')]" />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10 border-l-2 border-primary pl-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tighter">Performance Analysis</h1>
          <p className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">Knowledge Graph Topology Explorer</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-surface-container-high px-4 py-2 border border-outline-variant flex flex-col">
            <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Time Period</span>
            <span className="font-mono text-primary font-bold">REAL-TIME</span>
          </div>
          <div className="bg-surface-container-high px-4 py-2 border border-outline-variant flex flex-col">
            <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Data Source</span>
            <span className="font-mono text-primary font-bold">NEXUS-NODE-07</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full relative z-10 flex-1 min-h-0 gap-4">
        {/* Top specific metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-surface-container border border-outline-variant p-4 flex flex-col justify-center">
             <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Graph Query Latency</span>
             <span className="font-mono text-primary font-bold text-xl mt-1">42ms</span>
          </div>
          <div className="bg-surface-container border border-outline-variant p-4 flex flex-col justify-center">
             <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Data Ingestion Rate</span>
             <span className="font-mono text-primary font-bold text-xl mt-1">1,024 ev/s</span>
          </div>
          <div className="bg-surface-container border border-outline-variant p-4 flex flex-col justify-center">
             <span className="font-mono text-[9px] font-bold tracking-widest text-on-surface-variant uppercase">Total Graph Entities</span>
             <span className="font-mono text-primary font-bold text-xl mt-1">
               {loading ? '...' : (stats?.node_counts ? Object.values(stats.node_counts).reduce((a,b)=>a+b, 0) : '4,812')}
             </span>
          </div>
          <div className="bg-surface-container border-l-4 border-error p-4 flex flex-col justify-center">
             <span className="font-mono text-[9px] font-bold tracking-widest text-error uppercase">Critical Hotspots</span>
             <span className="font-mono text-error font-bold text-xl mt-1">3</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 flex-wrap bg-surface-container-high border border-outline-variant p-4">
          <GraphControls
            onFitView={() => {}}
            onFilterChange={setActiveFilters}
            activeFilters={activeFilters}
          />

          <div className="px-4 py-2 text-xs flex gap-4 flex-wrap items-center">
            {loading ? (
              <span className="animate-pulse bg-surface-container-highest rounded-sm h-3 w-24 inline-block" />
            ) : stats?.node_counts ? (
              Object.entries(stats.node_counts).map(([type, count]) => (
                <span key={type} className="flex gap-1 items-center bg-surface-container px-2 py-1 border border-outline-variant">
                  <span className="font-mono text-primary font-bold">{count}</span>
                  <span className="font-mono text-[10px] text-on-surface-variant uppercase tracking-widest">{type}</span>
                </span>
              ))
            ) : (
              <span className="text-on-surface-variant">No stats available</span>
            )}
          </div>
        </div>

        <div className="flex-1 bg-surface-container-lowest border border-outline-variant overflow-hidden relative">
          <GraphCanvas
            stats={stats}
            loading={false}
            onNodeClick={handleNodeClick}
          />
        </div>

        <NodeDetailDrawer
          node={selectedNode}
          details={nodeDetails}
          loading={detailLoading}
          onClose={() => setSelectedNode(null)}
        />
      </div>
    </div>
  )
}
