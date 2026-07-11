import React from 'react';
import { X } from 'lucide-react';

export default function Drawer({ open, onClose, title, children, width = 'w-96' }) {
  if (!open) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40" 
        onClick={onClose}
      />
      <div 
        className={`fixed right-0 top-0 h-full bg-slate-900 border-l border-slate-800 z-50 flex flex-col animate-slide-in-right ${width}`}
      >
        <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-100 truncate pr-2">{title}</h2>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 focus:outline-none"
          >
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {children}
        </div>
      </div>
    </>
  );
}
