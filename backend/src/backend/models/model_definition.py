import uuid

from sqlalchemy import (
    Column,
    Text,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from backend.databases.postgres_db import Base


class GenerativeModel(Base):
    """
    Central catalog of all AI models available in the application.
    This is the "source of truth" for model properties, typically managed
    by system administrators.
    """
    __tablename__ = 'generative_model'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    name = Column(Text, nullable=False)

    type = Column(Text, nullable=False, index=True)

    __table_args__ = (
        UniqueConstraint('name', 'type', name='_model_name_type_uc'),
    )

    def __repr__(self):
        return f"<AIModelDefinition(id={self.id}, name='{self.name}')>"
