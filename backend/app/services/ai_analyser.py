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

# OpenRouter free models — rotate on rate limit
OPENROUTER_MODELS = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "mistralai/mistral-small-3.1-24b-instruct:free",
    "google/gemma-3-27b-it:free",
    "qwen/qwen3-4b:free",
]

SYSTEM_PROMPT = """You are an infrastructure project risk analyst. Analyse the project data and identify risk patterns.

You MUST respond with valid JSON only — no markdown, no explanation outside JSON.

JSON format:
{"patterns": [{"type": "scope_creep|cost_anomaly|assumption_drift|approval_pattern|sensor_contradiction|schedule_risk", "severity": "info|warning|critical", "confidence": 0.0-1.0, "affected_decisions": [sequence_numbers], "explanation": "clear 1-2 sentence explanation"}], "overall_risk_score": 0-100, "summary": "1 sentence overall assessment"}"""

USER_PROMPT = """Project: {name}
Original Budget: A${budget}
Current Budget: A${current}
Budget Drift: {drift}%

Decisions ({dec_count} total):
{decisions_json}

Assumptions ({assum_count} total):
{assumptions_json}

Recent Sensor Readings ({sensor_count} readings, {anomaly_count} anomalies):
{sensors_json}

Identify all risk patterns. Be specific about which decisions are affected."""


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
            "approved_by": str(d.approved_by) if d.approved_by else None,
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

    anomalies = [r for r in sensor_readings if r.anomaly_flag]
    sensors_data = [
        {
            "type": s.sensor_type,
            "value": float(s.value),
            "anomaly": s.anomaly_flag,
        }
        for s in sensor_readings[:20]
    ]

    budget = float(project.original_budget)
    current = float(project.current_budget)
    drift = round(((current - budget) / budget * 100), 1) if budget > 0 else 0

    user_prompt = USER_PROMPT.format(
        name=project.name,
        budget=f"{budget:,.0f}",
        current=f"{current:,.0f}",
        drift=drift,
        dec_count=len(decisions),
        decisions_json=json.dumps(decisions_data, indent=2),
        assum_count=len(assumptions),
        assumptions_json=json.dumps(assumptions_data, indent=2),
        sensor_count=len(sensor_readings),
        anomaly_count=len(anomalies),
        sensors_json=json.dumps(sensors_data, indent=2),
    )

    # Try OpenRouter first
    if settings.OPENROUTER_API_KEY:
        ai_result = await _call_openrouter(db, project_id, user_prompt)
        if ai_result is not None:
            return ai_result
        logger.warning("OpenRouter failed, falling back to rule-based analysis")

    # Fallback to rule-based
    try:
        return await _rule_based_analysis(db, project_id, decisions, assumptions, sensor_readings)
    except Exception as e:
        logger.error("Rule-based analysis failed for project %s: %s", project_id, e)
        return []


async def _call_openrouter(
    db: AsyncSession,
    project_id: uuid.UUID,
    user_prompt: str,
) -> list[AIAnalysisResult] | None:
    """Call OpenRouter API with model rotation on failure."""
    for model in OPENROUTER_MODELS:
        try:
            async with httpx.AsyncClient(timeout=45) as client:
                response = await client.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {settings.OPENROUTER_API_KEY}",
                        "Content-Type": "application/json",
                        "HTTP-Referer": settings.FRONTEND_URL,
                        "X-Title": "InfraTrace",
                    },
                    json={
                        "model": model,
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": user_prompt},
                        ],
                        "temperature": 0.3,
                        "max_tokens": 1500,
                    },
                )

                if response.status_code == 429:
                    logger.warning("Rate limited on %s, trying next model", model)
                    continue

                response.raise_for_status()
                data = response.json()

                content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                if not content:
                    logger.warning("Empty response from %s", model)
                    continue

                # Extract JSON from response
                json_start = content.find("{")
                json_end = content.rfind("}") + 1
                if json_start >= 0 and json_end > json_start:
                    parsed = json.loads(content[json_start:json_end])
                    logger.info("AI analysis successful via %s", model)
                    return await _save_findings(db, project_id, parsed, model)

                logger.warning("Could not parse JSON from %s: %s", model, content[:200])
                continue

        except httpx.HTTPStatusError as e:
            logger.error("OpenRouter HTTP error on %s: %s", model, e)
        except json.JSONDecodeError as e:
            logger.error("JSON parse error from %s: %s", model, e)
        except Exception as e:
            logger.error("OpenRouter error on %s: %s", model, e)

    return None


VALID_ANALYSIS_TYPES = {"assumption_drift", "cost_anomaly", "approval_pattern", "scope_creep", "sensor_contradiction", "risk_assessment"}


async def _save_findings(
    db: AsyncSession,
    project_id: uuid.UUID,
    parsed: dict,
    model_version: str,
) -> list[AIAnalysisResult]:
    findings = []
    patterns = parsed.get("patterns", [])

    for pattern in patterns:
        confidence = min(max(float(pattern.get("confidence", 0.5)), 0.0), 1.0)
        atype = pattern.get("type", "risk_assessment")
        if atype not in VALID_ANALYSIS_TYPES:
            atype = "risk_assessment"
        # Ensure related_decisions are JSON-serializable (not UUIDs)
        affected = pattern.get("affected_decisions", [])
        if affected and not isinstance(affected[0], (int, str, float)):
            affected = [str(a) for a in affected]
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type=atype,
            severity=pattern.get("severity", "info"),
            finding=pattern.get("explanation", "No explanation provided"),
            related_decisions=affected if affected else None,
            confidence_score=confidence,
            model_version=model_version,
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
    """Rule-based analysis fallback when AI is unavailable."""
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

    schedule_changes = [d for d in decisions if d.decision_type == "schedule_change"]
    if len(schedule_changes) >= 3:
        affected = [d.sequence_number for d in schedule_changes]
        finding = AIAnalysisResult(
            project_id=project_id,
            analysis_type="risk_assessment",
            severity="warning",
            finding=f"Detected {len(schedule_changes)} schedule modifications. "
                    f"Frequent timeline adjustments indicate potential delivery risk.",
            related_decisions=affected,
            confidence_score=0.72,
            model_version="rule-based-v1.0",
        )
        db.add(finding)
        findings.append(finding)

    await db.flush()
    return findings
