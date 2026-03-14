import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AssumptionCreate(BaseModel):
    assumption_text: str
    category: str | None = None
    threshold_value: float | None = None
    threshold_unit: str | None = Field(None, max_length=50)
    sensor_type: str | None = Field(None, max_length=50)
    original_decision_id: uuid.UUID | None = None


class AssumptionUpdate(BaseModel):
    status: str | None = Field(None, pattern="^(active|invalidated|superseded|validated)$")
    invalidated_by_id: uuid.UUID | None = None
    threshold_value: float | None = None


class AssumptionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    assumption_text: str
    category: str | None = None
    status: str
    threshold_value: float | None = None
    threshold_unit: str | None = None
    sensor_type: str | None = None
    original_decision_id: uuid.UUID | None = None
    invalidated_by_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}
