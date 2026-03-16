import io
import logging
import uuid
from datetime import datetime, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analysis import AIAnalysisResult
from app.models.assumption import Assumption
from app.models.decision import DecisionRecord
from app.models.project import Project
from app.models.sensor import SensorReading

logger = logging.getLogger(__name__)


async def generate_pdf_report(
    db: AsyncSession,
    project_id: uuid.UUID,
    include_ai: bool = True,
    include_sensors: bool = True,
    include_blockchain: bool = True,
) -> bytes:
    """Generate a PDF audit report for a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise ValueError(f"Project {project_id} not found")

    decisions_result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = decisions_result.scalars().all()

    html_parts = [
        "<html><head>",
        "<style>",
        "body { font-family: 'Inter', Arial, sans-serif; margin: 40px; color: #0A1128; }",
        "h1 { color: #0A1128; border-bottom: 2px solid #4A9EFF; padding-bottom: 8px; }",
        "h2 { color: #2563EB; margin-top: 24px; }",
        "table { border-collapse: collapse; width: 100%; margin: 12px 0; }",
        "th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 11px; }",
        "th { background: #f0f2f8; font-weight: 600; }",
        ".badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; }",
        ".critical { background: #ffe0e8; color: #E8305B; }",
        ".warning { background: #fff3d0; color: #E09400; }",
        ".info { background: #e0f0ff; color: #2563EB; }",
        ".hash { font-family: 'JetBrains Mono', monospace; font-size: 9px; color: #5A6785; }",
        ".metric { font-size: 20px; font-weight: 700; }",
        ".footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 9px; color: #9AA4B8; }",
        "</style></head><body>",
    ]

    html_parts.append(f"<h1>InfraTrace Audit Report — {project.name}</h1>")
    html_parts.append(f"<p>Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}</p>")

    budget_drift = float(project.current_budget) - float(project.original_budget)
    drift_pct = (budget_drift / float(project.original_budget)) * 100 if float(project.original_budget) > 0 else 0

    html_parts.append("<h2>Project Summary</h2>")
    html_parts.append("<table>")
    html_parts.append(f"<tr><th>Original Budget</th><td class='metric'>A${float(project.original_budget):,.0f}</td></tr>")
    html_parts.append(f"<tr><th>Current Budget</th><td class='metric'>A${float(project.current_budget):,.0f}</td></tr>")
    html_parts.append(f"<tr><th>Budget Drift</th><td>A${budget_drift:,.0f} ({drift_pct:+.1f}%)</td></tr>")
    html_parts.append(f"<tr><th>Status</th><td>{project.status}</td></tr>")
    html_parts.append(f"<tr><th>Total Decisions</th><td>{len(decisions)}</td></tr>")
    html_parts.append("</table>")

    html_parts.append("<h2>Decision Timeline</h2>")
    html_parts.append("<table><tr><th>#</th><th>Date</th><th>Type</th><th>Title</th><th>Cost Impact</th><th>Risk</th></tr>")
    for d in decisions:
        cost_str = f"A${float(d.cost_impact):,.0f}" if d.cost_impact else "—"
        risk_str = d.risk_level or "—"
        html_parts.append(
            f"<tr><td>{d.sequence_number}</td>"
            f"<td>{d.created_at.strftime('%Y-%m-%d')}</td>"
            f"<td>{d.decision_type}</td>"
            f"<td>{d.title}</td>"
            f"<td>{cost_str}</td>"
            f"<td>{risk_str}</td></tr>"
        )
    html_parts.append("</table>")

    if include_blockchain:
        html_parts.append("<h2>Blockchain Proofs</h2>")
        html_parts.append("<table><tr><th>#</th><th>Record Hash</th><th>TX Hash</th><th>Status</th></tr>")
        for d in decisions:
            tx = d.tx_hash or "Not anchored"
            status = "✓ Confirmed" if d.chain_verified else "Pending"
            html_parts.append(
                f"<tr><td>{d.sequence_number}</td>"
                f"<td class='hash'>{d.record_hash[:32]}...</td>"
                f"<td class='hash'>{tx[:32]}...</td>"
                f"<td>{status}</td></tr>"
            )
        html_parts.append("</table>")

    if include_ai:
        ai_result = await db.execute(
            select(AIAnalysisResult)
            .where(AIAnalysisResult.project_id == project_id)
            .order_by(AIAnalysisResult.created_at.desc())
        )
        findings = ai_result.scalars().all()
        if findings:
            html_parts.append("<h2>AI Analysis Findings</h2>")
            for f in findings:
                html_parts.append(
                    f"<p><span class='badge {f.severity}'>{f.severity.upper()}</span> "
                    f"<strong>{f.analysis_type}</strong> "
                    f"(confidence: {float(f.confidence_score)*100:.0f}%)</p>"
                    f"<p>{f.finding}</p>"
                )

    if include_sensors:
        anomalies_result = await db.execute(
            select(SensorReading)
            .where(
                SensorReading.project_id == project_id,
                SensorReading.anomaly_flag == True,  # noqa: E712
            )
            .order_by(SensorReading.created_at.desc())
            .limit(20)
        )
        anomalies = anomalies_result.scalars().all()
        if anomalies:
            html_parts.append("<h2>Sensor Anomalies</h2>")
            html_parts.append("<table><tr><th>Type</th><th>Value</th><th>Unit</th><th>Date</th></tr>")
            for a in anomalies:
                html_parts.append(
                    f"<tr><td>{a.sensor_type}</td>"
                    f"<td>{float(a.value):,.2f}</td>"
                    f"<td>{a.unit}</td>"
                    f"<td>{a.created_at.strftime('%Y-%m-%d %H:%M')}</td></tr>"
                )
            html_parts.append("</table>")

    html_parts.append("<div class='footer'>")
    html_parts.append("Generated by InfraTrace — Infrastructure Decision Accountability Platform")
    html_parts.append("</div></body></html>")

    html_content = "\n".join(html_parts)

    try:
        from weasyprint import HTML
        pdf_bytes = HTML(string=html_content).write_pdf()
        return pdf_bytes
    except ImportError:
        logger.warning("WeasyPrint not available, returning HTML as fallback")
        return html_content.encode("utf-8")
    except Exception as e:
        logger.error("PDF generation failed: %s", e)
        raise RuntimeError(f"PDF generation failed: {e}") from e
