import React, { useEffect, useState } from 'react';
import { useStore } from '../lib/store';
import { socket } from '../lib/socket';
import { api } from '../lib/api';
import SectionHeader from '../components/ui/SectionHeader';
import StatusBadge from '../components/ui/StatusBadge';
import { Server, Activity, Settings2, Info } from 'lucide-react';

export default function Settings() {
  const socketStatus = useStore(state => state.socketStatus);
  const lastHeartbeat = useStore(state => state.lastHeartbeat);
  const [healthStatus, setHealthStatus] = useState(null);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    try {
      const res = await api.get('/api/health');
      setHealthStatus({ success: true, data: res });
    } catch (err) {
      setHealthStatus({ success: false, error: err.message || 'Connection failed' });
    } finally {
      setIsTesting(false);
    }
  };

  const forceReconnect = () => {
    socket.disconnect();
    setTimeout(() => socket.connect(), 500);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-6xl">
      {/* System Connection */}
      <div className="panel p-4 flex flex-col">
        <SectionHeader title="System Connection" icon={Server} />
        <div className="space-y-4 mt-2 flex-1">
          <div>
            <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">API Base URL</label>
            <input 
              type="text" 
              readOnly 
              className="input-field bg-slate-950 font-mono text-slate-400"
              value={import.meta.env.VITE_API_URL || 'http://localhost:8000'} 
            />
          </div>
          <div>
            <label className="text-xs text-slate-500 uppercase font-semibold mb-1 block">WebSocket Endpoint</label>
            <input 
              type="text" 
              readOnly 
              className="input-field bg-slate-950 font-mono text-slate-400"
              value={`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/socket.io/`} 
            />
          </div>
          <div className="pt-2">
            <button 
              className="btn-primary w-full" 
              onClick={testConnection}
              disabled={isTesting}
            >
              {isTesting ? 'Testing...' : 'Test Connection'}
            </button>
          </div>
          {healthStatus && (
            <div className={`p-3 rounded-sm border text-xs font-mono ${healthStatus.success ? 'bg-emerald-950/30 border-emerald-900 text-emerald-400' : 'bg-red-950/30 border-red-900 text-red-400'}`}>
              {healthStatus.success ? (
                <>
                  <div className="font-semibold text-emerald-300 mb-1">Status: OK</div>
                  <div>Version: {healthStatus.data?.version}</div>
                  <div>Timestamp: {healthStatus.data?.timestamp}</div>
                </>
              ) : (
                <>
                  <div className="font-semibold text-red-300 mb-1">Status: FAILED</div>
                  <div>{healthStatus.error}</div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* WebSocket Status */}
      <div className="panel p-4 flex flex-col">
        <SectionHeader title="WebSocket Stream" icon={Activity} />
        <div className="space-y-6 mt-2 flex-1">
          <div className="flex items-center justify-between bg-slate-950 p-4 rounded-sm border border-slate-800">
            <div>
              <div className="text-xs text-slate-500 uppercase font-semibold mb-1">Current State</div>
              <div className="font-mono text-xs text-slate-400 mt-1">
                Last Heartbeat: {lastHeartbeat ? new Date(lastHeartbeat).toLocaleTimeString() : 'Never'}
              </div>
            </div>
            <StatusBadge 
              status={socketStatus === 'online' ? 'normal' : socketStatus === 'connecting' ? 'active' : 'critical'} 
              label={socketStatus.toUpperCase()} 
            />
          </div>
          
          <button 
            className="btn-ghost border border-slate-700 w-full hover:border-slate-500" 
            onClick={forceReconnect}
          >
            Force Reconnect Socket
          </button>
        </div>
      </div>

      {/* Thresholds Ref */}
      <div className="panel p-4 md:col-span-2">
        <SectionHeader title="Sensor Thresholds Reference" icon={Settings2} />
        <div className="overflow-x-auto mt-2">
          <table className="data-table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Unit</th>
                <th>Warning</th>
                <th>Critical</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="font-mono text-xs">GAS_H2S</td><td>ppm</td><td className="text-amber-400 font-mono">5</td><td className="text-red-400 font-mono">10</td></tr>
              <tr><td className="font-mono text-xs">GAS_CH4</td><td>ppm</td><td className="text-amber-400 font-mono">35</td><td className="text-red-400 font-mono">50</td></tr>
              <tr><td className="font-mono text-xs">GAS_CO</td><td>ppm</td><td className="text-amber-400 font-mono">35</td><td className="text-red-400 font-mono">50</td></tr>
              <tr><td className="font-mono text-xs">GAS_O2</td><td>%</td><td className="text-amber-400 font-mono">18 (low)</td><td className="text-red-400 font-mono">16 (low)</td></tr>
              <tr><td className="font-mono text-xs">TEMPERATURE</td><td>°C</td><td className="text-amber-400 font-mono">90</td><td className="text-red-400 font-mono">110</td></tr>
              <tr><td className="font-mono text-xs">PRESSURE</td><td>bar</td><td className="text-amber-400 font-mono">5.5</td><td className="text-red-400 font-mono">7.0</td></tr>
              <tr><td className="font-mono text-xs">VIBRATION</td><td>mm/s</td><td className="text-amber-400 font-mono">8</td><td className="text-red-400 font-mono">12</td></tr>
              <tr><td className="font-mono text-xs">HUMIDITY</td><td>%RH</td><td className="text-amber-400 font-mono">85</td><td className="text-red-400 font-mono">95</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* About */}
      <div className="panel p-4 md:col-span-2 bg-cobalt/5 border-cobalt/20">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cobalt/20 rounded-full text-cobalt">
            <Info size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">SafetyNexus AI</h3>
            <div className="text-sm text-slate-400 mt-1">Enterprise Command Center Dashboard</div>
            <div className="flex gap-4 mt-3 text-xs text-slate-500 font-mono">
              <span>Frontend: v1.0.0</span>
              <span>Build Date: {new Date().toISOString().split('T')[0]}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
