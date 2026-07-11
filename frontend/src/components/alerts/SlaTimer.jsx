import React, { useState, useEffect } from 'react';

export default function SlaTimer({ slaDeadline, slaBreached }) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isNearBreach, setIsNearBreach] = useState(false);

  useEffect(() => {
    if (!slaDeadline || slaBreached) return;

    const deadline = new Date(slaDeadline).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const diff = deadline - now;

      if (diff <= 0) {
        setTimeLeft('0h 0m 0s');
        return;
      }

      setIsNearBreach(diff < 120000); // less than 2 minutes

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      
      let text = '';
      if (h > 0) text += `${h}h `;
      text += `${m}m ${s}s`;
      setTimeLeft(text);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [slaDeadline, slaBreached]);

  if (slaBreached) {
    return <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded-sm uppercase font-semibold">SLA Breached</span>;
  }

  if (!slaDeadline) return <span className="text-slate-500">—</span>;

  return (
    <span className={`font-mono text-xs ${isNearBreach ? 'text-amber-400 flash-warn' : 'text-slate-300'}`}>
      {timeLeft}
    </span>
  );
}
