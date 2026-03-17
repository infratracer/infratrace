import logging
import sys
from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.middleware.rate_limiter import RateLimitMiddleware

logging.basicConfig(
    level=logging.DEBUG if settings.ENVIRONMENT == "development" else logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncIterator[None]:
    if not settings.DATABASE_URL:
        logger.critical("DATABASE_URL is not set — refusing to start")
        sys.exit(1)
    if not settings.JWT_SECRET:
        logger.critical("JWT_SECRET is not set — refusing to start")
        sys.exit(1)

    logger.info("InfraTrace API starting (env=%s)", settings.ENVIRONMENT)
    yield
    logger.info("InfraTrace API shutting down")


app = FastAPI(
    title="InfraTrace API",
    version="2.0.0",
    lifespan=lifespan,
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
)

# Middleware order matters: Starlette processes them in reverse registration order.
# Register RateLimitMiddleware BEFORE CORSMiddleware so CORS runs first (outermost),
# and rate limiting runs on the inner pass — after CORS headers are already set.
app.add_middleware(RateLimitMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


from app.api import auth as auth_router
from app.api import projects as projects_router
from app.api import decisions as decisions_router
from app.api import assumptions as assumptions_router
from app.api import sensors as sensors_router
from app.api import analysis as analysis_router
from app.api import verification as verification_router
from app.api import reports as reports_router
from app.api import admin as admin_router
from app.api import onboarding as onboarding_router
from app.api import public as public_router
from app.api import project_sensors as project_sensors_router
from app.api import documents as documents_router
from app.api import search as search_router
from app.api import project_settings as project_settings_router
from app.api import approvals as approvals_router
from app.api import export as export_router
from app.api import webhooks as webhooks_router
from app.websocket.sensor_feed import router as ws_router

app.include_router(auth_router.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projects_router.router, prefix="/api/v1", tags=["projects"])
app.include_router(decisions_router.router, prefix="/api/v1", tags=["decisions"])
app.include_router(assumptions_router.router, prefix="/api/v1", tags=["assumptions"])
app.include_router(sensors_router.router, prefix="/api/v1", tags=["sensors"])
app.include_router(project_sensors_router.router, prefix="/api/v1", tags=["sensor-config"])
app.include_router(documents_router.router, prefix="/api/v1", tags=["documents"])
app.include_router(analysis_router.router, prefix="/api/v1", tags=["analysis"])
app.include_router(verification_router.router, prefix="/api/v1", tags=["verification"])
app.include_router(reports_router.router, prefix="/api/v1", tags=["reports"])
app.include_router(admin_router.router, prefix="/api/v1/admin", tags=["admin"])
app.include_router(onboarding_router.router, prefix="/api/v1", tags=["onboarding"])
app.include_router(public_router.router, prefix="/api/v1", tags=["public"])
app.include_router(search_router.router, prefix="/api/v1", tags=["search"])
app.include_router(project_settings_router.router, prefix="/api/v1", tags=["settings"])
app.include_router(approvals_router.router, prefix="/api/v1", tags=["approvals"])
app.include_router(export_router.router, prefix="/api/v1", tags=["export"])
app.include_router(webhooks_router.router, prefix="/api/v1", tags=["webhooks"])
app.include_router(ws_router)


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "version": "2.0.0"}


@app.post("/api/v1/seed")
async def seed_database(secret: str = "") -> dict[str, str]:
    """One-time seed endpoint. Protected by JWT_SECRET."""
    if secret != settings.JWT_SECRET:
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Forbidden")
        from app.seed.demo_data import seed
        await seed()
        return {"status": "seeded"}
