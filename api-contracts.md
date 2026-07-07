# SafetyNexus AI — API Contracts
**Sync Point 1 Document** | Both members agreed on these contracts before integration.

> **Base URL:** Use the environment variable `NEXT_PUBLIC_API_URL`
> Set in `.env.local` (development) or deployment environment (production).
>
> **Local dev:** `NEXT_PUBLIC_API_URL=http://localhost:8000`
> **Deployed:**  `NEXT_PUBLIC_API_URL=https://your-deployed-backend-url.com`

---

## How Shubhranshu Should Set Up the API Client

Create a single config file — all API calls and Socket.io use this, never hardcode URLs:

```javascript
// lib/config.js (Shubhranshu creates this)
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
```

```javascript
// lib/socket.js (Shubhranshu creates this)
import { io } from 'socket.io-client';
import { API_BASE_URL } from './config';

// Single shared socket instance — import this everywhere
export const socket = io(API_BASE_URL, {
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  transports: ['websocket', 'polling'], // fallback to polling if WS blocked
});
```

```javascript
// All REST API calls via this helper (Shubhranshu creates this)
// lib/api.js
import { API_BASE_URL } from './config';

export const api = {
  get: (path) => fetch(`${API_BASE_URL}${path}`).then(r => r.json()),
  post: (path, body) => fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(r => r.json()),
};

// Usage examples:
// api.get('/api/sensors')
// api.get('/api/risk-score')
// api.get('/api/heatmap')
// api.post('/api/query', { query: 'gas leak incidents in Zone B?' })
// api.post('/api/permits/assess', { ... })
```

```bash
# Shubhranshu's .env.local (for local dev — not committed to git)
NEXT_PUBLIC_API_URL=http://localhost:8000

# For deployment — set this in Vercel / Railway / wherever deployed
NEXT_PUBLIC_API_URL=https://safetynexus-backend.yourdomain.com
```

> [!IMPORTANT]
> Shubhranshu must add `.env.local` to `.gitignore` in his Next.js project.
> Deepak must expose the correct CORS origin on the backend when deployed.

---


## REST API Endpoints

### GET `/api/sensors`
Returns live readings for all sensors.
**Query params:** `zone_id` (int, optional), `sensor_type` (string, optional)
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
      "timestamp": "2026-07-02T15:00:00",
      "is_anomaly": false
    }
  ],
  "count": 42,
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### GET `/api/alerts`
Returns all alerts sorted by priority score.
**Query params:** `status` (active|acknowledged|escalated|resolved), `severity` (info|warning|high|critical), `zone_id` (int), `limit` (int, default 50)
```json
{
  "alerts": [
    {
      "id": 1,
      "alert_uid": "ALT-20260702-0001",
      "title": "Compound Risk Alert — Zone B",
      "description": "...",
      "severity": "critical",
      "source": "compound_risk",
      "status": "active",
      "zone_id": 2,
      "zone_name": "Zone B - Hot Strip Mill",
      "priority_score": 95.0,
      "compound_risk_score": 82.3,
      "acknowledged_by": null,
      "acknowledged_at": null,
      "sla_deadline": "2026-07-02T15:10:00",
      "sla_breached": false,
      "regulatory_ref": "OISD-GDN-105 §4.3",
      "escalation_count": 0,
      "created_at": "2026-07-02T15:00:00",
      "updated_at": "2026-07-02T15:00:00"
    }
  ],
  "counts": {
    "total": 8,
    "critical": 3,
    "high": 3,
    "warning": 2
  },
  "timestamp": "2026-07-02T15:00:00"
}
```

**POST** `/api/alerts/{alert_uid}/acknowledge` — Body: `{ "acknowledged_by": "Officer Name" }`
**POST** `/api/alerts/{alert_uid}/escalate` — Body: `{ "reason": "..." }`
**POST** `/api/alerts/{alert_uid}/resolve` — No body required.

---

### GET `/api/risk-score`
Returns compound risk scores for all zones. ⚠️ **Note: flat URL, not /api/risk/score**
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
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### GET `/api/heatmap`
Returns GeoJSON FeatureCollection for Leaflet heatmap. ⚠️ **Note: flat URL, not /api/risk/heatmap**
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
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### GET `/api/compliance`
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
      "remediation": "Conduct immediate gas test...",
      "category": "OISD"
    }
  ],
  "last_audit": "2026-07-02T15:00:00",
  "next_audit_due": "2026-07-15T00:00:00",
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### GET `/api/permits`
**Query params:** `status`, `zone_id`, `permit_type`
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
      "ai_reasoning": "...",
      "has_conflict": true,
      "conflict_details": "...",
      "start_time": "2026-07-02T08:00:00",
      "end_time": "2026-07-02T16:00:00",
      "remaining_minutes": 180,
      "is_overdue": false,
      "created_at": "2026-07-02T07:30:00"
    }
  ],
  "active_count": 12,
  "conflict_count": 2,
  "timestamp": "2026-07-02T15:00:00"
}
```

**POST** `/api/permits/assess` — AI permit risk assessment:
```json
// Request body:
{
  "permit_type": "HOT_WORK",
  "zone_id": 2,
  "description": "Welding on pipe P-304",
  "crew_count": 4,
  "start_time": "2026-07-02T10:00:00",
  "end_time": "2026-07-02T16:00:00",
  "issued_by": "Safety Officer Sharma"
}
// Response:
{
  "recommendation": "approve_with_conditions",
  "risk_score": 74.5,
  "reasoning": "Gemini-generated reasoning...",
  "conditions": ["Gas test required within 30 minutes...", "Fire watch must be posted..."],
  "conflicts_detected": [{"permit_uid": "PTW-2026-0812", "conflict_reason": "..."}],
  "zone_classification": "hazardous",
  "current_gas_readings": ["GAS_CH4: 28.4 ppm (threshold: 50 ppm)"],
  "active_permits_in_zone": 1,
  "assessment_timestamp": "2026-07-02T15:00:00",
  "regulatory_refs": ["OISD-GDN-105", "Factory Act §36"]
}
```

---

### GET `/api/incidents`
**Query params:** `severity`, `incident_type`, `zone_id`, `limit`
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
      "description": "...",
      "root_cause": "...",
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
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### POST `/api/query`
RAG-powered natural language safety queries. **This is the endpoint for the Incident Investigation View.**
```json
// Request body:
{ "query": "Have there been similar gas leak incidents during maintenance in Zone B?" }

// Response:
{
  "query": "Have there been similar gas leak incidents...",
  "answer": "Gemini-synthesized answer with citations...",
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
  "timestamp": "2026-07-02T15:00:00"
}
```

---

### GET `/api/dashboard/summary`
One-shot KPI endpoint for dashboard initial load.
```json
{
  "active_alerts": 8,
  "critical_alerts": 3,
  "workers_on_site": 68,
  "active_permits": 12,
  "conflict_permits": 2,
  "overall_risk_score": 82.3,
  "overall_risk_level": "critical",
  "timestamp": "2026-07-02T15:00:00"
}
```

---

## Socket.io Real-Time Channels

> **Frontend connection:** `const socket = io('http://localhost:8000')`

| Event (emit from server) | Frequency | Payload |
|---|---|---|
| `initial-state` | Once on connect | `{ sensors, zones, alerts, timestamp }` |
| `sensor-data` | Every 3s | `{ sensors: [...], timestamp }` |
| `risk-updates` | Every 9s | `{ zones: [...], timestamp }` |
| `worker-locations` | Every 9s | `{ workers: [...], timestamp }` |
| `alerts` | Every 15s | `{ alerts: [...], timestamp }` |

**Client → Server events:**
- `ping` → Server emits `pong`

**Frontend hooks (Shubhranshu to implement):**
```javascript
// useSocket.js
const socket = io('http://localhost:8000');
socket.on('sensor-data', (data) => { /* update sensor state */ });
socket.on('risk-updates', (data) => { /* update heatmap */ });
socket.on('alerts', (data) => { /* update alert feed */ });
socket.on('worker-locations', (data) => { /* update map markers */ });
```

---

## Sensor Types Reference

| Type | Unit | Warning | Critical |
|---|---|---|---|
| `GAS_H2S` | ppm | 5 | 10 |
| `GAS_CH4` | ppm | 35 | 50 |
| `GAS_CO` | ppm | 35 | 50 |
| `GAS_O2` | % | 18 | 16 |
| `TEMPERATURE` | °C | 90 | 110 |
| `PRESSURE` | bar | 5.5 | 7.0 |
| `VIBRATION` | mm/s | 8 | 12 |
| `HUMIDITY` | %RH | 85 | 95 |

## Zone Classifications

`safe` | `restricted` | `hazardous` | `critical`

## Alert Sources

`sensor` | `compound_risk` | `cv_detection` | `permit_conflict` | `compliance` | `predictive`

## Permit Types

`HOT_WORK` | `CONFINED_SPACE` | `ELECTRICAL` | `WORKING_AT_HEIGHT` | `EXCAVATION` | `RADIOGRAPHY` | `CRITICAL_LIFT`
