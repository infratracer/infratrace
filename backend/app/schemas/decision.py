import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class DecisionCreate(BaseModel):
    decision_type: str = Field(
        pattern="^(scope_change|cost_revision|assumption_change|contractor_change|schedule_change|risk_acceptance|approval)$"
    )
    title: str = Field(max_length=500)
    description: str
    justification: str
    assumptions: dict | None = None
    cost_impact: float | None = None
    schedule_impact_days: int | None = None
    risk_level: str | None = Field(None, pattern="^(low|medium|high|critical)$")
    approved_by: uuid.UUID | None = None
    supporting_docs: dict | None = None
    triggered_by_sensor: uuid.UUID | None = None


class DecisionResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    sequence_number: int
    decision_type: str
    title: str
    description: str
    justification: str
    assumptions: dict | None = None
    cost_impact: float | None = None
    schedule_impact_days: int | None = None
    risk_level: str | None = None
    approved_by: uuid.UUID | None = None
    created_by: uuid.UUID
    supporting_docs: dict | None = None
    previous_hash: str
    record_hash: str
    tx_hash: str | None = None
    block_number: int | None = None
    chain_verified: bool = False
    triggered_by_sensor: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class TimelineResponse(BaseModel):
    decisions: list[DecisionResponse]
    cost_trajectory: list[float]


class ChainVerificationResult(BaseModel):
    valid: bool
    total_records: int
    broken_at: int | None = None
    message: str
