import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { WifiOff, ShieldAlert } from 'lucide-react';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';
import { MOCK_ZONES } from '../../lib/mockData';

const PLANT_CENTER = [17.6869, 83.2186];
const ZOOM         = 16;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';

function riskColor(level) {
  switch (level?.toLowerCase()) {
    case 'critical': return '#FF3B30';
    case 'high':     return '#FF9500';
    case 'warning':  return '#FFCC00';
    case 'normal':   return '#00DAF3';
    default:         return '#00DAF3';
  }
}

function OfflineBanner() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[400] flex items-start justify-center pt-4">
      <div className="flex items-center gap-2 bg-error-container border border-error rounded-sm px-3 py-1.5 text-on-error-container text-xs font-mono font-bold uppercase tracking-widest shadow-lg">
        <WifiOff size={13} />
        Telemetry Offline — Showing last sync
      </div>
    </div>
  );
}

export default function HeatmapCanvas({ zones: propZones, loading }) {
  const storeZones     = useStore((s) => s.zones);
  const socketStatus   = useStore((s) => s.socketStatus);
  const [heatPts, setHeatPts] = useState([]);
  const [isEvacuating, setIsEvacuating] = useState(false);
  const [workers, setWorkers] = useState([]);

  const activeZones =
    storeZones?.length > 0 ? storeZones :
    propZones?.length  > 0 ? propZones  :
    MOCK_ZONES;

  useEffect(() => {
    let cancelled = false;
    api.get('/api/heatmap').then((res) => {
      if (!cancelled) setHeatPts(Array.isArray(res) ? res : res?.points ?? []);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const startEvacuation = () => {
    setIsEvacuating(true);
    // Spawn 40 workers around a critical zone (or center)
    const criticalZone = activeZones.find(z => z.risk_level?.toLowerCase() === 'critical') || activeZones[0];
    const centerLat = criticalZone?.center_lat || PLANT_CENTER[0];
    const centerLng = criticalZone?.center_lng || PLANT_CENTER[1];

    const initialWorkers = Array.from({ length: 40 }).map((_, i) => ({
      id: i,
      lat: centerLat + (Math.random() - 0.5) * 0.002,
      lng: centerLng + (Math.random() - 0.5) * 0.002,
      targetLat: PLANT_CENTER[0] + (Math.random() - 0.5) * 0.03, // safe zones on edge
      targetLng: PLANT_CENTER[1] + (Math.random() - 0.5) * 0.03,
    }));
    setWorkers(initialWorkers);
  };

  useEffect(() => {
    if (!isEvacuating) return;
    const interval = setInterval(() => {
      setWorkers(prev => prev.map(w => {
        const dLat = w.targetLat - w.lat;
        const dLng = w.targetLng - w.lng;
        return {
          ...w,
          lat: w.lat + dLat * 0.05,
          lng: w.lng + dLng * 0.05
        };
      }));
    }, 100);
    return () => clearInterval(interval);
  }, [isEvacuating]);

  if (loading) {
    return <div className="animate-pulse bg-surface-container-high h-[440px] w-full border border-outline-variant" />;
  }

  return (
    <div className="h-[440px] w-full border border-outline-variant overflow-hidden relative shadow-inner">
      {socketStatus === 'offline' && <OfflineBanner />}

      {/* Evacuation Button Overlay */}
      <div className="absolute top-4 right-4 z-[500]">
        {!isEvacuating ? (
          <button 
            onClick={startEvacuation}
            className="bg-error/20 text-error border border-error/50 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-error hover:text-on-error transition-colors flex items-center gap-2 animate-pulse shadow-lg backdrop-blur-sm rounded"
          >
            <span className="material-symbols-outlined text-[14px]">directions_run</span>
            Simulate Evacuation
          </button>
        ) : (
          <div className="bg-error text-on-error px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest flex items-center gap-2 shadow-lg rounded">
            <span className="material-symbols-outlined text-[14px] animate-spin">refresh</span>
            EVACUATION IN PROGRESS...
          </div>
        )}
      </div>

      {/* Evacuation Danger Overlay (Expands out) */}
      {isEvacuating && (
        <div className="absolute inset-0 pointer-events-none z-[450] flex items-center justify-center">
          <div className="w-[10px] h-[10px] bg-error/20 rounded-full animate-[ping_4s_ease-out_infinite] scale-[15]"></div>
        </div>
      )}

      <MapContainer
        center={PLANT_CENTER}
        zoom={ZOOM}
        style={{ height: '100%', width: '100%', background: '#0a0a0a' }}
        zoomControl={true}
        attributionControl={false}
      >
        <TileLayer url={TILE_URL} />

        {activeZones.map((zone) => {
          const color = riskColor(zone.risk_level);
          const isCritical = zone.risk_level?.toLowerCase() === 'critical';
          
          return (
            <div key={zone.zone_id || zone.zone_name}>
              {/* Outer pulsing ring for critical/high zones */}
              {(isCritical || zone.risk_level?.toLowerCase() === 'high') && (
                <CircleMarker
                  center={[zone.center_lat || PLANT_CENTER[0], zone.center_lng || PLANT_CENTER[1]]}
                  radius={isCritical ? 35 : 25}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.1,
                    weight: 1,
                    className: 'animate-ping origin-center'
                  }}
                />
              )}
              
              {/* Interactive Core Node */}
              <CircleMarker
                center={[zone.center_lat || PLANT_CENTER[0], zone.center_lng || PLANT_CENTER[1]]}
                radius={12}
                pathOptions={{
                  color: color,
                  fillColor: color,
                  fillOpacity: 0.8,
                  weight: 3,
                  className: 'cursor-pointer drop-shadow-md'
                }}
              >
                <Popup className="industrial-popup">
                  <div className="bg-surface-container-highest p-4 border border-outline-variant text-on-surface w-[260px] shadow-2xl rounded-sm">
                    <div className="flex items-center gap-2 border-b border-outline-variant pb-3 mb-3">
                      {isCritical && <ShieldAlert size={16} className="text-error animate-pulse" />}
                      <span className="font-mono text-sm font-bold text-primary uppercase tracking-widest break-words">
                        {zone.zone_name || 'Unknown Zone'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono mb-2">
                      <span className="text-on-surface-variant uppercase">Risk Score</span>
                      <span className={`font-bold text-lg ${isCritical ? 'text-error' : 'text-primary'}`}>
                        {zone.risk_score?.toFixed(1) ?? '—'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono mb-2">
                      <span className="text-on-surface-variant uppercase">Active Permits</span>
                      <span className="font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface">
                        {zone.active_permits ?? 0}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-xs font-mono mb-3">
                      <span className="text-on-surface-variant uppercase">Workers on Site</span>
                      <span className="font-bold bg-surface-container px-2 py-0.5 rounded text-on-surface">
                        {zone.workers_on_site ?? 0}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-mono mt-3 pt-3 border-t border-outline-variant/50 bg-surface-container p-2 rounded-sm">
                      <span className="text-on-surface-variant uppercase tracking-widest">Status</span>
                      <span className={`font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${
                        zone.risk_level?.toLowerCase() === 'critical' ? 'bg-error text-on-error animate-pulse' :
                        zone.risk_level?.toLowerCase() === 'high'     ? 'bg-orange-500 text-white' :
                        zone.risk_level?.toLowerCase() === 'warning'  ? 'bg-tertiary-container text-on-tertiary-container' :
                                                                        'bg-primary/20 text-primary'
                      }`}>
                        {zone.risk_level || 'NORMAL'}
                      </span>
                    </div>
                  </div>
                </Popup>
              </CircleMarker>
            </div>
          );
        })}

        {/* Worker Particles for Evacuation */}
        {workers.map(w => (
          <CircleMarker
            key={w.id}
            center={[w.lat, w.lng]}
            radius={3}
            pathOptions={{
              color: '#fff',
              fillColor: '#00DAF3',
              fillOpacity: 1,
              weight: 1
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
