import React from 'react';
import EmptyState from '../ui/EmptyState';
import StatusBadge from '../ui/StatusBadge';
import { SearchCode, Info, Users, Activity } from 'lucide-react';

export default function ContextViewer({ selectedSource, equipmentRisks }) {
  if (!selectedSource && (!equipmentRisks || equipmentRisks.length === 0)) {
    return (
      <EmptyState 
        icon={SearchCode} 
        message="Select a source or equipment tag to inspect details" 
      />
    );
  }

  return (
    <div className="space-y-6">
      {selectedSource && (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="font-mono text-cobalt font-semibold">{selectedSource.incident_uid}</h3>
            <StatusBadge 
              status={selectedSource.severity === 'critical' ? 'critical' : selectedSource.severity === 'major' ? 'high' : 'warning'} 
              label={selectedSource.severity} 
            />
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-800">
              <span className="text-slate-500 block mb-1">Type</span>
              <span className="text-slate-200">{selectedSource.incident_type}</span>
            </div>
            <div className="bg-slate-800/50 p-2 rounded-sm border border-slate-800">
              <span className="text-slate-500 block mb-1">Zone</span>
              <span className="text-slate-200">{selectedSource.zone_name || `Zone ${selectedSource.zone_id}`}</span>
            </div>
          </div>

          {selectedSource.occurred_at && (
            <div className="text-xs text-slate-400">
              Occurred: {new Date(selectedSource.occurred_at).toLocaleString()}
            </div>
          )}

          <div className="bg-slate-800 p-3 rounded-sm border border-slate-700 text-sm text-slate-300">
            {selectedSource.description || 'No description available.'}
          </div>

          {selectedSource.root_cause && (
            <div>
              <h4 className="text-xs text-slate-400 uppercase mb-1">Root Cause</h4>
              <div className="bg-slate-900 border-l-2 border-amber-500 p-2 text-xs text-slate-300">
                {selectedSource.root_cause}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5 text-slate-400">
              <Users size={14} />
              <span>{selectedSource.workers_affected || 0} Affected</span>
            </div>
            <div className={`flex items-center gap-1.5 ${selectedSource.injuries > 0 ? 'text-red-400' : 'text-slate-400'}`}>
              <Activity size={14} />
              <span>{selectedSource.injuries || 0} Injuries</span>
            </div>
            <div className={`flex items-center gap-1.5 ${selectedSource.fatalities > 0 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
              <Info size={14} />
              <span>{selectedSource.fatalities || 0} Fatalities</span>
            </div>
          </div>
        </div>
      )}

      {equipmentRisks && equipmentRisks.length > 0 && (
        <div className="space-y-3 pt-4 border-t border-slate-800">
          <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity size={16} className="text-amber-500" />
            Associated Equipment Risks
          </h4>
          <div className="space-y-2">
            {equipmentRisks.map((risk, idx) => (
              <div key={idx} className="bg-slate-900 border border-slate-800 p-3 rounded-sm text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-mono text-slate-300">{risk.sensor_uid}</span>
                  <span className="text-slate-400">{risk.risk_type}</span>
                </div>
                <div className="text-slate-500">{risk.details}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
