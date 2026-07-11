import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import { WifiOff } from 'lucide-react';
import { useStore } from '../../lib/store';
import { api } from '../../lib/api';
import { MOCK_ZONES } from '../../lib/mockData';

// ─── HeatmapCanvas ────────────────────────────────────────────────────────────
// Leaflet map rendering zone risk as coloured circle markers.
// Pulls zone list from Zustand (populated by socket risk-updates event).
// Additionally fetches GET /api/heatmap for supplemental heatmap data.

const PLANT_CENTER = [17.6869, 83.2186];
const ZOOM         = 14;

const TILE_URL = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
const TILE_ATTR = '&copy; <a href="https://carto.com/">CartoDB</a>';

function riskColor(level) {
  switch (level) {
    case 'critical': return '#DC2626';
    case 'high':     return '#F59E0B';
    case 'warning':  return '#F59E0B';
    case 'normal':   return '#10B981';
    default:         return '#64748B';
  }
}

function riskOpacity(level) {
  switch (level) {
    case 'critical': return 0.7;
    case 'high':     return 0.5;
    case 'warning':  return 0.4;
    case 'normal':   return 0.15;
    default:         return 0.2;
  }
}

// Extra heatmap circles from /api/heatmap
function HeatmapOverlay({ points }) {
  return points.map((pt, i) => (
    <CircleMarker
      key={`hm-${i}`}
      center={[pt.lat, pt.lng]}
      radius={pt.intensity ? Math.max(8, pt.intensity * 0.3) : 8}
      pathOptions={{
        color:       '#F59E0B',
        fillColor:   '#F59E0B',
        fillOpacity: 0.15,
        weight:      0,
      }}
    />
  ));
}

// Offline banner overlaid on the map
function OfflineBanner() {
  return (
    <div className="absolute inset-0 pointer-events-none z-[400] flex items-start justify-center pt-4">
      <div className="flex items-center gap-2 bg-amber-950/90 border border-amber-700 rounded-sm px-3 py-1.5 text-amber-400 text-xs font-medium">
        <WifiOff size={13} />
        Offline — showing last-known zone data
      </div>
    </div>
  );
}

// Props: zones (array), loading (bool)
export default function HeatmapCanvas({ zones: propZones, loading }) {
  const storeZones     = useStore((s) => s.zones);
  const socketStatus   = useStore((s) => s.socketStatus);
  const [heatPts, setHeatPts] = useState([]);

  // Merge: prefer Zustand live data, fall back to prop zones, then MOCK_ZONES
  const activeZones =
    storeZones?.length > 0 ? storeZones :
    propZones?.length  > 0 ? propZones  :
    MOCK_ZONES;

  // Fetch supplemental heatmap data
  useEffect(() => {
    let cancelled = false;
    // INTEGRATION POINT: replace with real API call when endpoint is ready
    api.get('/api/heatmap')
      .then((res) => {
        if (!cancelled) {
          setHeatPts(Array.isArray(res) ? res : res?.points ?? []);
        }
      })
      .catch(() => {
        // Fallback: just use zone centroids — heatmap endpoint optional
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="animate-pulse bg-slate-800 h-[440px] w-full rounded-sm" />;
  }

  return (
    <div className="h-[440px] w-full rounded-sm overflow-hidden relative">
      {socketStatus === 'offline' && <OfflineBanner />}

      <MapContainer
        center={PLANT_CENTER}
        zoom={ZOOM}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        attributionControl={true}
      >
        <TileLayer url={TILE_URL} attribution={TILE_ATTR} />

        {/* Zone risk circles */}
        {activeZones.map((zone) => (
          <CircleMarker
            key={zone.zone_id}
            center={[zone.center_lat, zone.center_lng]}
            radius={20}
            pathOptions={{
              color:       riskColor(zone.risk_level),
              fillColor:   riskColor(zone.risk_level),
              fillOpacity: riskOpacity(zone.risk_level),
              weight:      zone.risk_level === 'critical' ? 2 : 1,
            }}
          >
            <Popup>
              <div className="text-slate-100 min-w-[180px] space-y-1">
                <div className="font-semibold text-sm border-b border-slate-700 pb-1 mb-1">
                  {zone.zone_name}
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Risk Score</span>
                  <span className="font-mono font-semibold">{zone.risk_score?.toFixed(1) ?? '—'}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Active Permits</span>
                  <span className="font-mono">{zone.active_permits ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Workers On Site</span>
                  <span className="font-mono">{zone.workers_on_site ?? 0}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400">Level</span>
                  <span className={`font-mono uppercase text-xs ${
                    zone.risk_level === 'critical' ? 'text-red-400' :
                    zone.risk_level === 'high'     ? 'text-orange-400' :
                    zone.risk_level === 'warning'  ? 'text-amber-400' :
                                                     'text-emerald-400'
                  }`}>{zone.risk_level}</span>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        ))}

        {/* Supplemental heatmap overlay */}
        {heatPts.length > 0 && <HeatmapOverlay points={heatPts} />}
      </MapContainer>
    </div>
  );
}
