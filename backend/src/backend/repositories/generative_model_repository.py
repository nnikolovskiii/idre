from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.generative_model import GenerativeModel


class GenerativeModelRepository:
    """
    Handles data access logic for the GenerativeModel entity.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, name: str, type: str) -> GenerativeModel:
        """Creates a new GenerativeModel object and adds it to the session."""
        generative_model = GenerativeModel(
            name=name,
            type=type
        )
        self.session.add(generative_model)
        await self.session.flush()
        return generative_model

    async def get_by_id(self, model_id: str) -> Optional[GenerativeModel]:
        """Retrieves a generative model by its ID."""
        return await self.session.get(GenerativeModel, model_id)

    async def get_by_name(self, name: str) -> Optional[GenerativeModel]:
        """Retrieves a generative model by its name."""
        stmt = select(GenerativeModel).where(GenerativeModel.name == name)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_name_and_type(self, name: str, model_type: str) -> Optional[GenerativeModel]:
        """Retrieves a generative model by name and type."""
        stmt = select(GenerativeModel).where(
            GenerativeModel.name == name,
            GenerativeModel.type == model_type
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_type(self, model_type: str) -> List[GenerativeModel]:
        """Retrieves all generative models of a specific type."""
        stmt = select(GenerativeModel).where(GenerativeModel.type == model_type)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_all(self) -> List[GenerativeModel]:
        """Retrieves all generative models."""
        stmt = select(GenerativeModel)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, model_id: str, update_data: Dict[str, Any]) -> Optional[GenerativeModel]:
        """Updates a generative model record with the provided data."""
        model = await self.get_by_id(model_id)
        if model:
            for key, value in update_data.items():
                if hasattr(model, key) and value is not None:
                    setattr(model, key, value)
            await self.session.flush()
        return model

    async def delete_by_id(self, model_id: str) -> bool:
        """Deletes a generative model by its ID."""
        model = await self.get_by_id(model_id)
        if model:
            await self.session.delete(model)
            await self.session.flush()
            return True
        return False

    async def exists(self, model_id: str) -> bool:
        """Checks if a generative model with the given ID exists."""
        model = await self.get_by_id(model_id)
        return model is not None

    