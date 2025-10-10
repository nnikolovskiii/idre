import uuid
from typing import Optional

from sqlalchemy import (
    Column,
    Text,
    DateTime,
    Integer,
    func,
    Index
)
from sqlalchemy.dialects.postgresql import UUID, JSONB

from backend.databases.postgres_db import Base


class Assistant(Base):
    __tablename__ = 'assistant'

    assistant_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    graph_id = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    config = Column(JSONB, nullable=False, server_default='{}')
    version = Column(Integer, nullable=False, server_default='1')
    name = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    context = Column(JSONB, nullable=True)
    

    def __repr__(self):
        return f"<Assistant(assistant_id={self.assistant_id}, graph_id='{self.graph_id}', name='{self.name}')>"