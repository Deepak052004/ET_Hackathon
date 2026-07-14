import React from 'react';
import useDashboardSummary from '../hooks/useDashboardSummary';
import { useStore } from '../lib/store';
import HeatmapCanvas from '../components/dashboard/HeatmapCanvas';
import LiveAlertFeed from '../components/dashboard/LiveAlertFeed';

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary();
  const zones = useStore((state) => state.zones);
  const sensors = useStore((state) => state.sensors);
  const liveAlerts = useStore((state) => state.liveAlerts);

  const activeAlerts = liveAlerts.filter(a => a.status !== 'resolved');

  return (
    <div className="flex flex-col lg:flex-row h-full w-full bg-background border border-outline-variant overflow-hidden">
      {/* Main Map Zone */}
      <div className="relative flex-1 bg-surface-container-lowest p-8 overflow-hidden flex flex-col">
        {/* Background Layer */}
        <div className="absolute inset-0 z-0 opacity-10">
          <div className="absolute inset-0 map-grid"></div>
          <div className="scanline"></div>
        </div>
        
        {/* Header Overlays */}
        <div className="relative z-10 flex justify-between items-start mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold text-primary data-glow uppercase">Sector Infrastructure Map</h1>
            <p className="font-mono text-xs text-on-surface-variant font-bold mt-1 tracking-widest">REAL-TIME TELEMETRY STREAM</p>
          </div>
          <div className="flex gap-2">
            <div className="px-3 py-1 bg-surface-container-high border border-primary/30 rounded flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
              <span className="font-mono text-[11px] font-bold text-primary uppercase tracking-widest">LIVE SYNC</span>
            </div>
          </div>
        </div>

        {/* Interactive Zone Map */}
        <div className="flex-1 relative z-10 flex items-center justify-center p-4">
          <HeatmapCanvas zones={zones} loading={false} />
        </div>

        {/* Footer KPIs */}
        <div className="mt-auto relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4 pb-4">
          <div className="border-l-2 border-primary pl-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Active Sensors</p>
            <p className="font-mono text-xl font-bold text-primary">{sensors.length || 0}</p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Compound Risk</p>
            <p className="font-mono text-xl font-bold text-primary">{summary?.overall_compound_risk || 0}%</p>
          </div>
          <div className="border-l-2 border-error pl-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Anomalies</p>
            <p className="font-mono text-xl font-bold text-error">{activeAlerts.length}</p>
          </div>
          <div className="border-l-2 border-primary pl-4">
            <p className="font-mono text-[11px] font-bold uppercase tracking-widest text-on-surface-variant">Active Permits</p>
            <p className="font-mono text-xl font-bold text-primary">{(summary?.active_hot_work || 0) + (summary?.active_confined_space || 0)}</p>
          </div>
        </div>
      </div>

      {/* Right Side Data Panel */}
      <aside className="w-full lg:w-96 bg-surface-container border-l border-outline-variant flex flex-col">
        <div className="p-6 border-b border-outline-variant">
          <div className="flex justify-between items-center mb-4">
            <span className="font-mono text-[11px] font-bold uppercase tracking-widest text-primary">SYSTEM_STATUS</span>
            <span className="material-symbols-outlined text-primary text-lg">expand_content</span>
          </div>
          
          <div className="p-4 bg-surface-container-lowest border border-error-container/30 rounded relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-error-container/20"></div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-display text-[16px] text-error-container font-semibold">Critical Threat Intel</h3>
              <span className="bg-error text-on-error px-1.5 py-0.5 text-[9px] font-bold rounded">LEVEL_2_ALERT</span>
            </div>
            <p className="text-xs text-on-surface-variant mb-4">AI predicts an impending incident based on compound sensor data and permit conflicts.</p>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-surface-container-low p-2 border border-outline-variant/30 rounded">
                <p className="text-[9px] font-mono uppercase text-on-surface-variant font-bold">Risk Score</p>
                <p className="font-mono text-on-surface font-medium">{summary?.overall_compound_risk || 0}%</p>
              </div>
              <div className="bg-surface-container-low p-2 border border-outline-variant/30 rounded">
                <p className="text-[9px] font-mono uppercase text-on-surface-variant font-bold">Active Alerts</p>
                <p className="font-mono text-error font-medium">{activeAlerts.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 p-6 overflow-y-auto space-y-6">
          {/* Live Alert Feed Cluster */}
          <div>
            <h4 className="font-mono text-[11px] font-bold tracking-widest text-on-surface-variant mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-[14px]">history</span>
              LIVE_TELEMETRY_FEED
            </h4>
            <div className="h-64 overflow-y-auto no-scrollbar border border-outline-variant bg-surface-container-low">
               <LiveAlertFeed compact />
            </div>
          </div>
        </div>

        <div className="p-6 bg-surface-container-high/50 mt-auto border-t border-outline-variant">
          <button 
            onClick={() => {
              try {
                const reportText = `SAFETY NEXUS AI - ZONE REPORT\nDate: ${new Date().toISOString()}\n\nOverall Compound Risk: ${summary?.overall_compound_risk || 0}%\nActive Sensors: ${sensors?.length || 0}\nActive Alerts: ${activeAlerts?.length || 0}\nPermit Conflicts: ${zones?.filter(z => z.active_permits > 1).length || 0}\n\nZones Status:\n${(zones || []).map(z => `- ${z.zone_name || 'Unknown'}: Risk Level ${(z.risk_level || 'unknown').toUpperCase()}, Score ${z.risk_score?.toFixed(1) || 0}`).join('\n')}\n\nEND OF REPORT`;
                const blob = new Blob([reportText], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = url;
                a.download = `zone-report-${new Date().getTime()}.txt`;
                document.body.appendChild(a);
                a.click();
                setTimeout(() => {
                  document.body.removeChild(a);
                  window.URL.revokeObjectURL(url);
                }, 100);
                window.dispatchEvent(new CustomEvent('toast', { detail: 'ZONE REPORT DOWNLOADED.' }));
              } catch (e) {
                console.error(e);
                window.dispatchEvent(new CustomEvent('toast', { detail: 'ERROR GENERATING REPORT.' }));
              }
            }}
            className="w-full py-3 border border-primary text-primary font-mono text-[11px] font-bold rounded flex items-center justify-center gap-2 hover:bg-primary hover:text-on-primary transition-all active:scale-95 tracking-widest uppercase"
          >
            <span className="material-symbols-outlined text-[16px]">print</span>
            GENERATE_ZONE_REPORT
          </button>
        </div>
      </aside>

      {/* Floating UI elements for Industrial feel */}
      <div className="fixed bottom-6 left-[280px] pointer-events-none opacity-40 select-none">
        <p className="font-mono text-[10px] text-primary leading-tight">
          // SECURE_SYSTEM_V.4.2<br/>
          // ENCRYPTION_SHA256_ACTIVE<br/>
          // LOC_REF: LAT_44.31_LON_12.82
        </p>
      </div>
    </div>
  );
}
