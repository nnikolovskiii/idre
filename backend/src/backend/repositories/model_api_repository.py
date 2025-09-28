# backend/repositories/model_api_repository.py

from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.model_api import ModelApi


class ModelApiRepository:
    """
    Handles data access logic for the ModelApi entity.
    This repository operates on encrypted API key values.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_user_id(self, user_id: str) -> Optional[ModelApi]:
        """Retrieves a ModelApi record for a specific user."""
        stmt = select(ModelApi).where(ModelApi.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def upsert(self, user_id: str, encrypted_value: str) -> ModelApi:
        """
        Creates a new ModelApi record or updates an existing one for a user.
        Does not commit the transaction.
        """
        model_api = await self.get_by_user_id(user_id)

        if model_api:
            # Update existing record
            model_api.value = encrypted_value
        else:
            # Create a new record
            model_api = ModelApi(
                user_id=user_id,
                value=encrypted_value
            )
            self.session.add(model_api)

        await self.session.flush()
        return model_api

    async def delete_by_user_id(self, user_id: str) -> bool:
        """
        Deletes the API key record for a given user.
        Does not commit the transaction. Returns True on success.
        """
        model_api = await self.get_by_user_id(user_id)

        if model_api:
            await self.session.delete(model_api)
            await self.session.flush()
            return True

        return False