import hashlib
import os
import re
from typing import Tuple
from fastapi import HTTPException, status
from backend.app.config import settings


def sanitize_filename(filename: str) -> str:
    r"""
    Sanitizes a client-provided filename:
    - Removes path traversal characters (../, ..\, /)
    - Strips leading/trailing spaces and dots
    - Removes null bytes and control characters
    - Normalizes characters and restricts length
    """
    if not filename:
        return "untitled_file"

    # Remove path directory separators and null bytes
    cleaned = os.path.basename(filename)
    cleaned = cleaned.replace("\0", "").strip()

    # Disallow relative path indicators
    cleaned = re.sub(r"\.{2,}", ".", cleaned)

    # Allow alphanumeric, hyphens, underscores, dots, and spaces
    cleaned = re.sub(r"[^\w\s\.\-]", "_", cleaned)
    cleaned = cleaned.strip()

    if not cleaned or cleaned.startswith("."):
        cleaned = f"file_{cleaned}".strip("_.")

    # Max length limit (keep extension intact)
    if len(cleaned) > 200:
        base, ext = os.path.splitext(cleaned)
        cleaned = f"{base[:190]}{ext}"

    return cleaned


def validate_file_metadata(filename: str, file_size: int, client_content_type: str) -> Tuple[str, str]:
    """
    Validates file size, extension, and content type.
    Returns (sanitized_filename, validated_content_type).
    """
    # 1. Size check
    if file_size <= 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot upload an empty file."
        )

    if file_size > settings.MAX_UPLOAD_SIZE_BYTES:
        max_mb = settings.MAX_UPLOAD_SIZE_BYTES / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum upload limit of {max_mb:.1f} MB."
        )

    # 2. Sanitize filename
    clean_name = sanitize_filename(filename)

    # 3. Extension check
    ext = os.path.splitext(clean_name)[1].lower().lstrip(".")
    if not ext or ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type '.{ext}'. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    # 4. Safe MIME type mapping fallback
    mime_type = client_content_type or "application/octet-stream"

    return clean_name, mime_type


def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 hash digest of file binary data."""
    sha = hashlib.sha256()
    sha.update(data)
    return sha.hexdigest()
