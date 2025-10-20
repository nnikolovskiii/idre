import uuid

from sqlalchemy import (
    Column,
    Text,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped

from backend.databases.postgres_db import Base
from backend.models.generative_model import GenerativeModel


class NotebookModel(Base):
    """
    Stores a user's default model preference for a specific notebook.
    This links a user, a notebook, and a chosen GenerativeModel.
    """
    __tablename__ = 'notebook_default_models'  # Plural table name

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)
    notebook_id = Column(UUID(as_uuid=True), ForeignKey('notebooks.id', ondelete="CASCADE"), nullable=False)

    # Foreign key to the central definition table
    generative_model_id = Column(UUID(as_uuid=True), ForeignKey('generative_models.id'), nullable=False)

    # Relationship to easily access the model details
    model: Mapped[GenerativeModel] = relationship("GenerativeModel")

    # One-to-one relationship back to the notebook
    notebook = relationship("Notebook", back_populates="default_model")

    def __repr__(self):
        return f"<NotebookDefaultModel(notebook_id='{self.notebook_id}', user_id='{self.user_id}')>"