import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class Assumption(Base):
    __tablename__ = "assumptions_register"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True
    )
    assumption_text: Mapped[str] = mapped_column(String, nullable=False)
    category: Mapped[str | None] = mapped_column(String(100))
    status: Mapped[str] = mapped_column(
        SAEnum(
            "active",
            "invalidated",
            "superseded",
            "validated",
            name="assumption_status",
            create_constraint=True,
        ),
        nullable=False,
        default="active",
    )
    threshold_value: Mapped[float | None] = mapped_column(Numeric(15, 2))
    threshold_unit: Mapped[str | None] = mapped_column(String(50))
    sensor_type: Mapped[str | None] = mapped_column(String(50))
    sensor_config_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_sensors.id")
    )
    original_decision_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decision_records.id")
    )
    invalidated_by_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decision_records.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
