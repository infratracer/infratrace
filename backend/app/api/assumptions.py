import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.assumption import Assumption
from app.models.user import User
from app.schemas.assumption import AssumptionCreate, AssumptionResponse, AssumptionUpdate
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/projects/{project_id}/assumptions", response_model=list[AssumptionResponse])
async def list_assumptions(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AssumptionResponse]:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(Assumption)
        .where(Assumption.project_id == project_id)
        .order_by(Assumption.created_at.asc())
    )
    assumptions = result.scalars().all()

    return [
        AssumptionResponse(
            id=a.id,
            project_id=a.project_id,
            assumption_text=a.assumption_text,
            category=a.category,
            status=a.status,
            threshold_value=float(a.threshold_value) if a.threshold_value else None,
            threshold_unit=a.threshold_unit,
            sensor_type=a.sensor_type,
            original_decision_id=a.original_decision_id,
            invalidated_by_id=a.invalidated_by_id,
            created_at=a.created_at,
        )
        for a in assumptions
    ]


@router.post("/projects/{project_id}/assumptions", response_model=AssumptionResponse, status_code=status.HTTP_201_CREATED)
async def create_assumption(
    project_id: uuid.UUID,
    body: AssumptionCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> AssumptionResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    assumption = Assumption(
        project_id=project_id,
        assumption_text=body.assumption_text,
        category=body.category,
        threshold_value=body.threshold_value,
        threshold_unit=body.threshold_unit,
        sensor_type=body.sensor_type,
        original_decision_id=body.original_decision_id,
    )
    db.add(assumption)
    await db.flush()

    await log_action(db, current_user.id, "assumption_created", "assumption", assumption.id)

    return AssumptionResponse(
        id=assumption.id,
        project_id=assumption.project_id,
        assumption_text=assumption.assumption_text,
        category=assumption.category,
        status=assumption.status,
        threshold_value=float(assumption.threshold_value) if assumption.threshold_value else None,
        threshold_unit=assumption.threshold_unit,
        sensor_type=assumption.sensor_type,
        original_decision_id=assumption.original_decision_id,
        invalidated_by_id=assumption.invalidated_by_id,
        created_at=assumption.created_at,
    )


@router.put("/projects/{project_id}/assumptions/{assumption_id}", response_model=AssumptionResponse)
async def update_assumption(
    project_id: uuid.UUID,
    assumption_id: uuid.UUID,
    body: AssumptionUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> AssumptionResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(
        select(Assumption).where(
            Assumption.id == assumption_id,
            Assumption.project_id == project_id,
        )
    )
    assumption = result.scalar_one_or_none()
    if assumption is None:
        raise HTTPException(status_code=404, detail="Assumption not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(assumption, field, value)

    await log_action(db, current_user.id, "assumption_updated", "assumption", assumption.id, metadata=update_data)
    await db.flush()

    return AssumptionResponse(
        id=assumption.id,
        project_id=assumption.project_id,
        assumption_text=assumption.assumption_text,
        category=assumption.category,
        status=assumption.status,
        threshold_value=float(assumption.threshold_value) if assumption.threshold_value else None,
        threshold_unit=assumption.threshold_unit,
        sensor_type=assumption.sensor_type,
        original_decision_id=assumption.original_decision_id,
        invalidated_by_id=assumption.invalidated_by_id,
        created_at=assumption.created_at,
    )


@router.delete("/projects/{project_id}/assumptions/{assumption_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_assumption(
    project_id: uuid.UUID,
    assumption_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> None:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(
        select(Assumption).where(
            Assumption.id == assumption_id,
            Assumption.project_id == project_id,
        )
    )
    assumption = result.scalar_one_or_none()
    if assumption is None:
        raise HTTPException(status_code=404, detail="Assumption not found")

    await db.delete(assumption)
    await log_action(db, current_user.id, "assumption_deleted", "assumption", assumption_id)
