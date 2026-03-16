import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.decision import DecisionRecord
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.project import (
    MemberAdd,
    MemberResponse,
    ProjectCreate,
    ProjectResponse,
    ProjectUpdate,
)
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/projects", response_model=list[ProjectResponse])
async def list_projects(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[ProjectResponse]:
    if current_user.role == "admin" or current_user.role == "auditor":
        query = select(Project)
        # Scope to user's organization if they belong to one
        if hasattr(current_user, "organisation_id") and current_user.organisation_id:
            query = query.where(Project.organisation_id == current_user.organisation_id)
    else:
        query = (
            select(Project)
            .join(ProjectMember, ProjectMember.project_id == Project.id)
            .where(ProjectMember.user_id == current_user.id)
        )

    result = await db.execute(query.order_by(Project.created_at.desc()))
    projects = result.scalars().all()

    if not projects:
        return []

    project_ids = [p.id for p in projects]

    # Batch: decision counts per project
    dec_counts_result = await db.execute(
        select(DecisionRecord.project_id, func.count())
        .where(DecisionRecord.project_id.in_(project_ids))
        .group_by(DecisionRecord.project_id)
    )
    dec_counts = dict(dec_counts_result.all())

    # Batch: member counts per project
    mem_counts_result = await db.execute(
        select(ProjectMember.project_id, func.count())
        .where(ProjectMember.project_id.in_(project_ids))
        .group_by(ProjectMember.project_id)
    )
    mem_counts = dict(mem_counts_result.all())

    return [
        ProjectResponse(
            id=p.id,
            name=p.name,
            description=p.description,
            original_budget=float(p.original_budget),
            current_budget=float(p.current_budget),
            status=p.status,
            start_date=p.start_date,
            expected_end=p.expected_end,
            contract_address=p.contract_address,
            created_by=p.created_by,
            created_at=p.created_at,
            decision_count=dec_counts.get(p.id, 0),
            member_count=mem_counts.get(p.id, 0),
        )
        for p in projects
    ]


@router.post("/projects", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> ProjectResponse:
    project = Project(
        name=body.name,
        description=body.description,
        original_budget=body.original_budget,
        current_budget=body.original_budget,
        status=body.status,
        start_date=body.start_date,
        expected_end=body.expected_end,
        category=body.category,
        currency=body.currency,
        country=body.country,
        region=body.region,
        latitude=body.latitude,
        longitude=body.longitude,
        parent_project_id=body.parent_project_id,
        contract_value=body.contract_value,
        funding_source=body.funding_source,
        organisation_id=body.organisation_id or (current_user.organisation_id if hasattr(current_user, "organisation_id") else None),
        created_by=current_user.id,
    )
    db.add(project)
    await db.flush()

    member = ProjectMember(
        project_id=project.id,
        user_id=current_user.id,
        project_role="pm" if current_user.role == "project_manager" else "admin",
    )
    db.add(member)

    await log_action(
        db,
        user_id=current_user.id,
        action="project_created",
        resource_type="project",
        resource_id=project.id,
    )

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        original_budget=float(project.original_budget),
        current_budget=float(project.current_budget),
        status=project.status,
        start_date=project.start_date,
        expected_end=project.expected_end,
        contract_address=project.contract_address,
        created_by=project.created_by,
        created_at=project.created_at,
        decision_count=0,
        member_count=1,
    )


@router.get("/projects/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    decision_count_result = await db.execute(
        select(func.count()).where(DecisionRecord.project_id == project.id)
    )
    decision_count = decision_count_result.scalar() or 0

    member_count_result = await db.execute(
        select(func.count()).where(ProjectMember.project_id == project.id)
    )
    member_count = member_count_result.scalar() or 0

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        original_budget=float(project.original_budget),
        current_budget=float(project.current_budget),
        status=project.status,
        start_date=project.start_date,
        expected_end=project.expected_end,
        contract_address=project.contract_address,
        created_by=project.created_by,
        created_at=project.created_at,
        decision_count=decision_count,
        member_count=member_count,
    )


@router.put("/projects/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: uuid.UUID,
    body: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ProjectResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    update_data = body.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(project, field, value)

    await log_action(
        db,
        user_id=current_user.id,
        action="project_updated",
        resource_type="project",
        resource_id=project.id,
        metadata=update_data,
    )

    await db.flush()

    decision_count_result = await db.execute(
        select(func.count()).where(DecisionRecord.project_id == project.id)
    )
    decision_count = decision_count_result.scalar() or 0

    member_count_result = await db.execute(
        select(func.count()).where(ProjectMember.project_id == project.id)
    )
    member_count = member_count_result.scalar() or 0

    return ProjectResponse(
        id=project.id,
        name=project.name,
        description=project.description,
        original_budget=float(project.original_budget),
        current_budget=float(project.current_budget),
        status=project.status,
        start_date=project.start_date,
        expected_end=project.expected_end,
        contract_address=project.contract_address,
        created_by=project.created_by,
        created_at=project.created_at,
        decision_count=decision_count,
        member_count=member_count,
    )


@router.get("/projects/{project_id}/members", response_model=list[MemberResponse])
async def list_members(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[MemberResponse]:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(ProjectMember, User)
        .join(User, ProjectMember.user_id == User.id)
        .where(ProjectMember.project_id == project_id)
        .order_by(ProjectMember.added_at.asc())
    )
    rows = result.all()

    return [
        MemberResponse(
            id=member.id,
            user_id=member.user_id,
            project_role=member.project_role,
            added_at=member.added_at,
            user_email=user.email,
            user_full_name=user.full_name,
        )
        for member, user in rows
    ]


@router.delete("/projects/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin")),
) -> None:
    result = await db.execute(select(Project).where(Project.id == project_id))
    project = result.scalar_one_or_none()
    if project is None:
        raise HTTPException(status_code=404, detail="Project not found")

    project.status = "archived"

    await log_action(
        db,
        user_id=current_user.id,
        action="project_archived",
        resource_type="project",
        resource_id=project.id,
    )


@router.post("/projects/{project_id}/members", response_model=MemberResponse, status_code=status.HTTP_201_CREATED)
async def add_member(
    project_id: uuid.UUID,
    body: MemberAdd,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> MemberResponse:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(select(Project).where(Project.id == project_id))
    if result.scalar_one_or_none() is None:
        raise HTTPException(status_code=404, detail="Project not found")

    result = await db.execute(select(User).where(User.id == body.user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    existing = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == body.user_id,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail="User is already a member")

    member = ProjectMember(
        project_id=project_id,
        user_id=body.user_id,
        project_role=body.project_role,
    )
    db.add(member)
    await db.flush()

    await log_action(
        db,
        user_id=current_user.id,
        action="member_added",
        resource_type="project_member",
        resource_id=member.id,
        metadata={"project_id": str(project_id), "user_id": str(body.user_id)},
    )

    return MemberResponse(
        id=member.id,
        user_id=member.user_id,
        project_role=member.project_role,
        added_at=member.added_at,
        user_email=user.email,
        user_full_name=user.full_name,
    )


@router.delete("/projects/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    project_id: uuid.UUID,
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    result = await db.execute(
        select(ProjectMember).where(
            ProjectMember.project_id == project_id,
            ProjectMember.user_id == user_id,
        )
    )
    member = result.scalar_one_or_none()
    if member is None:
        raise HTTPException(status_code=404, detail="Member not found")

    await db.delete(member)

    await log_action(
        db,
        user_id=current_user.id,
        action="member_removed",
        resource_type="project_member",
        resource_id=member.id,
        metadata={"project_id": str(project_id), "removed_user_id": str(user_id)},
    )
