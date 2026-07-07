"""
SafetyNexus AI — Database Seeder
Generates realistic synthetic data for all tables.
Runs automatically on Docker startup before the API server.
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import random
import json
from datetime import datetime, timedelta
from faker import Faker
from sqlalchemy.orm import Session

from app.models.db import engine, create_tables, SessionLocal
from app.models.zone import Zone, ZoneClassification
from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.worker import Worker, WorkerRole, PPEStatus
from app.models.permit import Permit, PermitType, PermitStatus
from app.models.incident import Incident, IncidentType, IncidentSeverity
from app.models.alert import Alert, AlertSeverity, AlertStatus, AlertSource

fake = Faker("en_IN")
random.seed(42)

# ─── Zone definitions (Visakhapatnam Steel Plant inspired) ─────────────────────
ZONE_DEFINITIONS = [
    {"name": "Zone A - Blast Furnace",      "classification": ZoneClassification.HAZARDOUS,  "center_lat": 17.6880, "center_lng": 83.2190, "area_sqm": 5000},
    {"name": "Zone B - Hot Strip Mill",     "classification": ZoneClassification.HAZARDOUS,  "center_lat": 17.6868, "center_lng": 83.2185, "area_sqm": 4200},
    {"name": "Zone C - Coke Oven Battery",  "classification": ZoneClassification.CRITICAL,   "center_lat": 17.6855, "center_lng": 83.2175, "area_sqm": 3800},
    {"name": "Zone D - Oxygen Plant",       "classification": ZoneClassification.HAZARDOUS,  "center_lat": 17.6892, "center_lng": 83.2200, "area_sqm": 2900},
    {"name": "Zone E - Power Plant",        "classification": ZoneClassification.RESTRICTED, "center_lat": 17.6840, "center_lng": 83.2160, "area_sqm": 6000},
    {"name": "Zone F - Raw Material Yard",  "classification": ZoneClassification.RESTRICTED, "center_lat": 17.6910, "center_lng": 83.2210, "area_sqm": 8000},
    {"name": "Zone G - Control Room",       "classification": ZoneClassification.SAFE,       "center_lat": 17.6870, "center_lng": 83.2170, "area_sqm": 1200},
    {"name": "Zone H - Water Treatment",    "classification": ZoneClassification.SAFE,       "center_lat": 17.6860, "center_lng": 83.2195, "area_sqm": 2500},
    {"name": "Zone I - Maintenance Bay",    "classification": ZoneClassification.RESTRICTED, "center_lat": 17.6875, "center_lng": 83.2180, "area_sqm": 3000},
    {"name": "Zone J - Gas Distribution",   "classification": ZoneClassification.CRITICAL,   "center_lat": 17.6885, "center_lng": 83.2165, "area_sqm": 1800},
]

# Sensor configs per type
SENSOR_CONFIG = {
    SensorType.GAS_H2S:     {"unit": "ppm",   "normal_min": 0, "normal_max": 5,   "warning": 5,   "critical": 10,  "label": "H₂S"},
    SensorType.GAS_CH4:     {"unit": "ppm",   "normal_min": 0, "normal_max": 20,  "warning": 35,  "critical": 50,  "label": "CH₄"},
    SensorType.GAS_CO:      {"unit": "ppm",   "normal_min": 0, "normal_max": 25,  "warning": 35,  "critical": 50,  "label": "CO"},
    SensorType.GAS_O2:      {"unit": "%",     "normal_min": 19.5, "normal_max": 23.5, "warning": 18, "critical": 16, "label": "O₂"},
    SensorType.TEMPERATURE:  {"unit": "°C",   "normal_min": 30, "normal_max": 80,  "warning": 90,  "critical": 110, "label": "Temp"},
    SensorType.PRESSURE:     {"unit": "bar",  "normal_min": 2.5,"normal_max": 4.5, "warning": 5.5, "critical": 7.0, "label": "Pressure"},
    SensorType.VIBRATION:    {"unit": "mm/s", "normal_min": 1,  "normal_max": 5,   "warning": 8,   "critical": 12,  "label": "Vibration"},
    SensorType.HUMIDITY:     {"unit": "%RH",  "normal_min": 30, "normal_max": 70,  "warning": 85,  "critical": 95,  "label": "Humidity"},
}

INCIDENT_TEMPLATES = [
    {
        "type": IncidentType.GAS_LEAK,
        "title": "Methane gas accumulation during maintenance",
        "description": "Elevated CH4 levels detected in {zone} during scheduled pipe maintenance. Gas sensor readings reached {value} ppm before alarm triggered. Hot work permit was active in adjacent area. Maintenance crew of {workers} workers evacuated safely.",
        "root_cause": "Flange joint failure during pressure testing. Compound risk: active hot work permit in adjacent zone combined with gradual gas accumulation.",
        "contributing_factors": ["Concurrent hot work permit in Zone B", "Delayed gas sensor calibration", "Shift handover without risk carry-forward"],
    },
    {
        "type": IncidentType.PPE_VIOLATION,
        "title": "PPE non-compliance detected in restricted zone",
        "description": "CCTV analytics detected worker without safety helmet in {zone}. Worker was performing routine inspection. Immediate corrective action taken.",
        "root_cause": "Inadequate pre-shift PPE verification. Worker removed helmet due to heat discomfort.",
        "contributing_factors": ["High ambient temperature (45°C)", "No PPE monitoring system", "Insufficient spot checks"],
    },
    {
        "type": IncidentType.EQUIPMENT_FAILURE,
        "title": "Pump bearing failure with safety implications",
        "description": "Pump P-{pump_id} in {zone} showed progressive vibration increase from 3.2 mm/s to 11.8 mm/s over 4 hours. Bearing failure led to seal damage and minor lubricant leak. Production halted for 6 hours.",
        "root_cause": "Overdue preventive maintenance. Vibration sensor data not actioned despite early warning signs.",
        "contributing_factors": ["Missed PM schedule", "Alert fatigue from excessive nuisance alarms", "No predictive analytics baseline"],
    },
    {
        "type": IncidentType.SHIFT_HANDOVER_FAILURE,
        "title": "Critical risk information lost during shift handover",
        "description": "Incoming shift supervisor in {zone} was not informed of elevated H2S readings and active confined space permit from previous shift. Near-miss incident when new crew entered zone without proper precautions.",
        "root_cause": "Verbal-only shift handover system. Outgoing supervisor did not document risk carry-forward items.",
        "contributing_factors": ["No digital handover system", "Time pressure during shift change", "No active permit visibility at handover"],
    },
    {
        "type": IncidentType.ZONE_VIOLATION,
        "title": "Unauthorized personnel entry into restricted zone",
        "description": "Contractor without zone authorization accessed {zone} through unguarded access point. Zone had active gas leak isolation in progress. Immediate evacuation required.",
        "root_cause": "Access control system failure. Badge reader malfunction at Zone D North Gate.",
        "contributing_factors": ["Access control system maintenance overdue", "No visual barrier at secondary access point", "Contractor briefing inadequate"],
    },
    {
        "type": IncidentType.FIRE,
        "title": "Ignition event during hot work near gas accumulation",
        "description": "Minor fire ignition during welding operations in {zone}. Gas sensor had recorded sub-threshold CH4 accumulation of 38 ppm (threshold: 50 ppm) but compound risk was not assessed. Fire suppression system activated within 30 seconds.",
        "root_cause": "Compound risk not recognized: sub-threshold gas + hot work + inadequate ventilation. Individual systems showed no alarms.",
        "contributing_factors": ["No compound risk detection", "Single-sensor alarm paradigm", "Ventilation system partially blocked"],
    },
]

PERMIT_SCENARIOS = [
    {"type": PermitType.HOT_WORK,         "desc": "Welding and cutting operations on pipe section",  "crew": (2, 5),  "duration_h": (2, 8)},
    {"type": PermitType.CONFINED_SPACE,   "desc": "Vessel internal inspection and cleaning",          "crew": (2, 4),  "duration_h": (4, 12)},
    {"type": PermitType.ELECTRICAL,       "desc": "HT switchgear maintenance and testing",            "crew": (1, 3),  "duration_h": (2, 6)},
    {"type": PermitType.WORKING_AT_HEIGHT,"desc": "Structural inspection at height above 2 meters",   "crew": (2, 6),  "duration_h": (3, 10)},
    {"type": PermitType.EXCAVATION,       "desc": "Underground cable trench excavation",              "crew": (3, 8),  "duration_h": (6, 24)},
    {"type": PermitType.RADIOGRAPHY,      "desc": "Radiographic testing of weld joints",              "crew": (2, 3),  "duration_h": (4, 8)},
    {"type": PermitType.CRITICAL_LIFT,    "desc": "Crane lift of heavy equipment (>10 tonnes)",       "crew": (4, 10), "duration_h": (2, 6)},
]


def generate_sensor_value(sensor_type: SensorType, is_anomaly: bool = False, anomaly_level: float = 0.7) -> float:
    """Generate a realistic sensor value."""
    cfg = SENSOR_CONFIG[sensor_type]
    normal_range = cfg["normal_max"] - cfg["normal_min"]
    
    if sensor_type == SensorType.GAS_O2:
        # O2 is inverse — low is dangerous
        if is_anomaly:
            return round(cfg["warning"] - random.uniform(0, 4) * anomaly_level, 2)
        return round(random.uniform(cfg["normal_min"], cfg["normal_max"]), 2)
    
    if is_anomaly:
        # Ramp toward critical threshold
        base = cfg["warning"] + (cfg["critical"] - cfg["warning"]) * anomaly_level
        return round(base + random.gauss(0, normal_range * 0.05), 2)
    
    # Normal: sinusoidal base + gaussian noise
    import math
    import time
    t = time.time()
    base = (cfg["normal_min"] + cfg["normal_max"]) / 2
    sinusoidal = math.sin(t * 0.001) * (normal_range * 0.15)
    noise = random.gauss(0, normal_range * 0.05)
    val = base + sinusoidal + noise
    return round(max(cfg["normal_min"], min(cfg["normal_max"] * 0.95, val)), 2)


def seed_zones(db: Session) -> list[Zone]:
    print("  ➜ Seeding zones...")
    zones = []
    for zd in ZONE_DEFINITIONS:
        existing = db.query(Zone).filter(Zone.name == zd["name"]).first()
        if existing:
            zones.append(existing)
            continue
        zone = Zone(
            name=zd["name"],
            classification=zd["classification"],
            center_lat=zd["center_lat"],
            center_lng=zd["center_lng"],
            area_sqm=zd["area_sqm"],
            description=f"Industrial zone: {zd['name']}",
            risk_score=random.uniform(5, 30),  # baseline risk
        )
        db.add(zone)
        zones.append(zone)
    db.commit()
    print(f"    ✓ {len(zones)} zones ready")
    return zones


def seed_sensors(db: Session, zones: list[Zone]) -> list[Sensor]:
    print("  ➜ Seeding sensors...")
    sensors = []
    sensor_counter = {}

    # Assign sensor types per zone classification
    zone_sensor_map = {
        ZoneClassification.CRITICAL:   [SensorType.GAS_H2S, SensorType.GAS_CH4, SensorType.GAS_CO, SensorType.GAS_O2, SensorType.TEMPERATURE, SensorType.PRESSURE],
        ZoneClassification.HAZARDOUS:  [SensorType.GAS_CH4, SensorType.GAS_CO, SensorType.TEMPERATURE, SensorType.PRESSURE, SensorType.VIBRATION],
        ZoneClassification.RESTRICTED: [SensorType.TEMPERATURE, SensorType.VIBRATION, SensorType.HUMIDITY],
        ZoneClassification.SAFE:       [SensorType.TEMPERATURE, SensorType.HUMIDITY],
    }

    for zone in zones:
        sensor_types = zone_sensor_map.get(zone.classification, [SensorType.TEMPERATURE])
        for st in sensor_types:
            key = st.value
            sensor_counter[key] = sensor_counter.get(key, 0) + 1
            sensor_uid = f"{key}-{zone.name.split()[1]}-{sensor_counter[key]:02d}"

            existing = db.query(Sensor).filter(Sensor.sensor_uid == sensor_uid).first()
            if existing:
                sensors.append(existing)
                continue

            cfg = SENSOR_CONFIG[st]
            # Slight random offset from zone center for sensor location
            lat_offset = random.uniform(-0.0005, 0.0005)
            lng_offset = random.uniform(-0.0005, 0.0005)

            sensor = Sensor(
                sensor_uid=sensor_uid,
                name=f"{cfg['label']} Sensor {zone.name.split()[1]}-{sensor_counter[key]:02d}",
                sensor_type=st,
                zone_id=zone.id,
                lat=zone.center_lat + lat_offset,
                lng=zone.center_lng + lng_offset,
                unit=cfg["unit"],
                normal_min=cfg["normal_min"],
                normal_max=cfg["normal_max"],
                threshold_warning=cfg["warning"],
                threshold_critical=cfg["critical"],
            )
            db.add(sensor)
            sensors.append(sensor)

    db.commit()
    print(f"    ✓ {len(sensors)} sensors ready")
    return sensors


def seed_sensor_readings(db: Session, sensors: list[Sensor]):
    print("  ➜ Seeding sensor readings (last 2h of history)...")
    count = 0
    now = datetime.utcnow()
    for sensor in sensors:
        # 60 readings, one every 2 minutes (2h history)
        for i in range(60):
            ts = now - timedelta(minutes=(60 - i) * 2)
            is_anomaly = (i > 50) and sensor.sensor_type in [SensorType.GAS_CH4, SensorType.GAS_H2S] and "Zone B" in (sensor.name or "")
            val = generate_sensor_value(sensor.sensor_type, is_anomaly, anomaly_level=min(1.0, (i - 50) / 10.0) if is_anomaly else 0)
            reading = SensorReading(
                sensor_id=sensor.id,
                value=val,
                unit=sensor.unit,
                is_anomaly=is_anomaly,
                timestamp=ts,
            )
            db.add(reading)
            count += 1

    db.commit()
    print(f"    ✓ {count} sensor readings seeded")


def seed_workers(db: Session, zones: list[Zone]) -> list[Worker]:
    print("  ➜ Seeding workers...")
    workers = []
    roles = list(WorkerRole)
    ppe_statuses = [PPEStatus.COMPLIANT, PPEStatus.COMPLIANT, PPEStatus.COMPLIANT, PPEStatus.NON_COMPLIANT]

    for i in range(80):
        emp_id = f"EMP-{1000 + i:04d}"
        existing = db.query(Worker).filter(Worker.employee_id == emp_id).first()
        if existing:
            workers.append(existing)
            continue

        zone = random.choice(zones)
        lat_offset = random.uniform(-0.0008, 0.0008)
        lng_offset = random.uniform(-0.0008, 0.0008)

        worker = Worker(
            employee_id=emp_id,
            name=fake.name(),
            role=random.choice(roles),
            department=random.choice(["Operations", "Maintenance", "Safety", "Engineering", "Contracts"]),
            shift=random.choice(["day", "day", "night", "rotating"]),
            zone_id=zone.id,
            lat=zone.center_lat + lat_offset,
            lng=zone.center_lng + lng_offset,
            ppe_status=random.choice(ppe_statuses),
            is_on_site=random.random() > 0.15,
            certifications="Safety Induction,First Aid" + (",Hot Work" if random.random() > 0.5 else ""),
        )
        db.add(worker)
        workers.append(worker)

    db.commit()
    print(f"    ✓ {len(workers)} workers seeded")
    return workers


def seed_permits(db: Session, zones: list[Zone]) -> list[Permit]:
    print("  ➜ Seeding permits...")
    permits = []
    now = datetime.utcnow()

    # Create 60 permits: mix of active, completed, and a few conflicts
    for i in range(60):
        pid = f"PTW-2026-{800 + i:04d}"
        existing = db.query(Permit).filter(Permit.permit_uid == pid).first()
        if existing:
            permits.append(existing)
            continue

        scenario = random.choice(PERMIT_SCENARIOS)
        zone = random.choice(zones)
        offset_h = random.uniform(-48, 24)
        duration_h = random.randint(*scenario["duration_h"])
        start = now + timedelta(hours=offset_h)
        end = start + timedelta(hours=duration_h)

        # Determine status
        if end < now:
            status = PermitStatus.COMPLETED
        elif start > now:
            status = PermitStatus.PENDING
        else:
            status = PermitStatus.ACTIVE

        # Create conflicts for demo: Zone B HOT_WORK + CONFINED_SPACE overlap
        has_conflict = (
            i in [5, 12, 23] and
            zone.name == "Zone B - Hot Strip Mill" and
            scenario["type"] in [PermitType.HOT_WORK, PermitType.CONFINED_SPACE]
        )

        permit = Permit(
            permit_uid=pid,
            permit_type=scenario["type"],
            zone_id=zone.id,
            status=status,
            issued_by=f"Safety Officer {fake.last_name()}",
            crew_count=random.randint(*scenario["crew"]),
            description=scenario["desc"],
            preconditions=json.dumps(["Gas test < 30 min before start", "Fire watch posted", "LOTO applied"]),
            equipment_involved=json.dumps([f"Equipment-{random.randint(100, 999)}", f"Unit-{random.randint(10, 99)}"]),
            risk_score=random.uniform(20, 80),
            ai_recommendation="approve_with_conditions" if has_conflict else random.choice(["approve", "approve", "approve_with_conditions"]),
            has_conflict=has_conflict,
            conflict_details=json.dumps({"overlap_with": "PTW-2026-0812", "risk": "simultaneous hot work + confined space"}) if has_conflict else None,
            start_time=start,
            end_time=end,
        )
        db.add(permit)
        permits.append(permit)

    db.commit()
    print(f"    ✓ {len(permits)} permits seeded")
    return permits


def seed_incidents(db: Session, zones: list[Zone]) -> list[Incident]:
    print("  ➜ Seeding incidents (historical corpus for RAG)...")
    incidents = []
    now = datetime.utcnow()

    for i in range(120):
        iid = f"INC-2024-{i:04d}"
        existing = db.query(Incident).filter(Incident.incident_uid == iid).first()
        if existing:
            incidents.append(existing)
            continue

        template = random.choice(INCIDENT_TEMPLATES)
        zone = random.choice(zones)
        occurred = now - timedelta(days=random.randint(1, 730))  # last 2 years
        severity = random.choices(
            [IncidentSeverity.NEAR_MISS, IncidentSeverity.MINOR, IncidentSeverity.MODERATE, IncidentSeverity.MAJOR, IncidentSeverity.FATAL],
            weights=[40, 30, 20, 8, 2]
        )[0]

        workers_affected = random.randint(1, 8) if severity != IncidentSeverity.NEAR_MISS else 0
        desc = template["description"].format(
            zone=zone.name,
            value=round(random.uniform(35, 48), 1),
            workers=workers_affected,
            pump_id=random.randint(100, 999),
        )

        incident = Incident(
            incident_uid=iid,
            incident_type=template["type"],
            severity=severity,
            zone_id=zone.id,
            title=template["title"],
            description=desc,
            root_cause=template["root_cause"],
            contributing_factors=json.dumps(template["contributing_factors"]),
            actions_taken="Immediate evacuation, hazard isolation, incident investigation initiated.",
            workers_affected=workers_affected,
            injuries=random.randint(0, workers_affected) if severity in [IncidentSeverity.MODERATE, IncidentSeverity.MAJOR] else 0,
            fatalities=1 if severity == IncidentSeverity.FATAL else 0,
            property_damage_inr=random.uniform(10000, 5000000) if severity != IncidentSeverity.NEAR_MISS else 0,
            occurred_at=occurred,
            reported_at=occurred + timedelta(hours=random.randint(0, 4)),
            resolved_at=occurred + timedelta(days=random.randint(1, 30)) if severity != IncidentSeverity.FATAL else None,
        )
        db.add(incident)
        incidents.append(incident)

    db.commit()
    print(f"    ✓ {len(incidents)} incidents seeded (RAG corpus ready)")
    return incidents


def seed_alerts(db: Session, zones: list[Zone], sensors: list[Sensor]) -> list[Alert]:
    print("  ➜ Seeding active alerts...")
    alerts = []
    now = datetime.utcnow()

    alert_templates = [
        {"title": "CH₄ Gas Level Approaching Warning Threshold",        "severity": AlertSeverity.WARNING,  "source": AlertSource.SENSOR,        "desc": "Methane sensor {uid} in {zone} reading {val} ppm. Warning threshold: 35 ppm.", "ref": None},
        {"title": "Compound Risk Alert — Zone B",                       "severity": AlertSeverity.CRITICAL, "source": AlertSource.COMPOUND_RISK, "desc": "Compound risk score reached 82/100 in Zone B. Gas accumulation + active HOT_WORK permit + crew present.", "ref": "OISD-GDN-105 §4.3"},
        {"title": "PPE Violation Detected — Zone C",                    "severity": AlertSeverity.HIGH,     "source": AlertSource.CV_DETECTION,  "desc": "CCTV analytics detected worker without safety helmet at Coke Oven Battery entry point.", "ref": "Factory Act §7A"},
        {"title": "Permit Conflict — HOT_WORK + CONFINED_SPACE Overlap","severity": AlertSeverity.HIGH,     "source": AlertSource.PERMIT_CONFLICT,"desc": "PTW-2026-0812 (HOT_WORK) and PTW-2026-0847 (CONFINED_SPACE) overlap in Zone B. High ignition risk.", "ref": "OISD-GDN-105 §6.1"},
        {"title": "Vibration Anomaly — Pump P-207",                     "severity": AlertSeverity.WARNING,  "source": AlertSource.PREDICTIVE,    "desc": "Pump P-207 vibration: 7.2 mm/s (normal: <5 mm/s). Bearing failure predicted within 8 hours.", "ref": None},
        {"title": "H₂S Gas Detected — Zone J",                         "severity": AlertSeverity.CRITICAL, "source": AlertSource.SENSOR,        "desc": "H2S sensor reading 8.2 ppm in Gas Distribution zone. Evacuation of non-essential personnel recommended.", "ref": "DGMS Circular 2019-07"},
        {"title": "Compliance Violation — Gas Test Overdue",            "severity": AlertSeverity.HIGH,     "source": AlertSource.COMPLIANCE,    "desc": "Hot work permit PTW-2026-0815 has been active for 35 minutes without a gas test. Violation of OISD-GDN-105 §4.3.", "ref": "OISD-GDN-105 §4.3"},
        {"title": "Zone D — O₂ Level Below Safe Threshold",             "severity": AlertSeverity.CRITICAL, "source": AlertSource.SENSOR,        "desc": "Oxygen sensor in Oxygen Plant reading 18.1%. Below safe minimum (19.5%). Entry prohibited.", "ref": "IS 15656"},
    ]

    for i, tmpl in enumerate(alert_templates):
        aid = f"ALT-{now.strftime('%Y%m%d')}-{i:04d}"
        existing = db.query(Alert).filter(Alert.alert_uid == aid).first()
        if existing:
            alerts.append(existing)
            continue

        zone = random.choice(zones)
        sensor = random.choice(sensors) if sensors else None
        created_ago = timedelta(minutes=random.randint(1, 120))
        sla_window = {"info": 480, "warning": 120, "high": 30, "critical": 10}
        sla_mins = sla_window.get(tmpl["severity"].value, 60)

        alert = Alert(
            alert_uid=aid,
            title=tmpl["title"],
            description=tmpl["desc"].format(
                uid=sensor.sensor_uid if sensor else "SENS-01",
                zone=zone.name,
                val=round(random.uniform(32, 47), 1),
            ),
            severity=tmpl["severity"],
            source=tmpl["source"],
            status=AlertStatus.ACTIVE,
            zone_id=zone.id,
            sensor_id=sensor.id if sensor else None,
            priority_score={"info": 20, "warning": 45, "high": 70, "critical": 95}[tmpl["severity"].value],
            compound_risk_score=82.3 if tmpl["source"] == AlertSource.COMPOUND_RISK else None,
            sla_deadline=now - created_ago + timedelta(minutes=sla_mins),
            regulatory_ref=tmpl["ref"],
            created_at=now - created_ago,
        )
        db.add(alert)
        alerts.append(alert)

    db.commit()
    print(f"    ✓ {len(alerts)} active alerts seeded")
    return alerts


def enable_postgis(db: Session):
    """Enable PostGIS extension."""
    try:
        from sqlalchemy import text
        db.execute(text("CREATE EXTENSION IF NOT EXISTS postgis;"))
        db.commit()
        print("    ✓ PostGIS extension enabled")
    except Exception as e:
        print(f"    ⚠ PostGIS: {e}")
        db.rollback()


def main():
    print("\n🌱 SafetyNexus AI — Database Seeder")
    print("=" * 50)

    # Create tables
    print("\n[1/7] Creating database tables...")
    create_tables()
    print("    ✓ Tables created")

    db = SessionLocal()

    try:
        # Enable PostGIS
        print("\n[2/7] Enabling PostGIS...")
        enable_postgis(db)

        # Seed in order (respecting foreign keys)
        print("\n[3/7] Seeding zones...")
        zones = seed_zones(db)

        print("\n[4/7] Seeding sensors + readings...")
        sensors = seed_sensors(db, zones)
        seed_sensor_readings(db, sensors)

        print("\n[5/7] Seeding workers...")
        seed_workers(db, zones)

        print("\n[6/7] Seeding permits + incidents...")
        seed_permits(db, zones)
        seed_incidents(db, zones)

        print("\n[7/7] Seeding active alerts...")
        seed_alerts(db, zones, sensors)

        # ── Sync to Neo4j Knowledge Graph ────────────────────
        print("\n[+] Syncing Knowledge Graph to Neo4j...")
        try:
            from app.services.knowledge_graph import sync_graph_from_postgres
            sync_graph_from_postgres(db)
        except Exception as e:
            print(f"    ⚠ Neo4j sync skipped: {e}")

        # ── Index incidents into ChromaDB for RAG ────────────
        print("\n[+] Indexing incidents into ChromaDB for RAG...")
        try:
            from app.services.rag import index_incidents
            index_incidents(db)
        except Exception as e:
            print(f"    ⚠ ChromaDB indexing skipped: {e}")

        print("\n" + "=" * 50)
        print("✅ Database seeding complete! SafetyNexus AI is ready.")
        print("   ✓ PostgreSQL: zones, sensors, workers, permits, incidents, alerts")
        print("   ✓ Neo4j: Knowledge Graph synced")
        print("   ✓ ChromaDB: Incidents indexed for RAG")
        print("=" * 50 + "\n")

    except Exception as e:
        print(f"\n❌ Seeding failed: {e}")
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
