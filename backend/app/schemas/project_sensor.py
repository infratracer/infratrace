import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ProjectSensorCreate(BaseModel):
    name: str = Field(max_length=100)
    label: str = Field(max_length=255)
    unit: str = Field(max_length=50)
    category: str | None = Field(None, max_length=50)
    data_source: str = Field("simulator", pattern="^(api|manual|simulator)$")
    source_config: dict | None = None
    poll_interval_seconds: int = 300
    threshold_min: float | None = None
    threshold_max: float | None = None
    warning_threshold: float | None = None
    base_value: float | None = None
    range_min: float | None = None
    range_max: float | None = None
    noise_factor: float | None = None
    display_order: int = 0


class ProjectSensorUpdate(BaseModel):
    label: str | None = Field(None, max_length=255)
    unit: str | None = Field(None, max_length=50)
    category: str | None = Field(None, max_length=50)
    data_source: str | None = Field(None, pattern="^(api|manual|simulator)$")
    source_config: dict | None = None
    poll_interval_seconds: int | None = None
    threshold_min: float | None = None
    threshold_max: float | None = None
    warning_threshold: float | None = None
    base_value: float | None = None
    range_min: float | None = None
    range_max: float | None = None
    noise_factor: float | None = None
    display_order: int | None = None
    is_active: bool | None = None


class ProjectSensorResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    name: str
    label: str
    unit: str
    category: str | None = None
    data_source: str
    source_config: dict | None = None
    poll_interval_seconds: int
    threshold_min: float | None = None
    threshold_max: float | None = None
    warning_threshold: float | None = None
    base_value: float | None = None
    range_min: float | None = None
    range_max: float | None = None
    noise_factor: float | None = None
    display_order: int
    is_active: bool
    created_by: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
