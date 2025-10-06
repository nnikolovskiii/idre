from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.generative_model import GenerativeModel
from backend.repositories.generative_model_repository import GenerativeModelRepository


class GenerativeModelService:
    """
    Orchestrates business logic for GenerativeModel entities.
    """

    def __init__(self, session: AsyncSession, generative_model_repository: GenerativeModelRepository):
        self.session = session
        self.repo = generative_model_repository

    async def create_model(self, name: str, model_type: str, is_open_access: bool = True) -> GenerativeModel:
        """Creates a generative model and commits the transaction."""
        generative_model = await self.repo.create(
            name=name,
            type=model_type,
            is_open_access=is_open_access
        )
        await self.session.commit()
        await self.session.refresh(generative_model)
        return generative_model

    async def update_model(self, model_id: str, update_data: Dict[str, Any]) -> Optional[GenerativeModel]:
        """Updates a generative model and commits the transaction."""
        model = await self.repo.update(model_id, update_data)
        if model:
            await self.session.commit()
            await self.session.refresh(model)
        return model

    async def update_model_active_status(self, model_id: str, is_active: bool) -> Optional[GenerativeModel]:
        """Updates a generative model's active status and commits the transaction."""
        model = await self.repo.update_active_status(model_id, is_active)
        if model:
            await self.session.commit()
            await self.session.refresh(model)
        return model

    async def delete_model(self, model_id: str) -> bool:
        """Deletes a generative model and commits the transaction."""
        was_deleted = await self.repo.delete_by_id(model_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def get_model_by_id(self, model_id: str) -> Optional[GenerativeModel]:
        """Gets a generative model by ID."""
        return await self.repo.get_by_id(model_id)

    async def get_model_by_name(self, name: str) -> Optional[GenerativeModel]:
        """Gets a generative model by name."""
        return await self.repo.get_by_name(name)

    async def get_model(self, name: str, model_type: str) -> GenerativeModel:
        """Gets a generative model by name and type. This is used by notebook_model_service."""
        model = await self.repo.get_by_name_and_type(name, model_type)
        if not model:
            raise ValueError(f"Model '{name}' of type '{model_type}' not found")
        return model

    async def get_models_by_type(self, model_type: str) -> List[GenerativeModel]:
        """Gets all generative models of a specific type."""
        return await self.repo.get_by_type(model_type)

    async def get_all_models(self) -> List[GenerativeModel]:
        """Gets all generative models."""
        return await self.repo.list_all()

    async def model_exists(self, model_id: str) -> bool:
        """Checks if a generative model exists."""
        return await self.repo.exists(model_id)

    async def activate_model(self, model_id: str) -> Optional[GenerativeModel]:
        """Activates a generative model."""
        return await self.update_model_active_status(model_id, True)

    async def deactivate_model(self, model_id: str) -> Optional[GenerativeModel]:
        """Deactivates a generative model."""
        return await self.update_model_active_status(model_id, False)
