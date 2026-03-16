"""Public transparency endpoints — no authentication required.

These endpoints allow anyone to view project decision timelines and
verify the integrity of decision records against the blockchain.
"""
import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.decision import DecisionRecord
from app.models.project import Project
from app.schemas.decision import DecisionResponse, TimelineResponse
from app.services.blockchain import verify_onchain
from app.services.hash_chain import verify_chain

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/public/projects/{project_id}/timeline", response_model=TimelineResponse)
async def public_timeline(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> TimelineResponse:
    """Public read-only decision timeline for a project."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = result.scalars().all()

    cost_trajectory: list[float] = []
    cumulative = float(project.original_budget)
    for d in decisions:
        if d.cost_impact is not None:
            cumulative += float(d.cost_impact)
        cost_trajectory.append(cumulative)

    decision_responses = [
        DecisionResponse(
            id=d.id,
            project_id=d.project_id,
            sequence_number=d.sequence_number,
            decision_type=d.decision_type,
            title=d.title,
            description=d.description,
            justification=d.justification,
            assumptions=d.assumptions,
            cost_impact=float(d.cost_impact) if d.cost_impact is not None else None,
            schedule_impact_days=d.schedule_impact_days,
            risk_level=d.risk_level,
            approved_by=d.approved_by,
            created_by=d.created_by,
            supporting_docs=d.supporting_docs,
            previous_hash=d.previous_hash,
            record_hash=d.record_hash,
            tx_hash=d.tx_hash,
            block_number=d.block_number,
            chain_verified=d.chain_verified,
            triggered_by_sensor=d.triggered_by_sensor,
            created_at=d.created_at,
        )
        for d in decisions
    ]

    return TimelineResponse(decisions=decision_responses, cost_trajectory=cost_trajectory)


@router.post("/public/projects/{project_id}/verify/chain")
async def public_verify_chain(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Public chain integrity verification — anyone can check."""
    result = await db.execute(select(Project).where(Project.id == project_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Project not found")

    return await verify_chain(db, project_id)


@router.get("/public/verify/{record_hash}")
async def public_verify_hash(
    record_hash: str,
    db: AsyncSession = Depends(get_db),
) -> dict:
    """Verify a single decision record hash — lookup by hash, check blockchain."""
    result = await db.execute(
        select(DecisionRecord).where(DecisionRecord.record_hash == record_hash)
    )
    decision = result.scalar_one_or_none()
    if decision is None:
        raise HTTPException(status_code=404, detail="Decision record not found for this hash")

    blockchain_result = await verify_onchain(
        decision.project_id, decision.sequence_number, decision.record_hash
    )

    return {
        "record_hash": decision.record_hash,
        "project_id": str(decision.project_id),
        "sequence_number": decision.sequence_number,
        "title": decision.title,
        "decision_type": decision.decision_type,
        "created_at": decision.created_at.isoformat(),
        "previous_hash": decision.previous_hash,
        "tx_hash": decision.tx_hash,
        "block_number": decision.block_number,
        "chain_verified": decision.chain_verified,
        "blockchain_verification": blockchain_result,
    }
