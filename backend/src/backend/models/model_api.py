import uuid
from sqlalchemy import (
    Column,
    Text,
    DateTime,
    func
)
from sqlalchemy.dialects.postgresql import UUID

from backend.databases.postgres_db import Base


class ModelApi(Base):
    """
    Python model for the 'model_api' table.
    Stores API keys/values (hashed) for users.
    """
    __tablename__ = 'model_api'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)
    value = Column(Text, nullable=False)  # Store the hashed value as text

    # Optional: Add timestamps for audit trail
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())