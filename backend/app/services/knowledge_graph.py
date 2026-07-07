"""
SafetyNexus AI — Knowledge Graph Service (Neo4j)
Builds and queries a relationship graph: Equipment → Permit → Risk → Zone → Worker
Syncs from PostgreSQL data on startup.
"""
from datetime import datetime
from neo4j import GraphDatabase
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.zone import Zone
from app.models.sensor import Sensor, SensorReading, SensorType
from app.models.permit import Permit, PermitStatus, PermitType
from app.models.worker import Worker
from app.models.incident import Incident
from app.models.alert import Alert, AlertStatus
from sqlalchemy import desc

settings = get_settings()

# ─── Neo4j Driver ──────────────────────────────────────────────────────────────
_driver = None


def get_driver():
    global _driver
    if _driver is None:
        _driver = GraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
            max_connection_lifetime=300,
        )
    return _driver


def close_driver():
    global _driver
    if _driver:
        _driver.close()
        _driver = None


# ─── Graph Sync from PostgreSQL ───────────────────────────────────────────────
def sync_graph_from_postgres(db: Session):
    """
    Populate the Neo4j knowledge graph from existing PostgreSQL data.
    Called once during seeding. Idempotent via MERGE.
    """
    driver = get_driver()
    try:
        with driver.session() as session:
            # Clear existing graph for clean re-sync
            session.run("MATCH (n) DETACH DELETE n")

            # ── Create Zone nodes ────────────────────────────────
            zones = db.query(Zone).all()
            for z in zones:
                session.run(
                    """
                    MERGE (zone:Zone {zone_id: $zone_id})
                    SET zone.name = $name,
                        zone.classification = $classification,
                        zone.risk_score = $risk_score,
                        zone.center_lat = $lat,
                        zone.center_lng = $lng,
                        zone.area_sqm = $area_sqm
                    """,
                    zone_id=z.id,
                    name=z.name,
                    classification=z.classification.value,
                    risk_score=z.risk_score,
                    lat=z.center_lat,
                    lng=z.center_lng,
                    area_sqm=z.area_sqm,
                )

            # ── Create Equipment nodes (from sensors) ────────────
            sensors = db.query(Sensor).filter(Sensor.is_active == True).all()
            for s in sensors:
                # Get latest reading for current status
                reading = (
                    db.query(SensorReading)
                    .filter(SensorReading.sensor_id == s.id)
                    .order_by(desc(SensorReading.timestamp))
                    .first()
                )
                current_value = reading.value if reading else 0.0
                is_anomaly = reading.is_anomaly if reading else False

                # Determine health status
                if s.sensor_type == SensorType.GAS_O2:
                    health = "critical" if current_value < s.threshold_critical else "warning" if current_value < s.threshold_warning else "normal"
                else:
                    health = "critical" if current_value >= s.threshold_critical else "warning" if current_value >= s.threshold_warning else "normal"

                session.run(
                    """
                    MERGE (eq:Equipment {sensor_uid: $sensor_uid})
                    SET eq.name = $name,
                        eq.sensor_type = $sensor_type,
                        eq.current_value = $current_value,
                        eq.unit = $unit,
                        eq.health_status = $health,
                        eq.is_anomaly = $is_anomaly,
                        eq.threshold_warning = $threshold_warning,
                        eq.threshold_critical = $threshold_critical
                    """,
                    sensor_uid=s.sensor_uid,
                    name=s.name,
                    sensor_type=s.sensor_type.value,
                    current_value=current_value,
                    unit=s.unit,
                    health=health,
                    is_anomaly=is_anomaly,
                    threshold_warning=s.threshold_warning,
                    threshold_critical=s.threshold_critical,
                )

                # Equipment → LOCATED_IN → Zone
                session.run(
                    """
                    MATCH (eq:Equipment {sensor_uid: $sensor_uid})
                    MATCH (zone:Zone {zone_id: $zone_id})
                    MERGE (eq)-[:LOCATED_IN]->(zone)
                    """,
                    sensor_uid=s.sensor_uid,
                    zone_id=s.zone_id,
                )

                # Equipment → HAS_RISK → Risk (if elevated)
                if health in ("warning", "critical"):
                    risk_type = f"{s.sensor_type.value}_elevated"
                    session.run(
                        """
                        MERGE (risk:Risk {risk_id: $risk_id})
                        SET risk.type = $risk_type,
                            risk.level = $level,
                            risk.value = $value,
                            risk.threshold = $threshold
                        WITH risk
                        MATCH (eq:Equipment {sensor_uid: $sensor_uid})
                        MERGE (eq)-[:HAS_RISK]->(risk)
                        """,
                        risk_id=f"RISK-{s.sensor_uid}",
                        risk_type=risk_type,
                        level=health,
                        value=current_value,
                        threshold=s.threshold_critical,
                        sensor_uid=s.sensor_uid,
                    )

            # ── Create Permit nodes ──────────────────────────────
            permits = db.query(Permit).all()
            for p in permits:
                session.run(
                    """
                    MERGE (permit:Permit {permit_uid: $permit_uid})
                    SET permit.permit_type = $permit_type,
                        permit.status = $status,
                        permit.risk_score = $risk_score,
                        permit.issued_by = $issued_by,
                        permit.crew_count = $crew_count,
                        permit.has_conflict = $has_conflict,
                        permit.start_time = $start_time,
                        permit.end_time = $end_time
                    """,
                    permit_uid=p.permit_uid,
                    permit_type=p.permit_type.value,
                    status=p.status.value,
                    risk_score=p.risk_score,
                    issued_by=p.issued_by,
                    crew_count=p.crew_count,
                    has_conflict=p.has_conflict,
                    start_time=p.start_time.isoformat() if p.start_time else None,
                    end_time=p.end_time.isoformat() if p.end_time else None,
                )

                # Permit → ISSUED_FOR → Zone
                session.run(
                    """
                    MATCH (permit:Permit {permit_uid: $permit_uid})
                    MATCH (zone:Zone {zone_id: $zone_id})
                    MERGE (permit)-[:ISSUED_FOR]->(zone)
                    """,
                    permit_uid=p.permit_uid,
                    zone_id=p.zone_id,
                )

            # ── Create Permit conflict relationships ─────────────
            conflicting_permits = db.query(Permit).filter(
                Permit.has_conflict == True,
                Permit.status == PermitStatus.ACTIVE,
            ).all()
            for p in conflicting_permits:
                # Find other active permits in the same zone
                same_zone_permits = db.query(Permit).filter(
                    Permit.zone_id == p.zone_id,
                    Permit.status == PermitStatus.ACTIVE,
                    Permit.id != p.id,
                ).all()
                for other in same_zone_permits:
                    session.run(
                        """
                        MATCH (p1:Permit {permit_uid: $uid1})
                        MATCH (p2:Permit {permit_uid: $uid2})
                        MERGE (p1)-[:CONFLICTS_WITH]->(p2)
                        """,
                        uid1=p.permit_uid,
                        uid2=other.permit_uid,
                    )

            # ── Create Worker nodes ──────────────────────────────
            workers = db.query(Worker).all()
            for w in workers:
                session.run(
                    """
                    MERGE (worker:Worker {employee_id: $employee_id})
                    SET worker.name = $name,
                        worker.role = $role,
                        worker.department = $department,
                        worker.shift = $shift,
                        worker.ppe_status = $ppe_status,
                        worker.is_on_site = $is_on_site
                    """,
                    employee_id=w.employee_id,
                    name=w.name,
                    role=w.role.value,
                    department=w.department,
                    shift=w.shift,
                    ppe_status=w.ppe_status.value if w.ppe_status else "unknown",
                    is_on_site=w.is_on_site,
                )

                # Worker → ASSIGNED_TO → Zone
                if w.zone_id:
                    session.run(
                        """
                        MATCH (worker:Worker {employee_id: $employee_id})
                        MATCH (zone:Zone {zone_id: $zone_id})
                        MERGE (worker)-[:ASSIGNED_TO]->(zone)
                        """,
                        employee_id=w.employee_id,
                        zone_id=w.zone_id,
                    )

            # ── Create Incident nodes ────────────────────────────
            incidents = db.query(Incident).all()
            for inc in incidents:
                session.run(
                    """
                    MERGE (incident:Incident {incident_uid: $incident_uid})
                    SET incident.title = $title,
                        incident.incident_type = $incident_type,
                        incident.severity = $severity,
                        incident.workers_affected = $workers_affected,
                        incident.injuries = $injuries,
                        incident.fatalities = $fatalities,
                        incident.occurred_at = $occurred_at
                    """,
                    incident_uid=inc.incident_uid,
                    title=inc.title,
                    incident_type=inc.incident_type.value,
                    severity=inc.severity.value,
                    workers_affected=inc.workers_affected,
                    injuries=inc.injuries,
                    fatalities=inc.fatalities,
                    occurred_at=inc.occurred_at.isoformat() if inc.occurred_at else None,
                )

                # Incident → OCCURRED_IN → Zone
                if inc.zone_id:
                    session.run(
                        """
                        MATCH (incident:Incident {incident_uid: $incident_uid})
                        MATCH (zone:Zone {zone_id: $zone_id})
                        MERGE (incident)-[:OCCURRED_IN]->(zone)
                        """,
                        incident_uid=inc.incident_uid,
                        zone_id=inc.zone_id,
                    )

                # Incident → INVOLVED_EQUIPMENT → Equipment (match by zone sensors)
                if inc.zone_id:
                    zone_sensors = db.query(Sensor).filter(Sensor.zone_id == inc.zone_id).all()
                    # Link to first relevant sensor in zone by incident type
                    type_sensor_map = {
                        "gas_leak": [SensorType.GAS_H2S, SensorType.GAS_CH4, SensorType.GAS_CO],
                        "fire": [SensorType.TEMPERATURE],
                        "explosion": [SensorType.PRESSURE, SensorType.GAS_CH4],
                        "equipment_failure": [SensorType.VIBRATION],
                    }
                    relevant_types = type_sensor_map.get(inc.incident_type.value, [])
                    for s in zone_sensors:
                        if s.sensor_type in relevant_types:
                            session.run(
                                """
                                MATCH (incident:Incident {incident_uid: $incident_uid})
                                MATCH (eq:Equipment {sensor_uid: $sensor_uid})
                                MERGE (incident)-[:INVOLVED_EQUIPMENT]->(eq)
                                """,
                                incident_uid=inc.incident_uid,
                                sensor_uid=s.sensor_uid,
                            )

            # ── Create indexes for performance ───────────────────
            session.run("CREATE INDEX IF NOT EXISTS FOR (z:Zone) ON (z.zone_id)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (e:Equipment) ON (e.sensor_uid)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (p:Permit) ON (p.permit_uid)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (w:Worker) ON (w.employee_id)")
            session.run("CREATE INDEX IF NOT EXISTS FOR (i:Incident) ON (i.incident_uid)")

        print("    ✓ Knowledge Graph synced to Neo4j")
    except Exception as e:
        print(f"    ⚠ Neo4j sync error: {e}")


# ─── Query Functions ──────────────────────────────────────────────────────────

def get_graph_summary() -> dict:
    """Get overall graph statistics."""
    driver = get_driver()
    try:
        with driver.session() as session:
            counts = {}
            for label in ["Zone", "Equipment", "Permit", "Worker", "Incident", "Risk"]:
                result = session.run(f"MATCH (n:{label}) RETURN count(n) AS cnt")
                counts[label.lower() + "_count"] = result.single()["cnt"]

            rel_result = session.run("MATCH ()-[r]->() RETURN count(r) AS cnt")
            counts["relationship_count"] = rel_result.single()["cnt"]

            # Get relationship type breakdown
            rel_types = session.run(
                "MATCH ()-[r]->() RETURN type(r) AS rel_type, count(r) AS cnt ORDER BY cnt DESC"
            )
            counts["relationship_types"] = [
                {"type": r["rel_type"], "count": r["cnt"]} for r in rel_types
            ]

            return counts
    except Exception as e:
        return {"error": str(e)}


def get_equipment_risks(sensor_uid: str) -> dict:
    """Get all risks connected to a piece of equipment and its zone context."""
    driver = get_driver()
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (eq:Equipment {sensor_uid: $sensor_uid})
                OPTIONAL MATCH (eq)-[:LOCATED_IN]->(zone:Zone)
                OPTIONAL MATCH (eq)-[:HAS_RISK]->(risk:Risk)
                OPTIONAL MATCH (incident:Incident)-[:INVOLVED_EQUIPMENT]->(eq)
                OPTIONAL MATCH (permit:Permit)-[:ISSUED_FOR]->(zone)
                WHERE permit.status = 'active'
                RETURN eq, zone,
                       collect(DISTINCT risk) AS risks,
                       collect(DISTINCT incident) AS incidents,
                       collect(DISTINCT permit) AS permits
                """,
                sensor_uid=sensor_uid,
            )
            record = result.single()
            if not record or not record["eq"]:
                return {"error": "Equipment not found"}

            eq = dict(record["eq"])
            zone = dict(record["zone"]) if record["zone"] else None

            return {
                "equipment": eq,
                "zone": zone,
                "active_risks": [dict(r) for r in record["risks"]],
                "related_incidents": [
                    {
                        "incident_uid": dict(i).get("incident_uid"),
                        "title": dict(i).get("title"),
                        "severity": dict(i).get("severity"),
                        "incident_type": dict(i).get("incident_type"),
                    }
                    for i in record["incidents"]
                ],
                "active_permits_in_zone": [
                    {
                        "permit_uid": dict(p).get("permit_uid"),
                        "permit_type": dict(p).get("permit_type"),
                        "has_conflict": dict(p).get("has_conflict"),
                    }
                    for p in record["permits"]
                ],
                "risk_count": len(record["risks"]),
                "incident_count": len(record["incidents"]),
            }
    except Exception as e:
        return {"error": str(e)}


def get_zone_relationships(zone_id: int) -> dict:
    """Get all entities connected to a zone."""
    driver = get_driver()
    try:
        with driver.session() as session:
            result = session.run(
                """
                MATCH (zone:Zone {zone_id: $zone_id})
                OPTIONAL MATCH (eq:Equipment)-[:LOCATED_IN]->(zone)
                OPTIONAL MATCH (worker:Worker)-[:ASSIGNED_TO]->(zone)
                OPTIONAL MATCH (permit:Permit)-[:ISSUED_FOR]->(zone)
                OPTIONAL MATCH (incident:Incident)-[:OCCURRED_IN]->(zone)
                RETURN zone,
                       collect(DISTINCT eq) AS equipment,
                       collect(DISTINCT worker) AS workers,
                       collect(DISTINCT permit) AS permits,
                       collect(DISTINCT incident) AS incidents
                """,
                zone_id=zone_id,
            )
            record = result.single()
            if not record or not record["zone"]:
                return {"error": "Zone not found"}

            zone = dict(record["zone"])
            return {
                "zone": zone,
                "equipment": [
                    {
                        "sensor_uid": dict(e).get("sensor_uid"),
                        "name": dict(e).get("name"),
                        "sensor_type": dict(e).get("sensor_type"),
                        "health_status": dict(e).get("health_status"),
                        "current_value": dict(e).get("current_value"),
                        "unit": dict(e).get("unit"),
                    }
                    for e in record["equipment"]
                ],
                "workers": [
                    {
                        "employee_id": dict(w).get("employee_id"),
                        "name": dict(w).get("name"),
                        "role": dict(w).get("role"),
                        "ppe_status": dict(w).get("ppe_status"),
                        "is_on_site": dict(w).get("is_on_site"),
                    }
                    for w in record["workers"]
                ],
                "permits": [
                    {
                        "permit_uid": dict(p).get("permit_uid"),
                        "permit_type": dict(p).get("permit_type"),
                        "status": dict(p).get("status"),
                        "risk_score": dict(p).get("risk_score"),
                        "has_conflict": dict(p).get("has_conflict"),
                    }
                    for p in record["permits"]
                ],
                "incidents": [
                    {
                        "incident_uid": dict(i).get("incident_uid"),
                        "title": dict(i).get("title"),
                        "incident_type": dict(i).get("incident_type"),
                        "severity": dict(i).get("severity"),
                    }
                    for i in record["incidents"]
                ],
                "counts": {
                    "equipment": len(record["equipment"]),
                    "workers": len(record["workers"]),
                    "permits": len(record["permits"]),
                    "incidents": len(record["incidents"]),
                },
            }
    except Exception as e:
        return {"error": str(e)}


def get_risk_chain(zone_id: int) -> dict:
    """
    Trace the full risk chain for a zone:
    Zone ← Equipment → Risks
    Zone ← Permits (with conflicts)
    Zone ← Workers (at risk)
    Zone ← Incidents (historical)
    """
    driver = get_driver()
    try:
        with driver.session() as session:
            # Get equipment with active risks in this zone
            risk_chain = session.run(
                """
                MATCH (zone:Zone {zone_id: $zone_id})
                OPTIONAL MATCH (eq:Equipment)-[:LOCATED_IN]->(zone)
                OPTIONAL MATCH (eq)-[:HAS_RISK]->(risk:Risk)
                RETURN zone.name AS zone_name,
                       zone.classification AS classification,
                       zone.risk_score AS zone_risk_score,
                       collect(DISTINCT {
                           equipment: eq.name,
                           sensor_uid: eq.sensor_uid,
                           sensor_type: eq.sensor_type,
                           health: eq.health_status,
                           value: eq.current_value,
                           unit: eq.unit,
                           risk_type: risk.type,
                           risk_level: risk.level
                       }) AS equipment_risks
                """,
                zone_id=zone_id,
            )
            chain_record = risk_chain.single()
            if not chain_record:
                return {"error": "Zone not found"}

            # Get permit conflicts
            conflicts = session.run(
                """
                MATCH (p1:Permit)-[:ISSUED_FOR]->(zone:Zone {zone_id: $zone_id})
                WHERE p1.status = 'active'
                OPTIONAL MATCH (p1)-[:CONFLICTS_WITH]->(p2:Permit)
                RETURN p1.permit_uid AS permit_uid,
                       p1.permit_type AS permit_type,
                       p1.risk_score AS risk_score,
                       collect(DISTINCT p2.permit_uid) AS conflicts_with
                """,
                zone_id=zone_id,
            )
            permit_data = [
                {
                    "permit_uid": r["permit_uid"],
                    "permit_type": r["permit_type"],
                    "risk_score": r["risk_score"],
                    "conflicts_with": r["conflicts_with"],
                }
                for r in conflicts
            ]

            # Get workers at risk
            at_risk_workers = session.run(
                """
                MATCH (worker:Worker)-[:ASSIGNED_TO]->(zone:Zone {zone_id: $zone_id})
                WHERE worker.is_on_site = true
                RETURN worker.employee_id AS employee_id,
                       worker.name AS name,
                       worker.role AS role,
                       worker.ppe_status AS ppe_status
                """,
                zone_id=zone_id,
            )
            workers = [dict(r) for r in at_risk_workers]

            # Filter out empty equipment entries
            equipment_risks = [
                er for er in chain_record["equipment_risks"]
                if er.get("equipment") is not None
            ]

            return {
                "zone_name": chain_record["zone_name"],
                "classification": chain_record["classification"],
                "zone_risk_score": chain_record["zone_risk_score"],
                "risk_chain": {
                    "equipment_at_risk": [
                        er for er in equipment_risks if er.get("risk_level") is not None
                    ],
                    "all_equipment": equipment_risks,
                    "active_permits": permit_data,
                    "workers_at_risk": workers,
                },
                "summary": {
                    "equipment_with_risks": len([
                        er for er in equipment_risks if er.get("risk_level") is not None
                    ]),
                    "total_equipment": len(equipment_risks),
                    "active_permits": len(permit_data),
                    "permit_conflicts": len([p for p in permit_data if p["conflicts_with"]]),
                    "workers_on_site": len(workers),
                    "ppe_non_compliant": len([w for w in workers if w.get("ppe_status") == "non_compliant"]),
                },
                "timestamp": datetime.utcnow().isoformat(),
            }
    except Exception as e:
        return {"error": str(e)}
