from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.generative_model import GenerativeModel
from backend.models.notebook_model import NotebookModel


class NotebookModelRepository:
    """
    Handles data access logic for the NotebookModel entity.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: str, notebook_id: str, generative_model_id: str) -> NotebookModel:
        """Creates a new NotebookModel object and adds it to the session."""
        notebook_model = NotebookModel(
            user_id=user_id,
            notebook_id=notebook_id,
            generative_model_id=generative_model_id
        )
        self.session.add(notebook_model)
        await self.session.flush()
        return notebook_model

    async def get_by_id(self, notebook_model_id: str) -> Optional[NotebookModel]:
        """Retrieves a notebook model by its ID."""
        stmt = select(NotebookModel).options(
            selectinload(NotebookModel.model)
        ).where(NotebookModel.id == notebook_model_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_notebook_id_and_type(self, notebook_id: str, model_type: str) -> Optional[NotebookModel]:
        """Retrieves a notebook model by notebook_id and model type."""
        stmt = (
            select(NotebookModel)
            .options(selectinload(NotebookModel.model))
            .join(NotebookModel.model)
            .where(NotebookModel.notebook_id == notebook_id)
            .where(GenerativeModel.type == model_type)  # Direct reference to the joined table
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_notebook_id(self, notebook_id: str) -> List[NotebookModel]:
        """Retrieves all notebook models for a specific notebook."""
        stmt = (
            select(NotebookModel)
            .where(NotebookModel.notebook_id == notebook_id)
            .options(selectinload(NotebookModel.model))  # Eagerly load the relationship
        )
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_by_user_id(self, user_id: str) -> List[NotebookModel]:
        """Retrieves all notebook models for a specific user."""
        stmt = select(NotebookModel).where(NotebookModel.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, notebook_model_id: str, update_data: Dict[str, Any]) -> Optional[NotebookModel]:
        """Updates a notebook model record with the provided data."""
        notebook_model = await self.get_by_id(notebook_model_id)
        if notebook_model:
            for key, value in update_data.items():
                if hasattr(notebook_model, key) and value is not None:
                    setattr(notebook_model, key, value)
            await self.session.flush()
        return notebook_model

    async def delete_by_id(self, notebook_model_id: str) -> bool:
        """Deletes a notebook model by its ID."""
        notebook_model = await self.get_by_id(notebook_model_id)
        if notebook_model:
            await self.session.delete(notebook_model)
            await self.session.flush()
            return True
        return False
