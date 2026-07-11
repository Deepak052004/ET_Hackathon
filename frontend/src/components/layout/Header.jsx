import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ConnectionBadge from './ConnectionBadge';

// ─── Page title map ───────────────────────────────────────────────────────────
const PAGE_TITLES = {
  '/dashboard':    'Operations Command Center',
  '/investigation': 'Incident Investigation',
  '/permits':      'Permit Intelligence Console',
  '/graph':        'Knowledge Graph Explorer',
  '/documents':    'Document & Compliance Corpus',
  '/alerts':       'Security Alert Console',
  '/settings':     'System Configuration',
};

// ─── IST clock helper ─────────────────────────────────────────────────────────
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

// ─── Header ───────────────────────────────────────────────────────────────────
export default function Header() {
  const location = useLocation();
  const [time, setTime] = useState(getISTTime);
  const [date, setDate] = useState(getISTDate);

  // Derive page title from current path (exact match first, then prefix)
  const pageTitle =
    PAGE_TITLES[location.pathname] ??
    Object.entries(PAGE_TITLES).find(([k]) => location.pathname.startsWith(k))?.[1] ??
    'SafetyNexus AI';

  // Live IST clock — updates every second
  useEffect(() => {
    const tick = setInterval(() => {
      setTime(getISTTime());
      setDate(getISTDate());
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  return (
    <header className="h-16 flex items-center justify-between px-6 bg-slate-900 border-b border-slate-800 flex-shrink-0">
      {/* ── Left: page title ──────────────────────────────────────────────── */}
      <div className="flex flex-col leading-tight">
        <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
          {pageTitle}
        </h1>
        <span className="text-xs text-slate-500 font-mono">
          SafetyNexus AI · IntelliPlant
        </span>
      </div>

      {/* ── Center: live IST clock ────────────────────────────────────────── */}
      <div className="flex flex-col items-center leading-tight select-none">
        <span className="font-mono text-lg font-semibold text-slate-100 tabular-nums">
          {time}
        </span>
        <span className="font-mono text-[10px] text-slate-500 tracking-wide uppercase">
          {date} IST
        </span>
      </div>

      {/* ── Right: connection badge ───────────────────────────────────────── */}
      <div className="flex items-center">
        <ConnectionBadge />
      </div>
    </header>
  );
}
