import uuid
from datetime import datetime

from pydantic import BaseModel


class AnalysisResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    analysis_type: str
    severity: str
    finding: str
    related_decisions: list | dict | None = None
    related_sensors: list | dict | None = None
    confidence_score: float | None = None
    model_version: str
    created_at: datetime

    model_config = {"from_attributes": True}
