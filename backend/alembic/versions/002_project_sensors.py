"""Add configurable project_sensors table + FK columns

Revision ID: 002
Revises: 001
Create Date: 2026-03-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "002"
down_revision = "001"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "project_sensors",
        sa.Column("id", postgresql.UUID(as_uuid=True), server_default=sa.text("uuid_generate_v4()"), nullable=False),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False, index=True),
        sa.Column("name", sa.String(100), nullable=False),
        sa.Column("label", sa.String(255), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("category", sa.String(50), nullable=True),
        sa.Column("data_source", sa.String(20), nullable=False, server_default="simulator"),
        sa.Column("source_config", postgresql.JSONB, nullable=True),
        sa.Column("poll_interval_seconds", sa.Integer, server_default="300"),
        sa.Column("threshold_min", sa.Numeric(15, 4), nullable=True),
        sa.Column("threshold_max", sa.Numeric(15, 4), nullable=True),
        sa.Column("warning_threshold", sa.Numeric(15, 4), nullable=True),
        sa.Column("base_value", sa.Numeric(15, 4), nullable=True),
        sa.Column("range_min", sa.Numeric(15, 4), nullable=True),
        sa.Column("range_max", sa.Numeric(15, 4), nullable=True),
        sa.Column("noise_factor", sa.Numeric(10, 4), nullable=True),
        sa.Column("display_order", sa.Integer, server_default="0"),
        sa.Column("is_active", sa.Boolean, server_default="true"),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("project_id", "name", name="uq_project_sensor_name"),
    )

    # Add sensor_config_id FK to sensor_readings
    op.add_column(
        "sensor_readings",
        sa.Column("sensor_config_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project_sensors.id"), nullable=True),
    )

    # Add sensor_config_id FK to assumptions_register
    op.add_column(
        "assumptions_register",
        sa.Column("sensor_config_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("project_sensors.id"), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("assumptions_register", "sensor_config_id")
    op.drop_column("sensor_readings", "sensor_config_id")
    op.drop_table("project_sensors")
