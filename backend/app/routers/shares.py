from datetime import datetime, timezone
import logging
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import desc

from backend.app.database import get_db
from backend.app.models.user import User
from backend.app.models.file import File
from backend.app.models.share import FileShare
from backend.app.schemas.share import (
    ShareCreateRequest,
    ShareResponse,
    ReceivedShareItem,
    SentShareItem
)
from backend.app.utils.security import get_current_user

router = APIRouter(tags=["Sharing"])
logger = logging.getLogger(__name__)


@router.post("/api/files/{file_id}/shares", response_model=ShareResponse, status_code=status.HTTP_201_CREATED)
def share_file(
    file_id: str,
    req: ShareCreateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Shares a file with another registered user:
    - Verifies that current user is the owner of the file.
    - Resolves recipient by registered email.
    - Disallows sharing file with oneself.
    - Handles existing/reactivated shares.
    """
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    if file_record.owner_id != current_user.id:
        logger.warning(f"Unauthorized share attempt: user {current_user.id} tried sharing file {file_id}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only share files that you own."
        )

    # Resolve recipient
    recipient_email = req.recipient_email.lower().strip()
    if recipient_email == current_user.email.lower():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot share a file with yourself."
        )

    recipient = db.query(User).filter(User.email == recipient_email).first()
    if not recipient:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No registered account found with email '{recipient_email}'."
        )

    # Check for existing share record
    existing_share = db.query(FileShare).filter(
        FileShare.file_id == file_id,
        FileShare.recipient_id == recipient.id
    ).first()

    if existing_share:
        if existing_share.revoked_at is None:
            # Already active
            return ShareResponse(
                id=existing_share.id,
                file_id=file_record.id,
                original_filename=file_record.original_filename,
                owner_id=current_user.id,
                owner_name=current_user.full_name,
                owner_email=current_user.email,
                recipient_id=recipient.id,
                recipient_name=recipient.full_name,
                recipient_email=recipient.email,
                permission=existing_share.permission,
                created_at=existing_share.created_at,
                revoked_at=None,
                is_active=True
            )
        else:
            # Reactivate previously revoked share
            existing_share.revoked_at = None
            existing_share.permission = req.permission or "read"
            db.commit()
            db.refresh(existing_share)
            share_record = existing_share
    else:
        new_share = FileShare(
            file_id=file_id,
            owner_id=current_user.id,
            recipient_id=recipient.id,
            permission=req.permission or "read"
        )
        db.add(new_share)
        db.commit()
        db.refresh(new_share)
        share_record = new_share

    logger.info(f"User {current_user.id} shared file {file_id} with {recipient.id}")

    return ShareResponse(
        id=share_record.id,
        file_id=file_record.id,
        original_filename=file_record.original_filename,
        owner_id=current_user.id,
        owner_name=current_user.full_name,
        owner_email=current_user.email,
        recipient_id=recipient.id,
        recipient_name=recipient.full_name,
        recipient_email=recipient.email,
        permission=share_record.permission,
        created_at=share_record.created_at,
        revoked_at=share_record.revoked_at,
        is_active=(share_record.revoked_at is None)
    )


@router.get("/api/files/{file_id}/shares", response_model=List[ShareResponse])
def get_file_shares(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Lists all active and revoked shares for a file. Only the file owner may access this."""
    file_record = db.query(File).filter(File.id == file_id).first()
    if not file_record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="File not found.")

    if file_record.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the file owner can view sharing settings."
        )

    shares = db.query(FileShare).filter(FileShare.file_id == file_id).order_by(desc(FileShare.created_at)).all()
    results = []
    for s in shares:
        results.append(
            ShareResponse(
                id=s.id,
                file_id=file_record.id,
                original_filename=file_record.original_filename,
                owner_id=current_user.id,
                owner_name=current_user.full_name,
                owner_email=current_user.email,
                recipient_id=s.recipient.id,
                recipient_name=s.recipient.full_name,
                recipient_email=s.recipient.email,
                permission=s.permission,
                created_at=s.created_at,
                revoked_at=s.revoked_at,
                is_active=(s.revoked_at is None)
            )
        )
    return results


@router.delete("/api/files/{file_id}/shares/{share_id}")
def revoke_file_share(
    file_id: str,
    share_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Revokes sharing access for a recipient.
    Takes effect immediately for subsequent backend authorization checks.
    """
    share = db.query(FileShare).filter(FileShare.id == share_id, FileShare.file_id == file_id).first()
    if not share:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Share record not found.")

    if share.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the file owner can revoke sharing permissions."
        )

    share.revoked_at = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"User {current_user.id} revoked share {share_id} for file {file_id}")
    return {"message": "Sharing permission revoked successfully.", "share_id": share_id}


@router.get("/api/shares/received", response_model=List[ReceivedShareItem])
def get_received_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all files currently shared with the logged-in user that are not revoked."""
    active_shares = db.query(FileShare).filter(
        FileShare.recipient_id == current_user.id,
        FileShare.revoked_at.is_(None)
    ).order_by(desc(FileShare.created_at)).all()

    items = []
    for s in active_shares:
        if s.file:
            items.append(
                ReceivedShareItem(
                    share_id=s.id,
                    file_id=s.file.id,
                    original_filename=s.file.original_filename,
                    content_type=s.file.content_type,
                    file_size=s.file.file_size,
                    owner_name=s.owner.full_name,
                    owner_email=s.owner.email,
                    permission=s.permission,
                    shared_at=s.created_at
                )
            )
    return items


@router.get("/api/shares/sent", response_model=List[SentShareItem])
def get_sent_shares(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Returns all shares created by the logged-in user."""
    shares = db.query(FileShare).filter(
        FileShare.owner_id == current_user.id
    ).order_by(desc(FileShare.created_at)).all()

    items = []
    for s in shares:
        if s.file:
            items.append(
                SentShareItem(
                    share_id=s.id,
                    file_id=s.file.id,
                    original_filename=s.file.original_filename,
                    recipient_name=s.recipient.full_name,
                    recipient_email=s.recipient.email,
                    permission=s.permission,
                    shared_at=s.created_at,
                    revoked_at=s.revoked_at,
                    is_active=(s.revoked_at is None)
                )
            )
    return items
