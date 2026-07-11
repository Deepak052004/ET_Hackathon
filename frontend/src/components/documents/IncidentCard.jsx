import React, { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import { ChevronDown, ChevronRight, Activity, Users, Info, Calendar } from 'lucide-react';

export default function IncidentCard({ incident }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div 
      className={`bg-slate-800 border rounded-sm p-4 cursor-pointer transition-colors ${expanded ? 'border-slate-500' : 'border-slate-700 hover:border-slate-600'}`}
      onClick={() => setExpanded(!expanded)}
    >
      {/* Collapsed State (Always visible) */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-slate-400">{incident.incident_uid}</span>
            <StatusBadge 
              status={incident.severity === 'critical' ? 'critical' : incident.severity === 'major' ? 'high' : incident.severity === 'minor' ? 'normal' : 'warning'} 
              label={incident.severity} 
              size="sm" 
            />
            <span className="text-[10px] uppercase bg-slate-900 border border-slate-700 text-slate-300 px-1.5 py-0.5 rounded-sm">
              {incident.incident_type}
            </span>
            <span className="text-[10px] uppercase bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded-sm">
              {incident.zone_name || `Zone ${incident.zone_id}`}
            </span>
          </div>
          {expanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
        </div>
        
        <h3 className="text-sm font-medium text-slate-200">{incident.title || 'Untitled Incident'}</h3>
        
        <div className="flex items-center gap-4 text-xs mt-1">
          <div className="flex items-center gap-1.5 text-slate-400">
            <Users size={12} />
            <span>{incident.workers_affected || 0} Affected</span>
          </div>
          <div className={`flex items-center gap-1.5 ${incident.injuries > 0 ? 'text-red-400' : 'text-slate-400'}`}>
            <Activity size={12} />
            <span>{incident.injuries || 0} Injuries</span>
          </div>
          <div className={`flex items-center gap-1.5 ${incident.fatalities > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
            <Info size={12} />
            <span>{incident.fatalities || 0} Fatalities</span>
          </div>
          <div className="flex items-center gap-1.5 text-slate-500 ml-auto">
            <Calendar size={12} />
            <span>{new Date(incident.occurred_at).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {/* Expanded State */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-slate-700 space-y-4 animate-fade-in-down" onClick={e => e.stopPropagation()}>
          <div>
            <h4 className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Description</h4>
            <div className="text-xs text-slate-300 bg-slate-900 p-3 rounded-sm border border-slate-800">
              {incident.description}
            </div>
          </div>
          
          {incident.root_cause && (
            <div>
              <h4 className="text-[10px] uppercase text-slate-500 font-semibold mb-1">Root Cause Analysis</h4>
              <div className="text-xs text-slate-400">
                {incident.root_cause}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs pt-2">
            <div>
              <span className="text-slate-500 mr-2">Property Damage:</span>
              <span className="font-mono text-slate-300">
                {incident.property_damage_inr ? `₹${Number(incident.property_damage_inr).toLocaleString('en-IN')}` : 'N/A'}
              </span>
            </div>
            {incident.resolved_at && (
              <div className="text-emerald-400 flex items-center gap-1">
                <StatusBadge status="normal" label="Resolved" size="sm" />
                <span className="text-slate-500 ml-2">on {new Date(incident.resolved_at).toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
