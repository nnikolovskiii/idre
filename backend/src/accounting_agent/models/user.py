import uuid
from datetime import datetime

from sqlalchemy import (
    Column,
    String,
    Boolean,
    DateTime,
    func
)
from sqlalchemy.dialects.postgresql import UUID

# This should be the declarative base from your SQLAlchemy setup.
# I'm using the same import path as in your example.
from accounting_agent.databases.postgres_db import Base


class User(Base):
    """
    Python model corresponding to the 'users' table in PostgreSQL.
    """
    __tablename__ = 'users'

    # --- Column Definitions ---

    # A universally unique identifier is a great primary key.
    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Corresponds to: email: EmailStr
    # String(255) is a common length for emails.
    # unique=True enforces that no two users can have the same email.
    # index=True makes lookups by email faster (e.g., for login).
    email = Column(String(255), unique=True, index=True, nullable=False)

    # Username field for login alternative
    # String(50) is a reasonable length for usernames.
    # unique=True enforces that no two users can have the same username.
    # index=True makes lookups by username faster (e.g., for login).
    username = Column(String(50), unique=True, index=True, nullable=False)

    # Corresponds to: hashed_password: str
    # Storing as String. The length should be sufficient for common hashing algorithms.
    # Nullable is True to allow users to sign up via OAuth (e.g., Google) without a password.
    hashed_password = Column(String(255), nullable=True)

    # Corresponds to: is_google_auth: bool = False
    # A boolean flag with a database-level default of FALSE.
    is_google_auth = Column(Boolean, server_default='false', nullable=False)

    # Corresponds to: name: str
    name = Column(String(100), nullable=False)

    # Corresponds to: surname: str
    surname = Column(String(100), nullable=False)

    # --- Timestamps ---

    # Automatically set the creation time on the database side.
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    # Automatically updates the timestamp on any modification.
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())


    # --- (Optional) Relationships ---
    # If you wanted to link this User model back to your Chat model, you would add:
    # chats = relationship("Chat", back_populates="user", cascade="all, delete-orphan")
    # This assumes you would modify the Chat model to have a proper ForeignKey to `users.user_id`.


    def __repr__(self):
        """Provides a developer-friendly representation of the object."""
        return f"<User(user_id={self.user_id}, email='{self.email}')>"
