# 🚀 SafetyNexus AI — Shubhranshu Handoff Document

**From:** Deepak (Backend & AI Lead)
**Date:** July 7, 2026
**Project:** SafetyNexus AI — ET AI Hackathon 2026

> **TL;DR:** The entire backend is built and ready. You just need to `docker-compose up --build`, and all APIs + WebSocket + seeded data will be live at `http://localhost:8000`. This document tells you exactly what's available and how to use it.

---

## 📋 Table of Contents

1. [How to Run the Backend](#1-how-to-run-the-backend)
2. [Environment Setup for Your Next.js App](#2-environment-setup-for-your-nextjs-app)
3. [API Client Setup (Copy-Paste Ready)](#3-api-client-setup-copy-paste-ready)
4. [All REST API Endpoints](#4-all-rest-api-endpoints)
5. [Socket.io Real-Time Channels](#5-socketio-real-time-channels)
6. [Map & Geospatial Data](#6-map--geospatial-data)
7. [Enums & Constants Reference](#7-enums--constants-reference)
8. [Color Scheme for Risk Levels](#8-color-scheme-for-risk-levels)
9. [What Data is Pre-Seeded](#9-what-data-is-pre-seeded)
10. [Your Task Checklist (Phase-wise)](#10-your-task-checklist-phase-wise)
11. [Important Notes & Gotchas](#11-important-notes--gotchas)

---

## 1. How to Run the Backend

**Prerequisites:** Docker Desktop must be installed and running on your machine.

**Step 1:** Clone the repo and go to the project root:
```bash
cd ET
```

**Step 2:** Create a `.env` file from the template (only Gemini key is needed):
```bash
cp .env.example .env
```

Then open `.env` and paste the Gemini API key I'll share with you separately. If you don't have it, the backend still works — RAG and Permit AI will return fallback responses instead of Gemini-generated ones.

**Step 3:** Start everything with one command:
```bash
docker-compose up --build
```

**What this does:**
- Starts **PostgreSQL** (with PostGIS) on port `5432`
- Starts **Redis** on port `6379`
- Starts **Neo4j** on port `7474` (browser) / `7687` (bolt)
- Starts **ChromaDB** on port `8001`
- Builds and starts the **FastAPI backend** on port `8000`
- Automatically **seeds the database** with synthetic data (10 zones, 42+ sensors, 50+ permits, 100+ incidents, 60+ workers, alerts)
- Starts the **WebSocket broadcast loop** pushing live sensor data

**Step 4:** Verify it's working:
- Open `http://localhost:8000/api/health` → should return `{"status": "healthy"}`
- Open `http://localhost:8000/api/docs` → Swagger UI with all endpoints
- Open `http://localhost:8000/api/dashboard/summary` → KPI data

**To stop:** `Ctrl+C` then `docker-compose down`
**To restart fresh (wipe data):** `docker-compose down -v && docker-compose up --build`

---

## 2. Environment Setup for Your Next.js App

In your Next.js project root, create `.env.local`:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

> ⚠️ Add `.env.local` to your `.gitignore` — never commit this file.

Install the Socket.io client:
```bash
npm install socket.io-client
```

---

## 3. API Client Setup (Copy-Paste Ready)

Create these 3 files in your `lib/` directory. All your API calls should go through these — **never hardcode `localhost:8000` anywhere**.

### `lib/config.js`
```javascript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

**What this does:** Single source of truth for the backend URL. When we deploy, we just change the env variable and everything works.

---

### `lib/socket.js`
```javascript
import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

export const socket = io(API_BASE_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'],
});
```

**What this does:** Creates a single shared Socket.io connection. Import this in any component that needs real-time data. The backend auto-sends `initial-state` with all current data when you connect — so you don't need a separate API call for first load.

---

### `lib/api.js`
```javascript
import { API_BASE_URL } from './config';

export const api = {
  get: (path) => fetch(`${API_BASE_URL}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json()),
};

// Usage:
// const data = await api.get('/api/sensors');
// const result = await api.post('/api/query', { query: 'gas leaks in Zone B?' });
```

**What this does:** Simple fetch wrapper. Use `api.get()` for GET requests and `api.post()` for POST requests. All paths start with `/api/`.

---

## 4. All REST API Endpoints

Every endpoint below is **live and returning real data** from the seeded database.

---

### `GET /api/dashboard/summary`
**Use for:** Dashboard page — KPI cards (first thing the user sees)

```json
{
  "active_alerts": 8,
  "critical_alerts": 3,
  "workers_on_site": 68,
  "active_permits": 12,
  "conflict_permits": 2,
  "overall_risk_score": 82.3,
  "overall_risk_level": "critical",
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:** Display each field as a KPI card on the main dashboard:
- `active_alerts` → "Active Alerts" card (orange/red)
- `critical_alerts` → "Critical Alerts" badge inside the alerts card
- `workers_on_site` → "Workers On Site" card (blue)
- `active_permits` → "Active Permits" card
- `conflict_permits` → "Permit Conflicts" badge (red warning)
- `overall_risk_score` → Big risk gauge/score display (0-100)
- `overall_risk_level` → Color the gauge: `normal`=green, `warning`=yellow, `high`=orange, `critical`=red

---

### `GET /api/sensors`
**Use for:** Sensor data charts, sensor grid on dashboard
**Query params:** `?zone_id=2` (optional), `?sensor_type=GAS_CH4` (optional)

```json
{
  "sensors": [
    {
      "sensor_id": 1,
      "sensor_uid": "GAS_CH4-B-01",
      "name": "CH₄ Sensor Zone B-01",
      "type": "GAS_CH4",
      "zone_id": 2,
      "lat": 17.6869,
      "lng": 83.2186,
      "current_value": 22.4,
      "unit": "ppm",
      "status": "normal",
      "threshold_warning": 35.0,
      "threshold_critical": 50.0,
      "timestamp": "2026-07-07T15:00:00",
      "is_anomaly": false
    }
  ],
  "count": 42,
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `status` field: Color the sensor card/row — `"normal"`=green, `"warning"`=yellow, `"critical"`=red
- `current_value` + `unit`: Display as "22.4 ppm"
- `threshold_warning` & `threshold_critical`: Use to draw threshold lines on charts
- `lat`/`lng`: Plot sensor markers on the map
- For time-series charts, call this endpoint periodically OR use the Socket.io `sensor-data` channel (preferred)

---

### `GET /api/risk-score`
**Use for:** Risk score overview, risk breakdown per zone

```json
{
  "overall_risk_score": 82.3,
  "overall_risk_level": "critical",
  "zones": [
    {
      "zone_id": 2,
      "zone_name": "Zone B - Hot Strip Mill",
      "classification": "hazardous",
      "center_lat": 17.6868,
      "center_lng": 83.2185,
      "risk_score": 82.3,
      "risk_level": "critical",
      "factors": {
        "gas_risk": 65.0,
        "permit_risk": 90.0,
        "equipment_risk": 30.0,
        "personnel_risk": 45.0,
        "temporal_risk": 50.0,
        "history_risk": 60.0
      },
      "active_permits": 2,
      "workers_on_site": 6,
      "compound_multiplier": 1.6,
      "elevated_factors": 3
    }
  ],
  "critical_zones": 2,
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `overall_risk_score`: Main gauge on dashboard
- `zones[]`: Each zone is a row in a risk table or a segment on the map
- `factors`: Show as a radar/spider chart or 6 mini-bars for each zone — this is our **compound risk innovation** (the judges will ask about this!)
- `compound_multiplier`: Display this! It shows when multiple risk factors are elevated simultaneously (e.g., "1.6x compound multiplier" = 3 elevated factors interacting)

---

### `GET /api/heatmap`
**Use for:** The geospatial heatmap view (Leaflet.js/Mapbox)

Returns **GeoJSON FeatureCollection** — Leaflet can consume this directly.

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": { "type": "Point", "coordinates": [83.2185, 17.6868] },
      "properties": {
        "zone_id": 2,
        "zone_name": "Zone B - Hot Strip Mill",
        "risk_score": 82.3,
        "risk_level": "critical",
        "classification": "hazardous",
        "intensity": 0.823,
        "active_permits": 2,
        "workers_on_site": 6,
        "factors": { "gas_risk": 65.0, "permit_risk": 90.0 }
      }
    }
  ],
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- Pass `features` directly to Leaflet's `L.geoJSON()` or a heatmap layer
- `properties.intensity` (0-1) → Use as the heatmap weight/intensity
- `properties.risk_level` → Color the zone marker (green/yellow/orange/red)
- `geometry.coordinates` → Note: GeoJSON format is `[longitude, latitude]` (reversed from typical lat/lng!)
- On marker click, show a popup with zone details, risk factors, permit count, worker count

---

### `GET /api/alerts`
**Use for:** Alert Management Console, alert feed on dashboard
**Query params:** `?status=active`, `?severity=critical`, `?zone_id=2`, `?limit=50`

```json
{
  "alerts": [
    {
      "id": 1,
      "alert_uid": "ALT-20260702-0001",
      "title": "Compound Risk Alert — Zone B",
      "description": "Multiple elevated risk factors detected...",
      "severity": "critical",
      "source": "compound_risk",
      "status": "active",
      "zone_id": 2,
      "zone_name": "Zone B - Hot Strip Mill",
      "priority_score": 95.0,
      "compound_risk_score": 82.3,
      "acknowledged_by": null,
      "acknowledged_at": null,
      "sla_deadline": "2026-07-07T15:10:00",
      "sla_breached": false,
      "regulatory_ref": "OISD-GDN-105 §4.3",
      "escalation_count": 0,
      "created_at": "2026-07-07T15:00:00",
      "updated_at": "2026-07-07T15:00:00"
    }
  ],
  "counts": { "total": 8, "critical": 3, "high": 3, "warning": 2 },
  "timestamp": "2026-07-07T15:00:00"
}
```

**Alert actions (POST endpoints):**
```
POST /api/alerts/{alert_uid}/acknowledge   → Body: { "acknowledged_by": "Officer Name" }
POST /api/alerts/{alert_uid}/escalate      → Body: { "reason": "Requires plant manager approval" }
POST /api/alerts/{alert_uid}/resolve       → No body needed
```

**How to use this:**
- Show alerts as a list sorted by `priority_score` (highest first)
- Color-code by `severity`: `critical`=red, `high`=orange, `warning`=yellow, `info`=blue
- Show `source` as a badge (e.g., "COMPOUND RISK", "SENSOR", "PERMIT CONFLICT")
- Add action buttons: Acknowledge, Escalate, Resolve — each calls the respective POST endpoint
- Show `sla_breached` as a red "SLA BREACHED" badge when true
- `regulatory_ref` → Display as a small reference tag

---

### `GET /api/permits`
**Use for:** Permit Intelligence View, permit count on dashboard
**Query params:** `?status=active`, `?zone_id=2`, `?permit_type=HOT_WORK`

```json
{
  "permits": [
    {
      "id": 1,
      "permit_uid": "PTW-2026-0847",
      "permit_type": "HOT_WORK",
      "zone_id": 2,
      "zone_name": "Zone B - Hot Strip Mill",
      "status": "active",
      "issued_by": "Safety Officer Sharma",
      "crew_count": 4,
      "description": "Welding operations on pipe section",
      "risk_score": 72.5,
      "ai_recommendation": "approve_with_conditions",
      "ai_reasoning": "AI-generated text explaining why...",
      "has_conflict": true,
      "conflict_details": "Overlapping with confined space permit...",
      "start_time": "2026-07-07T08:00:00",
      "end_time": "2026-07-07T16:00:00",
      "remaining_minutes": 180,
      "is_overdue": false,
      "created_at": "2026-07-07T07:30:00"
    }
  ],
  "active_count": 12,
  "conflict_count": 2,
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- Show permits on the map as overlay icons (use `zone_id` to place them in the right zone)
- `has_conflict` = true → Red highlight on that permit row + show `conflict_details`
- `ai_recommendation`: Color-code — `"approve"`=green, `"approve_with_conditions"`=yellow, `"deny"`=red
- `remaining_minutes` → Show countdown timer on active permits
- `is_overdue` → Red badge "OVERDUE"

---

### `POST /api/permits/assess`
**Use for:** Permit creation form with AI-powered risk assessment

```json
// REQUEST:
{
  "permit_type": "HOT_WORK",
  "zone_id": 2,
  "description": "Welding on pipe P-304",
  "crew_count": 4,
  "start_time": "2026-07-07T10:00:00",
  "end_time": "2026-07-07T16:00:00",
  "issued_by": "Safety Officer Sharma"
}

// RESPONSE:
{
  "recommendation": "approve_with_conditions",
  "risk_score": 74.5,
  "reasoning": "Gemini-generated safety reasoning...",
  "conditions": [
    "Gas test required within 30 minutes of work commencement (OISD-GDN-105 §4.3)",
    "Fire watch must be posted throughout duration",
    "Coordinate with existing permit holders: PTW-2026-0812"
  ],
  "conflicts_detected": [
    {
      "permit_uid": "PTW-2026-0812",
      "permit_type": "CONFINED_SPACE",
      "conflict_reason": "Ignition source + restricted escape route",
      "conflict_risk": 0.9
    }
  ],
  "zone_classification": "hazardous",
  "current_gas_readings": ["GAS_CH4: 28.4 ppm (threshold: 50 ppm)"],
  "active_permits_in_zone": 1,
  "assessment_timestamp": "2026-07-07T15:00:00",
  "regulatory_refs": ["OISD-GDN-105", "Factory Act §36", "DGMS Circular 2019-07"]
}
```

**How to use this:** Build a form where the user selects permit type, zone, enters crew count, etc. On submit, call this endpoint and display the AI assessment as a card/panel below the form. Show conditions as a checklist, conflicts as warning cards.

---

### `GET /api/compliance`
**Use for:** Compliance Scorecard view

```json
{
  "overall_score": 72.5,
  "overall_status": "warning",
  "total_violations": 3,
  "critical_violations": 1,
  "categories": [
    { "name": "OISD", "total_rules": 4, "violations": 2, "score": 60 },
    { "name": "Factory Act", "total_rules": 2, "violations": 1, "score": 85 },
    { "name": "DGMS", "total_rules": 1, "violations": 0, "score": 100 },
    { "name": "IS Standards", "total_rules": 1, "violations": 0, "score": 100 }
  ],
  "violations": [
    {
      "rule_id": "OISD-105-4.3",
      "regulation": "OISD-GDN-105 §4.3",
      "title": "Gas Test Overdue for Hot Work Permit",
      "description": "...",
      "severity": "critical",
      "affected": ["PTW-2026-0812"],
      "remediation": "Conduct immediate gas test before allowing hot work to continue",
      "category": "OISD"
    }
  ],
  "last_audit": "2026-07-07T15:00:00",
  "next_audit_due": "2026-07-15T00:00:00",
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `overall_score` → Big circular gauge (72.5%)
- `categories[]` → Show as 4 horizontal bars or cards with individual scores
- `violations[]` → List as rows with severity badges, clickable to expand details
- `remediation` → Show as recommended action text

---

### `GET /api/incidents`
**Use for:** Incident Investigation View, historical data
**Query params:** `?severity=major`, `?incident_type=gas_leak`, `?zone_id=2`, `?limit=50`

```json
{
  "incidents": [
    {
      "id": 1,
      "incident_uid": "INC-2024-0001",
      "incident_type": "gas_leak",
      "severity": "major",
      "zone_id": 2,
      "zone_name": "Zone B - Hot Strip Mill",
      "title": "Methane gas accumulation during maintenance",
      "description": "During routine maintenance...",
      "root_cause": "Inadequate gas monitoring during welding operations",
      "workers_affected": 4,
      "injuries": 1,
      "fatalities": 0,
      "property_damage_inr": 250000,
      "occurred_at": "2025-03-15T10:30:00",
      "reported_at": "2025-03-15T11:00:00",
      "resolved_at": "2025-03-20T09:00:00"
    }
  ],
  "stats": { "total": 120, "fatalities": 2, "injuries": 18, "near_misses": 48 },
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `stats` → Summary cards at the top
- Show incidents as a timeline or list sorted by `occurred_at`
- `severity` → Badge color: `catastrophic`=dark red, `major`=red, `moderate`=orange, `minor`=yellow, `near_miss`=blue
- `property_damage_inr` → Format as ₹2,50,000
- For the AI-powered investigation, use `POST /api/query` (below)

---

### `POST /api/query`
**Use for:** RAG-powered natural language search (the "Ask SafetyNexus" feature)

```json
// REQUEST:
{ "query": "What gas leak incidents happened during maintenance?" }

// RESPONSE:
{
  "query": "What gas leak incidents happened during maintenance?",
  "answer": "Based on historical records, there have been 3 gas leak incidents during maintenance operations...",
  "sources": [
    {
      "incident_uid": "INC-2024-0023",
      "incident_type": "gas_leak",
      "severity": "major",
      "zone_name": "Zone B - Hot Strip Mill",
      "relevance_score": 0.87
    }
  ],
  "sources_count": 5,
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:** Create a search bar / chat-like interface. User types a question, call this endpoint, display the `answer` as markdown/text, and show `sources` as clickable reference cards below. `relevance_score` is 0-1 (higher = more relevant).

---

### `GET /api/health`
**Use for:** Connection status indicator in your UI header

```json
{
  "status": "healthy",
  "service": "SafetyNexus AI Backend",
  "version": "1.0.0",
  "timestamp": "2026-07-07T15:00:00"
}
```

---

### `GET /api/knowledge/graph`
**Use for:** Knowledge Graph overview / stats panel (stretch goal view)

```json
{
  "zone_count": 10,
  "equipment_count": 42,
  "permit_count": 50,
  "worker_count": 60,
  "incident_count": 100,
  "risk_count": 5,
  "relationship_count": 350,
  "relationship_types": [
    { "type": "LOCATED_IN", "count": 42 },
    { "type": "ASSIGNED_TO", "count": 60 },
    { "type": "ISSUED_FOR", "count": 50 },
    { "type": "OCCURRED_IN", "count": 100 }
  ],
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:** If you build a Knowledge Graph visualization page, this gives node/edge counts to display as stats. Can show as a small info panel.

---

### `GET /api/knowledge/zone/{zone_id}/relationships`
**Use for:** Zone detail panel — shows everything connected to a zone

```json
{
  "zone": { "name": "Zone B - Hot Strip Mill", "classification": "hazardous", "risk_score": 82.3 },
  "equipment": [
    { "sensor_uid": "GAS_CH4-B-01", "name": "CH₄ Sensor", "health_status": "warning", "current_value": 38.2 }
  ],
  "workers": [
    { "employee_id": "EMP-042", "name": "Rajesh Kumar", "role": "operator", "ppe_status": "compliant" }
  ],
  "permits": [
    { "permit_uid": "PTW-2026-0847", "permit_type": "HOT_WORK", "has_conflict": true }
  ],
  "incidents": [
    { "incident_uid": "INC-2024-0023", "title": "Gas leak during maintenance", "severity": "major" }
  ],
  "counts": { "equipment": 5, "workers": 8, "permits": 2, "incidents": 12 }
}
```

**How to use this:** When user clicks a zone on the heatmap, show a detail panel with all connected entities. Great for the zone popup or a sidebar detail view.

---

### `GET /api/knowledge/equipment/{sensor_uid}/risks`
**Use for:** Equipment detail drill-down — what risks does this sensor/equipment have?

Returns the equipment node, its active risks, related historical incidents, and active permits in the same zone. Use `sensor_uid` from the sensors API (e.g., `GAS_CH4-B-01`).

---

### `GET /api/knowledge/risk-chain/{zone_id}`
**Use for:** "Why is this zone high risk?" explainability view

Traces the full chain: equipment → risks, permits (with conflicts), workers at risk, historical incidents. Great for building a risk explanation panel when a zone has high risk score.

---

### `GET /api/predictions/anomalies`
**Use for:** Anomaly detection dashboard / alert overlay
**Query params:** `?zone_id=2` (optional)

```json
{
  "anomalies": [
    {
      "sensor_uid": "GAS_CH4-B-01",
      "sensor_name": "CH₄ Sensor Zone B-01",
      "sensor_type": "GAS_CH4",
      "zone_id": 2,
      "current_value": 42.1,
      "unit": "ppm",
      "threshold_status": "warning",
      "anomaly_score": 0.78,
      "is_anomaly": true,
      "anomaly_level": "warning",
      "z_score": 2.4,
      "mean_value": 22.5,
      "std_value": 8.1,
      "samples_used": 200
    }
  ],
  "summary": {
    "total_sensors": 42,
    "anomalies_detected": 3,
    "critical_anomalies": 1,
    "anomaly_rate": 7.1
  },
  "model": "IsolationForest",
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `anomaly_score` (0-1): Show as a colored bar or badge. 0 = normal, 1 = highly anomalous
- `is_anomaly` = true → Highlight in red on sensor grid
- `anomaly_level`: `"critical"` (>0.8), `"warning"` (>0.5), `"normal"`
- `z_score`: How many standard deviations from normal (>2 is unusual)
- `summary.anomaly_rate`: Show as a KPI on dashboard ("7.1% sensors anomalous")

---

### `GET /api/predictions/failures`
**Use for:** Equipment health dashboard, maintenance scheduling view
**Query params:** `?zone_id=2`, `?urgency=immediate`

```json
{
  "predictions": [
    {
      "sensor_uid": "VIB-A-01",
      "sensor_name": "Vibration Sensor Zone A-01",
      "sensor_type": "VIBRATION",
      "zone_id": 1,
      "current_value": 9.2,
      "unit": "mm/s",
      "prediction_status": "short_term",
      "slope_per_hour": 0.034,
      "rul_hours": 82.4,
      "rul_days": 3.4,
      "predicted_failure": "2026-07-10T21:00:00",
      "trend": "degrading",
      "confidence": 0.72,
      "urgency": "short_term"
    }
  ],
  "summary": {
    "total_equipment": 15,
    "immediate_attention": 1,
    "short_term_risk": 3,
    "degrading_trend": 4,
    "healthy": 10
  },
  "model": "LinearRegression_RUL",
  "timestamp": "2026-07-07T15:00:00"
}
```

**How to use this:**
- `urgency`: Color-code → `"immediate"`=🔴 red, `"short_term"`=🟠 orange, `"medium_term"`=🟡 yellow, `"healthy"`=🟢 green
- `rul_days`: "3.4 days until potential failure" — great for a countdown display
- `predicted_failure`: Show as a date/time
- `trend`: Show as ↑ (degrading), → (stable), ↓ (improving) arrow icons
- `confidence`: Show as "72% confidence" — higher = more reliable prediction
- `summary.immediate_attention`: KPI card "⚠️ 1 equipment needs immediate attention"

---

### `GET /api/predictions/trends/{sensor_uid}`
**Use for:** Detailed sensor trend analysis with 6-hour projection
**Query params:** `?hours=24` (analysis window, 1-168)

Returns statistics (min/max/mean/std), trend direction, slope, 6-hour projected values, and anomaly history. Use this when user clicks on a specific sensor to see its detailed trend view with a projected forecast line on the chart.

---

The backend broadcasts live data on these channels. **You don't call these via REST — you listen with Socket.io.**

```javascript
import { socket } from '../lib/socket';

// On connect, you automatically receive ALL current data:
socket.on('initial-state', (data) => {
  // data = { sensors: [...], zones: [...], alerts: [...], timestamp }
  // Use this to populate your initial UI state — no need for a separate API call!
});

// Live sensor readings — every 3 seconds:
socket.on('sensor-data', (data) => {
  // data = { sensors: [...same shape as GET /api/sensors...], timestamp }
  // Update your sensor charts and dashboard sensor grid
});

// Zone risk scores — every 9 seconds:
socket.on('risk-updates', (data) => {
  // data = { zones: [...risk score per zone...], timestamp }
  // Update the heatmap and risk gauges
});

// Alert updates — every 15 seconds:
socket.on('alerts', (data) => {
  // data = { alerts: [...top 10 active alerts...], timestamp }
  // Update the alert feed, show toast notifications for new critical alerts
});

// Worker locations — every 9 seconds:
socket.on('worker-locations', (data) => {
  // data = { workers: [...], timestamp }
  // Update worker markers on the map (placeholder for now, will be populated later)
});

// Health check:
socket.emit('ping', {});
socket.on('pong', (data) => {
  // data = { timestamp }
  // Use to show "Connected" status indicator
});
```

**Recommended React hook pattern:**
```javascript
// hooks/useSocket.js
import { useEffect, useState } from 'react';
import { socket } from '../lib/socket';

export function useLiveData(channel, initialValue = null) {
  const [data, setData] = useState(initialValue);
  
  useEffect(() => {
    socket.on(channel, setData);
    return () => socket.off(channel, setData);
  }, [channel]);
  
  return data;
}

// Usage in component:
// const sensorData = useLiveData('sensor-data');
// const riskUpdates = useLiveData('risk-updates');
// const alertFeed = useLiveData('alerts');
```

---

## 6. Map & Geospatial Data

### Plant Location
The data simulates a **Visakhapatnam Steel Plant** layout.

- **Map center:** `lat: 17.6875, lng: 83.2185`
- **Zoom level:** `15` (good starting zoom to see all zones)

### Zone Coordinates (10 zones)

| Zone | Classification | Latitude | Longitude |
|------|---------------|----------|-----------|
| Zone A - Blast Furnace | 🟠 hazardous | 17.6880 | 83.2190 |
| Zone B - Hot Strip Mill | 🟠 hazardous | 17.6868 | 83.2185 |
| Zone C - Coke Oven Battery | 🔴 critical | 17.6855 | 83.2175 |
| Zone D - Oxygen Plant | 🟠 hazardous | 17.6892 | 83.2200 |
| Zone E - Power Plant | 🟡 restricted | 17.6840 | 83.2160 |
| Zone F - Raw Material Yard | 🟡 restricted | 17.6910 | 83.2210 |
| Zone G - Control Room | 🟢 safe | 17.6870 | 83.2170 |
| Zone H - Water Treatment | 🟢 safe | 17.6860 | 83.2195 |
| Zone I - Maintenance Bay | 🟡 restricted | 17.6875 | 83.2180 |
| Zone J - Gas Distribution | 🔴 critical | 17.6885 | 83.2165 |

**How to use this:**
- Use Leaflet with OpenStreetMap tiles (free, no API key needed)
- Center the map on `[17.6875, 83.2185]` at zoom `15`
- Place zone markers using coordinates from `/api/heatmap`
- Use the `leaflet-heat` plugin for heatmap overlay (use `intensity` from API as weight)

```javascript
// Leaflet basic setup
import L from 'leaflet';

const map = L.map('map').setView([17.6875, 83.2185], 15);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
```

---

## 7. Enums & Constants Reference

Use these to build dropdowns, filters, and badges in your UI.

### Sensor Types
| Type | Display Name | Unit |
|------|-------------|------|
| `GAS_H2S` | H₂S Gas | ppm |
| `GAS_CH4` | Methane (CH₄) | ppm |
| `GAS_CO` | Carbon Monoxide (CO) | ppm |
| `GAS_O2` | Oxygen (O₂) | % |
| `TEMPERATURE` | Temperature | °C |
| `PRESSURE` | Pressure | bar |
| `VIBRATION` | Vibration | mm/s |
| `HUMIDITY` | Humidity | %RH |

### Zone Classifications
| Value | Display | Color |
|-------|---------|-------|
| `safe` | Safe | 🟢 Green |
| `restricted` | Restricted | 🟡 Yellow |
| `hazardous` | Hazardous | 🟠 Orange |
| `critical` | Critical | 🔴 Red |

### Alert Severities
| Value | Display | Color |
|-------|---------|-------|
| `info` | Info | 🔵 Blue |
| `warning` | Warning | 🟡 Yellow |
| `high` | High | 🟠 Orange |
| `critical` | Critical | 🔴 Red |

### Alert Statuses
`active` → `acknowledged` → `escalated` → `resolved`

### Alert Sources
| Value | Display |
|-------|---------|
| `sensor` | Sensor Alert |
| `compound_risk` | Compound Risk |
| `cv_detection` | CV Detection |
| `permit_conflict` | Permit Conflict |
| `compliance` | Compliance |
| `predictive` | Predictive |

### Permit Types
| Value | Display |
|-------|---------|
| `HOT_WORK` | Hot Work |
| `CONFINED_SPACE` | Confined Space |
| `ELECTRICAL` | Electrical |
| `WORKING_AT_HEIGHT` | Working at Height |
| `EXCAVATION` | Excavation |
| `RADIOGRAPHY` | Radiography |
| `CRITICAL_LIFT` | Critical Lift |

### Incident Types
`gas_leak` | `fire` | `explosion` | `chemical_spill` | `structural_failure` | `electrical` | `fall` | `equipment_failure` | `near_miss`

### Incident Severities
`near_miss` | `minor` | `moderate` | `major` | `catastrophic`

---

## 8. Color Scheme for Risk Levels

Use these consistently across all views:

```css
:root {
  /* Risk Level Colors */
  --risk-normal: #22c55e;     /* Green */
  --risk-warning: #eab308;    /* Yellow */
  --risk-high: #f97316;       /* Orange */
  --risk-critical: #ef4444;   /* Red */

  /* Risk Score Ranges */
  /* 0-39   → normal  (green)  */
  /* 40-59  → warning (yellow) */
  /* 60-79  → high    (orange) */
  /* 80-100 → critical (red)   */
  
  /* Zone Classification Colors */
  --zone-safe: #22c55e;
  --zone-restricted: #eab308;
  --zone-hazardous: #f97316;
  --zone-critical: #ef4444;
  
  /* Alert Severity Colors */
  --alert-info: #3b82f6;
  --alert-warning: #eab308;
  --alert-high: #f97316;
  --alert-critical: #ef4444;
}
```

---

## 9. What Data is Pre-Seeded

When you run `docker-compose up --build`, the database is automatically seeded with:

| Entity | Count | Notes |
|--------|-------|-------|
| Zones | 10 | Visakhapatnam Steel Plant layout |
| Sensors | 42+ | 4-5 sensors per zone (gas, temp, pressure, vibration, humidity) |
| Sensor Readings | 500+ | Historical time-series data with injected anomalies |
| Workers | 60+ | Spread across zones with PPE status |
| Permits | 50+ | Mix of active/expired/revoked, some with conflicts |
| Incidents | 100+ | Historical incidents from 2023-2026 |
| Alerts | 20+ | Active and resolved alerts |

**This means:** You'll always have real data to display. No need to create mock data.

---

## 10. Your Task Checklist (Phase-wise)

### Phase 1 (Hours 0-6): Setup & Foundation
- [ ] Initialize Next.js app with App Router
- [ ] Set up design system (dark theme, industrial aesthetic, Inter font)
- [ ] Create component library: Button, Card, Badge, Table, Modal, Skeleton
- [ ] Create dashboard layout with sidebar navigation
- [ ] Set up Leaflet.js for geospatial view
- [ ] Create chart components: Line, Gauge, Bar, Donut
- [ ] Set up Socket.io client (use the `lib/` files from Section 3 above)
- [ ] Create `lib/config.js`, `lib/socket.js`, `lib/api.js`

**Routes to set up:**
| Route | Page |
|-------|------|
| `/` | Main Dashboard |
| `/heatmap` | Geospatial Heatmap View |
| `/alerts` | Alert Management Console |
| `/permits` | Permit Intelligence View |
| `/compliance` | Compliance Scorecard |
| `/incidents` | Incident Investigation View |

### Phase 2 (Hours 6-18): Core Development
- [ ] **Dashboard page** → uses `GET /api/dashboard/summary` + Socket.io `sensor-data` + `alerts`
- [ ] **Heatmap page** → uses `GET /api/heatmap` + Socket.io `risk-updates`
- [ ] **Alert Console** → uses `GET /api/alerts` + `POST` acknowledge/escalate/resolve
- [ ] **WebSocket live integration** → Toast notifications for new critical alerts
- [ ] **Compliance Scorecard** → uses `GET /api/compliance`

### Phase 3 (Hours 18-30): Integration & Advanced
- [ ] **Incident Investigation View** → uses `GET /api/incidents` + `POST /api/query` (RAG search)
- [ ] **Permit Intelligence View** → uses `GET /api/permits` + `POST /api/permits/assess`
- [ ] Integration testing with all backend APIs
- [ ] Mobile responsiveness

### Phase 4 (Hours 30-42): Polish & Demo Prep
- [ ] Animations: page transitions, KPI counters, alert slide-ins, heatmap pulse
- [ ] Presentation deck (12-15 slides)
- [ ] Screen recordings & demo video
- [ ] Cross-browser testing (Chrome, Firefox, Safari)

---

## 11. Important Notes & Gotchas

### ⚠️ GeoJSON Coordinate Order
GeoJSON uses `[longitude, latitude]` — the reverse of what Leaflet's `L.latLng()` expects (`[lat, lng]`). The `/api/heatmap` endpoint returns GeoJSON format. Use Leaflet's `L.geoJSON()` which handles this automatically, OR swap the coordinates manually if placing markers.

### ⚠️ Socket.io, NOT plain WebSocket
The backend uses `python-socketio`. Your frontend **must** use the `socket.io-client` npm package, NOT the browser's native `WebSocket` API. They are not compatible.

```bash
npm install socket.io-client
```

### ⚠️ CORS is Open
The backend allows all origins (`*`) during development. No CORS issues should occur.

### ⚠️ API Prefix
All REST endpoints start with `/api/`. Don't forget the prefix.

### ⚠️ Don't Commit Secrets
Don't commit `.env.local` or any file with the Gemini API key to Git.

### 💡 Swagger UI
If you ever need to test an endpoint or check the exact response shape, open `http://localhost:8000/api/docs` — it's a live, interactive API explorer.

### 💡 Fallback Behavior
If the Gemini API key is missing or the API is down, the RAG queries and permit assessments will return **fallback text responses** — they won't crash. Your frontend should handle both cases the same way (just display the text).

---

**Questions? Ping me on Slack/WhatsApp. Flag with 🔴 if it's blocking you.**

Good luck! 🚀
