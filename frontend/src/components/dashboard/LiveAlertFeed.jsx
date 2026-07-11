import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../../lib/store';
import { MOCK_ALERTS } from '../../lib/mockData';
import EmptyState from '../ui/EmptyState';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function LiveAlertFeed({ compact = false }) {
  const navigate = useNavigate();
  const liveAlerts = useStore((state) => state.liveAlerts);
  
  // INTEGRATION POINT: use MOCK_ALERTS if real socket alerts are empty and backend is offline
  const socketStatus = useStore(state => state.socketStatus);
  const alertsToDisplay = (liveAlerts.length > 0 ? liveAlerts : (socketStatus === 'offline' ? MOCK_ALERTS : []))
    .slice(0, compact ? 4 : 8)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  if (alertsToDisplay.length === 0) {
    return <EmptyState icon={CheckCircle2} message="No active alerts — facility nominal" />;
  }

  const getSeverityIcon = (severity) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={16} className="text-red-500" />;
      case 'high': return <AlertCircle size={16} className="text-orange-500" />;
      case 'warning': return <AlertCircle size={16} className="text-amber-500" />;
      case 'info': return <Info size={16} className="text-slate-400" />;
      default: return <Info size={16} className="text-slate-400" />;
    }
  };

  const getRelativeTime = (isoString) => {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHrs = Math.floor(diffMins / 60);
    return `${diffHrs}h ago`;
  };

  return (
    <div className="space-y-2">
      {alertsToDisplay.map((alert, idx) => (
        <div 
          key={alert.alert_uid || idx}
          className="bg-slate-800/50 hover:bg-slate-800 p-2.5 rounded-sm border border-slate-800/50 hover:border-slate-700 cursor-pointer transition-colors animate-fade-in-down"
          onClick={() => navigate('/alerts')}
          style={{ animationDelay: `${idx * 50}ms` }}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-slate-200 truncate">{alert.title}</div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] bg-slate-900 border border-slate-700 text-slate-400 px-1.5 py-0.5 rounded-sm truncate max-w-[120px]">
                  {alert.zone_name || `Zone ${alert.zone_id}`}
                </span>
                <span className="text-[10px] text-slate-500">{getRelativeTime(alert.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
