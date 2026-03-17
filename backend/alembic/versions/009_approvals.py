"""Add decision_approvals table for approval workflow

Revision ID: 009
Revises: 008
Create Date: 2026-03-18
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "009"
down_revision = "008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "decision_approvals",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True,
                  server_default=sa.text("gen_random_uuid()")),
        sa.Column("decision_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("decision_records.id"), nullable=False, index=True),
        sa.Column("approver_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("users.id"), nullable=False, index=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("comment", sa.Text, nullable=True),
        sa.Column("sequence_order", sa.Integer, nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True),
                  server_default=sa.func.now(), nullable=False),
    )
    # One approver per decision (no duplicate requests)
    op.create_unique_constraint(
        "uq_approval_decision_approver",
        "decision_approvals",
        ["decision_id", "approver_id"],
    )
    # One sequence_order per decision (no duplicate slots)
    op.create_unique_constraint(
        "uq_approval_decision_sequence",
        "decision_approvals",
        ["decision_id", "sequence_order"],
    )


def downgrade() -> None:
    op.drop_table("decision_approvals")
