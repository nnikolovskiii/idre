# backend/databases/postgres_db.py

import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Load environment variables
load_dotenv()

# Base class for all SQLAlchemy models
Base = declarative_base()


class AsyncPostgreSQLDatabase:
    """
    Asynchronous PostgreSQL database connection manager using SQLAlchemy asyncio.
    """

    def __init__(self, database_url: str = None):
        if database_url is None:
            sync_db_url = os.getenv("DATABASE_URL", "postgresql://postgres:your_password@localhost/postgres")
            if 'postgresql://' in sync_db_url:
                database_url = sync_db_url.replace('postgresql://', 'postgresql+asyncpg://')
            else:
                database_url = sync_db_url

        self.engine = create_async_engine(
            database_url,
            echo=False,
            pool_pre_ping=True,
            pool_recycle=300,
        )

        self.AsyncSessionLocal = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,
        )

    # REMOVED: The @asynccontextmanager is now part of the dependency function below.
    # The class method now just returns a session from the sessionmaker.
    def get_session(self) -> AsyncSession:
        """Returns a new session instance."""
        return self.AsyncSessionLocal()

    async def create_tables(self):
        """
        Asynchronously create all tables defined in the models.
        """
        # It's better to import models inside the function where they are needed
        # if they also might import from this module, to avoid circular dependencies.
        from backend.models.user import User
        from backend.models.chat import Chat
        from backend.models.thread import Thread
        from backend.models.file import File
        from backend.models.notebook import Notebook

        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)


# --- Dependency Injection Setup ---

# Create a single instance of the database manager
db = AsyncPostgreSQLDatabase()

# This is the dependency that will be used in your API routes
async def get_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency that provides a database session.
    It handles session creation, commit, rollback, and closing.
    """
    session = db.get_session()
    try:
        yield session
        await session.commit()
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
