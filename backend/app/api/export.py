"""CSV / JSON export endpoints for decisions and audit logs."""

import csv
import io
import logging
import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import JSONResponse, StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.audit import AuditLog
from app.models.decision import DecisionRecord
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

_user_name_cache: dict[str, str] = {}


async def _resolve_user_name(db: AsyncSession, user_id: uuid.UUID | None) -> str | None:
    if user_id is None:
        return None
    key = str(user_id)
    if key in _user_name_cache:
        return _user_name_cache[key]
    result = await db.execute(select(User.full_name).where(User.id == user_id))
    name = result.scalar_one_or_none()
    if name:
        _user_name_cache[key] = name
    return name


def _csv_response(rows: list[dict], filename: str) -> StreamingResponse:
    """Build a StreamingResponse containing CSV data."""
    buf = io.StringIO()
    if rows:
        writer = csv.DictWriter(buf, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    content = buf.getvalue()
    return StreamingResponse(
        iter([content]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _json_response(rows: list[dict], filename: str) -> JSONResponse:
    return JSONResponse(
        content=rows,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def _ser(value) -> str | None:
    """Serialize a value to a JSON-safe string."""
    if value is None:
        return None
    if isinstance(value, uuid.UUID):
        return str(value)
    if isinstance(value, datetime):
        return value.isoformat()
    return value


# ---------------------------------------------------------------------------
# Decisions export
# ---------------------------------------------------------------------------

DECISION_FIELDS = [
    "sequence_number",
    "decision_type",
    "title",
    "description",
    "justification",
    "cost_impact",
    "risk_level",
    "record_hash",
    "tx_hash",
    "block_number",
    "approved_by_name",
    "created_at",
]


@router.get("/projects/{project_id}/export/decisions")
async def export_decisions(
    project_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export all project decisions as CSV or JSON."""
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = result.scalars().all()

    rows: list[dict] = []
    for d in decisions:
        approved_by_name = await _resolve_user_name(db, d.approved_by)
        rows.append({
            "sequence_number": d.sequence_number,
            "decision_type": d.decision_type,
            "title": d.title,
            "description": d.description,
            "justification": d.justification,
            "cost_impact": float(d.cost_impact) if d.cost_impact is not None else None,
            "risk_level": d.risk_level,
            "record_hash": d.record_hash,
            "tx_hash": d.tx_hash,
            "block_number": d.block_number,
            "approved_by_name": approved_by_name,
            "created_at": _ser(d.created_at),
        })

    if format == "csv":
        return _csv_response(rows, "decisions_export.csv")
    return _json_response(rows, "decisions_export.json")


# ---------------------------------------------------------------------------
# Audit-log export
# ---------------------------------------------------------------------------

AUDIT_FIELDS = [
    "id",
    "user_id",
    "action",
    "resource_type",
    "resource_id",
    "metadata",
    "ip_address",
    "created_at",
]


@router.get("/projects/{project_id}/export/audit-log")
async def export_audit_log(
    project_id: uuid.UUID,
    format: str = Query("csv", pattern="^(csv|json)$"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Export audit log entries related to this project."""
    await require_project_access(project_id, current_user, db)

    # Audit logs reference a project via resource_id (when resource_type is
    # "project") or via metadata->project_id for decision-level entries.
    # We fetch all entries whose resource_id matches the project OR whose
    # metadata contains the project_id.
    project_id_str = str(project_id)

    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.asc())
    )
    all_logs = result.scalars().all()

    rows: list[dict] = []
    for log in all_logs:
        # Match: resource_id is project, or metadata.project_id matches
        matches = False
        if log.resource_id and str(log.resource_id) == project_id_str:
            matches = True
        if log.metadata_ and log.metadata_.get("project_id") == project_id_str:
            matches = True
        if not matches:
            continue

        import json
        rows.append({
            "id": _ser(log.id),
            "user_id": _ser(log.user_id),
            "action": log.action,
            "resource_type": log.resource_type,
            "resource_id": _ser(log.resource_id),
            "metadata": json.dumps(log.metadata_) if log.metadata_ else None,
            "ip_address": log.ip_address,
            "created_at": _ser(log.created_at),
        })

    if format == "csv":
        return _csv_response(rows, "audit_log_export.csv")
    return _json_response(rows, "audit_log_export.json")
