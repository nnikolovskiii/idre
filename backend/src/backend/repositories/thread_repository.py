import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.thread import Thread

class ThreadRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, thread_id: str, notebook_id: Optional[str] = None) -> Thread:
        """
        Creates a new Thread object and adds it to the session.
        Note: This method does NOT commit. The service layer is responsible for the commit.
        """
        new_thread = Thread(
            thread_id=uuid.UUID(thread_id),
            notebook_id=notebook_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.session.add(new_thread)
        await self.session.flush() # flush sends the command to the DB to get IDs, etc.
        return new_thread