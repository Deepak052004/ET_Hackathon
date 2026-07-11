import React from 'react';
import usePredictions from '../../hooks/usePredictions';
import StatusBadge from '../ui/StatusBadge';
import SkeletonLoader from '../ui/SkeletonLoader';
import ErrorBanner from '../ui/ErrorBanner';
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react';

export default function PredictiveHealthWidget() {
  const { predictions, loading, error } = usePredictions();

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-2">
            <SkeletonLoader height="16px" width="100px" />
            <SkeletonLoader height="8px" />
          </div>
        ))}
      </div>
    );
  }

  if (error && !predictions) {
    return <ErrorBanner message="Predictive service unavailable — using last known state." />;
  }

  const immediateFailure = predictions?.find(p => p.urgency === 'immediate');

  return (
    <div>
      {immediateFailure && (
        <div className="bg-red-950 border border-red-800 p-2 rounded-sm flex items-center gap-2 text-red-300 text-sm mb-3">
          <AlertTriangle size={16} />
          <span>{immediateFailure.equipment_tag} — Failure predicted in {Math.round(immediateFailure.rul_hours / 24)} days ({immediateFailure.rul_hours}h)</span>
        </div>
      )}

      <div className="space-y-4 max-h-64 overflow-y-auto no-scrollbar">
        {predictions?.slice(0, 5).map(p => (
          <PredictionRow key={p.sensor_uid} prediction={p} />
        ))}
      </div>
    </div>
  );
}

function PredictionRow({ prediction }) {
  const { equipment_tag, urgency, trend, rul_hours } = prediction;
  
  // Progress bar calculation (assuming 720 hours max for healthy state)
  const maxHours = 720;
  const progress = Math.min(100, Math.max(0, (rul_hours / maxHours) * 100));
  
  let colorClass = 'bg-emerald-500';
  let badgeStatus = 'normal';
  if (urgency === 'immediate') { colorClass = 'bg-red-500 flash-critical'; badgeStatus = 'critical'; }
  else if (urgency === 'short_term') { colorClass = 'bg-amber-500'; badgeStatus = 'warning'; }
  else if (urgency === 'medium_term') { colorClass = 'bg-slate-400'; badgeStatus = 'acknowledged'; }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-sm text-slate-200">{equipment_tag}</span>
        <div className="flex items-center gap-2">
          {trend === 'degrading' ? (
            <span className="flex items-center text-xs text-amber-400"><TrendingDown size={14} className="mr-1"/> Degrading</span>
          ) : (
            <span className="flex items-center text-xs text-emerald-400"><TrendingUp size={14} className="mr-1"/> Stable</span>
          )}
          <StatusBadge status={badgeStatus} label={urgency.replace('_', ' ')} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex-1 h-1.5 bg-slate-800 rounded-sm overflow-hidden">
          <div className={`h-full ${colorClass}`} style={{ width: `${progress}%` }} />
        </div>
        <span className="font-mono text-xs text-slate-400 min-w-[32px] text-right">{rul_hours}h</span>
      </div>
    </div>
  );
}
