import uuid
from datetime import datetime

from pydantic import BaseModel


class SensorReadingResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    sensor_type: str
    value: float
    unit: str
    source: str | None = None
    anomaly_flag: bool = False
    related_assumption_id: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class SensorConfigRequest(BaseModel):
    interval_seconds: int = 5
    enabled_types: list[str] | None = None


class SensorMessage(BaseModel):
    sensor_type: str
    value: float
    unit: str
    anomaly: bool = False
    assumption_text: str | None = None
    threshold: float | None = None
    deviation_pct: float | None = None
    timestamp: str
