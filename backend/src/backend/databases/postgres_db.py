import os
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from dotenv import load_dotenv

load_dotenv()
Base = declarative_base()

class AsyncPostgreSQLDatabase:
    """
    Asynchronous PostgreSQL database connection manager.
    This class manages the engine and the session factory.
    An instance of this class should be treated as a singleton for the app's lifetime.
    """
    def __init__(self, database_url: str = None):
        if database_url is None:
            sync_db_url = os.getenv("DATABASE_URL", "postgresql://user:password@host/db")
            database_url = sync_db_url.replace('postgresql://', 'postgresql+asyncpg://', 1)

        self.engine = create_async_engine(database_url, echo=False)
        self.async_session_factory = async_sessionmaker(
            bind=self.engine,
            class_=AsyncSession,
            expire_on_commit=False,
        )

    def get_session_factory(self) -> async_sessionmaker[AsyncSession]:
        """Returns the session factory itself."""
        return self.async_session_factory

    async def create_tables(self):
        async with self.engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
