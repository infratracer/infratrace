import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import require_roles
from app.database import get_db
from app.models.decision import DecisionRecord
from app.models.user import User
from app.schemas.decision import BlockchainVerificationResult, ChainVerificationResult
from app.services.audit_service import log_action
from app.services.blockchain import verify_onchain
from app.services.hash_chain import verify_chain

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects/{project_id}/verify/chain", response_model=ChainVerificationResult)
async def verify_local_chain(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "auditor")),
) -> ChainVerificationResult:
    result = await verify_chain(db, project_id)

    await log_action(
        db,
        current_user.id,
        "chain_verified",
        "project",
        project_id,
        metadata={"valid": result["valid"], "total": result["total_records"]},
    )

    return ChainVerificationResult(**result)


@router.post("/projects/{project_id}/verify/blockchain", response_model=BlockchainVerificationResult)
async def verify_blockchain(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "auditor")),
) -> BlockchainVerificationResult:
    decisions_result = await db.execute(
        select(DecisionRecord)
        .where(DecisionRecord.project_id == project_id)
        .order_by(DecisionRecord.sequence_number.asc())
    )
    decisions = decisions_result.scalars().all()

    if not decisions:
        return BlockchainVerificationResult(valid=True, total_records=0, verified=0, message="No records to verify")

    verified_count = 0
    failed = []

    for decision in decisions:
        if decision.tx_hash:
            try:
                result = await verify_onchain(
                    project_id, decision.sequence_number, decision.record_hash
                )
                if result.get("verified"):
                    verified_count += 1
                else:
                    failed.append(decision.sequence_number)
            except Exception as e:
                logger.error("Blockchain verify failed for #%d: %s", decision.sequence_number, e)
                failed.append(decision.sequence_number)

    await log_action(
        db,
        current_user.id,
        "blockchain_verified",
        "project",
        project_id,
        metadata={"verified": verified_count, "failed": failed},
    )

    return BlockchainVerificationResult(
        valid=len(failed) == 0,
        total_records=len(decisions),
        verified=verified_count,
        not_anchored=len(decisions) - verified_count - len(failed),
        failed=failed,
        message=f"{verified_count} records verified on-chain"
        if not failed
        else f"Verification failed for records: {failed}",
    )
