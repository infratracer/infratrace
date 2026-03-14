import logging
import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.user import User
from app.services.audit_service import log_action
from app.services.report_generator import generate_pdf_report

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/projects/{project_id}/reports/export")
async def export_report(
    project_id: uuid.UUID,
    include_ai: bool = True,
    include_sensors: bool = True,
    include_blockchain: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Response:
    await require_project_access(project_id, current_user, db)

    try:
        pdf_bytes = await generate_pdf_report(
            db,
            project_id,
            include_ai=include_ai,
            include_sensors=include_sensors,
            include_blockchain=include_blockchain,
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

    await log_action(db, current_user.id, "report_exported", "project", project_id)

    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=infratrace-report-{project_id}.pdf"},
    )
