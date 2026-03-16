import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.project_setting import ProjectSetting
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Default settings seeded when a project is created or first accessed
DEFAULT_DECISION_TYPES = [
    {"value": "scope_change", "label": "Scope Change"},
    {"value": "cost_revision", "label": "Cost Revision"},
    {"value": "assumption_change", "label": "Assumption Change"},
    {"value": "contractor_change", "label": "Contractor Change"},
    {"value": "schedule_change", "label": "Schedule Change"},
    {"value": "risk_acceptance", "label": "Risk Acceptance"},
    {"value": "approval", "label": "Approval"},
]

DEFAULT_RISK_LEVELS = [
    {"value": "low", "label": "Low"},
    {"value": "medium", "label": "Medium"},
    {"value": "high", "label": "High"},
    {"value": "critical", "label": "Critical"},
]


class SettingUpdate(BaseModel):
    setting_value: list[dict]


class SettingResponse(BaseModel):
    setting_key: str
    setting_value: list[dict]


@router.get("/projects/{project_id}/settings/{setting_key}", response_model=SettingResponse)
async def get_setting(
    project_id: uuid.UUID,
    setting_key: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> SettingResponse:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(ProjectSetting).where(
            ProjectSetting.project_id == project_id,
            ProjectSetting.setting_key == setting_key,
        )
    )
    setting = result.scalar_one_or_none()

    if setting is None:
        # Return defaults
        defaults = {
            "decision_types": DEFAULT_DECISION_TYPES,
            "risk_levels": DEFAULT_RISK_LEVELS,
        }
        return SettingResponse(setting_key=setting_key, setting_value=defaults.get(setting_key, []))

    return SettingResponse(setting_key=setting.setting_key, setting_value=setting.setting_value)


@router.put("/projects/{project_id}/settings/{setting_key}", response_model=SettingResponse)
async def update_setting(
    project_id: uuid.UUID,
    setting_key: str,
    body: SettingUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> SettingResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    if setting_key not in ("decision_types", "risk_levels"):
        raise HTTPException(status_code=400, detail=f"Unknown setting key: {setting_key}")

    # Validate each item has value + label
    for item in body.setting_value:
        if "value" not in item or "label" not in item:
            raise HTTPException(status_code=422, detail="Each item must have 'value' and 'label' fields")

    result = await db.execute(
        select(ProjectSetting).where(
            ProjectSetting.project_id == project_id,
            ProjectSetting.setting_key == setting_key,
        )
    )
    setting = result.scalar_one_or_none()

    if setting is None:
        setting = ProjectSetting(
            project_id=project_id,
            setting_key=setting_key,
            setting_value=body.setting_value,
        )
        db.add(setting)
    else:
        setting.setting_value = body.setting_value

    await db.flush()
    return SettingResponse(setting_key=setting.setting_key, setting_value=setting.setting_value)
