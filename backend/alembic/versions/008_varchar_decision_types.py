"""Convert decision_type and risk_level from ENUM to VARCHAR for configurability

Revision ID: 008
Revises: 007
Create Date: 2026-03-17
"""

from alembic import op
import sqlalchemy as sa

revision = "008"
down_revision = "007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Convert decision_type ENUM to VARCHAR
    op.execute("ALTER TABLE decision_records ALTER COLUMN decision_type TYPE VARCHAR(100) USING decision_type::text")
    # Convert risk_level ENUM to VARCHAR
    op.execute("ALTER TABLE decision_records ALTER COLUMN risk_level TYPE VARCHAR(50) USING risk_level::text")
    # Drop the old ENUM types (they're no longer needed)
    op.execute("DROP TYPE IF EXISTS decision_type")
    op.execute("DROP TYPE IF EXISTS risk_level")


def downgrade() -> None:
    op.execute("CREATE TYPE decision_type AS ENUM ('scope_change','cost_revision','assumption_change','contractor_change','schedule_change','risk_acceptance','approval')")
    op.execute("CREATE TYPE risk_level AS ENUM ('low','medium','high','critical')")
    op.execute("ALTER TABLE decision_records ALTER COLUMN decision_type TYPE decision_type USING decision_type::decision_type")
    op.execute("ALTER TABLE decision_records ALTER COLUMN risk_level TYPE risk_level USING risk_level::risk_level")
