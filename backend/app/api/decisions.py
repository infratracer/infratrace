import logging
import uuid
from decimal import Decimal
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.decision import DecisionRecord
from app.models.project import Project
from app.models.user import User
from app.schemas.decision import (
    ChainVerificationResult,
    DecisionCreate,
    DecisionResponse,
    TimelineResponse,
)
from app.services.audit_service import log_action
from app.services.blockchain import anchor_decision
from app.services.hash_chain import (
    acquire_project_lock,
    compute_hash,
    get_previous_hash,
    verify_chain,
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/projects/{project_id}/decisions",
    response_model=DecisionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_decision(
    project_id: uuid.UUID,
    body: DecisionCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> DecisionResponse:
    """Create a new decision record — the CRITICAL endpoint.

    This is append-only. No edits or deletions are ever permitted.
    """
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    await acquire_project_lock(db, project_id)

    previous_hash, sequence_number = await get_previous_hash(db, project_id)

    created_at = datetime.now(timezone.utc)

    # approved_by: use current user's ID (the person submitting is the approver)
    approver_id = current_user.id

    record_hash = compute_hash(
        project_id=project_id,
        sequence_number=sequence_number,
        decision_type=body.decision_type,
        title=body.title,
        description=body.description,
        justification=body.justification,
        cost_impact=body.cost_impact,
        approved_by=approver_id,
        created_at=created_at,
        previous_hash=previous_hash,
    )

    decision = DecisionRecord(
        project_id=project_id,
        sequence_number=sequence_number,
        decision_type=body.decision_type,
        title=body.title,
        description=body.description,
        justification=body.justification,
        assumptions=body.assumptions,
        cost_impact=body.cost_impact,
        schedule_impact_days=body.schedule_impact_days,
        risk_level=body.risk_level,
        approved_by=approver_id,
        created_by=current_user.id,
        supporting_docs=body.supporting_docs,
        previous_hash=previous_hash,
        record_hash=record_hash,
        triggered_by_sensor=body.triggered_by_sensor,
        created_at=created_at,
    )
    db.add(decision)

    if body.cost_impact is not None:
        project.current_budget = Decimal(str(project.current_budget)) + Decimal(str(body.cost_impact))

    await log_action(
        db,
        user_id=current_user.id,
        action="decision_created",
        resource_type="decision",
        resource_id=decision.id,
        metadata={
            "project_id": str(project_id),
            "sequence": sequence_number,
            "type": body.decision_type,
        },
    )

    await db.flush()

    logger.info(
        "Decision #%d created for project %s (hash=%s)",
        sequence_number,
        project_id,
        record_hash[:16],
    )

    # Anchor to Polygon Amoy in background (non-blocking)
    _decision_id = decision.id
    _seq = sequence_number
    _hash = record_hash

    async def _anchor_bg() -> None:
        from app.database import async_session
        async with async_session() as bg_db:
            await anchor_decision(bg_db, _decision_id, project_id, _seq, _hash)

    background_tasks.add_task(_anchor_bg)

    return DecisionResponse(
        id=decision.id,
        project_id=decision.project_id,
        sequence_number=decision.sequence_number,
        decision_type=decision.decision_type,
        title=decision.title,
        description=decision.description,
        justification=decision.justification,
        assumptions=decision.assumptions,
        cost_impact=float(decision.cost_impact) if decision.cost_impact is not None else None,
        schedule_impact_days=decision.schedule_impact_days,
        risk_level=decision.risk_level,
        approved_by=decision.approved_by,
        created_by=decision.created_by,
        supporting_docs=decision.supporting_docs,
        previous_hash=decision.previous_hash,
        record_hash=decision.record_hash,
        tx_hash=decision.tx_hash,
        block_number=decision.block_number,
        chain_verified=decision.chain_verified,
        triggered_by_sensor=decision.triggered_by_sensor,
        created_at=decision.created_at,
    )


@router.get("/projects/{project_id}/decisions", response_model=list[DecisionResponse])
async def list_decisions(
    project_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    decision_type: str | None = None,
    risk: str | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DecisionResponse]:
    await require_project_access(project_id, current_user, db)

    query = select(DecisionRecord).where(DecisionRecord.project_id == project_id)

    if decision_type:
        query = query.where(DecisionRecord.decision_type == decision_type)
    if risk:
        query = query.where(DecisionRecord.risk_level == risk)

    query = query.order_by(DecisionRecord.sequence_number.asc())
    query = query.offset((page - 1) * per_page).limit(per_page)

    result = await db.execute(query)
    decisions = result.scalars().all()

    return [
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


@router.get("/projects/{project_id}/decisions/timeline", response_model=TimelineResponse)
async def get_timeline(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> TimelineResponse:
    await require_project_access(project_id, current_user, db)

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


@router.get("/projects/{project_id}/decisions/{decision_id}", response_model=DecisionResponse)
async def get_decision(
    project_id: uuid.UUID,
    decision_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DecisionResponse:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(DecisionRecord).where(
            DecisionRecord.id == decision_id,
            DecisionRecord.project_id == project_id,
        )
    )
    decision = result.scalar_one_or_none()
    if decision is None:
        raise HTTPException(status_code=404, detail="Decision not found")

    return DecisionResponse(
        id=decision.id,
        project_id=decision.project_id,
        sequence_number=decision.sequence_number,
        decision_type=decision.decision_type,
        title=decision.title,
        description=decision.description,
        justification=decision.justification,
        assumptions=decision.assumptions,
        cost_impact=float(decision.cost_impact) if decision.cost_impact is not None else None,
        schedule_impact_days=decision.schedule_impact_days,
        risk_level=decision.risk_level,
        approved_by=decision.approved_by,
        created_by=decision.created_by,
        supporting_docs=decision.supporting_docs,
        previous_hash=decision.previous_hash,
        record_hash=decision.record_hash,
        tx_hash=decision.tx_hash,
        block_number=decision.block_number,
        chain_verified=decision.chain_verified,
        triggered_by_sensor=decision.triggered_by_sensor,
        created_at=decision.created_at,
    )
