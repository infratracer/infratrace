import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field


class ProjectCreate(BaseModel):
    name: str = Field(max_length=255)
    description: str | None = None
    original_budget: float = Field(gt=0)
    status: str = "planning"
    start_date: date | None = None
    expected_end: date | None = None


class ProjectUpdate(BaseModel):
    name: str | None = Field(None, max_length=255)
    description: str | None = None
    status: str | None = None
    start_date: date | None = None
    expected_end: date | None = None
    contract_address: str | None = Field(None, max_length=42)


class MemberAdd(BaseModel):
    user_id: uuid.UUID
    project_role: str = Field(pattern="^(pm|auditor|stakeholder)$")


class MemberResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    project_role: str
    added_at: datetime
    user_email: str | None = None
    user_full_name: str | None = None

    model_config = {"from_attributes": True}


class ProjectResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    original_budget: float
    current_budget: float
    status: str
    start_date: date | None = None
    expected_end: date | None = None
    contract_address: str | None = None
    created_by: uuid.UUID
    created_at: datetime
    decision_count: int = 0
    member_count: int = 0

    model_config = {"from_attributes": True}
