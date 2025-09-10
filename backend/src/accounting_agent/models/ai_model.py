import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    Text,
    DateTime,
    ForeignKey,
    func
)
# No longer need 'relationship' from sqlalchemy.orm
from sqlalchemy.dialects.postgresql import UUID

# Assuming 'Base' is your declarative base from another file.
# from accounting_agent.databases.postgres_db import Base
from sqlalchemy.ext.declarative import declarative_base

from accounting_agent.databases.postgres_db import Base


# The AIModel class you requested
class AIModel(Base):
    """
    Python model corresponding to the 'ai_model' table in PostgreSQL.
    Stores information about a specific AI model instance used in a chat.
    """
    __tablename__ = 'ai_model'

    # A unique identifier for each AI model instance
    ai_model_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # --- Fields you requested ---
    user_id = Column(Text, nullable=False)
    name = Column(Text, nullable=False)
    type = Column(Text, nullable=False)

    # Foreign key to link this model to a specific chat.
    # This maintains the database-level link and data integrity.
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chat.chat_id', ondelete="CASCADE"), nullable=False)

    # --- Timestamps (best practice from your reference) ---
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<AIModel(ai_model_id={self.ai_model_id}, name='{self.name}', chat_id='{self.chat_id}')>"