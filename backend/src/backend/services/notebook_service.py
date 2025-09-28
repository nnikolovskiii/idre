# backend/services/notebook_service.py

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.notebook import Notebook
from backend.models.thread import Thread
from backend.models.chat import Chat
from backend.models.file import File
from backend.repositories.notebook_repository import NotebookRepository
from backend.repositories.thread_repository import ThreadRepository


class NotebookService:
    """
    Orchestrates business logic for Notebooks and their related entities.
    """
    def __init__(
        self,
        session: AsyncSession,
        notebook_repository: NotebookRepository,
        thread_repository: ThreadRepository
    ):
        self.session = session
        self.repo = notebook_repository
        self.thread_repo = thread_repository

    async def create_notebook(self, user_id: str, emoji: str, title: str,
                              date: str, bg_color: str, text_color: str,
                              source_count: int = 0) -> Notebook:
        """Creates a notebook and commits the transaction."""
        notebook = await self.repo.create(
            user_id=user_id, emoji=emoji, title=title, date=date,
            bg_color=bg_color, text_color=text_color, source_count=source_count
        )
        await self.session.commit()
        await self.session.refresh(notebook)
        return notebook

    async def update_notebook(self, notebook_id: str, update_data: Dict[str, Any]) -> Optional[Notebook]:
        """Updates a notebook and commits the transaction."""
        notebook = await self.repo.update(notebook_id, update_data)
        if notebook:
            await self.session.commit()
            await self.session.refresh(notebook)
        return notebook

    async def delete_notebook(self, notebook_id: str) -> bool:
        """Deletes a notebook and commits the transaction."""
        was_deleted = await self.repo.delete_by_id(notebook_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def create_thread_for_notebook(self, notebook_id: str, thread_id: str) -> Thread:
        """
        Creates a new thread for a notebook using the ThreadRepository
        and commits the transaction.
        """
        # The service orchestrates by using the appropriate repository.
        thread = await self.thread_repo.create(
            thread_id=thread_id,
            notebook_id=notebook_id
        )
        await self.session.commit()
        await self.session.refresh(thread)
        return thread

    # --- Read methods are simple pass-throughs to the repository ---

    async def get_notebook_by_id(self, notebook_id: str) -> Optional[Notebook]:
        return await self.repo.get_by_id(notebook_id)

    async def get_all_notebooks(self) -> List[Notebook]:
        return await self.repo.list_all()

    async def get_notebooks_for_user(self, user_id: str) -> List[Notebook]:
        return await self.repo.list_by_user_id(user_id)

    async def get_notebook_with_threads(self, notebook_id: str) -> Optional[Notebook]:
        return await self.repo.get_by_id_with_threads(notebook_id)

    async def get_threads_for_notebook(self, notebook_id: str) -> List[Thread]:
        return await self.repo.list_threads_for_notebook(notebook_id)

    async def get_chats_for_notebook(self, notebook_id: str) -> List[Chat]:
        return await self.repo.list_chats_for_notebook(notebook_id)

    async def get_files_for_notebook(self, notebook_id: str) -> List[File]:
        return await self.repo.list_files_for_notebook(notebook_id)