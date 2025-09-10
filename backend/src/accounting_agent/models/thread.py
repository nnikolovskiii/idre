import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Text,
    DateTime,
    ForeignKey,
    func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from accounting_agent.databases.postgres_db import Base


class Thread(Base):
    __tablename__ = 'thread'

    thread_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    chats = relationship("Chat", back_populates="thread")
