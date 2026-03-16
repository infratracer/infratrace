"""Add organisation_id FK to projects for multi-tenant isolation

Revision ID: 007
Revises: 006
Create Date: 2026-03-17
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "007"
down_revision = "006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("organisation_id", postgresql.UUID(as_uuid=True),
                  sa.ForeignKey("organizations.id"), nullable=True, index=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "organisation_id")
