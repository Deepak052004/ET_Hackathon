import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-slate-950 relative overflow-hidden">
      {/* Subtle grid background */}
      <div 
        className="absolute inset-0 opacity-5" 
        style={{ 
          backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', 
          backgroundSize: '40px 40px' 
        }} 
      />
      
      <div className="relative z-10 text-center">
        <div className="font-mono text-8xl font-bold text-red-600 mb-4 tracking-tighter">404</div>
        <div className="text-xl text-slate-400 mb-2 font-semibold tracking-wide">System Node Not Found</div>
        <div className="text-sm text-slate-600 mb-8 font-mono">Route Unresolved — Check Navigation Parameters</div>
        <Link to="/dashboard" className="btn-primary inline-flex items-center gap-2">
          <LayoutDashboard size={16}/> Return to Command Center
        </Link>
      </div>
    </div>
  );
}
