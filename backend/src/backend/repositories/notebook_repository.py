# backend/repositories/notebook_repository.py

from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.notebook import Notebook
from backend.models.thread import Thread
from backend.models.chat import Chat
from backend.models.file import File


class NotebookRepository:
    """
    Handles data access logic for the Notebook entity and its related models.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: str, emoji: str, title: str, date: str,
                     bg_color: str, text_color: str, source_count: int = 0) -> Notebook:
        """Creates a new Notebook object and adds it to the session."""
        notebook = Notebook(
            user_id=user_id, emoji=emoji, title=title, date=date,
            bg_color=bg_color, text_color=text_color, source_count=source_count
        )
        self.session.add(notebook)
        await self.session.flush()
        return notebook

    async def get_by_id(self, notebook_id: str) -> Optional[Notebook]:
        """Retrieves a notebook by its ID."""
        return await self.session.get(Notebook, notebook_id)

    async def list_all(self) -> List[Notebook]:
        """Retrieves all notebooks, ordered by most recent."""
        stmt = select(Notebook).order_by(Notebook.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_by_user_id(self, user_id: str) -> List[Notebook]:
        """Retrieves all notebooks for a specific user."""
        stmt = select(Notebook).where(Notebook.user_id == user_id).order_by(Notebook.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, notebook_id: str, update_data: Dict[str, Any]) -> Optional[Notebook]:
        """Updates a notebook record with the provided data."""
        notebook = await self.get_by_id(notebook_id)
        if notebook:
            for key, value in update_data.items():
                if hasattr(notebook, key) and value is not None:
                    setattr(notebook, key, value)
            await self.session.flush()
        return notebook

    async def delete_by_id(self, notebook_id: str) -> bool:
        """Deletes a notebook by its ID."""
        notebook = await self.get_by_id(notebook_id)
        if notebook:
            await self.session.delete(notebook)
            await self.session.flush()
            return True
        return False

    async def get_by_id_with_threads(self, notebook_id: str) -> Optional[Notebook]:
        """Retrieves a notebook with all its threads eagerly loaded."""
        stmt = select(Notebook).options(selectinload(Notebook.threads)).where(Notebook.id == notebook_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_threads_for_notebook(self, notebook_id: str) -> List[Thread]:
        """Retrieves all threads for a specific notebook."""
        stmt = select(Thread).where(Thread.notebook_id == notebook_id).order_by(Thread.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_chats_for_notebook(self, notebook_id: str) -> List[Chat]:
        """Retrieves all chats for a specific notebook (through threads)."""
        stmt = (
            select(Chat)
            .join(Thread, Chat.thread_id == Thread.thread_id)
            .where(Thread.notebook_id == notebook_id)
            .order_by(Chat.created_at.desc())
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_files_for_notebook(self, notebook_id: str) -> List[File]:
        """Retrieves all files for a specific notebook."""
        # Note: Corrected the File query to join on notebook_id directly, assuming File has it.
        # If File is only related via Thread, the original subquery is also correct. This join is often more efficient.
        stmt = select(File).where(File.notebook_id == notebook_id).order_by(File.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()