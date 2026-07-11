import React, { useState } from 'react';
import { UserCheck, ChevronUp, CheckCheck, Loader2 } from 'lucide-react';

export default function ActionButtons({ alert, onAction }) {
  const [activeForm, setActiveForm] = useState(null); // 'acknowledge' | 'escalate'
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (action) => {
    setLoading(true);
    try {
      if (action === 'acknowledge') {
        await onAction({ action, alertUid: alert.alert_uid, acknowledged_by: inputValue || 'Safety Officer' });
      } else if (action === 'escalate') {
        await onAction({ action, alertUid: alert.alert_uid, reason: inputValue || 'Manual escalation' });
      } else if (action === 'resolve') {
        await onAction({ action, alertUid: alert.alert_uid });
      }
      setActiveForm(null);
    } finally {
      setLoading(false);
    }
  };

  if (activeForm === 'acknowledge') {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Officer Name" 
          className="input-field py-1 text-xs w-24"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          autoFocus
        />
        <button className="btn-success flex items-center gap-1" onClick={() => handleSubmit('acknowledge')} disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Confirm'}
        </button>
        <button className="text-slate-500 hover:text-slate-300 text-xs" onClick={() => setActiveForm(null)}>Cancel</button>
      </div>
    );
  }

  if (activeForm === 'escalate') {
    return (
      <div className="flex items-center gap-2">
        <input 
          type="text" 
          placeholder="Reason for escalation" 
          className="input-field py-1 text-xs w-32 border-amber-500/50 focus:border-amber-500 focus:ring-amber-500"
          value={inputValue}
          onChange={e => setInputValue(e.target.value)}
          autoFocus
        />
        <button className="btn-warn flex items-center gap-1" onClick={() => handleSubmit('escalate')} disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Escalate'}
        </button>
        <button className="text-slate-500 hover:text-slate-300 text-xs" onClick={() => setActiveForm(null)}>Cancel</button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {alert.status === 'active' && (
        <button className="btn-success flex items-center gap-1" onClick={() => setActiveForm('acknowledge')}>
          <UserCheck size={12} /> Ack
        </button>
      )}
      
      {(alert.status === 'active' || alert.status === 'acknowledged') && (
        <button className="btn-warn flex items-center gap-1" onClick={() => setActiveForm('escalate')}>
          <ChevronUp size={12} /> Escalate
        </button>
      )}

      {(alert.status === 'acknowledged' || alert.status === 'escalated') && (
        <button className="btn-ghost flex items-center gap-1 text-emerald-500 hover:bg-emerald-950 hover:text-emerald-400" onClick={() => handleSubmit('resolve')} disabled={loading}>
          {loading ? <Loader2 size={12} className="animate-spin" /> : <CheckCheck size={12} />} Resolve
        </button>
      )}
    </div>
  );
}
