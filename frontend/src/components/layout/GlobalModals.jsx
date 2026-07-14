import React, { useState, useEffect } from 'react';
import { useStore } from '../../lib/store';

export default function GlobalModals() {
  const activeModal = useStore((s) => s.activeModal);
  const closeModal = useStore((s) => s.closeModal);

  if (!activeModal) return null;

  const renderContent = () => {
    switch (activeModal) {
      case 'terminal':
        return (
          <div className="w-full max-w-2xl bg-surface-container-highest border border-primary p-1 shadow-[0_0_30px_rgba(0,218,243,0.15)] flex flex-col h-[400px]">
            <div className="bg-surface-container-high border-b border-primary/30 px-3 py-2 flex justify-between items-center">
              <span className="font-mono text-xs font-bold text-primary tracking-widest">NEXUS_TERMINAL // SECURE_SHELL</span>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="p-4 font-mono text-[11px] text-on-surface-variant overflow-y-auto flex-1 flex flex-col gap-1">
              <p className="text-primary">&gt; Establishing secure connection to core mainframe...</p>
              <p>&gt; Connection established.</p>
              <p>&gt; Auth: ENG-001 (Level 4 Clearance)</p>
              <p className="text-tertiary-container">&gt; Warning: Active permit conflict detected in Sector 7G.</p>
              <p>&gt; Polling latest sensor telemetry...</p>
              <p>&gt; OK.</p>
              <p className="mt-4 flex items-center gap-2"><span className="text-primary">&gt; _</span><span className="animate-pulse w-2 h-4 bg-primary inline-block"></span></p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div className="w-full max-w-md bg-surface-container-highest border border-outline-variant p-6 shadow-2xl flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-outline-variant pb-4">
              <h2 className="font-display text-lg text-primary font-bold uppercase tracking-widest">System Config</h2>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-on-surface">Auto-Sync Telemetry</span>
                <input type="checkbox" defaultChecked className="toggle toggle-primary" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-on-surface">Dark Mode Enforcement</span>
                <input type="checkbox" defaultChecked className="toggle toggle-primary" />
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-on-surface">AI Risk Sensitivity</span>
                <input type="range" min="1" max="100" defaultValue="75" className="w-32 accent-primary" />
              </div>
            </div>
          </div>
        );
      case 'notifications':
        return (
          <div className="absolute top-16 right-8 w-80 bg-surface-container-highest border border-outline-variant shadow-2xl flex flex-col">
            <div className="bg-surface-container-high px-4 py-3 flex justify-between items-center border-b border-outline-variant">
              <span className="font-mono text-xs font-bold text-on-surface uppercase">Alerts Center</span>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="p-4 flex flex-col gap-3 max-h-64 overflow-y-auto">
              <div className="border-l-2 border-error pl-3">
                <p className="font-mono text-[10px] text-error font-bold">Zone D - H2S Spike</p>
                <p className="font-mono text-[9px] text-on-surface-variant">2 mins ago</p>
              </div>
              <div className="border-l-2 border-tertiary-container pl-3">
                <p className="font-mono text-[10px] text-tertiary-container font-bold">Permit Conflict Detected</p>
                <p className="font-mono text-[9px] text-on-surface-variant">15 mins ago</p>
              </div>
              <div className="border-l-2 border-primary pl-3">
                <p className="font-mono text-[10px] text-primary font-bold">System Backup Complete</p>
                <p className="font-mono text-[9px] text-on-surface-variant">1 hour ago</p>
              </div>
            </div>
          </div>
        );
      case 'emergency':
        return (
          <div className="w-full max-w-xl bg-error-container border-2 border-error p-8 shadow-[0_0_50px_rgba(255,59,48,0.3)] flex flex-col items-center text-center gap-6 animate-in zoom-in-95">
            <div className="w-20 h-20 rounded-full bg-error flex items-center justify-center animate-pulse">
              <span className="material-symbols-outlined text-4xl text-on-error">warning</span>
            </div>
            <div>
              <h2 className="font-display text-3xl text-error font-bold tracking-tighter uppercase mb-2">Initiate Emergency Shutdown?</h2>
              <p className="font-mono text-xs text-on-error-container font-bold">This action will cut power to all heavy machinery in Sector 7G and dispatch emergency response protocols. This action is irreversible.</p>
            </div>
            <div className="flex gap-4 w-full mt-4">
              <button onClick={closeModal} className="flex-1 py-3 bg-surface-container-highest text-on-surface font-mono text-xs uppercase font-bold tracking-widest border border-outline-variant hover:bg-surface-container-high transition-colors">Cancel</button>
              <button onClick={() => { alert("SHUTDOWN INITIATED."); closeModal(); }} className="flex-1 py-3 bg-error text-on-error font-mono text-xs uppercase font-bold tracking-widest hover:bg-error/90 transition-colors">Confirm Stop</button>
            </div>
          </div>
        );
      case 'logs':
        return (
          <div className="w-full max-w-4xl bg-surface-container border border-outline-variant p-6 shadow-2xl flex flex-col h-[600px]">
            <div className="flex justify-between items-center border-b border-outline-variant pb-4 mb-4">
              <h2 className="font-display text-lg text-primary font-bold uppercase tracking-widest">Historical Event Logs</h2>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="flex-1 overflow-y-auto border border-outline-variant/30 bg-surface-container-lowest p-4 font-mono text-[10px]">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-on-surface-variant border-b border-outline-variant/30">
                    <th className="pb-2 font-normal">TIMESTAMP</th>
                    <th className="pb-2 font-normal">EVENT_ID</th>
                    <th className="pb-2 font-normal">TYPE</th>
                    <th className="pb-2 font-normal">DETAILS</th>
                  </tr>
                </thead>
                <tbody className="text-on-surface">
                  <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="py-2 text-primary">2026-07-14T02:15:00Z</td>
                    <td className="py-2">SYS_UPDATE</td>
                    <td className="py-2">INFO</td>
                    <td className="py-2">Mainframe synchronization completed.</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="py-2 text-primary">2026-07-14T01:42:11Z</td>
                    <td className="py-2">PERMIT_AUTH</td>
                    <td className="py-2">WARN</td>
                    <td className="py-2 text-tertiary-container">Confined Space permit PTW-2026-0812 approved with active conflict.</td>
                  </tr>
                  <tr className="border-b border-outline-variant/10 hover:bg-surface-container-low transition-colors">
                    <td className="py-2 text-primary">2026-07-14T00:05:33Z</td>
                    <td className="py-2">SENSOR_DROP</td>
                    <td className="py-2">ERROR</td>
                    <td className="py-2 text-error">Zone D O2 sensor disconnected unexpectedly.</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      case 'drone':
        return (
          <div className="w-full max-w-5xl bg-[#050505] border border-outline-variant p-2 shadow-2xl flex flex-col">
            <div className="bg-surface-container-highest px-4 py-3 flex justify-between items-center border-b border-outline-variant mb-2">
              <div className="flex items-center gap-4">
                <span className="font-mono text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span> LIVE: Coke-Oven Drone Surveillance
                </span>
                <span className="font-mono text-[9px] text-on-surface-variant">ALT: 45m | BATT: 82%</span>
              </div>
              <button onClick={closeModal} className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-sm">close</span></button>
            </div>
            <div className="relative w-full aspect-video bg-black overflow-hidden group">
              {/* Fake drone video feed background */}
              <div className="absolute inset-0 opacity-40 bg-[url('https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center mix-blend-luminosity grayscale contrast-150 animate-[pulse_4s_ease-in-out_infinite]" />
              
              {/* Scanline overlay */}
              <div className="absolute inset-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjIiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4yIi8+PC9zdmc+')] opacity-50" />
              
              {/* Drone HUD crosshairs */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[400px] h-[400px] border border-primary/20 rounded-full flex items-center justify-center">
                  <div className="w-4 h-4 border-t-2 border-l-2 border-primary absolute top-4 left-4" />
                  <div className="w-4 h-4 border-t-2 border-r-2 border-primary absolute top-4 right-4" />
                  <div className="w-4 h-4 border-b-2 border-l-2 border-primary absolute bottom-4 left-4" />
                  <div className="w-4 h-4 border-b-2 border-r-2 border-primary absolute bottom-4 right-4" />
                  <div className="w-[1px] h-full bg-primary/20 absolute left-1/2 -translate-x-1/2" />
                  <div className="h-[1px] w-full bg-primary/20 absolute top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Simulated AI Vision Bounding Box */}
              <div className="absolute top-[30%] left-[45%] w-32 h-40 border-2 border-error animate-[pulse_2s_ease-in-out_infinite]">
                <div className="absolute -top-6 left-0 bg-error text-on-error font-mono text-[9px] font-bold px-2 py-0.5 whitespace-nowrap">
                  H2S ENTRAPPED GAS DETECTED (98% CONF)
                </div>
                <div className="absolute -right-24 top-1/2 -translate-y-1/2 font-mono text-[8px] text-error flex flex-col gap-1">
                  <span>VOL: 45ppm</span>
                  <span>TEMP: 34°C</span>
                </div>
              </div>

              {/* Data Overlay */}
              <div className="absolute top-4 left-4 font-mono text-[10px] text-primary flex flex-col gap-1">
                <span>REC_MODE: ACTIVE</span>
                <span>THERMAL: ONLINE</span>
                <span>AI_VISION: TRACKING</span>
              </div>
            </div>
          </div>
        );
      case 'rca':
        return <RCAModal closeModal={closeModal} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      {renderContent()}
    </div>
  );
}

function RCAModal({ closeModal }) {
  const [text, setText] = useState('');
  const fullText = `[SYSTEM] Initiating Generative AI Root Cause Analysis...
[AI] Cross-referencing real-time SCADA telemetry with historical incident corpora (Visakhapatnam Steel Plant dataset)...
[AI] Anomalous H2S gas accumulation detected in Zone D (Coke Oven Battery).
[AI] Correlating with active permit PTW-2026-0812 (Confined Space Entry).
[AI] Warning: Compound risk detected. Simultaneous maintenance operation and hazardous gas accumulation.
[AI] REGULATORY FLAG: Potential violation of OISD Guidelines and Factory Act Section 41 (Hazardous Processes).
[AI] CONCLUSION: High probability of entrapped gas explosion if PTW-2026-0812 continues.
[RECOMMENDATION] Autonomous Orchestrator deploying evacuation protocols for Coke Oven Battery. Revoking PTW-2026-0812.
[SYSTEM] End of Analysis.`;

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      setText(fullText.substring(0, index));
      index++;
      if (index > fullText.length) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full max-w-3xl bg-surface-container-highest border border-primary p-1 shadow-[0_0_40px_rgba(0,218,243,0.2)] flex flex-col h-[500px]">
      <div className="bg-surface-container-high border-b border-primary/30 px-4 py-3 flex justify-between items-center">
        <span className="font-mono text-sm font-bold text-primary tracking-widest flex items-center gap-2">
          <span className="material-symbols-outlined text-base animate-spin-slow">auto_awesome</span>
          AI ROOT CAUSE ANALYSIS
        </span>
        <button onClick={closeModal} className="text-on-surface-variant hover:text-error"><span className="material-symbols-outlined text-sm">close</span></button>
      </div>
      <div className="p-6 font-mono text-xs text-primary whitespace-pre-wrap overflow-y-auto flex-1 leading-relaxed">
        {text}
        <span className="animate-pulse bg-primary inline-block w-2 h-4 ml-1 align-middle"></span>
      </div>
      <div className="p-4 border-t border-primary/30 flex justify-end">
        <button 
          onClick={() => { alert("Report exported to safety database."); closeModal(); }}
          className="bg-primary text-on-primary px-6 py-2 font-mono text-xs font-bold uppercase tracking-widest hover:bg-primary/90 transition-colors"
        >
          EXPORT REPORT
        </button>
      </div>
    </div>
  );
}
