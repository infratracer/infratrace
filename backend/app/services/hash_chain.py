import hashlib
import logging
import uuid
from datetime import datetime

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.decision import DecisionRecord

logger = logging.getLogger(__name__)

GENESIS_HASH = "0" * 64


def compute_hash(
    project_id: uuid.UUID,
    sequence_number: int,
    decision_type: str,
    title: str,
    description: str,
    justification: str,
    cost_impact: float | None,
    approved_by: uuid.UUID | None,
    created_at: datetime,
    previous_hash: str,
) -> str:
    """Compute SHA-256 hash for a decision record.

    Formula: SHA256(project_id|sequence_number|decision_type|title|description|
                    justification|cost_impact|approved_by|created_at_iso|previous_hash)

    Rules:
    - All fields converted to string. None/null becomes empty string "".
    - UUIDs: lowercase hex with hyphens (standard UUID format).
    - cost_impact: formatted to 2 decimal places. None → "".
    - created_at: ISO 8601 UTC string with microseconds.
    """
    cost_str = f"{cost_impact:.2f}" if cost_impact is not None else ""
    approved_str = str(approved_by) if approved_by is not None else ""
    created_str = created_at.isoformat()

    payload = "|".join([
        str(project_id),
        str(sequence_number),
        decision_type,
        title,
        description,
        justification,
        cost_str,
        approved_str,
        created_str,
        previous_hash,
    ])

    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


async def get_latest_decision(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> DecisionRecord | None:
    result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.desc())
        .limit(1)
    )
    return result.scalar_one_or_none()


async def get_previous_hash(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> tuple[str, int]:
    """Return (previous_hash, next_sequence_number) for a project."""
    latest = await get_latest_decision(db, project_id)
    if latest is None:
        return GENESIS_HASH, 1
    return latest.record_hash, latest.sequence_number + 1


async def acquire_project_lock(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> None:
    """Acquire advisory lock to prevent concurrent decision creation."""
    await db.execute(
        text("SELECT pg_advisory_xact_lock(hashtext(:pid))"),
        {"pid": str(project_id)},
    )


async def verify_chain(
    db: AsyncSession,
    project_id: uuid.UUID,
) -> dict:
    """Verify the hash chain integrity for a project."""
    result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = result.scalars().all()

    if not decisions:
        return {
            "valid": True,
            "total_records": 0,
            "message": "No records to verify",
        }

    expected_prev = GENESIS_HASH

    for decision in decisions:
        if decision.previous_hash != expected_prev:
            return {
                "valid": False,
                "total_records": len(decisions),
                "broken_at": decision.sequence_number,
                "message": f"Chain broken at record #{decision.sequence_number}: "
                           f"expected previous_hash {expected_prev[:16]}... "
                           f"but found {decision.previous_hash[:16]}...",
            }

        recomputed = compute_hash(
            project_id=decision.project_id,
            sequence_number=decision.sequence_number,
            decision_type=decision.decision_type,
            title=decision.title,
            description=decision.description,
            justification=decision.justification,
            cost_impact=float(decision.cost_impact) if decision.cost_impact is not None else None,
            approved_by=decision.approved_by,
            created_at=decision.created_at,
            previous_hash=decision.previous_hash,
        )

        if recomputed != decision.record_hash:
            return {
                "valid": False,
                "total_records": len(decisions),
                "broken_at": decision.sequence_number,
                "message": f"Hash mismatch at record #{decision.sequence_number}: "
                           f"stored {decision.record_hash[:16]}... "
                           f"vs computed {recomputed[:16]}...",
            }

        expected_prev = decision.record_hash

    return {
        "valid": True,
        "total_records": len(decisions),
        "message": f"Chain intact — {len(decisions)} records verified",
    }
