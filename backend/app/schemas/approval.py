import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class ApprovalCreate(BaseModel):
    decision_id: uuid.UUID
    approver_id: uuid.UUID
    sequence_order: int = Field(ge=1)


class ApprovalAction(BaseModel):
    status: Literal["approved", "rejected"]
    comment: str | None = None


class ApprovalResponse(BaseModel):
    id: uuid.UUID
    decision_id: uuid.UUID
    approver_id: uuid.UUID
    status: str
    comment: str | None = None
    sequence_order: int
    decided_at: datetime | None = None
    created_at: datetime
    approver_name: str | None = None

    model_config = {"from_attributes": True}
