import React from 'react';
import useDashboardSummary from '../hooks/useDashboardSummary';
import { useStore } from '../lib/store';
import KpiBar from '../components/dashboard/KpiBar';
import HeatmapCanvas from '../components/dashboard/HeatmapCanvas';
import LiveAlertFeed from '../components/dashboard/LiveAlertFeed';
import SensorGrid from '../components/dashboard/SensorGrid';
import PredictiveHealthWidget from '../components/dashboard/PredictiveHealthWidget';
import AnomalyWidget from '../components/dashboard/AnomalyWidget';
import ComplianceWidget from '../components/dashboard/ComplianceWidget';
import PermitOverviewWidget from '../components/dashboard/PermitOverviewWidget';
import AiSafetyBrief from '../components/dashboard/AiSafetyBrief';
import SectionHeader from '../components/ui/SectionHeader';
import { MapPin, BellRing, Activity, TrendingDown, Target, ShieldCheck, FileCheck2 } from 'lucide-react';

export default function Dashboard() {
  const { data: summary, loading: summaryLoading } = useDashboardSummary();
  const zones = useStore((state) => state.zones);
  const sensors = useStore((state) => state.sensors);
  const zonesLoading = useStore((state) => state.socketStatus === 'connecting'); // approximation

  return (
    <div className="space-y-4">
      {/* KPI Bar */}
      <KpiBar data={summary} loading={summaryLoading} />
      
      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Left 2/3: Map */}
        <div className="xl:col-span-2 panel p-0 overflow-hidden flex flex-col h-[440px]">
          <SectionHeader title="Geospatial Risk Heatmap" icon={MapPin} className="p-4 border-b border-slate-800 m-0" />
          <div className="flex-1 min-h-0 relative">
             <HeatmapCanvas zones={zones} loading={zonesLoading} />
          </div>
        </div>
        {/* Right 1/3: Live Alert Feed */}
        <div className="panel p-4 flex flex-col h-[440px]">
          <SectionHeader title="Live Alert Feed" icon={BellRing} />
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <LiveAlertFeed />
          </div>
        </div>
      </div>
      
      {/* Second row */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="panel p-4">
          <SectionHeader title="Sensor Telemetry" icon={Activity} />
          <SensorGrid sensors={sensors} loading={zonesLoading} />
        </div>
        <div className="panel p-4">
          <SectionHeader title="Predictive Health" icon={TrendingDown} />
          <PredictiveHealthWidget />
        </div>
        <div className="panel p-4">
          <SectionHeader title="Anomaly Detection" icon={Target} />
          <AnomalyWidget />
        </div>
        <div className="panel p-4">
          <SectionHeader title="Recent Alerts" icon={BellRing} />
          <LiveAlertFeed compact />
        </div>
      </div>
      
      {/* Third row */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="panel p-4">
          <SectionHeader title="Compliance Overview" icon={ShieldCheck} />
          <div className="mt-4"><ComplianceWidget /></div>
        </div>
        <div className="panel p-4 flex flex-col">
          <SectionHeader title="Permits & Conflicts" icon={FileCheck2} />
          <div className="mt-2 flex-1"><PermitOverviewWidget /></div>
        </div>
        <div className="h-full">
          <AiSafetyBrief />
        </div>
      </div>
    </div>
  );
}
