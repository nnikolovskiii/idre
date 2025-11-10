import uuid
from sqlalchemy import (
    Column,
    DateTime,
    func,
    Text,
    ForeignKey
)
from sqlalchemy.dialects.postgresql import UUID
# No longer need relationship in this file for this simple case

from backend.databases.postgres_db import Base


class Proposition(Base):
    """
    Python model corresponding to the 'propositions' table in PostgreSQL.
    Each proposition has a one-to-one relationship with a Notebook,
    using the notebook_id as its primary key.
    """
    __tablename__ = 'propositions'

    # The notebook_id is now BOTH the Primary Key and a Foreign Key.
    # This enforces a one-to-one relationship at the database level.
    notebook_id = Column(UUID(as_uuid=True), ForeignKey('notebooks.id', ondelete="CASCADE"), primary_key=True)

    # The separate 'id' column is removed.

    service = Column(Text, nullable=True)
    audience = Column(Text, nullable=True)
    problem = Column(Text, nullable=True)
    solution = Column(Text, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    def __repr__(self):
        """Provides a developer-friendly representation of the object."""
        return f"<Proposition(notebook_id={self.notebook_id})>"