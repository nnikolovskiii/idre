from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from backend.models.notebook import Notebook
from backend.models.thread import Thread
from backend.models.chat import Chat
from backend.models.file import File
from typing import List, Optional
import uuid


class NotebookService:
    async def create_notebook(self, session: AsyncSession, user_id: str, emoji: str, title: str,
                             date: str, bg_color: str, text_color: str,
                             source_count: int = 0) -> Notebook:
        """
        Create and save a notebook record to the database.

        Args:
            session: Database session
            user_id: ID of the user creating the notebook
            emoji: Notebook emoji icon
            title: Notebook title
            date: Creation date
            bg_color: Background color
            text_color: Text color
            source_count: Number of sources (default: 0)

        Returns:
            The created Notebook object
        """
        notebook_record = Notebook(
            user_id=user_id,
            emoji=emoji,
            title=title,
            date=date,
            bg_color=bg_color,
            text_color=text_color,
            source_count=source_count
        )

        session.add(notebook_record)
        await session.commit()
        await session.refresh(notebook_record)

        return notebook_record

    async def get_notebook_by_id(self, session: AsyncSession, notebook_id: str) -> Optional[Notebook]:
        """
        Retrieve a notebook by its ID.

        Args:
            session: Database session
            notebook_id: UUID of the notebook

        Returns:
            Notebook object if found, None otherwise
        """
        result = await session.execute(
            select(Notebook).where(Notebook.id == notebook_id)
        )
        return result.scalar_one_or_none()

    async def get_all_notebooks(self, session: AsyncSession) -> List[Notebook]:
        """
        Retrieve all notebooks.

        Args:
            session: Database session

        Returns:
            List of all Notebook objects
        """
        result = await session.execute(
            select(Notebook).order_by(Notebook.created_at.desc())
        )
        return result.scalars().all()

    async def get_notebooks_for_user(self, session: AsyncSession, user_id: str) -> List[Notebook]:
        """
        Retrieve all notebooks for a specific user.

        Args:
            session: Database session
            user_id: ID of the user to get notebooks for

        Returns:
            List of Notebook objects for the user
        """
        result = await session.execute(
            select(Notebook).where(Notebook.user_id == user_id).order_by(Notebook.created_at.desc())
        )
        return result.scalars().all()

    async def update_notebook(self, session: AsyncSession, notebook_id: str,
                             emoji: Optional[str] = None, title: Optional[str] = None,
                             date: Optional[str] = None, bg_color: Optional[str] = None,
                             text_color: Optional[str] = None,
                             source_count: Optional[int] = None) -> Optional[Notebook]:
        """
        Update a notebook record.

        Args:
            session: Database session
            notebook_id: UUID of the notebook to update
            emoji: New emoji (optional)
            title: New title (optional)
            date: New date (optional)
            bg_color: New background color (optional)
            text_color: New text color (optional)
            source_count: New source count (optional)

        Returns:
            Updated Notebook object if found, None otherwise
        """
        notebook = await self.get_notebook_by_id(session, notebook_id)
        if not notebook:
            return None

        # Update fields if provided
        if emoji is not None:
            notebook.emoji = emoji
        if title is not None:
            notebook.title = title
        if date is not None:
            notebook.date = date
        if bg_color is not None:
            notebook.bg_color = bg_color
        if text_color is not None:
            notebook.text_color = text_color
        if source_count is not None:
            notebook.source_count = source_count

        await session.commit()
        await session.refresh(notebook)

        return notebook

    async def delete_notebook(self, session: AsyncSession, notebook_id: str) -> bool:
        """
        Delete a notebook by its ID.

        Args:
            session: Database session
            notebook_id: UUID of the notebook to delete

        Returns:
            True if deleted successfully, False if notebook not found
        """
        notebook = await self.get_notebook_by_id(session, notebook_id)
        if not notebook:
            return False

        await session.delete(notebook)
        await session.commit()

        return True

    async def create_thread_for_notebook(self, session: AsyncSession, notebook_id: str) -> Thread:
        """
        Create a new thread for a notebook.

        Args:
            session: Database session
            notebook_id: UUID of the notebook to create thread for

        Returns:
            The created Thread object
        """
        thread_record = Thread(notebook_id=notebook_id)
        session.add(thread_record)
        await session.commit()
        await session.refresh(thread_record)

        return thread_record

    async def get_notebook_with_threads(self, session: AsyncSession, notebook_id: str) -> Optional[Notebook]:
        """
        Retrieve a notebook with all its threads loaded.

        Args:
            session: Database session
            notebook_id: UUID of the notebook

        Returns:
            Notebook object with threads loaded if found, None otherwise
        """
        result = await session.execute(
            select(Notebook)
            .options(selectinload(Notebook.threads))
            .where(Notebook.id == notebook_id)
        )
        return result.scalar_one_or_none()

    async def get_threads_for_notebook(self, session: AsyncSession, notebook_id: str) -> List[Thread]:
        """
        Retrieve all threads for a specific notebook.

        Args:
            session: Database session
            notebook_id: UUID of the notebook

        Returns:
            List of Thread objects for the notebook
        """
        result = await session.execute(
            select(Thread).where(Thread.notebook_id == notebook_id).order_by(Thread.created_at.desc())
        )
        return result.scalars().all()

    async def get_chats_for_notebook(self, session: AsyncSession, notebook_id: str) -> List[Chat]:
        """
        Retrieve all chats for a specific notebook (through threads).

        Args:
            session: Database session
            notebook_id: UUID of the notebook

        Returns:
            List of Chat objects for the notebook
        """
        result = await session.execute(
            select(Chat)
            .join(Thread)
            .where(Thread.notebook_id == notebook_id)
            .order_by(Chat.created_at.desc())
        )
        return result.scalars().all()

    async def get_files_for_notebook(self, session: AsyncSession, notebook_id: str) -> List[File]:
        """
        Retrieve all files for a specific notebook (through threads).

        Args:
            session: Database session
            notebook_id: UUID of the notebook

        Returns:
            List of File objects for the notebook
        """
        result = await session.execute(
            select(File)
            .where(File.thread_id.in_(
                select(Thread.thread_id).where(Thread.notebook_id == notebook_id)
            ))
            .order_by(File.created_at.desc())
        )
        return result.scalars().all()
