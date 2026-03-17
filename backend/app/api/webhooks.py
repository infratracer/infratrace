"""CRUD endpoints for webhook subscriptions."""

import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.user import User
from app.models.webhook import WebhookSubscription
from app.schemas.webhook import WebhookCreate, WebhookResponse, WebhookTestResponse
from app.services.audit_service import log_action
from app.services.webhook_service import dispatch_event

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post(
    "/projects/{project_id}/webhooks",
    response_model=WebhookResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_webhook(
    project_id: uuid.UUID,
    body: WebhookCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
):
    """Create a webhook subscription (admin / PM only)."""
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    subscription = WebhookSubscription(
        project_id=project_id,
        url=body.url,
        events=[e.value for e in body.events],
        secret=body.secret,
        created_by=current_user.id,
    )
    db.add(subscription)
    await db.flush()

    await log_action(
        db,
        user_id=current_user.id,
        action="webhook_created",
        resource_type="webhook",
        resource_id=subscription.id,
        metadata={"project_id": str(project_id), "url": body.url, "events": [e.value for e in body.events]},
    )

    logger.info("Webhook %s created for project %s", subscription.id, project_id)
    return subscription


@router.get(
    "/projects/{project_id}/webhooks",
    response_model=list[WebhookResponse],
)
async def list_webhooks(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all webhook subscriptions for a project."""
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(WebhookSubscription)
        .where(WebhookSubscription.project_id == project_id)
        .order_by(WebhookSubscription.created_at.desc())
    )
    return result.scalars().all()


@router.delete(
    "/projects/{project_id}/webhooks/{webhook_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_webhook(
    project_id: uuid.UUID,
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
):
    """Delete a webhook subscription."""
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.id == webhook_id,
            WebhookSubscription.project_id == project_id,
        )
    )
    subscription = result.scalar_one_or_none()
    if subscription is None:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")

    await db.delete(subscription)

    await log_action(
        db,
        user_id=current_user.id,
        action="webhook_deleted",
        resource_type="webhook",
        resource_id=webhook_id,
        metadata={"project_id": str(project_id)},
    )

    logger.info("Webhook %s deleted from project %s", webhook_id, project_id)


@router.post(
    "/projects/{project_id}/webhooks/{webhook_id}/test",
    response_model=WebhookTestResponse,
)
async def test_webhook(
    project_id: uuid.UUID,
    webhook_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
):
    """Send a test event to a webhook subscription."""
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.id == webhook_id,
            WebhookSubscription.project_id == project_id,
        )
    )
    subscription = result.scalar_one_or_none()
    if subscription is None:
        raise HTTPException(status_code=404, detail="Webhook subscription not found")

    if not subscription.is_active:
        raise HTTPException(status_code=400, detail="Webhook subscription is inactive")

    # Dispatch a test event — the subscription must include "decision_created"
    # or we send to all subscribed events via the first event type.
    test_event = subscription.events[0] if subscription.events else "decision_created"

    await dispatch_event(
        db,
        project_id=project_id,
        event_type=test_event,
        payload={
            "test": True,
            "message": "This is a test event from InfraTrace",
            "triggered_by": str(current_user.id),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        },
    )

    return WebhookTestResponse(
        status="sent",
        message=f"Test event '{test_event}' dispatched to {subscription.url}",
    )
