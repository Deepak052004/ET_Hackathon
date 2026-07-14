import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ConnectionBadge from './ConnectionBadge';
import { useStore } from '../../lib/store';

const PAGE_TITLES = {
  '/dashboard':    'Asset Map',
  '/investigation': 'Incident Protocol',
  '/permits':      'Permits',
  '/graph':        'Analytics',
  '/documents':    'Support',
  '/alerts':       'Telemetry',
  '/settings':     'System Config',
};

function getISTTime() {
  return new Date().toLocaleTimeString('en-IN', {
    timeZone:  'Asia/Kolkata',
    hour12:    false,
    hour:      '2-digit',
    minute:    '2-digit',
    second:    '2-digit',
  });
}

function getISTDate() {
  return new Date().toLocaleDateString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day:      '2-digit',
    month:    'short',
    year:     'numeric',
  });
}

export default function Header() {
  const location = useLocation();
  const [time, setTime] = useState(getISTTime);
  const [date, setDate] = useState(getISTDate);
  const openModal = useStore((s) => s.openModal);

  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] ??
    'SafetyNexus AI';

  useEffect(() => {
    const tick = setInterval(() => {
      setTime(getISTTime());
      setDate(getISTDate());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <header className="fixed top-0 w-full z-50 h-16 bg-surface-container border-b border-outline-variant flex justify-between items-center px-8">
      <div className="flex items-center gap-8">
        <span className="font-display text-xl font-bold text-primary tracking-tight">SafetyNexus AI</span>
        <div className="hidden md:flex gap-6 items-center h-full h-16">
          <div className="h-full flex items-center px-2 text-on-surface-variant font-mono text-xs uppercase">
            Network Status: <span className="ml-2 text-primary"><ConnectionBadge /></span>
          </div>
          <div className="h-full flex items-center px-2 text-primary border-b-2 border-primary font-mono text-xs uppercase">
            {pageTitle}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex gap-2 mr-4">
          <button 
            onClick={() => openModal('notifications')}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">notifications_active</span>
          </button>
          <button 
            onClick={() => openModal('settings')}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined">settings</span>
          </button>
          <button 
            onClick={() => openModal('terminal')}
            className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:bg-surface-bright transition-colors"
          >
            <span className="material-symbols-outlined text-primary">terminal</span>
          </button>
        </div>
        <div className="flex flex-col items-end leading-none mr-4">
          <span className="font-mono text-lg font-semibold text-primary">{time}</span>
          <span className="font-mono text-[10px] text-on-surface-variant">{date} IST</span>
        </div>
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('toast', { detail: 'System Diagnostic Check... ALL SYSTEMS NOMINAL.' }))}
          className="bg-primary text-on-primary px-4 py-2 font-mono text-xs font-bold uppercase tracking-widest active:scale-95 transition-transform duration-150 hover:bg-primary/90"
        >
          System Check
        </button>
      </div>
    </header>
  );
}
