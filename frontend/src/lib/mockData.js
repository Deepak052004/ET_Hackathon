// ─── Mock Data Fallback Registry ─────────────────────────────────────────────
// Used when:
//   (a) Backend is offline (socket disconnected)
//   (b) An endpoint exists but returns empty data on initial seed
//   (c) An endpoint is not yet wired (e.g. knowledge graph topology)
//
// INTEGRATION POINT: Each export is a named constant. When the real endpoint
// is ready, replace the mock in the relevant hook — the UI architecture stays unchanged.

// ── MOCK: Sensor readings (mirrors socket sensor-data payload) ────────────────
export const MOCK_SENSORS = [
  { sensor_uid: 'GAS_H2S-A-01', name: 'H₂S Sensor Zone A-01', type: 'GAS_H2S', zone_id: 1, value: 3.2, unit: 'ppm', status: 'normal', threshold_warning: 5, threshold_critical: 10, lat: 17.6870, lng: 83.2180, is_anomaly: false },
  { sensor_uid: 'GAS_CH4-B-01', name: 'CH₄ Sensor Zone B-01', type: 'GAS_CH4', zone_id: 2, value: 38.4, unit: 'ppm', status: 'warning', threshold_warning: 35, threshold_critical: 50, lat: 17.6869, lng: 83.2186, is_anomaly: true },
  { sensor_uid: 'TEMP-B-02', name: 'Temperature Zone B-02', type: 'TEMPERATURE', zone_id: 2, value: 94.1, unit: '°C', status: 'warning', threshold_warning: 90, threshold_critical: 110, lat: 17.6871, lng: 83.2188, is_anomaly: false },
  { sensor_uid: 'GAS_CO-C-01', name: 'CO Sensor Zone C-01', type: 'GAS_CO', zone_id: 3, value: 12.5, unit: 'ppm', status: 'normal', threshold_warning: 35, threshold_critical: 50, lat: 17.6865, lng: 83.2175, is_anomaly: false },
  { sensor_uid: 'PRESS-B-01', name: 'Pressure Zone B-01', type: 'PRESSURE', zone_id: 2, value: 6.2, unit: 'bar', status: 'warning', threshold_warning: 5.5, threshold_critical: 7.0, lat: 17.6868, lng: 83.2184, is_anomaly: false },
  { sensor_uid: 'VIB-D-01', name: 'Vibration Zone D-01', type: 'VIBRATION', zone_id: 4, value: 13.4, unit: 'mm/s', status: 'critical', threshold_warning: 8, threshold_critical: 12, lat: 17.6860, lng: 83.2170, is_anomaly: true },
  { sensor_uid: 'GAS_O2-A-01', name: 'O₂ Sensor Zone A-01', type: 'GAS_O2', zone_id: 1, value: 20.9, unit: '%', status: 'normal', threshold_warning: 18, threshold_critical: 16, lat: 17.6872, lng: 83.2182, is_anomaly: false },
  { sensor_uid: 'HUM-C-01', name: 'Humidity Zone C-01', type: 'HUMIDITY', zone_id: 3, value: 78.2, unit: '%RH', status: 'normal', threshold_warning: 85, threshold_critical: 95, lat: 17.6864, lng: 83.2176, is_anomaly: false },
];

// ── MOCK: Zones (mirrors socket risk-updates payload) ────────────────────────
export const MOCK_ZONES = [
  { zone_id: 1, zone_name: 'Zone A - Blast Furnace', risk_score: 42.3, risk_level: 'warning', classification: 'restricted', center_lat: 17.6870, center_lng: 83.2180, active_permits: 1, workers_on_site: 8 },
  { zone_id: 2, zone_name: 'Zone B - Hot Strip Mill', risk_score: 82.3, risk_level: 'critical', classification: 'hazardous', center_lat: 17.6869, center_lng: 83.2186, active_permits: 3, workers_on_site: 14 },
  { zone_id: 3, zone_name: 'Zone C - Coke Oven Battery', risk_score: 55.1, risk_level: 'high', classification: 'hazardous', center_lat: 17.6865, center_lng: 83.2175, active_permits: 2, workers_on_site: 6 },
  { zone_id: 4, zone_name: 'Zone D - Steel Melting Shop', risk_score: 71.8, risk_level: 'high', classification: 'hazardous', center_lat: 17.6860, center_lng: 83.2170, active_permits: 1, workers_on_site: 10 },
  { zone_id: 5, zone_name: 'Zone E - Raw Material Yard', risk_score: 18.2, risk_level: 'normal', classification: 'safe', center_lat: 17.6880, center_lng: 83.2195, active_permits: 0, workers_on_site: 4 },
];

// ── MOCK: Alerts (mirrors socket alerts payload) ──────────────────────────────
export const MOCK_ALERTS = [
  { alert_uid: 'ALT-MOCK-0001', title: 'Compound Risk Alert — Zone B', description: 'Multiple elevated risk factors detected in Hot Strip Mill.', severity: 'critical', source: 'compound_risk', status: 'active', zone_id: 2, zone_name: 'Zone B - Hot Strip Mill', priority_score: 95.0, compound_risk_score: 82.3, sla_deadline: new Date(Date.now() + 600000).toISOString(), sla_breached: false, regulatory_ref: 'OISD-GDN-105 §4.3', escalation_count: 0, created_at: new Date(Date.now() - 300000).toISOString() },
  { alert_uid: 'ALT-MOCK-0002', title: 'Vibration Anomaly — Zone D', description: 'VIB-D-01 exceeded critical threshold (13.4 mm/s).', severity: 'high', source: 'sensor', status: 'active', zone_id: 4, zone_name: 'Zone D - Steel Melting Shop', priority_score: 78.5, compound_risk_score: 71.8, sla_deadline: new Date(Date.now() + 1800000).toISOString(), sla_breached: false, regulatory_ref: null, escalation_count: 1, created_at: new Date(Date.now() - 900000).toISOString() },
  { alert_uid: 'ALT-MOCK-0003', title: 'Permit Conflict — Zone B', description: 'Hot work and confined space permits overlap in Zone B.', severity: 'high', source: 'permit_conflict', status: 'acknowledged', zone_id: 2, zone_name: 'Zone B - Hot Strip Mill', priority_score: 72.0, compound_risk_score: 65.0, sla_deadline: new Date(Date.now() + 3600000).toISOString(), sla_breached: false, regulatory_ref: 'OISD-GDN-105 §6.1', escalation_count: 0, created_at: new Date(Date.now() - 1800000).toISOString() },
  { alert_uid: 'ALT-MOCK-0004', title: 'CH₄ Elevated — Zone B', description: 'Methane reading at 38.4 ppm, warning threshold breached.', severity: 'warning', source: 'sensor', status: 'active', zone_id: 2, zone_name: 'Zone B - Hot Strip Mill', priority_score: 58.0, compound_risk_score: null, sla_deadline: null, sla_breached: false, regulatory_ref: null, escalation_count: 0, created_at: new Date(Date.now() - 120000).toISOString() },
];

// ── MOCK: Dashboard Summary ───────────────────────────────────────────────────
export const MOCK_DASHBOARD_SUMMARY = {
  active_alerts: 8, critical_alerts: 3, workers_on_site: 68,
  active_permits: 12, conflict_permits: 2,
  overall_risk_score: 82.3, overall_risk_level: 'critical',
};

// ── MOCK: Predictions (GET /api/predictions/failures) ────────────────────────
// CONFIRMED endpoint — this is the real payload shape from predictions.py
export const MOCK_PREDICTIONS = [
  { sensor_uid: 'VIB-D-01', equipment_tag: 'PUMP-D-401', zone_id: 4, zone_name: 'Zone D', rul_hours: 36, urgency: 'immediate', trend: 'degrading', predicted_failure_date: new Date(Date.now() + 36 * 3600000).toISOString() },
  { sensor_uid: 'VIB-B-02', equipment_tag: 'COMP-B-201', zone_id: 2, zone_name: 'Zone B', rul_hours: 96, urgency: 'short_term', trend: 'degrading', predicted_failure_date: new Date(Date.now() + 96 * 3600000).toISOString() },
  { sensor_uid: 'TEMP-B-02', equipment_tag: 'HEX-B-101', zone_id: 2, zone_name: 'Zone B', rul_hours: 240, urgency: 'medium_term', trend: 'stable', predicted_failure_date: new Date(Date.now() + 240 * 3600000).toISOString() },
  { sensor_uid: 'PRESS-C-01', equipment_tag: 'PUMP-C-301', zone_id: 3, zone_name: 'Zone C', rul_hours: 720, urgency: 'healthy', trend: 'stable', predicted_failure_date: null },
];

// ── MOCK: Anomalies (GET /api/predictions/anomalies) ─────────────────────────
export const MOCK_ANOMALIES = {
  anomalies: [
    { sensor_uid: 'VIB-D-01', name: 'Vibration Zone D-01', type: 'VIBRATION', zone_id: 4, anomaly_score: 0.91, is_anomaly: true, anomaly_level: 'critical' },
    { sensor_uid: 'GAS_CH4-B-01', name: 'CH₄ Sensor Zone B-01', type: 'GAS_CH4', zone_id: 2, anomaly_score: 0.73, is_anomaly: true, anomaly_level: 'high' },
    { sensor_uid: 'TEMP-B-02', name: 'Temperature Zone B-02', type: 'TEMPERATURE', zone_id: 2, anomaly_score: 0.62, is_anomaly: true, anomaly_level: 'high' },
  ],
  summary: { total_sensors: 42, anomalies_detected: 3, critical_anomalies: 1, anomaly_rate: 7.1 },
};

// ── MOCK: Knowledge Graph Topology ───────────────────────────────────────────
// INTEGRATION POINT: GET /api/knowledge/graph currently returns statistics only
// (node counts, relationship counts). It does NOT return renderable nodes/edges.
// When the backend adds topology output, replace MOCK_GRAPH_TOPOLOGY with real data.
// The GraphCanvas component reads from this export only.
export const MOCK_GRAPH_TOPOLOGY = {
  nodes: [
    { id: 'zone-2', label: 'Zone B - Hot Strip Mill', type: 'Zone' },
    { id: 'zone-4', label: 'Zone D - Steel Melting Shop', type: 'Zone' },
    { id: 'equip-vib-d', label: 'PUMP-D-401', type: 'Equipment' },
    { id: 'equip-comp-b', label: 'COMP-B-201', type: 'Equipment' },
    { id: 'worker-001', label: 'Worker W-001', type: 'Worker' },
    { id: 'permit-0847', label: 'PTW-2026-0847', type: 'Permit' },
    { id: 'inc-0023', label: 'INC-2024-0023 Gas Leak', type: 'Incident' },
    { id: 'reg-oisd105', label: 'OISD-GDN-105 §4.3', type: 'Regulation' },
    { id: 'permit-0812', label: 'PTW-2026-0812', type: 'Permit' },
    { id: 'inc-0001', label: 'INC-2024-0001 Methane Accum.', type: 'Incident' },
  ],
  edges: [
    { source: 'equip-vib-d', target: 'zone-4', type: 'LOCATED_IN' },
    { source: 'equip-comp-b', target: 'zone-2', type: 'LOCATED_IN' },
    { source: 'permit-0847', target: 'zone-2', type: 'COVERS_ZONE' },
    { source: 'permit-0812', target: 'zone-2', type: 'COVERS_ZONE' },
    { source: 'inc-0023', target: 'zone-2', type: 'OCCURRED_IN' },
    { source: 'inc-0001', target: 'zone-2', type: 'OCCURRED_IN' },
    { source: 'worker-001', target: 'permit-0847', type: 'PERFORMED_BY' },
    { source: 'inc-0023', target: 'reg-oisd105', type: 'REFERENCES' },
    { source: 'permit-0847', target: 'equip-comp-b', type: 'HAS_MAINTENANCE' },
    { source: 'inc-0001', target: 'equip-comp-b', type: 'CAUSED_BY' },
  ],
};

// ── MOCK: Workers ─────────────────────────────────────────────────────────────
// INTEGRATION POINT: worker-locations socket event emits workers:[] currently
// (backend comment: "Populated in Phase 3 with real worker tracking")
export const MOCK_WORKERS = [];

// ── MOCK: AI Safety Brief ─────────────────────────────────────────────────────
// No backend endpoint exists for AI-generated safety brief summaries.
// This is a static demo card. Label clearly as "Simulated".
export const MOCK_SAFETY_BRIEF = {
  generated_at: new Date().toISOString(),
  shift: 'Day Shift (06:00 – 14:00)',
  summary: 'Critical compound risk detected in Zone B (Hot Strip Mill) driven by overlapping permit conflicts and elevated CH₄ readings. Zone D requires immediate attention — vibration sensor PUMP-D-401 is projecting failure within 36 hours. Recommend suspending non-essential hot work in Zone B and scheduling emergency inspection for PUMP-D-401.',
  risk_factors: ['CH₄ elevated at 38.4 ppm (Zone B)', 'PUMP-D-401 RUL: 36h (Zone D)', 'Permit conflict PTW-0847 ↔ PTW-0812 (Zone B)', 'PPE violation detected by CV (Zone B)'],
  is_mock: true,
};
