import hashlib
import logging
import os
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, require_roles
from app.core.permissions import require_project_access
from app.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import DocumentResponse
from app.services.audit_service import log_action

logger = logging.getLogger(__name__)

router = APIRouter()

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads")


@router.post(
    "/projects/{project_id}/documents",
    response_model=DocumentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def upload_document(
    project_id: uuid.UUID,
    file: UploadFile,
    decision_id: uuid.UUID | None = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DocumentResponse:
    await require_project_access(project_id, current_user, db)

    os.makedirs(UPLOAD_DIR, exist_ok=True)

    content = await file.read()
    size_bytes = len(content)
    checksum = hashlib.sha256(content).hexdigest()

    file_id = uuid.uuid4()
    ext = os.path.splitext(file.filename or "")[1]
    storage_filename = f"{file_id}{ext}"
    storage_path = os.path.join(UPLOAD_DIR, storage_filename)

    with open(storage_path, "wb") as f:
        f.write(content)

    doc = Document(
        id=file_id,
        project_id=project_id,
        decision_id=decision_id,
        filename=file.filename or "unnamed",
        content_type=file.content_type or "application/octet-stream",
        size_bytes=size_bytes,
        storage_path=storage_path,
        checksum_sha256=checksum,
        uploaded_by=current_user.id,
    )
    db.add(doc)
    await db.flush()

    await log_action(
        db,
        user_id=current_user.id,
        action="document_uploaded",
        resource_type="document",
        resource_id=doc.id,
        metadata={"project_id": str(project_id), "filename": doc.filename},
    )

    return DocumentResponse.model_validate(doc)


@router.get(
    "/projects/{project_id}/documents",
    response_model=list[DocumentResponse],
)
async def list_documents(
    project_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[DocumentResponse]:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(Document)
        .where(Document.project_id == project_id)
        .order_by(Document.created_at.desc())
    )
    docs = result.scalars().all()
    return [DocumentResponse.model_validate(d) for d in docs]


@router.get(
    "/projects/{project_id}/documents/{doc_id}/download",
)
async def download_document(
    project_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> FileResponse:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.project_id == project_id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if not os.path.exists(doc.storage_path):
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(
        path=doc.storage_path,
        filename=doc.filename,
        media_type=doc.content_type,
    )


@router.delete(
    "/projects/{project_id}/documents/{doc_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def delete_document(
    project_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> None:
    await require_project_access(project_id, current_user, db)

    result = await db.execute(
        select(Document).where(
            Document.id == doc_id,
            Document.project_id == project_id,
        )
    )
    doc = result.scalar_one_or_none()
    if doc is None:
        raise HTTPException(status_code=404, detail="Document not found")

    if os.path.exists(doc.storage_path):
        os.remove(doc.storage_path)

    await db.delete(doc)

    await log_action(
        db,
        user_id=current_user.id,
        action="document_deleted",
        resource_type="document",
        resource_id=doc.id,
        metadata={"project_id": str(project_id), "filename": doc.filename},
    )
