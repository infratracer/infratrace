import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class AIAnalysisResult(Base):
    __tablename__ = "ai_analysis_results"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True
    )
    analysis_type: Mapped[str] = mapped_column(
        SAEnum(
            "assumption_drift",
            "cost_anomaly",
            "approval_pattern",
            "scope_creep",
            "sensor_contradiction",
            "risk_assessment",
            name="analysis_type",
            create_constraint=True,
        ),
        nullable=False,
    )
    severity: Mapped[str] = mapped_column(
        SAEnum(
            "info",
            "warning",
            "critical",
            name="severity",
            create_constraint=True,
        ),
        nullable=False,
    )
    finding: Mapped[str] = mapped_column(String, nullable=False)
    related_decisions: Mapped[dict | None] = mapped_column(JSONB)
    related_sensors: Mapped[dict | None] = mapped_column(JSONB)
    confidence_score: Mapped[float | None] = mapped_column(Numeric(3, 2))
    model_version: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
