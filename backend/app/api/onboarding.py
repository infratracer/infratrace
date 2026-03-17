import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.security import create_access_token, hash_password
from app.database import get_db
from app.models.invitation import UserInvitation
from app.models.organization import Organization
from app.models.user import User
from app.services.audit_service import log_action
from app.services.email_service import send_invitation, send_welcome

logger = logging.getLogger(__name__)

router = APIRouter()


# ---------------------------------------------------------------------------
# Pydantic schemas
# ---------------------------------------------------------------------------

class OrganizationResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    country: str | None = None
    region: str | None = None
    industry: str | None = None
    logo_url: str | None = None
    is_active: bool
    created_by: uuid.UUID | None = None
    created_at: datetime

    model_config = {"from_attributes": True}


class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    full_name: str
    role: str
    organisation: str | None = None
    organisation_id: uuid.UUID | None = None
    is_active: bool
    email_verified: bool
    must_change_password: bool
    created_at: datetime
    last_login: datetime | None = None

    model_config = {"from_attributes": True}


class InvitationResponse(BaseModel):
    id: uuid.UUID
    email: str
    organisation_id: uuid.UUID
    role: str
    invited_by: uuid.UUID
    token: str
    accepted_at: datetime | None = None
    expires_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


# -- Bootstrap --

class BootstrapRequest(BaseModel):
    org_name: str = Field(min_length=1, max_length=255)
    org_slug: str = Field(min_length=1, max_length=100, pattern=r"^[a-z0-9\-]+$")
    org_country: str | None = None
    admin_email: EmailStr
    admin_password: str = Field(min_length=8)
    admin_full_name: str = Field(min_length=1, max_length=255)


class BootstrapResponse(BaseModel):
    organization: OrganizationResponse
    user: UserResponse
    access_token: str


# -- Self-registration --

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)


# -- Invitation --

class CreateInvitationRequest(BaseModel):
    email: EmailStr
    role: str = Field(pattern=r"^(admin|project_manager|auditor|stakeholder)$")
    organisation_id: uuid.UUID | None = None


class AcceptInvitationRequest(BaseModel):
    password: str = Field(min_length=8)
    full_name: str = Field(min_length=1, max_length=255)


class AcceptInvitationResponse(BaseModel):
    user: UserResponse
    access_token: str


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------


@router.post(
    "/setup/bootstrap",
    response_model=BootstrapResponse,
    status_code=status.HTTP_201_CREATED,
)
async def bootstrap(
    body: BootstrapRequest,
    db: AsyncSession = Depends(get_db),
) -> BootstrapResponse:
    """Create first admin + organization. Only works when no organizations exist."""
    count_result = await db.execute(select(func.count()).select_from(Organization))
    org_count = count_result.scalar_one()
    if org_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="System already bootstrapped — organizations exist",
        )

    # Check email uniqueness
    existing = await db.execute(select(User).where(User.email == body.admin_email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Create organization
    org = Organization(
        name=body.org_name,
        slug=body.org_slug,
        country=body.org_country,
    )
    db.add(org)
    await db.flush()

    # Create admin user
    user = User(
        email=body.admin_email,
        password_hash=hash_password(body.admin_password),
        full_name=body.admin_full_name,
        role="admin",
        organisation=body.org_name,
        organisation_id=org.id,
        is_active=True,
        email_verified=True,
    )
    db.add(user)
    await db.flush()

    # Link org.created_by back to the admin
    org.created_by = user.id
    await db.flush()

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role},
    )

    await log_action(db, user.id, "bootstrap", "organization", org.id)

    return BootstrapResponse(
        organization=OrganizationResponse.model_validate(org),
        user=UserResponse.model_validate(user),
        access_token=access_token,
    )


@router.post(
    "/auth/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
async def register(
    body: RegisterRequest,
    db: AsyncSession = Depends(get_db),
) -> UserResponse:
    """Self-registration — creates a user in pending state (active but unverified)."""
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role="stakeholder",
        is_active=True,
        email_verified=False,
    )
    db.add(user)
    await db.flush()

    await log_action(db, user.id, "self_registered", "user", user.id)

    # Fire-and-forget welcome email (non-blocking, never fails the request)
    try:
        await send_welcome(user.email, user.full_name)
    except Exception:
        logger.warning("Failed to send welcome email to %s", user.email)

    return UserResponse.model_validate(user)


@router.post(
    "/invitations",
    response_model=InvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_invitation(
    body: CreateInvitationRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> InvitationResponse:
    """Admin or PM invites a user by email."""
    # Determine target organisation
    org_id = body.organisation_id or current_user.organisation_id
    if org_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No organisation_id provided and current user has no organisation",
        )

    # Verify org exists
    org_result = await db.execute(select(Organization).where(Organization.id == org_id))
    org = org_result.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")

    # Check if email already has a pending invitation for this org
    existing = await db.execute(
        select(UserInvitation).where(
            UserInvitation.email == body.email,
            UserInvitation.organisation_id == org_id,
            UserInvitation.accepted_at.is_(None),
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Pending invitation already exists for this email")

    token = secrets.token_urlsafe(48)
    invitation = UserInvitation(
        email=body.email,
        organisation_id=org_id,
        role=body.role,
        invited_by=current_user.id,
        token=token,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
    )
    db.add(invitation)
    await db.flush()

    await log_action(
        db,
        current_user.id,
        "invitation_created",
        "invitation",
        invitation.id,
        metadata={"email": body.email, "role": body.role},
    )

    # Send invitation email
    try:
        from app.config import settings
        await send_invitation(
            email=body.email,
            token=token,
            inviter_name=current_user.full_name,
            org_name=org.name,
            base_url=settings.FRONTEND_URL,
        )
    except Exception:
        logger.warning("Failed to send invitation email to %s", body.email)

    return InvitationResponse.model_validate(invitation)


@router.post(
    "/invitations/accept/{token}",
    response_model=AcceptInvitationResponse,
    status_code=status.HTTP_201_CREATED,
)
async def accept_invitation(
    token: str,
    body: AcceptInvitationRequest,
    db: AsyncSession = Depends(get_db),
) -> AcceptInvitationResponse:
    """Accept an invitation — no auth required."""
    result = await db.execute(
        select(UserInvitation).where(UserInvitation.token == token)
    )
    invitation = result.scalar_one_or_none()

    if invitation is None:
        raise HTTPException(status_code=404, detail="Invitation not found")
    if invitation.accepted_at is not None:
        raise HTTPException(status_code=409, detail="Invitation already accepted")
    if invitation.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=410, detail="Invitation has expired")

    # Check if email is already registered
    existing = await db.execute(select(User).where(User.email == invitation.email))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="Email already registered")

    # Fetch org name for the string field
    org_result = await db.execute(
        select(Organization).where(Organization.id == invitation.organisation_id)
    )
    org = org_result.scalar_one()

    user = User(
        email=invitation.email,
        password_hash=hash_password(body.password),
        full_name=body.full_name,
        role=invitation.role,
        organisation=org.name,
        organisation_id=invitation.organisation_id,
        is_active=True,
        email_verified=True,
        invited_by=invitation.invited_by,
    )
    db.add(user)
    await db.flush()

    invitation.accepted_at = datetime.now(timezone.utc)
    await db.flush()

    access_token = create_access_token(
        subject=str(user.id),
        extra_claims={"role": user.role},
    )

    await log_action(
        db,
        user.id,
        "invitation_accepted",
        "invitation",
        invitation.id,
    )

    return AcceptInvitationResponse(
        user=UserResponse.model_validate(user),
        access_token=access_token,
    )


@router.get("/organizations", response_model=list[OrganizationResponse])
async def list_organizations(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
) -> list[OrganizationResponse]:
    """List all organizations (admin only)."""
    result = await db.execute(
        select(Organization).order_by(Organization.created_at.desc())
    )
    orgs = result.scalars().all()
    return [OrganizationResponse.model_validate(o) for o in orgs]


@router.get("/organizations/{org_id}", response_model=OrganizationResponse)
async def get_organization(
    org_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> OrganizationResponse:
    """Get organization details."""
    result = await db.execute(
        select(Organization).where(Organization.id == org_id)
    )
    org = result.scalar_one_or_none()
    if org is None:
        raise HTTPException(status_code=404, detail="Organization not found")
    return OrganizationResponse.model_validate(org)
