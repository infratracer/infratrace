import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.decision import DecisionRecord
from app.models.user import User
from app.schemas.decision import DecisionResponse

router = APIRouter()


@router.get("/search", response_model=list[DecisionResponse])
async def full_text_search(
    q: str = Query(..., min_length=1),
    project_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DecisionResponse]:
    """Full-text search across decision records (title, description, justification)."""
    ts_vector = func.to_tsvector(
        "english",
        func.coalesce(DecisionRecord.title, "")
        + " "
        + func.coalesce(DecisionRecord.description, "")
        + " "
        + func.coalesce(DecisionRecord.justification, ""),
    )
    ts_query = func.plainto_tsquery("english", q)

    query = (
        select(DecisionRecord)
        .where(ts_vector.op("@@")(ts_query))
    )

    if project_id is not None:
        query = query.where(DecisionRecord.project_id == project_id)

    query = query.order_by(DecisionRecord.created_at.desc()).limit(20)

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
