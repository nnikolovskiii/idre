import uuid
from typing import Optional
from sqlalchemy import select

from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from .fernet_service import FernetService
from ..models.model_api import ModelApi


class ModelApiService:
    """
    Service class for managing ModelApi records in the database.
    It handles the encryption of API keys before saving and decryption upon retrieval.
    """

    def __init__(self, db: AsyncPostgreSQLDatabase, fernet_service: FernetService):
        """
        Initializes the service with a database connection manager and a fernet service.

        Args:
            db: The async database connection manager.
            fernet_service: The service responsible for encryption and decryption.
        """
        self.db = db
        self.fernet_service = fernet_service

    async def upsert_api_key(self, user_id: str, raw_api_key: str) -> ModelApi:
        """
        Creates or updates an API key for a given user.
        The provided API key is encrypted before being stored.

        Args:
            user_id: The ID of the user.
            raw_api_key: The plaintext API key to be stored.

        Returns:
            The created or updated ModelApi instance.
        """
        # Encrypt the API key value before doing anything with the database
        encrypted_value = self.fernet_service.encrypt_data(raw_api_key)

        async with self.db.get_session() as session:
            # Check if an entry already exists for this user
            stmt = select(ModelApi).where(ModelApi.user_id == user_id)
            result = await session.execute(stmt)
            model_api = result.scalars().first()

            if model_api:
                # Update the existing record
                model_api.value = encrypted_value
            else:
                # Create a new record
                model_api = ModelApi(
                    user_id=user_id,
                    value=encrypted_value
                )
                session.add(model_api)

            await session.commit()
            await session.refresh(model_api)
            return model_api

    async def get_api_key_by_user_id(self, user_id: str) -> Optional[ModelApi]:
        """
        Retrieves the ModelApi record for a specific user.
        Note: The 'value' attribute of the returned object is still encrypted.

        Args:
            user_id: The ID of the user.

        Returns:
            The ModelApi instance if found, otherwise None.
        """
        async with self.db.get_session() as session:
            stmt = select(ModelApi).where(ModelApi.user_id == user_id)
            result = await session.execute(stmt)
            return result.scalars().first()

    # async def get_decrypted_api_key(self, user_id: str) -> Optional[str]:
    #     """
    #     Retrieves and decrypts the API key for a given user.
    #     This is the primary method to get the usable, plaintext API key.
    #
    #     Args:
    #         user_id: The ID of the user.
    #
    #     Returns:
    #         The decrypted API key as a string if found, otherwise None.
    #     """
    #     model_api = await self.get_api_key_by_user_id(user_id)
    #
    #     if not model_api:
    #         return None
    #
    #     # Decrypt the value on demand
    #     try:
    #         decrypted_value = self.fernet_service.decrypt_data(model_api.value)
    #         return decrypted_value
    #     except Exception as e:
    #         # Handle potential decryption errors (e.g., key mismatch, invalid token)
    #         print(f"Error decrypting data for user {user_id}: {e}")
    #         return None

    async def delete_api_key(self, user_id: str) -> bool:
        """
        Deletes the API key record for a given user.

        Args:
            user_id: The ID of the user.

        Returns:
            True if the record was deleted, False if it was not found.
        """
        async with self.db.get_session() as session:
            stmt = select(ModelApi).where(ModelApi.user_id == user_id)
            result = await session.execute(stmt)
            model_api = result.scalars().first()

            if model_api:
                await session.delete(model_api)
                await session.commit()
                return True

            return False
