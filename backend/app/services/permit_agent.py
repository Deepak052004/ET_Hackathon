"""
SafetyNexus AI — Digital Permit Intelligence Agent
AI-powered permit risk assessment using Gemini.
"""
from datetime import datetime
from sqlalchemy.orm import Session

from app.config import get_settings
from app.models.zone import Zone, ZoneClassification
from app.models.permit import Permit, PermitType, PermitStatus
from app.models.sensor import Sensor, SensorReading, SensorType
from sqlalchemy import desc

settings = get_settings()

# Risk matrix: permit type combinations that create compound risk
CONFLICT_MATRIX = {
    (PermitType.HOT_WORK, PermitType.CONFINED_SPACE): {"risk": 0.9, "reason": "Ignition source + restricted escape route"},
    (PermitType.HOT_WORK, PermitType.RADIOGRAPHY): {"risk": 0.7, "reason": "Multiple hazard sources in same zone"},
    (PermitType.ELECTRICAL, PermitType.CONFINED_SPACE): {"risk": 0.6, "reason": "Electrical hazard in oxygen-deficient environment"},
    (PermitType.HOT_WORK, PermitType.EXCAVATION): {"risk": 0.5, "reason": "Ground disturbance near heat source"},
}


async def assess_permit_risk(
    zone: Zone,
    permit_type: str,
    crew_count: int,
    start_time: datetime,
    end_time: datetime,
    overlapping_permits: list[Permit],
    db: Session,
) -> dict:
    """
    Comprehensive AI permit risk assessment.
    Returns recommendation: approve | approve_with_conditions | deny
    """
    # ── Gather current zone conditions ───────────────────────────────
    gas_sensors = db.query(Sensor).filter(
        Sensor.zone_id == zone.id,
        Sensor.sensor_type.in_([SensorType.GAS_H2S, SensorType.GAS_CH4, SensorType.GAS_CO]),
    ).all()

    gas_readings = []
    peak_gas_risk = 0.0
    for s in gas_sensors:
        reading = db.query(SensorReading).filter(SensorReading.sensor_id == s.id).order_by(desc(SensorReading.timestamp)).first()
        if reading:
            ratio = reading.value / s.threshold_critical
            peak_gas_risk = max(peak_gas_risk, ratio)
            gas_readings.append(f"{s.sensor_type.value}: {reading.value} {s.unit} (threshold: {s.threshold_critical})")

    # ── Check conflict matrix ─────────────────────────────────────────
    conflicts = []
    new_type = PermitType(permit_type) if permit_type in [e.value for e in PermitType] else None
    for existing in overlapping_permits:
        pair = (new_type, existing.permit_type) if new_type else None
        reverse_pair = (existing.permit_type, new_type) if new_type else None
        conflict_info = CONFLICT_MATRIX.get(pair) or CONFLICT_MATRIX.get(reverse_pair)
        if conflict_info:
            conflicts.append({
                "permit_uid": existing.permit_uid,
                "permit_type": existing.permit_type.value,
                "conflict_reason": conflict_info["reason"],
                "conflict_risk": conflict_info["risk"],
            })

    # ── Determine recommendation ──────────────────────────────────────
    has_critical_conflict = any(c["conflict_risk"] >= 0.8 for c in conflicts)
    zone_is_critical = zone.classification in [ZoneClassification.CRITICAL, ZoneClassification.HAZARDOUS]
    high_gas_risk = peak_gas_risk > 0.7

    if has_critical_conflict or high_gas_risk:
        recommendation = "deny"
    elif conflicts or (zone_is_critical and len(overlapping_permits) > 0):
        recommendation = "approve_with_conditions"
    else:
        recommendation = "approve"

    # ── Build risk score ──────────────────────────────────────────────
    base_risk = {
        "HOT_WORK": 70, "CONFINED_SPACE": 60, "ELECTRICAL": 50,
        "WORKING_AT_HEIGHT": 45, "RADIOGRAPHY": 55, "EXCAVATION": 40, "CRITICAL_LIFT": 50,
    }.get(permit_type, 40)
    conflict_penalty = sum(c["conflict_risk"] * 30 for c in conflicts)
    gas_penalty = peak_gas_risk * 25
    crew_factor = min(10, crew_count * 1.5)
    risk_score = min(100, base_risk + conflict_penalty + gas_penalty + crew_factor)

    # ── Build conditions ──────────────────────────────────────────────
    conditions = []
    if permit_type == "HOT_WORK":
        conditions += ["Gas test required within 30 minutes of work commencement (OISD-GDN-105 §4.3)", "Fire watch must be posted throughout duration", "Portable gas detector required on site"]
    if conflicts:
        conditions.append(f"Coordinate with existing permit holders: {', '.join(c['permit_uid'] for c in conflicts)}")
    if zone_is_critical:
        conditions.append("Supervisor must be physically present in zone throughout work duration")
    if crew_count > 5:
        conditions.append("Emergency evacuation drill required before work commencement")

    # ── Call Gemini for detailed reasoning ────────────────────────────
    reasoning = await _generate_permit_reasoning(
        zone=zone,
        permit_type=permit_type,
        crew_count=crew_count,
        gas_readings=gas_readings,
        conflicts=conflicts,
        recommendation=recommendation,
        risk_score=risk_score,
    )

    return {
        "recommendation": recommendation,
        "risk_score": round(risk_score, 1),
        "reasoning": reasoning,
        "conditions": conditions,
        "conflicts_detected": conflicts,
        "zone_classification": zone.classification.value,
        "current_gas_readings": gas_readings,
        "active_permits_in_zone": len(overlapping_permits),
        "assessment_timestamp": datetime.utcnow().isoformat(),
        "regulatory_refs": ["OISD-GDN-105", "Factory Act §36", "DGMS Circular 2019-07"],
    }


async def _generate_permit_reasoning(
    zone: Zone,
    permit_type: str,
    crew_count: int,
    gas_readings: list[str],
    conflicts: list[dict],
    recommendation: str,
    risk_score: float,
) -> str:
    """Generate detailed AI reasoning for the permit recommendation using Gemini."""
    try:
        import google.generativeai as genai
        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-1.5-flash")

        gas_ctx = "\n".join(gas_readings) if gas_readings else "No gas sensors in zone"
        conflict_ctx = "\n".join([f"- {c['permit_type']} ({c['permit_uid']}): {c['conflict_reason']}" for c in conflicts]) if conflicts else "None"

        prompt = f"""You are SafetyNexus AI permit intelligence agent. Assess this permit request:

Permit Type: {permit_type}
Zone: {zone.name} (Classification: {zone.classification.value})
Crew Size: {crew_count} workers
Duration: Active during this assessment

Current Gas Readings in Zone:
{gas_ctx}

Active Conflicting Permits:
{conflict_ctx}

System Recommendation: {recommendation.upper()} (Risk Score: {risk_score}/100)

Provide a concise 2-3 sentence safety assessment explaining WHY this recommendation was made, referencing specific conditions and regulatory requirements. Be direct and actionable."""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        # Fallback reasoning
        if recommendation == "deny":
            return f"Permit DENIED: Critical risk conditions detected in {zone.name}. High gas levels or conflicting active permits create unacceptable compound risk. Address current hazards before resubmitting."
        elif recommendation == "approve_with_conditions":
            return f"Permit approved with conditions for {zone.name}. {len(conflicts)} permit conflict(s) detected requiring coordination. Mandatory safety conditions must be implemented before work commences per OISD-GDN-105."
        else:
            return f"Permit approved for {zone.name}. Current zone conditions are within acceptable safety parameters. Ensure all standard precautions per permit type are followed."
