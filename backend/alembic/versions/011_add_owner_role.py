"""Add 'owner' to project_role enum

Revision ID: 011
Revises: 010
Create Date: 2026-03-18
"""

from alembic import op

revision = "011"
down_revision = "010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE project_role ADD VALUE IF NOT EXISTS 'owner'")


def downgrade() -> None:
    pass  # PostgreSQL does not support removing enum values
