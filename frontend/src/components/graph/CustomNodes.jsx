import { Handle, Position } from 'reactflow'
import { Wrench, AlertTriangle, HardHat, MapPin, FileCheck2, Shield } from 'lucide-react'

// ─── CustomNodes ──────────────────────────────────────────────────────────────
// All 6 entity type node components for the React Flow knowledge graph canvas.
// Each node shows: icon + truncated label + type tag.

function truncate(str, max = 12) {
  if (!str) return ''
  return str.length > max ? str.slice(0, max) + '…' : str
}

// ─── Equipment Node (hexagon) ─────────────────────────────────────────────────
function EquipmentNode({ data }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-32 h-24 bg-blue-700 text-white cursor-pointer hover:brightness-125 transition-all animate-graph-node"
      style={{
        clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-blue-400 !border-blue-200" />
      <Handle type="source" position={Position.Bottom} className="!bg-blue-400 !border-blue-200" />
      <Wrench size={14} className="text-white mb-1" />
      <span className="text-xs font-medium text-center leading-tight px-1">
        {truncate(data.label)}
      </span>
      <span className="text-xs opacity-70 mt-0.5">Equipment</span>
    </div>
  )
}

// ─── Incident Node (circle) ───────────────────────────────────────────────────
function IncidentNode({ data }) {
  return (
    <div className="relative flex flex-col items-center justify-center w-28 h-28 rounded-full bg-red-800 text-white border-2 border-red-600 cursor-pointer hover:brightness-125 transition-all animate-graph-node">
      <Handle type="target" position={Position.Top} className="!bg-red-400 !border-red-200" />
      <Handle type="source" position={Position.Bottom} className="!bg-red-400 !border-red-200" />
      <AlertTriangle size={14} className="text-white mb-1" />
      <span className="text-xs font-medium text-center leading-tight px-2">
        {truncate(data.label)}
      </span>
      <span className="text-xs opacity-70 mt-0.5">Incident</span>
    </div>
  )
}

// ─── Worker Node (square) ─────────────────────────────────────────────────────
function WorkerNode({ data }) {
  return (
    <div className="relative flex flex-col items-center justify-center w-28 h-20 bg-slate-600 text-white border border-slate-500 cursor-pointer hover:brightness-125 transition-all animate-graph-node">
      <Handle type="target" position={Position.Top} className="!bg-slate-400 !border-slate-200" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-400 !border-slate-200" />
      <HardHat size={14} className="text-white mb-1" />
      <span className="text-xs font-medium text-center leading-tight px-1">
        {truncate(data.label)}
      </span>
      <span className="text-xs opacity-70 mt-0.5">Worker</span>
    </div>
  )
}

// ─── Zone Node (diamond — rotated square) ─────────────────────────────────────
function ZoneNode({ data }) {
  return (
    <div className="relative flex items-center justify-center w-28 h-28 bg-teal-700 text-white cursor-pointer hover:brightness-125 transition-all animate-graph-node transform rotate-45">
      <Handle
        type="target"
        position={Position.Top}
        style={{ transform: 'rotate(-45deg)' }}
        className="!bg-teal-400 !border-teal-200"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ transform: 'rotate(-45deg)' }}
        className="!bg-teal-400 !border-teal-200"
      />
      <div className="transform -rotate-45 flex flex-col items-center gap-1">
        <MapPin size={14} className="text-white" />
        <span className="text-xs font-medium text-center leading-tight px-1">
          {truncate(data.label)}
        </span>
        <span className="text-xs opacity-70">Zone</span>
      </div>
    </div>
  )
}

// ─── Permit Node (pentagon) ───────────────────────────────────────────────────
function PermitNode({ data }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-28 h-28 bg-amber-700 text-white cursor-pointer hover:brightness-125 transition-all animate-graph-node"
      style={{
        clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-amber-400 !border-amber-200" />
      <Handle type="source" position={Position.Bottom} className="!bg-amber-400 !border-amber-200" />
      <FileCheck2 size={14} className="text-white mb-1" />
      <span className="text-xs font-medium text-center leading-tight px-2">
        {truncate(data.label)}
      </span>
      <span className="text-xs opacity-70 mt-0.5">Permit</span>
    </div>
  )
}

// ─── Regulation Node (shield) ─────────────────────────────────────────────────
function RegulationNode({ data }) {
  return (
    <div
      className="relative flex flex-col items-center justify-center w-28 h-28 bg-violet-700 text-white cursor-pointer hover:brightness-125 transition-all animate-graph-node"
      style={{
        clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
      }}
    >
      <Handle type="target" position={Position.Top} className="!bg-violet-400 !border-violet-200" />
      <Handle type="source" position={Position.Bottom} className="!bg-violet-400 !border-violet-200" />
      <Shield size={14} className="text-white mb-1" />
      <span className="text-xs font-medium text-center leading-tight px-2">
        {truncate(data.label)}
      </span>
      <span className="text-xs opacity-70 mt-0.5">Regulation</span>
    </div>
  )
}

// ─── nodeTypes map (exported for ReactFlow) ───────────────────────────────────
export const nodeTypes = {
  Equipment: EquipmentNode,
  Incident: IncidentNode,
  Worker: WorkerNode,
  Zone: ZoneNode,
  Permit: PermitNode,
  Regulation: RegulationNode,
}
