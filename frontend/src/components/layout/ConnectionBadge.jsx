import { Wifi, WifiOff } from 'lucide-react';
import { useStore } from '../../lib/store';

// ─── ConnectionBadge ──────────────────────────────────────────────────────────
// Reflects the current WebSocket connection status from Zustand store.
//  online     → solid green dot, 'LIVE',                  Wifi icon
//  offline    → pulsing amber dot, 'OFFLINE_DISCONNECTED', WifiOff icon
//  connecting → pulsing gray dot,  'CONNECTING...',        Wifi icon

export default function ConnectionBadge() {
  const socketStatus = useStore((s) => s.socketStatus);

  if (socketStatus === 'online') {
    return (
      <div className="flex items-center gap-2 text-emerald-400">
        {/* Solid green indicator */}
        <span className="relative flex h-2 w-2">
          <span className="inline-flex h-full w-full rounded-full bg-emerald-400" />
        </span>
        <Wifi className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase">
          LIVE
        </span>
      </div>
    );
  }

  if (socketStatus === 'offline') {
    return (
      <div className="flex items-center gap-2 text-amber-400">
        {/* Pulsing amber indicator */}
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
        </span>
        <WifiOff className="h-3.5 w-3.5" />
        <span className="font-mono text-[10px] font-semibold tracking-widest uppercase flash-warn">
          OFFLINE_DISCONNECTED
        </span>
      </div>
    );
  }

  // Default: 'connecting'
  return (
    <div className="flex items-center gap-2 text-slate-400">
      {/* Pulsing gray indicator */}
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-slate-400 opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-slate-500" />
      </span>
      <Wifi className="h-3.5 w-3.5" />
      <span className="font-mono text-[10px] font-semibold tracking-widest uppercase">
        CONNECTING...
      </span>
    </div>
  );
}
