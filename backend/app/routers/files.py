import io
import os
import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File as FastAPIFile, Query, status, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.file import File
from backend.app.models.share import FileShare
from backend.app.schemas.file import FileResponse, FileDetailResponse, FileListResponse
from backend.app.utils.security import get_current_user
from backend.app.utils.validators import validate_file_metadata, compute_sha256
from backend.app.services.storage import get_storage_service

router = APIRouter(prefix="/api/files", tags=["Files"])
logger = logging.getLogger(__name__)


@router.post("/upload", response_model=FileResponse, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile = FastAPIFile(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Secure file upload endpoint:
    - Enforces file size limit
    - Sanitizes original filename (directory traversal prevention)
    - Validates extension and content type
    - Stores file with isolated, UUID-based storage key in S3
    - Stores metadata and SHA-256 checksum in PostgreSQL
    """
    file_bytes = await file.read()
    file_size = len(file_bytes)

    # 1. Validate file metadata and size
    clean_filename, content_type = validate_file_metadata(
        filename=file.filename or "upload",
        file_size=file_size,
        client_content_type=file.content_type or "application/octet-stream"
    )

    # 2. Compute integrity checksum
    checksum = compute_sha256(file_bytes)

    # 3. Generate isolated S3 storage key (never rely on raw user filename for object keys)
    object_id = str(uuid.uuid4())
    storage_key = f"users/{current_user.id}/{object_id}_{clean_filename}"

    storage_service = get_storage_service()

    # 4. Upload file to storage
    storage_service.upload_file(
        storage_key=storage_key,
        data=file_bytes,
        content_type=content_type
    )

    # 5. Save metadata in PostgreSQL
    db_file = File(
        owner_id=current_user.id,
        original_filename=clean_filename,
        storage_key=storage_key,
        content_type=content_type,
        file_size=file_size,
        checksum=checksum
    )

    try:
        db.add(db_file)
        db.commit()
        db.refresh(db_file)
    except Exception as e:
        logger.error(f"Database error while saving file metadata: {e}. Rolling back storage...")
        db.rollback()
        # Clean up storage object on metadata failure
        try:
            storage_service.delete_file(storage_key)
        except Exception:
            pass
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to record file metadata."
        )

    logger.info(f"User {current_user.id} uploaded file {db_file.id} ({clean_filename}, {file_size} bytes)")

    return FileResponse(
        id=db_file.id,
        original_filename=db_file.original_filename,
        content_type=db_file.content_type,
        file_size=db_file.file_size,
        checksum=db_file.checksum,
        created_at=db_file.created_at,
        updated_at=db_file.updated_at,
        owner_id=db_file.owner_id,
        is_owner=True,
        share_count=0
    )


@router.get("", response_model=FileListResponse)
def list_files(
    q: Optional[str] = Query(None, description="Search by filename"),
    type: Optional[str] = Query(None, description="Filter: all, image, document, archive"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Page size"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists files owned by the current user with optional search and type filtering."""
    query = db.query(File).filter(File.owner_id == current_user.id)

    if q and q.strip():
        search_pattern = f"%{q.strip()}%"
        query = query.filter(File.original_filename.ilike(search_pattern))

    if type and type.lower() != "all":
        t = type.lower()
        if t == "image":
            query = query.filter(File.content_type.ilike("image/%"))
        elif t == "document":
            query = query.filter(
                or_(
                    File.content_type.ilike("%pdf%"),
                    File.content_type.ilike("%word%"),
                    File.content_type.ilike("%excel%"),
                    File.content_type.ilike("%presentation%"),
                    File.content_type.ilike("%text%"),
                    File.content_type.ilike("%csv%"),
                    File.content_type.ilike("%json%")
                )
            )
        elif t == "archive":
            query = query.filter(
                or_(
                    File.content_type.ilike("%zip%"),
                    File.content_type.ilike("%tar%"),
                    File.content_type.ilike("%compressed%")
                )
            )

    total = query.count()
    files = query.order_by(desc(File.created_at)).offset((page - 1) * page_size).limit(page_size).all()

    # Calculate active share counts per file
    file_items = []
    for f in files:
        active_shares = db.query(FileShare).filter(
            FileShare.file_id == f.id,
            FileShare.revoked_at.is_(None)
        ).count()

        file_items.append(
            FileResponse(
                id=f.id,
                original_filename=f.original_filename,
                content_type=f.content_type,
                file_size=f.file_size,
                checksum=f.checksum,
                created_at=f.created_at,
                updated_at=f.updated_at,
                owner_id=f.owner_id,
                is_owner=True,
                share_count=active_shares
            )
        )

    return FileListResponse(
        items=file_items,
        total=total,
        page=page,
        page_size=page_size
    )


@router.get("/{file_id}", response_model=FileDetailResponse)
def get_file_metadata(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieves file metadata.
    Enforces authorization: Only the owner OR an authorized recipient with active share can view metadata.
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    is_owner = (file_record.owner_id == current_user.id)
    if not is_owner:
        # Check if recipient has an active unrevoked share
        active_share = db.query(FileShare).filter(
            FileShare.file_id == file_id,
            FileShare.recipient_id == current_user.id,
            FileShare.revoked_at.is_(None)
        ).first()

        if not active_share:
            # Prevent IDOR enumeration by returning 404
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found or access denied.")

    storage_service = get_storage_service()
    presigned_url = storage_service.generate_presigned_download_url(
        storage_key=file_record.storage_key,
        filename=file_record.original_filename,
        expires_in=settings.PRESIGNED_URL_EXPIRATION_SECONDS
    )

    share_count = db.query(FileShare).filter(
        FileShare.file_id == file_record.id,
        FileShare.revoked_at.is_(None)
    ).count()

    return FileDetailResponse(
        id=file_record.id,
        original_filename=file_record.original_filename,
        content_type=file_record.content_type,
        file_size=file_record.file_size,
        checksum=file_record.checksum,
        created_at=file_record.created_at,
        updated_at=file_record.updated_at,
        owner_id=file_record.owner_id,
        is_owner=is_owner,
        share_count=share_count,
        download_url=presigned_url
    )


@router.get("/{file_id}/download")
def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Downloads authorized file content.
    Enforces authorization:
    - User must be owner, OR
    - User must have an active unrevoked share record.
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    # Authorization verification
    is_owner = (file_record.owner_id == current_user.id)
    if not is_owner:
        active_share = db.query(FileShare).filter(
            FileShare.file_id == file_id,
            FileShare.recipient_id == current_user.id,
            FileShare.revoked_at.is_(None)
        ).first()

        if not active_share:
            logger.warning(
                f"Unauthorized download attempt for file {file_id} by user {current_user.id}"
            )
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access to this file has been denied or revoked.")

    storage_service = get_storage_service()
    file_bytes = storage_service.download_file(file_record.storage_key)

    # Safe headers for content download
    safe_filename = file_record.original_filename.replace('"', '\\"')
    headers = {
        "Content-Disposition": f'attachment; filename="{safe_filename}"',
        "Content-Length": str(len(file_bytes)),
        "X-Content-Type-Options": "nosniff"
    }

    return Response(
        content=file_bytes,
        media_type=file_record.content_type or "application/octet-stream",
        headers=headers
    )


@router.delete("/{file_id}")
def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Deletes a file.
    Enforces authorization: ONLY the file owner can delete the file.
    Recipients cannot delete files shared with them.
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    if file_record.owner_id != current_user.id:
        logger.warning(
            f"Unauthorized file deletion attempt for file {file_id} by user {current_user.id}"
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to delete this file."
        )

    storage_service = get_storage_service()
    # Delete from cloud/local storage
    try:
        storage_service.delete_file(file_record.storage_key)
    except Exception as e:
        logger.warning(f"Error removing storage object during file deletion: {e}")

    # Delete database record (cascades to shares)
    db.delete(file_record)
    db.commit()

    logger.info(f"User {current_user.id} deleted file {file_id} ({file_record.original_filename})")

    return {"message": "File deleted successfully.", "file_id": file_id}
