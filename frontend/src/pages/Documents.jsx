import React, { useState } from 'react';
import useIncidents from '../hooks/useIncidents';
import useCompliance from '../hooks/useCompliance';
import FilterSidebar from '../components/documents/FilterSidebar';
import IncidentCard from '../components/documents/IncidentCard';
import CompliancePanel from '../components/documents/CompliancePanel';
import SectionHeader from '../components/ui/SectionHeader';
import { ShieldCheck, AlertTriangle } from 'lucide-react';

export default function Documents() {
  const [filters, setFilters] = useState({ limit: 50 });
  const { data: incidentData, loading: incidentsLoading } = useIncidents(filters);
  const { data: compliance, loading: complianceLoading } = useCompliance();

  const incidents = incidentData?.incidents || [];

  return (
    <div className="flex gap-4 h-full" style={{ height: 'calc(100vh - 110px)' }}>
      <FilterSidebar filters={filters} onChange={setFilters} />
      
      <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar pr-2">
        <div className="panel p-4">
          <CompliancePanel data={compliance} loading={complianceLoading} />
        </div>
        
        <div className="panel p-4">
          <SectionHeader 
            title={`Incident Registry (${incidentData?.stats?.total || 0})`} 
            icon={AlertTriangle} 
          />
          <div className="space-y-3 mt-4">
            {incidentsLoading ? (
              <div className="text-sm text-slate-500">Loading incidents...</div>
            ) : incidents.length === 0 ? (
              <div className="text-sm text-slate-500 py-8 text-center border border-dashed border-slate-700 rounded-sm">
                No incidents match the selected filters.
              </div>
            ) : (
              incidents.map(incident => (
                <IncidentCard key={incident.incident_uid} incident={incident} />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
