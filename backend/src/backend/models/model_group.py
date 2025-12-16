import uuid
from typing import List

from sqlalchemy import (
    Column,
    String,
    Text,
    DateTime,
    ForeignKey,
    Table,
    func
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped

from backend.databases.postgres_db import Base
from backend.models.generative_model import GenerativeModel

# Association table
model_group_memberships = Table(
    'model_group_memberships',
    Base.metadata,
    Column('group_id', UUID(as_uuid=True), ForeignKey('model_groups.id', ondelete="CASCADE"), primary_key=True),
    # FIX: Reverted to UUID to match generative_models table definition
    Column('model_id', UUID(as_uuid=True), ForeignKey('generative_models.id', ondelete="CASCADE"), primary_key=True)
)

class ModelGroup(Base):
    __tablename__ = 'model_groups'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    models: Mapped[List[GenerativeModel]] = relationship(
        "GenerativeModel",
        secondary=model_group_memberships,
        lazy="selectin"
    )

    def __repr__(self):
        return f"<ModelGroup(id={self.id}, name='{self.name}', user_id='{self.user_id}')>"