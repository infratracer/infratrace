"""Webhook dispatch service — sends signed HTTP callbacks for platform events."""

import hashlib
import hmac
import json
import logging
import asyncio
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.webhook import WebhookSubscription

logger = logging.getLogger(__name__)

_DELIVERY_TIMEOUT = 5.0  # seconds


def _sign_payload(payload_bytes: bytes, secret: str) -> str:
    """Compute HMAC-SHA256 hex digest of the payload using the subscription secret."""
    return hmac.new(secret.encode(), payload_bytes, hashlib.sha256).hexdigest()


async def _deliver(url: str, payload_bytes: bytes, signature: str, webhook_id: str) -> None:
    """Fire-and-forget delivery of a single webhook. Logs success/failure."""
    try:
        async with httpx.AsyncClient(timeout=_DELIVERY_TIMEOUT) as client:
            resp = await client.post(
                url,
                content=payload_bytes,
                headers={
                    "Content-Type": "application/json",
                    "X-InfraTrace-Signature": signature,
                },
            )
        logger.info(
            "Webhook %s delivered to %s — status %d",
            webhook_id, url, resp.status_code,
        )
    except Exception as exc:
        logger.error(
            "Webhook %s delivery to %s FAILED: %s",
            webhook_id, url, exc,
        )


async def dispatch_event(
    db: AsyncSession,
    project_id,
    event_type: str,
    payload: dict,
) -> None:
    """Find matching active subscriptions and POST the event payload to each.

    Delivery is fire-and-forget — we spawn async tasks so the caller is not
    blocked by slow or failing endpoints.
    """
    result = await db.execute(
        select(WebhookSubscription).where(
            WebhookSubscription.project_id == project_id,
            WebhookSubscription.is_active.is_(True),
        )
    )
    subscriptions = result.scalars().all()

    envelope = {
        "event": event_type,
        "project_id": str(project_id),
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "data": payload,
    }
    payload_bytes = json.dumps(envelope, default=str).encode()

    for sub in subscriptions:
        # Only deliver if this subscription listens for the event type
        if event_type not in (sub.events or []):
            continue

        signature = _sign_payload(payload_bytes, sub.secret)
        asyncio.create_task(
            _deliver(sub.url, payload_bytes, signature, str(sub.id))
        )

    matched = sum(1 for s in subscriptions if event_type in (s.events or []))
    logger.info(
        "Dispatched event '%s' for project %s to %d subscription(s)",
        event_type, project_id, matched,
    )
