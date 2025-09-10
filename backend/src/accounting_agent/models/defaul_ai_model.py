import uuid
from sqlalchemy import (
    Column,
    Text,
    DateTime,
    func
)
from sqlalchemy.dialects.postgresql import UUID

# Assuming 'Base' is your declarative base
# from accounting_agent.databases.postgres_db import Base
from sqlalchemy.ext.declarative import declarative_base

from accounting_agent.databases.postgres_db import Base


class DefaultAIModel(Base):
    """
    Python model for the 'default_ai_model' table.
    Stores the default AI model name for a given model type.
    """
    __tablename__ = 'default_ai_model'

    # A unique identifier for each default model setting
    default_ai_model_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # The type of the model (e.g., 'llm', 'image_generation').
    # Made unique to ensure only one default per type.
    type = Column(Text, nullable=False, unique=True)

    # The default name for this type (e.g., 'gpt-4-turbo').
    name = Column(Text, nullable=False)

    # Standard timestamp columns for auditing
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        return f"<DefaultAIModel(type='{self.type}', name='{self.name}')>"