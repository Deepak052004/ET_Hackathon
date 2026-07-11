import React from 'react';
import { useNavigate } from 'react-router-dom';
import usePermits from '../../hooks/usePermits';
import RecommendationChip from '../permits/RecommendationChip';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function PermitOverviewWidget() {
  const navigate = useNavigate();
  // Fetch only active permits for the dashboard
  const { data, loading } = usePermits({ status: 'active' });

  if (loading) {
    return (
      <div className="space-y-3">
        <SkeletonLoader height="28px" />
        {[...Array(4)].map((_, i) => <SkeletonLoader key={i} height="40px" />)}
      </div>
    );
  }

  const { permits = [], active_count = 0, conflict_count = 0 } = data || {};
  const topPermits = permits.sort((a, b) => b.risk_score - a.risk_score).slice(0, 4);

  return (
    <div className="flex flex-col h-full">
      {/* Header strip */}
      <div className="flex items-center gap-4 bg-slate-800/50 p-2 rounded-sm mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase">Active</span>
          <span className="font-mono text-sm text-slate-200">{active_count}</span>
        </div>
        <div className="w-px h-4 bg-slate-700" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 uppercase">Conflicts</span>
          {conflict_count > 0 ? (
            <span className="font-mono text-sm bg-amber-950 text-amber-400 px-1.5 rounded-sm border border-amber-900 flash-warn">
              {conflict_count}
            </span>
          ) : (
            <span className="font-mono text-sm text-slate-500">0</span>
          )}
        </div>
      </div>

      {/* Mini-list */}
      <div className="space-y-2 flex-1">
        {topPermits.map(permit => (
          <div key={permit.permit_uid} className="flex items-center justify-between bg-slate-800/30 p-2 border border-slate-800/50 rounded-sm">
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-slate-400">{permit.permit_uid}</span>
                <span className="text-[10px] text-slate-500 uppercase">{permit.permit_type}</span>
              </div>
              <span className="text-xs text-slate-300 truncate">{permit.zone_name}</span>
            </div>
            <div className="flex flex-col items-end gap-1">
              <RecommendationChip recommendation={permit.ai_recommendation} />
              <span className={`font-mono text-[10px] ${permit.is_overdue ? 'text-red-400' : 'text-slate-500'}`}>
                {permit.is_overdue ? 'OVERDUE' : `${Math.floor(permit.remaining_minutes / 60)}h ${permit.remaining_minutes % 60}m`}
              </span>
            </div>
          </div>
        ))}
        {permits.length === 0 && (
          <div className="text-center text-sm text-slate-500 py-4">No active permits</div>
        )}
      </div>

      <button 
        className="mt-3 w-full text-center text-xs text-cobalt hover:text-blue-400 transition-colors py-1 border border-transparent hover:border-slate-800 rounded-sm"
        onClick={() => navigate('/permits')}
      >
        View All Permits →
      </button>
    </div>
  );
}
