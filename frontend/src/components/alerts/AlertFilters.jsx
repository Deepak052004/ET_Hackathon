import React from 'react';

export default function AlertFilters({ filters, onChange, counts }) {
  const severities = [
    { value: 'critical', label: 'Critical', color: 'bg-red-950 text-red-400 border-red-800' },
    { value: 'high', label: 'High', color: 'bg-orange-950 text-orange-400 border-orange-800' },
    { value: 'warning', label: 'Warning', color: 'bg-amber-950 text-amber-400 border-amber-800' },
    { value: 'info', label: 'Info', color: 'bg-slate-800 text-slate-300 border-slate-700' },
  ];

  const toggleSeverity = (val) => {
    if (filters.severity === val) {
      const newFilters = { ...filters };
      delete newFilters.severity;
      onChange(newFilters);
    } else {
      onChange({ ...filters, severity: val });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-4 bg-slate-900 border border-slate-800 rounded-sm p-3">
      {/* Severity Toggles */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase text-slate-500 font-semibold mr-2">Severity</span>
        {severities.map(sev => {
          const isActive = filters.severity === sev.value;
          return (
            <button
              key={sev.value}
              onClick={() => toggleSeverity(sev.value)}
              className={`text-xs px-3 py-1.5 rounded-sm border transition-colors flex items-center gap-2 ${
                isActive 
                  ? sev.color 
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
              }`}
            >
              {sev.label}
              {counts && counts[sev.value] !== undefined && (
                <span className={`text-[10px] px-1.5 rounded-sm bg-slate-950/50 ${isActive ? '' : 'text-slate-400'}`}>
                  {counts[sev.value]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="w-px h-6 bg-slate-800 hidden md:block" />

      {/* Status Select */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase text-slate-500 font-semibold">Status</span>
        <select 
          className="select-field py-1 text-xs"
          value={filters.status || ''}
          onChange={(e) => onChange({ ...filters, status: e.target.value || undefined })}
        >
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="acknowledged">Acknowledged</option>
          <option value="escalated">Escalated</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="w-px h-6 bg-slate-800 hidden md:block" />

      {/* Zone Input */}
      <div className="flex items-center gap-2">
        <span className="text-xs uppercase text-slate-500 font-semibold">Zone</span>
        <input 
          type="number"
          placeholder="All Zones"
          className="input-field py-1 text-xs w-24"
          value={filters.zone_id || ''}
          onChange={(e) => onChange({ ...filters, zone_id: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      {/* Summary Chips */}
      {counts && (
        <div className="ml-auto flex items-center gap-2 text-xs font-mono">
          <span className="text-slate-500">Total: {counts.total || 0}</span>
        </div>
      )}
    </div>
  );
}
