from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, EmailStr, Field


class ShareCreateRequest(BaseModel):
    recipient_email: EmailStr = Field(..., description="Email address of the registered recipient")
    permission: str = Field(default="read", description="Permission granted (default: read)")


class ShareResponse(BaseModel):
    id: str
    file_id: str
    original_filename: str
    owner_id: str
    owner_name: str
    owner_email: str
    recipient_id: str
    recipient_name: str
    recipient_email: str
    permission: str
    created_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool

    model_config = {"from_attributes": True}


class ReceivedShareItem(BaseModel):
    share_id: str
    file_id: str
    original_filename: str
    content_type: str
    file_size: int
    owner_name: str
    owner_email: str
    permission: str
    shared_at: datetime


class SentShareItem(BaseModel):
    share_id: str
    file_id: str
    original_filename: str
    recipient_name: str
    recipient_email: str
    permission: str
    shared_at: datetime
    revoked_at: Optional[datetime] = None
    is_active: bool
