import uuid
from datetime import datetime

from sqlalchemy import BigInteger, Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class DecisionRecord(Base):
    __tablename__ = "decision_records"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True
    )
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)
    decision_type: Mapped[str] = mapped_column(
        SAEnum(
            "scope_change",
            "cost_revision",
            "assumption_change",
            "contractor_change",
            "schedule_change",
            "risk_acceptance",
            "approval",
            name="decision_type",
            create_constraint=True,
        ),
        nullable=False,
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    description: Mapped[str] = mapped_column(String, nullable=False)
    justification: Mapped[str] = mapped_column(String, nullable=False)
    assumptions: Mapped[dict | None] = mapped_column(JSONB)
    cost_impact: Mapped[float | None] = mapped_column(Numeric(15, 2))
    schedule_impact_days: Mapped[int | None] = mapped_column(Integer)
    risk_level: Mapped[str | None] = mapped_column(
        SAEnum(
            "low",
            "medium",
            "high",
            "critical",
            name="risk_level",
            create_constraint=True,
        )
    )
    approved_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    supporting_docs: Mapped[dict | None] = mapped_column(JSONB)
    previous_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    record_hash: Mapped[str] = mapped_column(
        String(64), nullable=False, unique=True
    )
    tx_hash: Mapped[str | None] = mapped_column(String(66))
    block_number: Mapped[int | None] = mapped_column(BigInteger)
    chain_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    triggered_by_sensor: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sensor_readings.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
