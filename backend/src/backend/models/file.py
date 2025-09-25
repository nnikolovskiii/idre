import uuid
from enum import Enum

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Integer,
    func
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from backend.databases.postgres_db import Base


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class File(Base):
    """
    Python model corresponding to the 'files' table in PostgreSQL.
    """
    __tablename__ = 'files'

    # A universally unique identifier is a great primary key.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who uploaded the file
    user_id = Column(String(255), nullable=False, index=True)

    # File URL
    url = Column(String(500), nullable=False)

    # Original filename provided by the user
    filename = Column(String(255), nullable=False)

    # Unique filename used for storage and URLs
    unique_filename = Column(String(255), nullable=False, unique=True)

    # Content type of the file
    content_type = Column(String(100), nullable=True)

    # File size in bytes
    file_size_bytes = Column(Integer, nullable=True)

    # Processing status
    processing_status = Column(String(20), nullable=False, default=ProcessingStatus.PENDING)

    # Associated thread ID
    thread_id = Column(UUID(as_uuid=True), ForeignKey('thread.thread_id', ondelete="CASCADE"), nullable=True)

    # Associated run ID
    run_id = Column(String(255), nullable=True)

    # Processing result as JSON
    processing_result = Column(JSONB, nullable=True)

    # --- Timestamps ---

    # Automatically set the creation time on the database side.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Automatically updates the timestamp on any modification.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        """Provides a developer-friendly representation of the object."""
        return f"<File(file_id={self.file_id}, filename='{self.filename}')>"
