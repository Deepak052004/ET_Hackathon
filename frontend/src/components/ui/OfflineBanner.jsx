import React from 'react';
import { useStore } from '../../lib/store';
import { WifiOff } from 'lucide-react';

export default function OfflineBanner() {
  const socketStatus = useStore((state) => state.socketStatus);

  if (socketStatus !== 'offline') return null;

  return (
    <div className="sticky top-0 z-40 w-full bg-amber-950 border-b border-amber-800 text-amber-300 text-xs px-6 py-1.5 flex items-center gap-2">
      <WifiOff size={14} className="animate-pulse" />
      <span>WebSocket Disconnected — Displaying cached data. Reconnecting…</span>
    </div>
  );
}
