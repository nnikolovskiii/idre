import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv
from contextlib import asynccontextmanager
from typing import AsyncGenerator

# Load environment variables
load_dotenv()

# Create a base class for all SQLAlchemy models (this remains the same)
Base = declarative_base()


class AsyncPostgreSQLDatabase:
    """
    Asynchronous PostgreSQL database connection manager using SQLAlchemy asyncio.
    """

    def __init__(self, database_url: str = None):
        if database_url is None:
            # Get database URL from environment variable
            sync_db_url = os.getenv("DATABASE_URL", "postgresql://postgres:your_password@localhost/postgres")

            # Convert the sync URL to an async URL by adding the asyncpg driver
            # e.g., "postgresql://..." -> "postgresql+asyncpg://..."
            if 'postgresql://' in sync_db_url:
                database_url = sync_db_url.replace('postgresql://', 'postgresql+asyncpg://')
            else:
                database_url = sync_db_url

        # Create an async engine to connect to the database
        self.engine = create_async_engine(
            database_url,
            echo=False,  # Set to True for SQL query logging
            pool_pre_ping=True,  # Verify connections before use
            pool_recycle=300,  # Recycle connections every 5 minutes
        )

        # An AsyncSession is the entry point for all async database operations with the ORM
        self.AsyncSessionLocal = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            autocommit=False,
            autoflush=False,
            expire_on_commit=False,  # Good practice for async web apps
        )

    @asynccontextmanager
    async def get_session(self) -> AsyncGenerator[AsyncSession, None]:
        """
        Async context manager for database sessions.
        Automatically handles session cleanup and rollback on errors.

        Usage:
            async with db.get_session() as session:
                # Your async database operations here
                session.add(new_object)
                await session.commit()
        """
        session = self.AsyncSessionLocal()
        try:
            yield session
            await session.commit()
        except Exception as e:
            await session.rollback()
            raise e
        finally:
            await session.close()

    async def create_tables(self):
        """
        Asynchronously create all tables defined in the models.
        """
        # Import models here to avoid circular imports
        from accounting_agent.models.user import User
        from accounting_agent.models.chat import Chat
        from accounting_agent.models.thread import Thread

        async with self.engine.begin() as conn:
            # run_sync is used to run the synchronous metadata creation
            await conn.run_sync(Base.metadata.create_all)

    def get_session_direct(self) -> AsyncSession:
        """
        Get an async database session directly (not recommended for production).
        Remember to await session.close() manually when done.
        """
        return self.AsyncSessionLocal()
