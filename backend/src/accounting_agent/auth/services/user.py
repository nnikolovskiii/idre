import uuid
from cryptography.fernet import Fernet
from sqlalchemy import select

from accounting_agent.databases.postgres_db import AsyncPostgreSQLDatabase
from accounting_agent.models.user import User


class UserService:
    """
    Service for handling user-related operations using PostgreSQL.
    """
    postgres_db: AsyncPostgreSQLDatabase
    fernet: Fernet

    def __init__(self, postgres_db: AsyncPostgreSQLDatabase, fernet: Fernet):
        self.postgres_db = postgres_db
        self.fernet = fernet

    async def check_user_exist(self, user_id: uuid.UUID) -> bool:
        async with self.postgres_db.get_session() as session:
            user = await session.get(User, user_id)
            return user is not None

    async def get_user_by_email(self, email: str) -> User | None:
        """
        Retrieves a user from the database by their email address.
        This is the primary lookup for login and registration checks.
        """
        async with self.postgres_db.get_session() as session:
            stmt = select(User).where(User.email == email)
            result = await session.execute(stmt)
            return result.scalars().first()

    async def get_user_by_username(self, username: str) -> User | None:
        """
        Retrieves a user from the database by their username.
        This is used for username-based login.
        """
        async with self.postgres_db.get_session() as session:
            stmt = select(User).where(User.username == username)
            result = await session.execute(stmt)
            return result.scalars().first()

    async def get_user_by_email_or_username(self, identifier: str) -> User | None:
        """
        Retrieves a user from the database by either email or username.
        This is used for flexible login that accepts either identifier.
        """
        async with self.postgres_db.get_session() as session:
            stmt = select(User).where((User.email == identifier) | (User.username == identifier))
            result = await session.execute(stmt)
            return result.scalars().first()

    async def get_user_by_id(self, user_id: uuid.UUID) -> User | None:
        """
        Retrieves a user from the database by their primary key (user_id).
        This is the most efficient way to get a user when the ID is known.
        """
        async with self.postgres_db.get_session() as session:
            user = await session.get(User, user_id)
            return user

    async def create_user(
        self,
        email: str,
        username: str,
        password: str,
        name: str,
        surname: str,
        is_google_auth: bool = False
    ) -> User:
        new_user = User(
            email=email,
            username=username,
            hashed_password=password,
            name=name,
            surname=surname,
            is_google_auth=is_google_auth
        )
        async with self.postgres_db.get_session() as session:
            session.add(new_user)
            await session.flush()
            await session.refresh(new_user)
            return new_user

    async def update_user_google_auth(self, user_id: uuid.UUID, is_google_auth: bool) -> None:
        """
        Updates the Google authentication flag for a user.
        """
        async with self.postgres_db.get_session() as session:
            user = await session.get(User, user_id)
            if user:
                user.is_google_auth = is_google_auth
                await session.commit()

    def encrypt_data(self, data: str) -> str:
        encrypted_bytes = self.fernet.encrypt(data.encode('utf-8'))
        return encrypted_bytes.decode('utf-8')

    def decrypt_data(self, data: str) -> str:
        encrypted_bytes = data.encode('utf-8')
        return self.fernet.decrypt(encrypted_bytes).decode('utf-8')
