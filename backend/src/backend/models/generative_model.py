import uuid
from sqlalchemy import Column, Text, UniqueConstraint, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from backend.databases.postgres_db import Base


class GenerativeModel(Base):
    """
    Central catalog of all generative models available in the application.
    This is the "source of truth" for model properties.
    All models require API keys to access.
    """
    __tablename__ = 'generative_models'  # Plural table name

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False, comment="User-friendly display name, e.g., 'GPT-4 Turbo'")
    type = Column(Text, nullable=False, index=True, comment="The provider or family, e.g., 'openai'")
    is_recommended = Column(Boolean, nullable=False, default=False, comment="Whether this model is recommended for users")
    recommendation_order = Column(Integer, nullable=True, comment="Order for displaying recommended models (lower numbers appear first)")
    recommendation_reason = Column(Text, nullable=True, comment="Reason why this model is recommended")

    __table_args__ = (
        UniqueConstraint('name', 'type', name='_model_name_type_uc'),
    )

    def __repr__(self):
        return f"<GenerativeModel(id={self.id}, name='{self.name}')>"