import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class AuditLogResponse(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID | None = None
    action: str
    resource_type: str | None = None
    resource_id: uuid.UUID | None = None
    metadata: dict | None = None
    ip_address: str | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserCreateRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    full_name: str
    role: str = Field(pattern="^(admin|project_manager|auditor|stakeholder)$")
    organisation: str | None = None


class UserUpdateRequest(BaseModel):
    full_name: str | None = None
    role: str | None = None
    organisation: str | None = None
    is_active: bool | None = None
