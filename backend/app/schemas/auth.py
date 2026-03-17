import uuid
from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class RefreshRequest(BaseModel):
    refresh_token: str


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    organisation: str | None = None
    organisation_id: uuid.UUID | None = None
    is_active: bool
    email_verified: bool = False
    must_change_password: bool = False
    created_at: datetime
    last_login: datetime | None = None

    model_config = {"from_attributes": True}
