import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.project_sensor import ProjectSensor
from app.models.user import User
from app.schemas.project_sensor import (
    ProjectSensorCreate,
    ProjectSensorResponse,
    ProjectSensorUpdate,
)
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/projects/{project_id}/sensors/config", response_model=list[ProjectSensorResponse])
async def list_sensor_configs(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectSensorResponse]:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(ProjectSensor)
        .where(ProjectSensor.project_id == project_id)
        .order_by(ProjectSensor.display_order.asc(), ProjectSensor.created_at.asc())
    )
    sensors = result.scalars().all()
    return [ProjectSensorResponse.model_validate(s) for s in sensors]


@router.post(
    "/projects/{project_id}/sensors/config",
    response_model=ProjectSensorResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_sensor_config(
    project_id: uuid.UUID,
    body: ProjectSensorCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectSensorResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm", "owner"])

    # Check uniqueness
    existing = await db.execute(
        select(ProjectSensor).where(
            ProjectSensor.project_id == project_id,
            ProjectSensor.name == body.name,
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail=f"Sensor '{body.name}' already exists for this project")

    sensor = ProjectSensor(
        project_id=project_id,
        name=body.name,
        label=body.label,
        unit=body.unit,
        category=body.category,
        data_source=body.data_source,
        source_config=body.source_config,
        poll_interval_seconds=body.poll_interval_seconds,
        threshold_min=body.threshold_min,
        threshold_max=body.threshold_max,
        warning_threshold=body.warning_threshold,
        base_value=body.base_value,
        range_min=body.range_min,
        range_max=body.range_max,
        noise_factor=body.noise_factor,
        display_order=body.display_order,
        created_by=current_user.id,
    )
    db.add(sensor)
    await db.flush()

    await log_action(db, current_user.id, "sensor_config_created", "project_sensor", sensor.id,
                     metadata={"project_id": str(project_id), "name": body.name, "data_source": body.data_source})

    return ProjectSensorResponse.model_validate(sensor)


@router.put("/projects/{project_id}/sensors/config/{sensor_id}", response_model=ProjectSensorResponse)
async def update_sensor_config(
    project_id: uuid.UUID,
    sensor_id: uuid.UUID,
    body: ProjectSensorUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectSensorResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm", "owner"])

    result = await db.execute(
        select(ProjectSensor).where(
            ProjectSensor.id == sensor_id,
            ProjectSensor.project_id == project_id,
        )
    )
    sensor = result.scalar_one_or_none()
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor config not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(sensor, field, value)

    await log_action(db, current_user.id, "sensor_config_updated", "project_sensor", sensor.id,
                     metadata=update_data)
    await db.flush()

    return ProjectSensorResponse.model_validate(sensor)


@router.delete("/projects/{project_id}/sensors/config/{sensor_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_sensor_config(
    project_id: uuid.UUID,
    sensor_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await require_project_access(project_id, current_user, db, required_roles=["pm", "owner"])

    result = await db.execute(
        select(ProjectSensor).where(
            ProjectSensor.id == sensor_id,
            ProjectSensor.project_id == project_id,
        )
    )
    sensor = result.scalar_one_or_none()
    if sensor is None:
        raise HTTPException(status_code=404, detail="Sensor config not found")

    await db.delete(sensor)
    await log_action(db, current_user.id, "sensor_config_deleted", "project_sensor", sensor_id)
