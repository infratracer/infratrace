import logging
import uuid

from fastapi import Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.database import get_db
from app.models.project import ProjectMember
from app.models.user import User

logger = logging.getLogger(__name__)


async def check_project_access(
    project_id: uuid.UUID,
    user: User,
    db: AsyncSession,
    required_roles: list[str] | None = None,
) -> bool:
    if user.role == "admin":
        return True

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user.id,
        )
    )
    member = result.scalar_one_or_none()

    if member is None:
        return False

    if required_roles and member.project_role not in required_roles:
        return False

    return True


async def require_project_access(
    project_id: uuid.UUID,
    user: User,
    db: AsyncSession,
    required_roles: list[str] | None = None,
) -> None:
    has_access = await check_project_access(project_id, user, db, required_roles)
    if not has_access:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied for this project",
        )
