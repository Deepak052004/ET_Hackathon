import React from 'react';

export default function FilterSidebar({ filters, onChange }) {
  const updateFilter = (category, value, checked) => {
    const current = filters[category] || [];
    const updated = checked 
      ? [...current, value]
      : current.filter(v => v !== value);
    
    onChange({ ...filters, [category]: updated });
  };

  const severities = ['critical', 'major', 'moderate', 'minor', 'near_miss'];
  const incidentTypes = ['gas_leak', 'fire', 'explosion', 'equipment_failure', 'near_miss', 'electrical', 'structural'];

  return (
    <div className="w-56 flex-shrink-0 panel p-4 space-y-6 overflow-y-auto h-full">
      
      {/* Severity */}
      <div>
        <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wider">Severity</h4>
        <div className="space-y-1.5">
          {severities.map(sev => (
            <label key={sev} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-slate-100">
              <input 
                type="checkbox"
                className="w-3 h-3 bg-slate-900 border-slate-700 rounded-sm focus:ring-cobalt focus:ring-offset-slate-950 accent-cobalt"
                checked={filters.severity?.includes(sev) || false}
                onChange={(e) => updateFilter('severity', sev, e.target.checked)}
              />
              <span className="capitalize">{sev.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Incident Type */}
      <div>
        <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wider">Incident Type</h4>
        <div className="space-y-1.5">
          {incidentTypes.map(type => (
            <label key={type} className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer hover:text-slate-100">
              <input 
                type="checkbox"
                className="w-3 h-3 bg-slate-900 border-slate-700 rounded-sm focus:ring-cobalt focus:ring-offset-slate-950 accent-cobalt"
                checked={filters.incident_type?.includes(type) || false}
                onChange={(e) => updateFilter('incident_type', type, e.target.checked)}
              />
              <span className="capitalize">{type.replace('_', ' ')}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Zone */}
      <div>
        <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wider">Zone</h4>
        <input 
          type="number" 
          placeholder="All Zones"
          className="input-field py-1 text-xs"
          value={filters.zone_id || ''}
          onChange={(e) => onChange({ ...filters, zone_id: e.target.value ? Number(e.target.value) : undefined })}
        />
      </div>

      {/* Limit */}
      <div>
        <h4 className="text-xs uppercase text-slate-500 font-semibold mb-2 tracking-wider">Show Entries</h4>
        <select 
          className="select-field py-1 text-xs w-full"
          value={filters.limit || 50}
          onChange={(e) => onChange({ ...filters, limit: Number(e.target.value) })}
        >
          <option value={25}>25 items</option>
          <option value={50}>50 items</option>
          <option value={100}>100 items</option>
          <option value={200}>200 items</option>
        </select>
      </div>

      <div className="pt-4 border-t border-slate-800">
        <button 
          className="text-xs text-cobalt hover:text-blue-400 w-full text-left"
          onClick={() => onChange({ limit: 50 })}
        >
          Reset Filters
        </button>
      </div>
    </div>
  );
}
