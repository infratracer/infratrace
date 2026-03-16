import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.sensor import SensorReading
from app.models.user import User
from app.schemas.sensor import SensorReadingResponse

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/projects/{project_id}/sensors", response_model=list[SensorReadingResponse])
async def list_sensors(
    project_id: uuid.UUID,
    sensor_type: str | None = None,
    limit: int = Query(100, ge=1, le=500),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SensorReadingResponse]:
    await require_project_access(project_id, current_user, db)

    VALID_SENSOR_TYPES = {"steel_price", "copper_price", "labour_rate", "rainfall", "temperature", "delivery_status"}

    query = (
        select(SensorReading)
        .where(SensorReading.project_id == project_id)
        .order_by(SensorReading.created_at.desc())
        .limit(limit)
    )

    if sensor_type:
        if sensor_type not in VALID_SENSOR_TYPES:
            raise HTTPException(status_code=400, detail=f"Invalid sensor_type. Must be one of: {', '.join(sorted(VALID_SENSOR_TYPES))}")
        query = query.where(SensorReading.sensor_type == sensor_type)

    result = await db.execute(query)
    readings = result.scalars().all()

    return [
        SensorReadingResponse(
            id=r.id,
            project_id=r.project_id,
            sensor_type=r.sensor_type,
            value=float(r.value),
            unit=r.unit,
            source=r.source,
            anomaly_flag=r.anomaly_flag,
            related_assumption_id=r.related_assumption_id,
            created_at=r.created_at,
        )
        for r in readings
    ]


@router.get("/projects/{project_id}/sensors/latest", response_model=list[SensorReadingResponse])
async def latest_sensors(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SensorReadingResponse]:
    """Return the most recent reading for each sensor type."""
    await require_project_access(project_id, current_user, db)

    from sqlalchemy import func, and_

    # Subquery: max created_at per sensor_type for this project
    subq = (
        select(
            SensorReading.sensor_type,
            func.max(SensorReading.created_at).label("max_ts"),
        )
        .where(SensorReading.project_id == project_id)
        .group_by(SensorReading.sensor_type)
        .subquery()
    )

    result = await db.execute(
        select(SensorReading)
        .join(
            subq,
            and_(
                SensorReading.sensor_type == subq.c.sensor_type,
                SensorReading.created_at == subq.c.max_ts,
                SensorReading.project_id == project_id,
            ),
        )
    )
    readings = result.scalars().all()

    return [
        SensorReadingResponse(
            id=r.id,
            project_id=r.project_id,
            sensor_type=r.sensor_type,
            value=float(r.value),
            unit=r.unit,
            source=r.source,
            anomaly_flag=r.anomaly_flag,
            related_assumption_id=r.related_assumption_id,
            created_at=r.created_at,
        )
        for r in readings
    ]


@router.get("/projects/{project_id}/sensors/anomalies", response_model=list[SensorReadingResponse])
async def list_anomalies(
    project_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=200),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[SensorReadingResponse]:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(SensorReading)
        .where(
            SensorReading.project_id == project_id,
            SensorReading.anomaly_flag == True,  # noqa: E712
        )
        .order_by(SensorReading.created_at.desc())
        .limit(limit)
    )
    readings = result.scalars().all()

    return [
        SensorReadingResponse(
            id=r.id,
            project_id=r.project_id,
            sensor_type=r.sensor_type,
            value=float(r.value),
            unit=r.unit,
            source=r.source,
            anomaly_flag=r.anomaly_flag,
            related_assumption_id=r.related_assumption_id,
            created_at=r.created_at,
        )
        for r in readings
    ]
