"""Initial schema — all 9 tables

Revision ID: 001
Revises:
Create Date: 2026-03-14
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"')

    # ENUM types
    user_role = postgresql.ENUM(
        "admin", "project_manager", "auditor", "stakeholder",
        name="user_role", create_type=False,
    )
    project_status = postgresql.ENUM(
        "planning", "active", "on_hold", "completed",
        name="project_status", create_type=False,
    )
    project_role = postgresql.ENUM(
        "pm", "auditor", "stakeholder",
        name="project_role", create_type=False,
    )
    decision_type = postgresql.ENUM(
        "scope_change", "cost_revision", "assumption_change",
        "contractor_change", "schedule_change", "risk_acceptance", "approval",
        name="decision_type", create_type=False,
    )
    risk_level = postgresql.ENUM(
        "low", "medium", "high", "critical",
        name="risk_level", create_type=False,
    )
    assumption_status = postgresql.ENUM(
        "active", "invalidated", "superseded", "validated",
        name="assumption_status", create_type=False,
    )
    analysis_type = postgresql.ENUM(
        "assumption_drift", "cost_anomaly", "approval_pattern",
        "scope_creep", "sensor_contradiction", "risk_assessment",
        name="analysis_type", create_type=False,
    )
    severity = postgresql.ENUM(
        "info", "warning", "critical",
        name="severity", create_type=False,
    )
    anchor_status = postgresql.ENUM(
        "pending", "confirmed", "failed",
        name="anchor_status", create_type=False,
    )

    user_role.create(op.get_bind(), checkfirst=True)
    project_status.create(op.get_bind(), checkfirst=True)
    project_role.create(op.get_bind(), checkfirst=True)
    decision_type.create(op.get_bind(), checkfirst=True)
    risk_level.create(op.get_bind(), checkfirst=True)
    assumption_status.create(op.get_bind(), checkfirst=True)
    analysis_type.create(op.get_bind(), checkfirst=True)
    severity.create(op.get_bind(), checkfirst=True)
    anchor_status.create(op.get_bind(), checkfirst=True)

    # 1. users
    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("email", sa.String(255), unique=True, nullable=False, index=True),
        sa.Column("password_hash", sa.String(255), nullable=False),
        sa.Column("full_name", sa.String(255), nullable=False),
        sa.Column("role", user_role, nullable=False),
        sa.Column("organisation", sa.String(255), nullable=True),
        sa.Column("is_active", sa.Boolean, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("last_login", sa.DateTime(timezone=True), nullable=True),
    )

    # 2. projects
    op.create_table(
        "projects",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("description", sa.Text, nullable=True),
        sa.Column("original_budget", sa.Numeric(15, 2), nullable=False),
        sa.Column("current_budget", sa.Numeric(15, 2), nullable=False),
        sa.Column("status", project_status, nullable=False, server_default="planning"),
        sa.Column("start_date", sa.Date, nullable=True),
        sa.Column("expected_end", sa.Date, nullable=True),
        sa.Column("contract_address", sa.String(42), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 3. project_members
    op.create_table(
        "project_members",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("project_role", project_role, nullable=False),
        sa.Column("added_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 4. assumptions_register (created before decision_records and sensor_readings due to FK deps)
    op.create_table(
        "assumptions_register",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False, index=True),
        sa.Column("assumption_text", sa.Text, nullable=False),
        sa.Column("category", sa.String(100), nullable=True),
        sa.Column("status", assumption_status, nullable=False, server_default="active"),
        sa.Column("threshold_value", sa.Numeric(15, 2), nullable=True),
        sa.Column("threshold_unit", sa.String(50), nullable=True),
        sa.Column("sensor_type", sa.String(50), nullable=True),
        sa.Column("original_decision_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("invalidated_by_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 5. sensor_readings
    op.create_table(
        "sensor_readings",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False, index=True),
        sa.Column("sensor_type", sa.String(50), nullable=False),
        sa.Column("value", sa.Numeric(15, 4), nullable=False),
        sa.Column("unit", sa.String(50), nullable=False),
        sa.Column("source", sa.String(100), nullable=True),
        sa.Column("anomaly_flag", sa.Boolean, server_default=sa.text("false")),
        sa.Column("related_assumption_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("assumptions_register.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 6. decision_records
    op.create_table(
        "decision_records",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False, index=True),
        sa.Column("sequence_number", sa.Integer, nullable=False),
        sa.Column("decision_type", decision_type, nullable=False),
        sa.Column("title", sa.String(500), nullable=False),
        sa.Column("description", sa.Text, nullable=False),
        sa.Column("justification", sa.Text, nullable=False),
        sa.Column("assumptions", postgresql.JSONB, nullable=True),
        sa.Column("cost_impact", sa.Numeric(15, 2), nullable=True),
        sa.Column("schedule_impact_days", sa.Integer, nullable=True),
        sa.Column("risk_level", risk_level, nullable=True),
        sa.Column("approved_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("created_by", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False),
        sa.Column("supporting_docs", postgresql.JSONB, nullable=True),
        sa.Column("previous_hash", sa.String(64), nullable=False),
        sa.Column("record_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("tx_hash", sa.String(66), nullable=True),
        sa.Column("block_number", sa.BigInteger, nullable=True),
        sa.Column("chain_verified", sa.Boolean, server_default=sa.text("false")),
        sa.Column("triggered_by_sensor", postgresql.UUID(as_uuid=True), sa.ForeignKey("sensor_readings.id"), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # Add deferred FKs for assumptions_register → decision_records
    op.create_foreign_key(
        "fk_assumption_original_decision",
        "assumptions_register", "decision_records",
        ["original_decision_id"], ["id"],
    )
    op.create_foreign_key(
        "fk_assumption_invalidated_by",
        "assumptions_register", "decision_records",
        ["invalidated_by_id"], ["id"],
    )

    # 7. ai_analysis_results
    op.create_table(
        "ai_analysis_results",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("project_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("projects.id"), nullable=False, index=True),
        sa.Column("analysis_type", analysis_type, nullable=False),
        sa.Column("severity", severity, nullable=False),
        sa.Column("finding", sa.Text, nullable=False),
        sa.Column("related_decisions", postgresql.JSONB, nullable=True),
        sa.Column("related_sensors", postgresql.JSONB, nullable=True),
        sa.Column("confidence_score", sa.Numeric(3, 2), nullable=True),
        sa.Column("model_version", sa.String(100), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )

    # 8. blockchain_anchors
    op.create_table(
        "blockchain_anchors",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("decision_records.id"), nullable=False),
        sa.Column("record_hash", sa.String(64), nullable=False),
        sa.Column("tx_hash", sa.String(66), nullable=False),
        sa.Column("block_number", sa.BigInteger, nullable=True),
        sa.Column("network", sa.String(20), nullable=False, server_default="amoy"),
        sa.Column("status", anchor_status, nullable=False, server_default="pending"),
        sa.Column("gas_used", sa.BigInteger, nullable=True),
        sa.Column("anchored_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("confirmed_at", sa.DateTime(timezone=True), nullable=True),
    )

    # 9. audit_log
    op.create_table(
        "audit_log",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True, server_default=sa.text("uuid_generate_v4()")),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("action", sa.String(100), nullable=False),
        sa.Column("resource_type", sa.String(50), nullable=True),
        sa.Column("resource_id", postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column("metadata", postgresql.JSONB, nullable=True),
        sa.Column("ip_address", postgresql.INET, nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("audit_log")
    op.drop_table("blockchain_anchors")
    op.drop_table("ai_analysis_results")
    op.drop_constraint("fk_assumption_invalidated_by", "assumptions_register", type_="foreignkey")
    op.drop_constraint("fk_assumption_original_decision", "assumptions_register", type_="foreignkey")
    op.drop_table("decision_records")
    op.drop_table("sensor_readings")
    op.drop_table("assumptions_register")
    op.drop_table("project_members")
    op.drop_table("projects")
    op.drop_table("users")

    for enum_name in [
        "anchor_status", "severity", "analysis_type", "assumption_status",
        "risk_level", "decision_type", "project_role", "project_status", "user_role",
    ]:
        op.execute(f"DROP TYPE IF EXISTS {enum_name}")
