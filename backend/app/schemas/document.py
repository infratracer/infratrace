import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    decision_id: uuid.UUID | None = None
    filename: str
    content_type: str
    size_bytes: int
    storage_path: str
    checksum_sha256: str | None = None
    uploaded_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}
