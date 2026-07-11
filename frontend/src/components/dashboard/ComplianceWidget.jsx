import React from 'react';
import useCompliance from '../../hooks/useCompliance';
import StatusBadge from '../ui/StatusBadge';
import RiskBar from '../ui/RiskBar';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function ComplianceWidget() {
  const { data, loading } = useCompliance();

  if (loading) {
    return (
      <div className="flex gap-4 items-center">
        <SkeletonLoader height="80px" width="80px" className="rounded-full" />
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonLoader key={i} height="12px" />)}
        </div>
      </div>
    );
  }

  const { overall_score = 0, overall_status = 'warning', categories = [], critical_violations = 0 } = data || {};

  // Simple SVG arc calculation for 80x80 circle with r=32
  const circumference = 2 * Math.PI * 32;
  const strokeDasharray = `${(overall_score / 100) * circumference} ${circumference}`;
  
  let arcColor = '#10B981'; // safe
  if (overall_score < 60) arcColor = '#DC2626'; // critical
  else if (overall_score < 80) arcColor = '#F59E0B'; // warning

  return (
    <div className="flex gap-6 items-center">
      {/* Circular Gauge */}
      <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
        <svg width="80" height="80" className="transform -rotate-90">
          <circle cx="40" cy="40" r="32" stroke="#1E293B" strokeWidth="8" fill="none" />
          <circle 
            cx="40" cy="40" r="32" 
            stroke={arcColor} 
            strokeWidth="8" 
            fill="none" 
            strokeLinecap="round"
            strokeDasharray={strokeDasharray}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-mono text-xl font-semibold text-slate-100">{Math.round(overall_score)}</span>
        </div>
      </div>

      {/* Category Bars */}
      <div className="flex-1 space-y-3">
        <div className="flex items-center justify-between mb-1">
          <StatusBadge status={overall_status === 'critical' ? 'critical' : overall_status === 'warning' ? 'warning' : 'safe'} label={overall_status} />
          {critical_violations > 0 && (
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-sm uppercase flash-critical">
              {critical_violations} Critical Viol
            </span>
          )}
        </div>
        
        {categories.map(cat => (
          <div key={cat.name} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">{cat.name}</span>
              <span className="font-mono text-xs text-slate-300">{cat.score}%</span>
            </div>
            {/* Inverted RiskBar: low score is red */}
            <div className="w-full h-1 bg-slate-800 rounded-sm overflow-hidden">
              <div 
                className={`h-full ${cat.score < 60 ? 'bg-red-500' : cat.score < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${cat.score}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
