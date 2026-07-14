import React, { useState } from 'react';
import useAlerts from '../hooks/useAlerts';
import AlertFilters from '../components/alerts/AlertFilters';
import AlertTable from '../components/alerts/AlertTable';

export default function Alerts() {
  const [filters, setFilters] = useState({ limit: 50 });
  const { data, loading, error, refetch } = useAlerts(filters);
  
  const handleAction = async (actionData) => {
    const { api } = await import('../lib/api');
    try {
      if (actionData.action === 'acknowledge') {
        await api.post(`/api/alerts/${actionData.alertUid}/acknowledge`, { acknowledged_by: actionData.acknowledged_by });
      } else if (actionData.action === 'escalate') {
        await api.post(`/api/alerts/${actionData.alertUid}/escalate`, { reason: actionData.reason });
      } else if (actionData.action === 'resolve') {
        await api.post(`/api/alerts/${actionData.alertUid}/resolve`);
      }
      refetch();
    } catch (err) {
      console.error(`Action ${actionData.action} failed:`, err);
    }
  };

  const errorMsg = error?.message || (error ? 'Failed to load alerts' : null);

  return (
    <div className="flex flex-col h-[calc(100vh-112px)] w-full relative">
      {/* Header Section */}
      <div className="flex justify-between items-end mb-6 border-l-2 border-primary pl-4 relative z-10">
        <div>
          <h1 className="font-display text-3xl font-bold text-primary uppercase tracking-tight">Telemetry & Alerts</h1>
          <p className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant uppercase mt-1">Live Sensor Data Stream</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-1 bg-surface-container-high border border-primary/30 rounded flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest">LIVE SYNC</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col h-full gap-4 relative z-10 flex-1 min-h-0">
        <div className="bg-surface-container border border-outline-variant p-4">
          <AlertFilters 
            filters={filters} 
            onChange={setFilters} 
            counts={data?.counts} 
          />
        </div>
        <div className="bg-surface-container border border-outline-variant flex-1 overflow-hidden inset-panel p-0">
          <AlertTable 
            alerts={data?.alerts || []} 
            loading={loading} 
            error={errorMsg} 
            onAction={handleAction} 
          />
        </div>
      </div>
      
      {/* Background Asset with Overlay */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
        <div className="w-full h-full bg-cover bg-center grayscale brightness-[0.2] bg-[url('https://lh3.googleusercontent.com/aida-public/AB6AXuC6ivccQ-PbGEL9CEsUvDAKepPmXaXHR0jTxgbsbZ-NnU4lUk44FezBY4-2XepQsFbDFDVr4lrW1q1qBZNab5vNzZtCYZsk7FAg026HdV0M9g3h-0tgp7fq3bsLtyUhyRYHXiDVJhroLuaOjImATD5HEjRcMSJ2t-1V5IkImPovXvocxZYaIOzouyf3GuI4yegg0EHq1rbbMXaQsLzP0mr3ncwoAyj7B-GCLR6zgtyAqlZurwDgMArvHg')]" />
        <div className="absolute inset-0 bg-background/60" />
      </div>
    </div>
  );
}
