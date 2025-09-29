import uuid
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.user import User


class UserRepository:
    """
    Repository for user data access operations.
    Handles direct database interactions for the User model.
    """

    def __init__(self, session: AsyncSession):
        """
        Initializes the UserRepository with a database session.

        Args:
            session (AsyncSession): The SQLAlchemy session for database operations.
        """
        self.session = session

    async def get_by_id(self, user_id: uuid.UUID) -> User | None:
        """Retrieves a user by their primary key."""
        return await self.session.get(User, user_id)

    async def get_by_email(self, email: str) -> User | None:
        """Retrieves a user by their email address."""
        stmt = select(User).where(User.email == email)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_username(self, username: str) -> User | None:
        """Retrieves a user by their username."""
        stmt = select(User).where(User.username == username)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def get_by_email_or_username(self, identifier: str) -> User | None:
        """Retrieves a user by either their email or username."""
        stmt = select(User).where((User.email == identifier) | (User.username == identifier))
        result = await self.session.execute(stmt)
        return result.scalars().first()

    def add(self, user: User) -> None:
        """Adds a new user object to the session to be persisted."""
        self.session.add(user)