from typing import Dict
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, desc

from backend.app.config import settings
from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.file import File
from backend.app.models.share import FileShare
from backend.app.schemas.dashboard import DashboardStatsResponse
from backend.app.schemas.file import FileResponse
from backend.app.utils.security import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])

USER_STORAGE_QUOTA_BYTES = 500 * 1024 * 1024  # 500 MB demonstration quota


@router.get("/stats", response_model=DashboardStatsResponse)
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Calculates storage usage, quota metrics, and file distributions for the user dashboard."""
    # 1. Total files and storage usage
    files_query = db.query(File).filter(File.owner_id == current_user.id)
    total_files = files_query.count()

    total_storage = db.query(func.coalesce(func.sum(File.file_size), 0)).filter(
        File.owner_id == current_user.id
    ).scalar() or 0

    storage_percentage = round((total_storage / USER_STORAGE_QUOTA_BYTES) * 100, 2)
    if storage_percentage > 100:
        storage_percentage = 100.0

    # 2. Shares count
    shares_received_count = db.query(FileShare).filter(
        FileShare.recipient_id == current_user.id,
        FileShare.revoked_at.is_(None)
    ).count()

    shares_sent_count = db.query(FileShare).filter(
        FileShare.owner_id == current_user.id,
        FileShare.revoked_at.is_(None)
    ).count()

    # 3. Recent 5 files
    recent_records = files_query.order_by(desc(File.created_at)).limit(5).all()
    recent_files = [
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
            share_count=0
        )
        for f in recent_records
    ]

    # 4. File type category distribution
    user_files = files_query.all()
    distribution: Dict[str, int] = {
        "Images": 0,
        "Documents": 0,
        "Archives": 0,
        "Code/Text": 0,
        "Other": 0
    }

    for f in user_files:
        ct = f.content_type.lower()
        if ct.startswith("image/"):
            distribution["Images"] += 1
        elif "pdf" in ct or "word" in ct or "document" in ct or "sheet" in ct or "presentation" in ct:
            distribution["Documents"] += 1
        elif "zip" in ct or "tar" in ct or "compressed" in ct or "gzip" in ct:
            distribution["Archives"] += 1
        elif "text" in ct or "json" in ct or "csv" in ct:
            distribution["Code/Text"] += 1
        else:
            distribution["Other"] += 1

    return DashboardStatsResponse(
        total_files=total_files,
        total_storage_bytes=total_storage,
        storage_limit_bytes=USER_STORAGE_QUOTA_BYTES,
        storage_percentage=storage_percentage,
        shares_received_count=shares_received_count,
        shares_sent_count=shares_sent_count,
        recent_files=recent_files,
        file_type_distribution=distribution
    )
