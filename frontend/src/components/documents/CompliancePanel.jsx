import React, { useState } from 'react';
import StatusBadge from '../ui/StatusBadge';
import SkeletonLoader from '../ui/SkeletonLoader';
import { ChevronDown, ChevronRight, AlertCircle, FileText } from 'lucide-react';

export default function CompliancePanel({ data, loading }) {
  const [collapsed, setCollapsed] = useState(false);

  if (loading) {
    return (
      <div className="flex gap-6 items-center p-4">
        <SkeletonLoader height="80px" width="80px" className="rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          {[...Array(4)].map((_, i) => <SkeletonLoader key={i} height="16px" />)}
        </div>
      </div>
    );
  }

  const { overall_score = 0, overall_status = 'warning', next_audit_due, categories = [], recent_violations = [] } = data || {};

  // Simple SVG arc calculation for 80x80 circle with r=32
  const circumference = 2 * Math.PI * 32;
  const strokeDasharray = `${(overall_score / 100) * circumference} ${circumference}`;
  
  let arcColor = '#10B981'; // safe
  if (overall_score < 60) arcColor = '#DC2626'; // critical
  else if (overall_score < 80) arcColor = '#F59E0B'; // warning

  return (
    <div className="flex flex-col">
      <div 
        className="flex items-center justify-between cursor-pointer group"
        onClick={() => setCollapsed(!collapsed)}
      >
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <svg width="48" height="48" className="transform -rotate-90">
              <circle cx="24" cy="24" r="20" stroke="#1E293B" strokeWidth="4" fill="none" />
              <circle 
                cx="24" cy="24" r="20" 
                stroke={arcColor} 
                strokeWidth="4" 
                fill="none" 
                strokeLinecap="round"
                strokeDasharray={strokeDasharray}
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-mono text-xs font-semibold text-slate-100">{Math.round(overall_score)}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold text-slate-100">Enterprise Compliance Score</h3>
              <StatusBadge status={overall_status === 'critical' ? 'critical' : overall_status === 'warning' ? 'warning' : 'safe'} label={overall_status} size="sm" />
            </div>
            {next_audit_due && (
              <div className="text-xs text-slate-500 mt-0.5">Next Audit Due: {new Date(next_audit_due).toLocaleDateString()}</div>
            )}
          </div>
        </div>
        <button className="text-slate-500 group-hover:text-slate-300 transition-colors p-2">
          {collapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="mt-6 space-y-6 animate-fade-in-down">
          {/* Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(cat => (
              <div key={cat.name} className="bg-slate-900 border border-slate-800 p-3 rounded-sm flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 truncate pr-2">{cat.name}</span>
                  <span className="font-mono text-slate-200">{cat.score}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-800 rounded-sm overflow-hidden">
                  <div 
                    className={`h-full ${cat.score < 60 ? 'bg-red-500' : cat.score < 80 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${cat.score}%` }}
                  />
                </div>
                {cat.violations > 0 && (
                  <div className="text-[10px] text-amber-500 mt-1">{cat.violations} Active Violations</div>
                )}
              </div>
            ))}
          </div>

          {/* Recent Violations */}
          {recent_violations.length > 0 && (
            <div className="border-t border-slate-800 pt-4">
              <h4 className="text-xs uppercase font-semibold text-slate-500 mb-3 flex items-center gap-2">
                <AlertCircle size={14} className="text-amber-500" /> Recent Violations
              </h4>
              <div className="space-y-2">
                {recent_violations.map((violation, idx) => (
                  <ViolationItem key={idx} violation={violation} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ViolationItem({ violation }) {
  const [open, setOpen] = useState(false);
  
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-sm">
      <div 
        className="p-3 flex items-center gap-3 cursor-pointer hover:bg-slate-800/50"
        onClick={() => setOpen(!open)}
      >
        <span className="font-mono text-xs text-amber-500 w-24 flex-shrink-0">{violation.rule_id}</span>
        <StatusBadge status={violation.severity === 'critical' ? 'critical' : violation.severity === 'major' ? 'high' : 'warning'} label={violation.severity} size="sm" />
        <span className="text-sm text-slate-300 truncate flex-1">{violation.title}</span>
        {open ? <ChevronDown size={14} className="text-slate-500" /> : <ChevronRight size={14} className="text-slate-500" />}
      </div>
      
      {open && (
        <div className="p-3 border-t border-slate-800 bg-slate-950/50 text-xs">
          <div className="flex gap-2">
            <FileText size={14} className="text-slate-500 mt-0.5 flex-shrink-0" />
            <div className="text-slate-400">
              <span className="text-slate-300 font-semibold block mb-1">Required Remediation:</span>
              {violation.remediation || 'No remediation steps provided.'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
