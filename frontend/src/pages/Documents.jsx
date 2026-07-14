import React, { useState } from 'react';
import useIncidents from '../hooks/useIncidents';
import useCompliance from '../hooks/useCompliance';
import FilterSidebar from '../components/documents/FilterSidebar';
import IncidentCard from '../components/documents/IncidentCard';
import CompliancePanel from '../components/documents/CompliancePanel';
import { AlertTriangle } from 'lucide-react';

export default function Documents() {
  const [filters, setFilters] = useState({ limit: 50 });
  const { data: incidentData, loading: incidentsLoading } = useIncidents(filters);
  const { data: compliance, loading: complianceLoading } = useCompliance();

  const incidents = incidentData?.incidents || [];

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full relative">
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="w-full h-full bg-cover bg-center mix-blend-luminosity bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuANv02cV342C7CLpTP0i1MquLmmFbJHbQVMGN5Snr9IZ-c7KoJK6Vo0wTzAnBGLIYwNYbxZXE5d2EFYvrbEYmvnekZDecpwgIpfnqSlkFRf3MW8XusSUPW1a0J5KjA2nnOvTBIrnopmuHlntbxGuEHUOoZpYtp3uoG2wZO60Rookvd5Xw2sRMbFWTUHX8dMQ8DWdquxqxiWi1YLtyfe7KaQyfZkcRzOpFn3oM1e_Vu8uYjrheVNVGtF7Q')]" />
        <div className="absolute inset-0 bg-background/80" />
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4 relative z-10 border-l-2 border-primary pl-4">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tighter">Document Registry</h1>
          <p className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">Incident Reports & Compliance Data</p>
        </div>
      </div>

      <div className="flex h-full gap-6 relative z-10 flex-1 min-h-0">
        <div className="bg-surface-container border border-outline-variant p-4 w-64 flex-shrink-0">
          <FilterSidebar filters={filters} onChange={setFilters} />
        </div>
        
        <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pr-2">
          <div className="bg-surface-container border border-outline-variant p-6">
            <CompliancePanel data={compliance} loading={complianceLoading} />
          </div>
          
          <div className="bg-surface-container border border-outline-variant p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-mono text-[16px] font-bold text-on-surface uppercase flex items-center gap-2">
                <AlertTriangle className="text-error" size={18} />
                Incident Registry ({incidentData?.stats?.total || 0})
              </h3>
            </div>
            
            <div className="space-y-3 mt-4">
              {incidentsLoading ? (
                <div className="text-sm font-mono text-on-surface-variant uppercase">Loading incidents...</div>
              ) : incidents.length === 0 ? (
                <div className="text-sm font-mono text-on-surface-variant uppercase py-8 text-center border border-dashed border-outline-variant rounded-sm bg-surface-container-low">
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
    </div>
  );
}
