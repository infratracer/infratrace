import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql import func

from app.database import Base


class BlockchainAnchor(Base):
    __tablename__ = "blockchain_anchors"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    decision_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("decision_records.id"), nullable=False
    )
    record_hash: Mapped[str] = mapped_column(String(64), nullable=False)
    tx_hash: Mapped[str] = mapped_column(String(66), nullable=False)
    block_number: Mapped[int | None] = mapped_column(BigInteger)
    network: Mapped[str] = mapped_column(String(20), nullable=False, default="amoy")
    status: Mapped[str] = mapped_column(
        SAEnum(
            "pending",
            "confirmed",
            "failed",
            name="anchor_status",
            create_constraint=True,
        ),
        nullable=False,
        default="pending",
    )
    gas_used: Mapped[int | None] = mapped_column(BigInteger)
    anchored_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
