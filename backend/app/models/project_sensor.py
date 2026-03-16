import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class ProjectSensor(Base):
    """Configurable sensor definition per project.

    Each project can define its own set of sensors with custom names, units,
    thresholds, and data sources. This replaces the hardcoded SENSOR_CONFIGS.
    """

    __tablename__ = "project_sensors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    project_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(255), nullable=False)
    unit: Mapped[str] = mapped_column(String(50), nullable=False)
    category: Mapped[str | None] = mapped_column(String(50))  # commodity, weather, labour, logistics, custom

    # Data source
    data_source: Mapped[str] = mapped_column(
        String(20), nullable=False, default="simulator"
    )  # api, manual, simulator
    source_config: Mapped[dict | None] = mapped_column(JSONB)
    poll_interval_seconds: Mapped[int] = mapped_column(Integer, default=300)

    # Thresholds
    threshold_min: Mapped[float | None] = mapped_column(Numeric(15, 4))
    threshold_max: Mapped[float | None] = mapped_column(Numeric(15, 4))
    warning_threshold: Mapped[float | None] = mapped_column(Numeric(15, 4))

    # Display / simulator config
    base_value: Mapped[float | None] = mapped_column(Numeric(15, 4))
    range_min: Mapped[float | None] = mapped_column(Numeric(15, 4))
    range_max: Mapped[float | None] = mapped_column(Numeric(15, 4))
    noise_factor: Mapped[float | None] = mapped_column(Numeric(10, 4))
    display_order: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id")
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
