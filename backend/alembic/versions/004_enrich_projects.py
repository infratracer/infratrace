"""Enrich projects with category, geo, funding fields

Revision ID: 004
Revises: 003
Create Date: 2026-03-16
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "004"
down_revision = "003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "projects",
        sa.Column("category", sa.String(100), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("currency", sa.String(3), nullable=False, server_default="AUD"),
    )
    op.add_column(
        "projects",
        sa.Column("country", sa.String(100), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("region", sa.String(255), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("latitude", sa.Numeric(10, 7), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("longitude", sa.Numeric(10, 7), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column(
            "parent_project_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("projects.id"),
            nullable=True,
        ),
    )
    op.add_column(
        "projects",
        sa.Column("contract_value", sa.Numeric(15, 2), nullable=True),
    )
    op.add_column(
        "projects",
        sa.Column("funding_source", sa.String(255), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("projects", "funding_source")
    op.drop_column("projects", "contract_value")
    op.drop_column("projects", "parent_project_id")
    op.drop_column("projects", "longitude")
    op.drop_column("projects", "latitude")
    op.drop_column("projects", "region")
    op.drop_column("projects", "country")
    op.drop_column("projects", "currency")
    op.drop_column("projects", "category")
