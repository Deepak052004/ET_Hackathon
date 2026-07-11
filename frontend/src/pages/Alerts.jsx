import React, { useState } from 'react';
import useAlerts from '../hooks/useAlerts';
import AlertFilters from '../components/alerts/AlertFilters';
import AlertTable from '../components/alerts/AlertTable';

export default function Alerts() {
  const [filters, setFilters] = useState({ limit: 50 });
  const { data, loading, error, refetch } = useAlerts(filters);
  const { api } = require('../lib/api'); // local inline require to avoid top-level import issue if preferred, or use api directly

  // Actually let's import it properly. Wait, it's better to fetch inside the component or hook.
  // We'll pass the api instance via a local function or we can just use fetch.
  // For simplicity, let's just make the fetch call directly here using the wrapper.
  
  const handleAction = async (actionData) => {
    // Action data: { action, alertUid, ...params }
    const { api } = await import('../lib/api'); // dynamic import or standard import
    try {
      if (actionData.action === 'acknowledge') {
        await api.post(`/api/alerts/${actionData.alertUid}/acknowledge`, { acknowledged_by: actionData.acknowledged_by });
      } else if (actionData.action === 'escalate') {
        await api.post(`/api/alerts/${actionData.alertUid}/escalate`, { reason: actionData.reason });
      } else if (actionData.action === 'resolve') {
        await api.post(`/api/alerts/${actionData.alertUid}/resolve`);
      }
      refetch(); // Reload the data
    } catch (err) {
      console.error(`Action ${actionData.action} failed:`, err);
      // Could show a toast here
    }
  };

  const errorMsg = error?.message || (error ? 'Failed to load alerts' : null);

  return (
    <div className="flex flex-col h-full space-y-4" style={{ height: 'calc(100vh - 110px)' }}>
      <AlertFilters 
        filters={filters} 
        onChange={setFilters} 
        counts={data?.counts} 
      />
      <div className="panel flex-1 overflow-hidden">
        <AlertTable 
          alerts={data?.alerts || []} 
          loading={loading} 
          error={errorMsg} 
          onAction={handleAction} 
        />
      </div>
    </div>
  );
}
