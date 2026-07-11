import React from 'react';
import { MOCK_SAFETY_BRIEF } from '../../lib/mockData';
import { Shield, AlertCircle, Info } from 'lucide-react';

export default function AiSafetyBrief() {
  // INTEGRATION POINT: When a backend endpoint for AI safety briefs exists,
  // replace MOCK_SAFETY_BRIEF with an API call and remove the demo mode banner.
  const data = MOCK_SAFETY_BRIEF;

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-sm overflow-hidden">
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-slate-100">
            <Shield size={18} className="text-cobalt" />
            <h3 className="text-sm font-semibold">Shift Safety Brief</h3>
          </div>
          <span className="text-xs text-slate-400">{data.shift}</span>
        </div>
        <div className="bg-blue-950 text-blue-400 text-[10px] px-2 py-1 rounded-sm inline-flex items-center gap-1 uppercase tracking-wider font-medium">
          <Info size={12} />
          Simulated · No backend endpoint
        </div>
      </div>
      
      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        <p className="text-sm text-slate-300 leading-relaxed">
          {data.summary}
        </p>
        
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-slate-400 uppercase">Key Risk Factors</h4>
          <ul className="space-y-2">
            {data.risk_factors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <AlertCircle size={14} className="text-amber-500 mt-0.5 flex-shrink-0" />
                <span className="text-xs text-slate-300">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="p-3 bg-slate-950/50 border-t border-slate-800 flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span>GENERATED_AT</span>
        <span>{new Date(data.generated_at).toLocaleTimeString()}</span>
      </div>
    </div>
  );
}
