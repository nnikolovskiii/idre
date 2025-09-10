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


# 3. Define the Chat Model
class Chat(Base):
    """
    Python model corresponding to the 'chat' table in PostgreSQL.
    """
    __tablename__ = 'chat'

    # Map class attributes to table columns
    chat_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)

    # Define the foreign key relationship
    thread_id = Column(UUID(as_uuid=True), ForeignKey('thread.thread_id', ondelete="CASCADE"), nullable=False)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Create a direct link to the parent Thread object in Python
    thread = relationship("Thread", back_populates="chats")

    def __repr__(self):
        return f"<Chat(chat_id={self.chat_id}, user_id='{self.user_id}')>"
