import React from 'react';
import SlaTimer from './SlaTimer';
import ActionButtons from './ActionButtons';
import StatusBadge from '../ui/StatusBadge';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';

export default function AlertRow({ alert, onAction }) {
  let rowClass = 'bg-slate-800/30';
  let icon = <Info size={16} className="text-slate-400" />;

  if (alert.severity === 'critical') {
    rowClass = 'bg-red-950/60 border-l-4 border-red-600 flash-critical';
    icon = <AlertTriangle size={16} className="text-red-500" />;
  } else if (alert.severity === 'high') {
    rowClass = 'bg-orange-950/40 border-l-4 border-orange-500';
    icon = <AlertCircle size={16} className="text-orange-500" />;
  } else if (alert.severity === 'warning') {
    rowClass = 'bg-amber-950/30 border-l-4 border-amber-500';
    icon = <AlertCircle size={16} className="text-amber-500" />;
  }

  // Socket overlay alerts might have 'isNew' flag
  if (alert.isNew) {
    rowClass += ' animate-fade-in-down';
  }

  return (
    <tr className={rowClass}>
      <td className="w-8 text-center">{icon}</td>
      <td className="font-mono text-sm text-slate-200">{alert.priority_score?.toFixed(1) || '-'}</td>
      <td className="font-mono text-xs text-slate-400">
        {alert.alert_uid}
        {alert.isNew && <span className="ml-2 text-[10px] bg-emerald-900 text-emerald-300 px-1 rounded-sm">NEW</span>}
      </td>
      <td className="text-sm text-slate-200 max-w-[200px] truncate" title={alert.title}>{alert.title}</td>
      <td><StatusBadge status="normal" label={alert.source} size="sm" /></td>
      <td className="text-xs text-slate-400">{alert.zone_name || `Zone ${alert.zone_id}`}</td>
      <td><SlaTimer slaDeadline={alert.sla_deadline} slaBreached={alert.sla_breached} /></td>
      <td className={`font-mono text-xs text-center ${alert.escalation_count > 0 ? 'text-orange-400 font-bold' : 'text-slate-500'}`}>
        {alert.escalation_count}
      </td>
      <td><StatusBadge status={alert.status} /></td>
      <td>
        <ActionButtons alert={alert} onAction={onAction} />
      </td>
    </tr>
  );
}
