"""Simple in-memory rate limiter middleware.

Limits requests per IP to prevent abuse. Not distributed — suitable for
single-instance deployments. For multi-instance, replace with Redis-backed limiter.
"""
import time
from collections import defaultdict

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

# Per-IP: max requests within the window
DEFAULT_LIMIT = 100  # requests
DEFAULT_WINDOW = 60  # seconds


class RateLimitMiddleware(BaseHTTPMiddleware):
    def __init__(self, app, limit: int = DEFAULT_LIMIT, window: int = DEFAULT_WINDOW):
        super().__init__(app)
        self.limit = limit
        self.window = window
        self.requests: dict[str, list[float]] = defaultdict(list)

    async def dispatch(self, request: Request, call_next):
        # Skip rate limiting for health checks, CORS preflight, and WebSocket upgrades
        if (
            request.url.path == "/api/v1/health"
            or request.method == "OPTIONS"
            or request.headers.get("upgrade") == "websocket"
        ):
            return await call_next(request)

        client_ip = request.client.host if request.client else "unknown"
        now = time.time()
        cutoff = now - self.window

        # Clean old entries
        self.requests[client_ip] = [t for t in self.requests[client_ip] if t > cutoff]

        if len(self.requests[client_ip]) >= self.limit:
            return Response(
                content='{"detail":"Rate limit exceeded. Try again later."}',
                status_code=429,
                media_type="application/json",
                headers={"Retry-After": str(self.window)},
            )

        self.requests[client_ip].append(now)
        return await call_next(request)
