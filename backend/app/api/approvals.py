import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.approval import DecisionApproval
from app.models.decision import DecisionRecord
from app.models.user import User
from app.schemas.approval import ApprovalAction, ApprovalCreate, ApprovalResponse
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()


async def _resolve_approver_name(db: AsyncSession, user_id: uuid.UUID) -> str | None:
    result = await db.execute(select(User.full_name).where(User.id == user_id))
    return result.scalar_one_or_none()


async def _build_response(a: DecisionApproval, db: AsyncSession) -> ApprovalResponse:
    return ApprovalResponse(
        id=a.id,
        decision_id=a.decision_id,
        approver_id=a.approver_id,
        status=a.status,
        comment=a.comment,
        sequence_order=a.sequence_order,
        decided_at=a.decided_at,
        created_at=a.created_at,
        approver_name=await _resolve_approver_name(db, a.approver_id),
    )


@router.post(
    "/projects/{project_id}/decisions/{decision_id}/approvals",
    response_model=ApprovalResponse,
    status_code=status.HTTP_201_CREATED,
)
async def request_approval(
    project_id: uuid.UUID,
    decision_id: uuid.UUID,
    body: ApprovalCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> ApprovalResponse:
    """Request approval from a user for a decision. Admin/PM only."""
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    # Verify decision exists and belongs to this project
    result = await db.execute(
        select(DecisionRecord).where(
            DecisionRecord.id == decision_id,
            DecisionRecord.project_id == project_id,
        )
    )
    decision = result.scalar_one_or_none()
    if decision is None:
        raise HTTPException(status_code=404, detail="Decision not found")

    # Verify the body decision_id matches the URL
    if body.decision_id != decision_id:
        raise HTTPException(
            status_code=400,
            detail="decision_id in body must match URL",
        )

    # Verify approver exists
    result = await db.execute(select(User).where(User.id == body.approver_id))
    approver = result.scalar_one_or_none()
    if approver is None:
        raise HTTPException(status_code=404, detail="Approver user not found")

    # Prevent duplicate: same approver + same decision + same sequence
    result = await db.execute(
        select(DecisionApproval).where(
            DecisionApproval.decision_id == decision_id,
            DecisionApproval.approver_id == body.approver_id,
        )
    )
    existing = result.scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=409,
            detail="Approval already requested from this user for this decision",
        )

    # Prevent duplicate sequence_order for same decision
    result = await db.execute(
        select(DecisionApproval).where(
            DecisionApproval.decision_id == decision_id,
            DecisionApproval.sequence_order == body.sequence_order,
        )
    )
    if result.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail=f"Sequence order {body.sequence_order} already assigned for this decision",
        )

    approval = DecisionApproval(
        decision_id=decision_id,
        approver_id=body.approver_id,
        status="pending",
        sequence_order=body.sequence_order,
    )
    db.add(approval)

    await log_action(
        db,
        user_id=current_user.id,
        action="approval_requested",
        resource_type="approval",
        resource_id=approval.id,
        metadata={
            "project_id": str(project_id),
            "decision_id": str(decision_id),
            "approver_id": str(body.approver_id),
            "sequence_order": body.sequence_order,
        },
    )

    await db.flush()

    logger.info(
        "Approval requested: decision=%s approver=%s seq=%d",
        decision_id, body.approver_id, body.sequence_order,
    )

    return await _build_response(approval, db)


@router.get(
    "/projects/{project_id}/decisions/{decision_id}/approvals",
    response_model=list[ApprovalResponse],
)
async def list_decision_approvals(
    project_id: uuid.UUID,
    decision_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ApprovalResponse]:
    """List all approvals for a specific decision."""
    await require_project_access(project_id, current_user, db)

    # Verify decision belongs to project
    result = await db.execute(
        select(DecisionRecord).where(
            DecisionRecord.id == decision_id,
            DecisionRecord.project_id == project_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Decision not found")

    result = await db.execute(
        select(DecisionApproval)
        .where(DecisionApproval.decision_id == decision_id)
        .order_by(DecisionApproval.sequence_order.asc())
    )
    approvals = result.scalars().all()

    return [await _build_response(a, db) for a in approvals]


@router.put(
    "/projects/{project_id}/approvals/{approval_id}",
    response_model=ApprovalResponse,
)
async def act_on_approval(
    project_id: uuid.UUID,
    approval_id: uuid.UUID,
    body: ApprovalAction,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ApprovalResponse:
    """Approve or reject. Only the assigned approver can act."""
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(DecisionApproval).where(DecisionApproval.id == approval_id)
    )
    approval = result.scalar_one_or_none()
    if approval is None:
        raise HTTPException(status_code=404, detail="Approval not found")

    # Verify the decision belongs to this project
    result = await db.execute(
        select(DecisionRecord).where(
            DecisionRecord.id == approval.decision_id,
            DecisionRecord.project_id == project_id,
        )
    )
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Approval not found in this project")

    # Only the assigned approver can act
    if approval.approver_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the assigned approver can approve or reject",
        )

    if approval.status != "pending":
        raise HTTPException(
            status_code=400,
            detail=f"Approval already {approval.status}",
        )

    # Sequential enforcement: all previous approvers must have approved
    if approval.sequence_order > 1:
        result = await db.execute(
            select(DecisionApproval).where(
                DecisionApproval.decision_id == approval.decision_id,
                DecisionApproval.sequence_order < approval.sequence_order,
            )
        )
        predecessors = result.scalars().all()
        for pred in predecessors:
            if pred.status != "approved":
                raise HTTPException(
                    status_code=400,
                    detail=f"Cannot act until approver #{pred.sequence_order} has approved (currently {pred.status})",
                )

    approval.status = body.status
    approval.comment = body.comment
    approval.decided_at = datetime.now(timezone.utc)

    await log_action(
        db,
        user_id=current_user.id,
        action=f"approval_{body.status}",
        resource_type="approval",
        resource_id=approval.id,
        metadata={
            "project_id": str(project_id),
            "decision_id": str(approval.decision_id),
            "sequence_order": approval.sequence_order,
            "comment": body.comment,
        },
    )

    await db.flush()

    logger.info(
        "Approval %s: id=%s decision=%s by=%s",
        body.status, approval_id, approval.decision_id, current_user.id,
    )

    return await _build_response(approval, db)


@router.get(
    "/projects/{project_id}/approvals/pending",
    response_model=list[ApprovalResponse],
)
async def list_pending_approvals(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ApprovalResponse]:
    """List all pending approvals assigned to the current user within a project."""
    await require_project_access(project_id, current_user, db)

    # Get all pending approvals for this user, filtered to decisions in this project
    result = await db.execute(
        select(DecisionApproval)
        .join(DecisionRecord, DecisionApproval.decision_id == DecisionRecord.id)
        .where(
            DecisionRecord.project_id == project_id,
            DecisionApproval.approver_id == current_user.id,
            DecisionApproval.status == "pending",
        )
        .order_by(DecisionApproval.created_at.asc())
    )
    approvals = result.scalars().all()

    return [await _build_response(a, db) for a in approvals]
