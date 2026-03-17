"""Per-user / per-IP sliding-window rate limiter middleware.

Limits are applied based on route category:
  - Auth endpoints (login, register, forgot-password): 10 req/min per IP
  - Seed endpoint: 1 req/min per IP
  - Authenticated API endpoints: 120 req/min per user (JWT sub claim)
  - Health, WebSocket, OPTIONS (CORS preflight): exempt

Uses an in-memory sliding window (deque of timestamps per key). A background
cleanup task purges expired entries every 60 seconds to prevent memory leaks.

Not distributed — suitable for single-instance deployments. For multi-instance,
swap the storage backend to Redis.
"""

from __future__ import annotations

import asyncio
import base64
import json
import logging
import math
import time
from collections import defaultdict, deque

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Route category definitions
# ---------------------------------------------------------------------------

AUTH_PATHS = frozenset({
    "/api/v1/auth/login",
    "/api/v1/auth/register",
    "/api/v1/auth/forgot-password",
})

SEED_PATH = "/api/v1/seed"
HEALTH_PATH = "/api/v1/health"

# Limits: (max_requests, window_seconds)
LIMIT_AUTH = (10, 60)
LIMIT_API = (120, 60)
LIMIT_SEED = (1, 60)


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _extract_client_ip(request: Request) -> str:
    """Return the client IP, respecting X-Forwarded-For behind a proxy."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        # First entry is the original client IP
        return forwarded.split(",")[0].strip()
    if request.client:
        return request.client.host
    return "unknown"


def _extract_user_id_from_jwt(request: Request) -> str | None:
    """Decode the `sub` claim from a JWT Bearer token without full validation.

    This is intentionally lightweight — we only need the subject identifier
    for rate-limit bucketing, not for authentication (that happens later in
    the request pipeline).
    """
    auth_header = request.headers.get("authorization", "")
    if not auth_header.lower().startswith("bearer "):
        return None

    token = auth_header[7:]
    try:
        # JWT is header.payload.signature — we only need the payload
        payload_b64 = token.split(".")[1]
        # Add padding if missing
        padding = 4 - len(payload_b64) % 4
        if padding != 4:
            payload_b64 += "=" * padding
        payload = json.loads(base64.urlsafe_b64decode(payload_b64))
        sub = payload.get("sub")
        return str(sub) if sub is not None else None
    except Exception:
        return None


# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Sliding-window rate limiter with per-route limits."""

    def __init__(self, app) -> None:
        super().__init__(app)
        # key -> deque of timestamps
        self._buckets: dict[str, deque[float]] = defaultdict(deque)
        self._cleanup_task: asyncio.Task | None = None

    async def dispatch(self, request: Request, call_next):
        # Lazy-start the periodic cleanup task
        if self._cleanup_task is None or self._cleanup_task.done():
            self._cleanup_task = asyncio.create_task(self._periodic_cleanup())

        path = request.url.path
        method = request.method

        # ---- Exempt routes ----
        if (
            path == HEALTH_PATH
            or method == "OPTIONS"
            or request.headers.get("upgrade", "").lower() == "websocket"
        ):
            return await call_next(request)

        # ---- Determine limit category ----
        if path in AUTH_PATHS:
            limit, window = LIMIT_AUTH
            key = f"auth:{_extract_client_ip(request)}"
        elif path == SEED_PATH:
            limit, window = LIMIT_SEED
            key = f"seed:{_extract_client_ip(request)}"
        else:
            # Authenticated API — bucket by user if possible, fall back to IP
            user_id = _extract_user_id_from_jwt(request)
            if user_id:
                limit, window = LIMIT_API
                key = f"user:{user_id}"
            else:
                # Unauthenticated non-auth request (e.g., public endpoints)
                limit, window = LIMIT_API
                key = f"ip:{_extract_client_ip(request)}"

        # ---- Sliding window check ----
        now = time.time()
        cutoff = now - window
        bucket = self._buckets[key]

        # Trim expired timestamps from the left of the deque
        while bucket and bucket[0] <= cutoff:
            bucket.popleft()

        if len(bucket) >= limit:
            # Calculate how long until the oldest request in the window expires
            retry_after = math.ceil(bucket[0] + window - now)
            retry_after = max(retry_after, 1)
            return Response(
                content=json.dumps({
                    "detail": f"Rate limit exceeded. Try again in {retry_after} seconds."
                }),
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)
        return await call_next(request)

    # ---- Background cleanup ----

    async def _periodic_cleanup(self) -> None:
        """Remove empty / fully-expired buckets every 60 seconds."""
        while True:
            await asyncio.sleep(60)
            try:
                now = time.time()
                # Snapshot keys to avoid mutation during iteration
                keys = list(self._buckets.keys())
                removed = 0
                for key in keys:
                    bucket = self._buckets.get(key)
                    if bucket is None:
                        continue
                    # Trim expired entries
                    while bucket and bucket[0] <= now - 120:
                        bucket.popleft()
                    # Remove entirely empty buckets
                    if not bucket:
                        del self._buckets[key]
                        removed += 1
                if removed:
                    logger.debug("Rate limiter cleanup: removed %d empty buckets", removed)
            except Exception:
                logger.exception("Error in rate limiter cleanup task")
