import logging
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db, async_session
from app.models.analysis import AIAnalysisResult
from app.models.user import User
from app.schemas.analysis import AnalysisResponse
from app.services.ai_analyser import analyse_project
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()


async def _run_analysis_background(project_id: uuid.UUID, user_id: uuid.UUID) -> None:
    """Background task to run AI analysis."""
    async with async_session() as db:
        try:
            await analyse_project(db, project_id)
            await log_action(db, user_id, "analysis_completed", "project", project_id)
            await db.commit()
            logger.info("Analysis completed for project %s", project_id)
        except Exception as e:
            logger.error("Background analysis failed for project %s: %s", project_id, e)
            await db.rollback()


@router.post("/projects/{project_id}/analysis", status_code=status.HTTP_202_ACCEPTED)
async def trigger_analysis(
    project_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_roles("admin", "project_manager")),
) -> dict[str, str]:
    await require_project_access(project_id, current_user, db, required_roles=["pm"])

    await log_action(db, current_user.id, "analysis_triggered", "project", project_id)

    background_tasks.add_task(_run_analysis_background, project_id, current_user.id)

    return {"detail": "Analysis started", "project_id": str(project_id)}


@router.get("/projects/{project_id}/analysis", response_model=list[AnalysisResponse])
async def list_analysis(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[AnalysisResponse]:
    if current_user.role == "stakeholder":
        raise HTTPException(status_code=403, detail="Stakeholders cannot view AI analysis")

    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(AIAnalysisResult)
        .where(AIAnalysisResult.project_id == project_id)
        .order_by(AIAnalysisResult.created_at.desc())
    )
    findings = result.scalars().all()

    return [
        AnalysisResponse(
            id=f.id,
            project_id=f.project_id,
            analysis_type=f.analysis_type,
            severity=f.severity,
            finding=f.finding,
            related_decisions=f.related_decisions,
            related_sensors=f.related_sensors,
            confidence_score=float(f.confidence_score) if f.confidence_score else None,
            model_version=f.model_version,
            created_at=f.created_at,
        )
        for f in findings
    ]


@router.get("/projects/{project_id}/analysis/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(
    project_id: uuid.UUID,
    analysis_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> AnalysisResponse:
    if current_user.role == "stakeholder":
        raise HTTPException(status_code=403, detail="Stakeholders cannot view AI analysis")

    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(AIAnalysisResult).where(
            AIAnalysisResult.id == analysis_id,
            AIAnalysisResult.project_id == project_id,
        )
    )
    finding = result.scalar_one_or_none()
    if finding is None:
        raise HTTPException(status_code=404, detail="Analysis finding not found")

    return AnalysisResponse(
        id=finding.id,
        project_id=finding.project_id,
        analysis_type=finding.analysis_type,
        severity=finding.severity,
        finding=finding.finding,
        related_decisions=finding.related_decisions,
        related_sensors=finding.related_sensors,
        confidence_score=float(finding.confidence_score) if finding.confidence_score else None,
        model_version=finding.model_version,
        created_at=finding.created_at,
    )
