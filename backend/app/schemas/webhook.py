import uuid
from datetime import datetime
from enum import Enum

from pydantic import BaseModel, Field, HttpUrl


class WebhookEventType(str, Enum):
    decision_created = "decision_created"
    decision_approved = "decision_approved"
    anomaly_detected = "anomaly_detected"
    chain_verified = "chain_verified"
    threshold_breach = "threshold_breach"


class WebhookCreate(BaseModel):
    url: str = Field(..., max_length=2048, description="Callback URL for webhook delivery")
    events: list[WebhookEventType] = Field(
        ..., min_length=1, description="Event types to subscribe to"
    )
    secret: str = Field(
        ..., min_length=16, max_length=255,
        description="HMAC secret for signature verification (min 16 chars)",
    )


class WebhookResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    url: str
    events: list[str]
    is_active: bool
    created_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


class WebhookTestResponse(BaseModel):
    status: str
    message: str
