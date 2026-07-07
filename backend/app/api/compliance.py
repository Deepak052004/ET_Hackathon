from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from app.models.db import get_db
from app.models.permit import Permit, PermitStatus, PermitType
from app.models.alert import Alert, AlertStatus, AlertSeverity, AlertSource
from app.models.zone import Zone

router = APIRouter(prefix="/api/compliance", tags=["compliance"])

# Compliance rules — encoded requirements from OISD, Factory Act, DGMS
COMPLIANCE_RULES = [
    {
        "rule_id": "OISD-105-4.3",
        "regulation": "OISD-GDN-105 §4.3",
        "title": "Gas Test Before Hot Work",
        "description": "Hot work permits require a gas test within 30 minutes of work commencement.",
        "category": "OISD",
        "severity": "critical",
    },
    {
        "rule_id": "OISD-105-6.1",
        "regulation": "OISD-GDN-105 §6.1",
        "title": "Permit Overlap in Same Zone",
        "description": "Hot work and confined space permits must not overlap in the same zone without additional safety measures.",
        "category": "OISD",
        "severity": "high",
    },
    {
        "rule_id": "FACTORY-ACT-7A",
        "regulation": "Factory Act §7A",
        "title": "PPE Mandatory in Hazardous Zones",
        "description": "All workers in hazardous and critical zones must wear mandatory PPE at all times.",
        "category": "Factory Act",
        "severity": "high",
    },
    {
        "rule_id": "DGMS-2019-07",
        "regulation": "DGMS Circular 2019-07",
        "title": "H2S Monitoring Frequency",
        "description": "H2S sensor readings must be logged at intervals not exceeding 5 minutes in critical zones.",
        "category": "DGMS",
        "severity": "critical",
    },
    {
        "rule_id": "IS-15656",
        "regulation": "IS 15656",
        "title": "Oxygen Level Safe Range",
        "description": "Oxygen levels in enclosed spaces must be maintained between 19.5% and 23.5%.",
        "category": "IS Standards",
        "severity": "critical",
    },
    {
        "rule_id": "OISD-116",
        "regulation": "OISD-STD-116",
        "title": "Fire Detection System Testing",
        "description": "Fire detection and suppression systems must be tested monthly.",
        "category": "OISD",
        "severity": "medium",
    },
    {
        "rule_id": "OISD-118",
        "regulation": "OISD-STD-118 §5.2",
        "title": "Safety Audit Frequency",
        "description": "Internal safety audits must be conducted at least quarterly.",
        "category": "OISD",
        "severity": "medium",
    },
    {
        "rule_id": "FACTORY-ACT-41B",
        "regulation": "Factory Act §41B",
        "title": "Hazardous Process Disclosure",
        "description": "Workers must be informed of hazards associated with their work area.",
        "category": "Factory Act",
        "severity": "high",
    },
]


def _evaluate_violations(db: Session) -> list[dict]:
    """Evaluate current plant state against compliance rules."""
    violations = []

    # Rule 1: Gas test for active hot work permits (simplified check)
    hot_work_permits = db.query(Permit).filter(
        Permit.permit_type == PermitType.HOT_WORK,
        Permit.status == PermitStatus.ACTIVE,
    ).all()
    if hot_work_permits:
        violations.append({
            "rule_id": "OISD-105-4.3",
            "regulation": "OISD-GDN-105 §4.3",
            "title": "Gas Test Overdue for Hot Work Permit",
            "description": f"{len(hot_work_permits)} active hot work permit(s) detected. Gas test verification required within 30 minutes.",
            "severity": "critical",
            "affected": [p.permit_uid for p in hot_work_permits[:3]],
            "remediation": "Conduct immediate gas test in affected zones. Document results in permit log before work continues.",
            "category": "OISD",
        })

    # Rule 2: Permit conflicts
    conflicting = db.query(Permit).filter(
        Permit.has_conflict == True,
        Permit.status == PermitStatus.ACTIVE,
    ).all()
    if conflicting:
        violations.append({
            "rule_id": "OISD-105-6.1",
            "regulation": "OISD-GDN-105 §6.1",
            "title": "Conflicting Permits Active in Same Zone",
            "description": f"{len(conflicting)} permit(s) with spatial conflicts are currently active.",
            "severity": "high",
            "affected": [p.permit_uid for p in conflicting[:3]],
            "remediation": "Review conflicting permits. Stagger work schedules or implement additional isolation measures.",
            "category": "OISD",
        })

    # Rule 3: PPE violations from alerts
    ppe_alerts = db.query(Alert).filter(
        Alert.source == AlertSource.CV_DETECTION,
        Alert.status == AlertStatus.ACTIVE,
    ).count()
    if ppe_alerts:
        violations.append({
            "rule_id": "FACTORY-ACT-7A",
            "regulation": "Factory Act §7A",
            "title": f"PPE Non-Compliance Detected ({ppe_alerts} incidents)",
            "description": "CCTV analytics have detected PPE violations in hazardous zones.",
            "severity": "high",
            "affected": [],
            "remediation": "Issue immediate corrective notice. Conduct PPE refresher briefing for shift. Review access control procedures.",
            "category": "Factory Act",
        })

    return violations


@router.get("/")
def get_compliance_scorecard(db: Session = Depends(get_db)):
    """Full compliance scorecard with scores per regulation category."""
    violations = _evaluate_violations(db)

    # Score by category
    categories = {
        "OISD": {"total_rules": 4, "violations": 0, "score": 100},
        "Factory Act": {"total_rules": 2, "violations": 0, "score": 100},
        "DGMS": {"total_rules": 1, "violations": 0, "score": 100},
        "IS Standards": {"total_rules": 1, "violations": 0, "score": 100},
    }
    critical_violations = 0
    for v in violations:
        cat = v.get("category", "OISD")
        if cat in categories:
            categories[cat]["violations"] += 1
            penalty = 25 if v["severity"] == "critical" else 15 if v["severity"] == "high" else 8
            categories[cat]["score"] = max(0, categories[cat]["score"] - penalty)
        if v["severity"] == "critical":
            critical_violations += 1

    overall_score = round(sum(c["score"] for c in categories.values()) / len(categories), 1)

    return {
        "overall_score": overall_score,
        "overall_status": "critical" if overall_score < 60 else "warning" if overall_score < 80 else "compliant",
        "total_violations": len(violations),
        "critical_violations": critical_violations,
        "categories": [
            {"name": k, **v} for k, v in categories.items()
        ],
        "violations": violations,
        "last_audit": datetime.utcnow().isoformat(),
        "next_audit_due": "2026-07-15T00:00:00",
        "timestamp": datetime.utcnow().isoformat(),
    }
