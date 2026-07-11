import React from 'react';
import useAnomalies from '../../hooks/useAnomalies';
import StatusBadge from '../ui/StatusBadge';
import SkeletonLoader from '../ui/SkeletonLoader';
import EmptyState from '../ui/EmptyState';
import { CheckCircle2 } from 'lucide-react';

export default function AnomalyWidget() {
  const { anomalies, summary, loading } = useAnomalies();

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonLoader height="24px" />
        {[...Array(3)].map((_, i) => <SkeletonLoader key={i} height="40px" />)}
      </div>
    );
  }

  const actualAnomalies = anomalies?.filter(a => a.is_anomaly) || [];

  return (
    <div>
      {/* Summary strip */}
      <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-sm mb-4">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase">Sensors</span>
          <span className="font-mono text-sm text-slate-200">{summary?.total_sensors || 0}</span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase">Anomalies</span>
          <span className={`font-mono text-sm ${actualAnomalies.length > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
            {summary?.anomalies_detected || 0}
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 uppercase">Rate</span>
          <span className="font-mono text-sm text-slate-200">{summary?.anomaly_rate || 0}%</span>
        </div>
        <div className="flex flex-col ml-auto text-right">
          <span className="text-[10px] text-red-400 uppercase">Critical</span>
          <span className="font-mono text-sm text-red-400">{summary?.critical_anomalies || 0}</span>
        </div>
      </div>

      {actualAnomalies.length === 0 ? (
        <EmptyState icon={CheckCircle2} message="No anomalies detected — sensors nominal" />
      ) : (
        <div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar">
          {actualAnomalies.sort((a, b) => b.anomaly_score - a.anomaly_score).map(anomaly => (
            <div key={anomaly.sensor_uid} className="flex flex-col gap-1 border-b border-slate-800 pb-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-slate-300">{anomaly.sensor_uid}</span>
                <StatusBadge status={anomaly.anomaly_level === 'critical' ? 'critical' : 'warning'} label={anomaly.anomaly_level} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1 bg-slate-800 rounded-sm overflow-hidden">
                  <div 
                    className={`h-full ${anomaly.anomaly_score >= 0.8 ? 'bg-red-500' : 'bg-amber-500'}`} 
                    style={{ width: `${Math.min(100, anomaly.anomaly_score * 100)}%` }} 
                  />
                </div>
                <span className="font-mono text-xs text-slate-400">{anomaly.anomaly_score.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
