import uuid
from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database import Base


class FileShare(Base):
    __tablename__ = "file_shares"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, index=True)
    owner_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    recipient_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    permission = Column(String(20), default="read", nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc), nullable=False)
    revoked_at = Column(DateTime(timezone=True), nullable=True, index=True)

    __table_args__ = (
        UniqueConstraint("file_id", "recipient_id", name="uq_file_recipient"),
    )

    # Relationships
    file = relationship("File", back_populates="shares")
    owner = relationship("User", foreign_keys=[owner_id], back_populates="owned_shares")
    recipient = relationship("User", foreign_keys=[recipient_id], back_populates="received_shares")

    def __repr__(self):
        return f"<FileShare id={self.id} file={self.file_id} to={self.recipient_id} revoked={self.revoked_at is not None}>"
