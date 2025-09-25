import uuid
from sqlalchemy import (
    Column,
    String,
    DateTime,
    Integer,
    func
)
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID

from backend.databases.postgres_db import Base


class Notebook(Base):
    """
    Python model corresponding to the 'notebooks' table in PostgreSQL.
    """
    __tablename__ = 'notebooks'

    # A universally unique identifier is a great primary key.
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # User who created the notebook
    user_id = Column(String(255), nullable=False, index=True)

    # Notebook emoji icon
    emoji = Column(String(10), nullable=False)

    # Notebook title
    title = Column(String(255), nullable=False)

    # Creation date
    date = Column(String(50), nullable=False)

    # Number of sources associated with this notebook
    source_count = Column(Integer, nullable=False, default=0)

    # Background color for the notebook
    bg_color = Column(String(20), nullable=False)

    # Text color for the notebook
    text_color = Column(String(20), nullable=False)

    # --- Timestamps ---

    # Automatically set the creation time on the database side.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Automatically updates the timestamp on any modification.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationship to threads (which contain chats and files)
    threads = relationship("Thread", back_populates="notebook", cascade="all, delete-orphan")

    def __repr__(self):
        """Provides a developer-friendly representation of the object."""
        return f"<Notebook(id={self.id}, title='{self.title}', emoji='{self.emoji}')>"
