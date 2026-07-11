import { useCallback, useMemo } from 'react'
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  useReactFlow,
} from 'reactflow'
import 'reactflow/dist/style.css'
import dagre from '@dagrejs/dagre'
import { MOCK_GRAPH_TOPOLOGY } from '../../lib/mockData'
import { nodeTypes } from './CustomNodes'

// ─── Node color map for MiniMap ───────────────────────────────────────────────
const nodeColorMap = {
  Equipment:  '#1D4ED8',
  Incident:   '#B91C1C',
  Worker:     '#475569',
  Zone:       '#0F766E',
  Permit:     '#B45309',
  Regulation: '#7C3AED',
}

// ─── Dagre layout ─────────────────────────────────────────────────────────────
function applyDagreLayout(nodes, edges) {
  const g = new dagre.graphlib.Graph()
  g.setDefaultEdgeLabel(() => ({}))
  g.setGraph({ rankdir: 'LR', ranksep: 100, nodesep: 80 })

  nodes.forEach((node) => {
    g.setNode(node.id, { width: 128, height: 96 })
  })

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target)
  })

  dagre.layout(g)

  return nodes.map((node) => {
    const pos = g.node(node.id)
    return {
      ...node,
      position: { x: pos.x - 64, y: pos.y - 48 },
    }
  })
}

// ─── Convert MOCK_GRAPH_TOPOLOGY to ReactFlow format ─────────────────────────
function buildGraphElements() {
  // INTEGRATION POINT: MOCK_GRAPH_TOPOLOGY used for canvas nodes/edges.
  // GET /api/knowledge/graph returns statistics only (node counts, not topology).
  // When backend adds topology endpoint, replace MOCK_GRAPH_TOPOLOGY below.

  const rawNodes = MOCK_GRAPH_TOPOLOGY.nodes.map((n) => ({
    id: n.id,
    type: n.type, // maps to nodeTypes keys
    data: { label: n.label },
    position: { x: 0, y: 0 }, // overwritten by dagre
  }))

  const rawEdges = MOCK_GRAPH_TOPOLOGY.edges.map((e) => ({
    id: `${e.source}-${e.target}-${e.type}`,
    source: e.source,
    target: e.target,
    label: e.type,
    type: 'smoothstep',
    style: { stroke: '#475569', strokeWidth: 1.5 },
    labelStyle: { fill: '#64748B', fontSize: 10, fontFamily: 'JetBrains Mono, monospace' },
    labelBgStyle: { fill: '#0F172A', fillOpacity: 0.9 },
  }))

  const positionedNodes = applyDagreLayout(rawNodes, rawEdges)
  return { nodes: positionedNodes, edges: rawEdges }
}

// ─── Inner canvas (needs ReactFlowProvider context) ───────────────────────────
function FlowCanvas({ onNodeClick, loading }) {
  const { fitView } = useReactFlow()

  const { nodes: initialNodes, edges: initialEdges } = useMemo(() => buildGraphElements(), [])
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, , onEdgesChange] = useEdgesState(initialEdges)

  const handleNodeClick = useCallback(
    (event, node) => {
      onNodeClick?.(node)
    },
    [onNodeClick]
  )

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <div className="animate-pulse bg-slate-800 rounded-sm h-4 w-32" />
          <p className="text-xs">Loading graph topology…</p>
        </div>
      </div>
    )
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.15 }}
      className="bg-slate-950"
      proOptions={{ hideAttribution: true }}
    >
      <Background color="#1E293B" gap={20} size={1} />
      <Controls className="!bg-slate-900 !border-slate-700" />
      <MiniMap
        nodeColor={(n) => nodeColorMap[n.type] || '#475569'}
        style={{ background: '#0F172A', border: '1px solid #334155' }}
        maskColor="rgba(2, 6, 23, 0.7)"
      />
    </ReactFlow>
  )
}

// ─── GraphCanvas ──────────────────────────────────────────────────────────────
// Full-screen React Flow graph with dagre layout and demo topology data.

export default function GraphCanvas({ stats, loading, onNodeClick }) {
  return (
    <div className="h-full w-full bg-slate-950 rounded-sm">
      <ReactFlowProvider>
        <FlowCanvas onNodeClick={onNodeClick} loading={loading} />
      </ReactFlowProvider>
    </div>
  )
}
