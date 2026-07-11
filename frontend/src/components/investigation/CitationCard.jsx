import React, { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import ConfidenceBadge from '../ui/ConfidenceBadge';
import { ChevronDown, ChevronRight, Search } from 'lucide-react';

export default function CitationCard({ source, onSelect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-sm hover:border-slate-600 transition-colors">
      <div 
        className="p-2 flex items-center justify-between cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-2 overflow-hidden">
          {expanded ? <ChevronDown size={14} className="text-slate-500 flex-shrink-0" /> : <ChevronRight size={14} className="text-slate-500 flex-shrink-0" />}
          <span className="font-mono text-xs text-cobalt truncate">{source.incident_uid}</span>
          <StatusBadge status={source.severity === 'critical' ? 'critical' : source.severity === 'major' ? 'high' : 'warning'} label={source.severity} size="sm" />
        </div>
        <ConfidenceBadge score={source.relevance_score || 0.5} />
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1 border-t border-slate-800">
          <div className="flex gap-2 text-xs text-slate-400 mb-2">
            <span>{source.incident_type}</span>
            <span>&bull;</span>
            <span>{source.zone_name}</span>
          </div>
          <button 
            className="flex items-center gap-1 text-[10px] uppercase font-semibold text-slate-100 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded-sm transition-colors border border-slate-700 w-full justify-center mt-2"
            onClick={(e) => { e.stopPropagation(); onSelect(); }}
          >
            <Search size={12} />
            View in Context
          </button>
        </div>
      )}
    </div>
  );
}
