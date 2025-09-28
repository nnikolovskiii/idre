# backend/services/notebook_model_service.py

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.notebook_model import NotebookModel
from backend.repositories.notebook_model_repository import NotebookModelRepository


class NotebookModelService:
    """
    Orchestrates business logic for NotebookModel entities.
    """
    def __init__(
        self,
        session: AsyncSession,
        notebook_model_repository: NotebookModelRepository
    ):
        self.session = session
        self.repo = notebook_model_repository

    async def create_notebook_model(self, user_id: str, notebook_id: str, generative_model_id: str) -> NotebookModel:
        """Creates a notebook model and commits the transaction."""
        notebook_model = await self.repo.create(
            user_id=user_id,
            notebook_id=notebook_id,
            generative_model_id=generative_model_id
        )
        await self.session.commit()
        await self.session.refresh(notebook_model)
        return notebook_model

    async def update_notebook_model(self, notebook_model_id: str, update_data: Dict[str, Any]) -> Optional[NotebookModel]:
        """Updates a notebook model and commits the transaction."""
        notebook_model = await self.repo.update(notebook_model_id, update_data)
        if notebook_model:
            await self.session.commit()
            await self.session.refresh(notebook_model)
        return notebook_model

    async def delete_notebook_model(self, notebook_model_id: str) -> bool:
        """Deletes a notebook model and commits the transaction."""
        was_deleted = await self.repo.delete_by_id(notebook_model_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    # --- Read methods are simple pass-throughs to the repository ---

    async def get_notebook_model_by_id(self, notebook_model_id: str) -> Optional[NotebookModel]:
        return await self.repo.get_by_id(notebook_model_id)

    async def get_notebook_model_by_id_and_type(self, notebook_id: str, model_type: str) -> Optional[NotebookModel]:
        """Gets a notebook model by notebook_id and model type (light or heavy)."""
        return await self.repo.get_by_notebook_id_and_type(notebook_id, model_type)

    async def get_notebook_models_by_notebook_id(self, notebook_id: str) -> List[NotebookModel]:
        return await self.repo.list_by_notebook_id(notebook_id)

    async def get_notebook_models_by_user_id(self, user_id: str) -> List[NotebookModel]:
        return await self.repo.list_by_user_id(user_id)
