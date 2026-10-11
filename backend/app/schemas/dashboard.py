from typing import List, Dict
from pydantic import BaseModel
from backend.app.schemas.file import FileResponse


class DashboardStatsResponse(BaseModel):
    total_files: int
    total_storage_bytes: int
    storage_limit_bytes: int
    storage_percentage: float
    shares_received_count: int
    shares_sent_count: int
    recent_files: List[FileResponse]
    file_type_distribution: Dict[str, int]
