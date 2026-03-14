import json
import logging
import uuid

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.models.analysis import AIAnalysisResult
from app.models.assumption import Assumption
from app.models.decision import DecisionRecord
from app.models.project import Project
from app.models.sensor import SensorReading

logger = logging.getLogger(__name__)

PROMPT_TEMPLATE = """[INST] Analyse the following infrastructure decision chain for risk patterns.

Project: {name}
Original Budget: A${budget}
Current Budget: A${current}
Decisions: {decisions_json}
Assumptions: {assumptions_json}
Sensor Readings: {sensors_json}

Identify patterns: assumption_drift, cost_anomaly, approval_pattern, scope_creep, sensor_contradiction, risk_acceptance_cascade.

Respond ONLY with JSON:
{{"patterns": [{{"type": "...", "severity": "info|warning|critical", "confidence": 0.0-1.0, "affected_decisions": [seq_numbers], "explanation": "..."}}], "overall_risk_score": 0-100, "summary": "..."}}
[/INST]"""

MAX_RETRIES = 3


async def analyse_project(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> list[AIAnalysisResult]:
    """Run AI analysis on a project's decision chain."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        logger.error("Project %s not found for analysis", project_id)
        return []

    decisions_result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = decisions_result.scalars().all()

    assumptions_result = await db.execute(
        select(Assumption).where(Assumption.project_id == project_id)
    )
    assumptions = assumptions_result.scalars().all()

    sensors_result = await db.execute(
        select(SensorReading)
        .where(SensorReading.project_id == project_id)
        .order_by(SensorReading.created_at.desc())
        .limit(100)
    )
    sensor_readings = sensors_result.scalars().all()

    decisions_data = [
        {
            "seq": d.sequence_number,
            "type": d.decision_type,
            "title": d.title,
            "cost_impact": float(d.cost_impact) if d.cost_impact else 0,
            "risk": d.risk_level,
            "date": d.created_at.isoformat(),
        }
        for d in decisions
    ]

    assumptions_data = [
        {
            "text": a.assumption_text,
            "status": a.status,
            "threshold": float(a.threshold_value) if a.threshold_value else None,
            "sensor_type": a.sensor_type,
        }
        for a in assumptions
    ]

    sensors_data = [
        {
            "type": s.sensor_type,
            "value": float(s.value),
            "anomaly": s.anomaly_flag,
            "date": s.created_at.isoformat(),
        }
        for s in sensor_readings[:20]
    ]

    prompt = PROMPT_TEMPLATE.format(
        name=project.name,
        budget=f"{float(project.original_budget):,.0f}",
        current=f"{float(project.current_budget):,.0f}",
        decisions_json=json.dumps(decisions_data),
        assumptions_json=json.dumps(assumptions_data),
        sensors_json=json.dumps(sensors_data),
    )

    if not settings.HF_API_TOKEN or not settings.HF_MODEL_ID:
        logger.info("HuggingFace credentials not configured, using rule-based analysis")
        return await _rule_based_analysis(db, project_id, decisions, assumptions, sensor_readings)

    for attempt in range(MAX_RETRIES):
        try:
            async with httpx.AsyncClient(timeout=60) as client:
                response = await client.post(
                    f"https://api-inference.huggingface.co/models/{settings.HF_MODEL_ID}",
                    headers={"Authorization": f"Bearer {settings.HF_API_TOKEN}"},
                    json={"inputs": prompt, "parameters": {"max_new_tokens": 1000}},
                )

                if response.status_code == 429:
                    wait = 2 ** (attempt + 1)
                    logger.warning("HuggingFace rate limited, retrying in %ds", wait)
                    import asyncio
                    await asyncio.sleep(wait)
                    continue

                response.raise_for_status()
                result_data = response.json()

                text_output = ""
                if isinstance(result_data, list) and result_data:
                    text_output = result_data[0].get("generated_text", "")
                elif isinstance(result_data, dict):
                    text_output = result_data.get("generated_text", "")

                json_start = text_output.find("{")
                json_end = text_output.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    parsed = json.loads(text_output[json_start:json_end])
                    return await _save_findings(db, project_id, parsed)

                logger.warning("Could not parse AI response: %s", text_output[:200])
                return await _rule_based_analysis(db, project_id, decisions, assumptions, sensor_readings)

        except httpx.HTTPStatusError as e:
            logger.error("HuggingFace API error (attempt %d): %s", attempt + 1, e)
        except Exception as e:
            logger.error("AI analysis error (attempt %d): %s", attempt + 1, e)

    logger.error("AI analysis failed after %d retries, falling back to rule-based", MAX_RETRIES)
    return await _rule_based_analysis(db, project_id, decisions, assumptions, sensor_readings)


async def _save_findings(
    db: AsyncSession,
    project_id: uuid.UUID,
    parsed: dict,
) -> list[AIAnalysisResult]:
    findings = []
    patterns = parsed.get("patterns", [])

    for pattern in patterns:
        confidence = min(max(float(pattern.get("confidence", 0.5)), 0.0), 1.0)
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type=pattern.get("type", "risk_assessment"),
            severity=pattern.get("severity", "info"),
            finding=pattern.get("explanation", "No explanation provided"),
            related_decisions=pattern.get("affected_decisions"),
            confidence_score=confidence,
            model_version=settings.HF_MODEL_ID or "rule-based-v1.0",
        )
        db.add(finding)
        findings.append(finding)

    await db.flush()
    return findings


async def _rule_based_analysis(
    db: AsyncSession,
    project_id: uuid.UUID,
    decisions: list,
    assumptions: list,
    sensor_readings: list,
) -> list[AIAnalysisResult]:
    """Simple rule-based analysis fallback when HuggingFace is unavailable."""
    findings = []

    scope_changes = [d for d in decisions if d.decision_type == "scope_change"]
    if len(scope_changes) >= 3:
        affected = [d.sequence_number for d in scope_changes]
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type="scope_creep",
            severity="critical" if len(scope_changes) >= 4 else "warning",
            finding=f"Detected {len(scope_changes)} scope changes across the project lifecycle. "
                    f"Multiple scope expansions suggest potential scope creep that may impact "
                    f"budget and timeline adherence.",
            related_decisions=affected,
            confidence_score=0.85,
            model_version="rule-based-v1.0",
        )
        db.add(finding)
        findings.append(finding)

    assumption_changes = [d for d in decisions if d.decision_type == "assumption_change"]
    if len(assumption_changes) >= 2:
        affected = [d.sequence_number for d in assumption_changes]
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type="assumption_drift",
            severity="warning",
            finding=f"Identified {len(assumption_changes)} assumption revisions. "
                    f"Repeated assumption changes may indicate inadequate initial planning "
                    f"or significant external market shifts.",
            related_decisions=affected,
            confidence_score=0.80,
            model_version="rule-based-v1.0",
        )
        db.add(finding)
        findings.append(finding)

    anomalies = [r for r in sensor_readings if r.anomaly_flag]
    if len(anomalies) >= 5:
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type="sensor_contradiction",
            severity="warning",
            finding=f"Detected {len(anomalies)} sensor anomalies that contradict active assumptions. "
                    f"Sensor data suggests environmental or market conditions have shifted "
                    f"beyond planned parameters.",
            related_sensors=[str(a.id) for a in anomalies[:10]],
            confidence_score=0.75,
            model_version="rule-based-v1.0",
        )
        db.add(finding)
        findings.append(finding)

    total_cost = sum(float(d.cost_impact) for d in decisions if d.cost_impact is not None)
    if total_cost > 0:
        approvers = set()
        for d in decisions:
            if d.approved_by:
                approvers.add(str(d.approved_by))
        if len(approvers) <= 1 and len(decisions) > 5:
            affected = [d.sequence_number for d in decisions if d.approved_by]
            finding = AIAnalysisResult(
                project_id=project_id,
                analysis_type="approval_pattern",
                severity="warning",
                finding=f"All {len(affected)} approved decisions were approved by a single individual. "
                        f"This concentration of approval authority may represent a governance risk.",
                related_decisions=affected,
                confidence_score=0.78,
                model_version="rule-based-v1.0",
            )
            db.add(finding)
            findings.append(finding)

    await db.flush()
    return findings
