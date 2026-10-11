from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class FileResponse(BaseModel):
    id: str
    original_filename: str
    content_type: str
    file_size: int
    checksum: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    owner_id: str
    is_owner: bool = True
    share_count: int = 0

    model_config = {"from_attributes": True}


class FileDetailResponse(FileResponse):
    download_url: Optional[str] = None


class FileListResponse(BaseModel):
    items: List[FileResponse]
    total: int
    page: int
    page_size: int
