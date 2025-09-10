from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select
# Assuming your models and db setup are in these locations
from accounting_agent.databases.postgres_db import AsyncPostgreSQLDatabase
from accounting_agent.models.defaul_ai_model import DefaultAIModel


class DefaultAIModelService:
    """
    Service layer for handling business logic for DefaultAIModel settings.
    """

    def __init__(self, db: AsyncPostgreSQLDatabase):
        """
        Initializes the service with an async database connection manager.

        Args:
            db (AsyncPostgreSQLDatabase): The database manager instance.
        """
        self.db = db

    async def get_name_by_type(self, model_type: str) -> Optional[str]:
        """
        Gets the default model name for a given model type.

        Args:
            model_type (str): The type of the model (e.g., 'llm').

        Returns:
            Optional[str]: The name of the default model, or None if not found.
        """
        async with self.db.get_session() as session:
            # Select only the 'name' column for efficiency
            stmt = select(DefaultAIModel.name).where(DefaultAIModel.type == model_type)
            result = await session.execute(stmt)
            return result.scalars().first()

    async def create_default_ai_model(self, type: str, name: str) -> DefaultAIModel:
        """
        Creates a new default AI model setting.

        Args:
            type (str): The type of the model (e.g., 'llm').
            name (str): The default name for this type (e.g., 'gpt-4-turbo').

        Returns:
            DefaultAIModel: The created DefaultAIModel object.
        """
        async with self.db.get_session() as session:
            new_default = DefaultAIModel(type=type, name=name)
            session.add(new_default)
            await session.commit()
            await session.refresh(new_default)
            return new_default

    async def get_all_default_ai_models(self) -> List[DefaultAIModel]:
        """
        Retrieves all default AI model settings.

        Returns:
            List[DefaultAIModel]: A list of all default settings.
        """
        async with self.db.get_session() as session:
            stmt = select(DefaultAIModel)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def update_default_ai_model(self, model_type: str, update_data: Dict[str, Any]) -> Optional[DefaultAIModel]:
        """
        Updates an existing default setting, finding it by its unique type.

        Args:
            model_type (str): The unique type of the setting to update.
            update_data (Dict[str, Any]): A dictionary of fields to update (e.g., {"name": "new-name"}).

        Returns:
            Optional[DefaultAIModel]: The updated object, or None if not found.
        """
        async with self.db.get_session() as session:
            stmt = select(DefaultAIModel).where(DefaultAIModel.type == model_type)
            result = await session.execute(stmt)
            default_model = result.scalars().first()

            if default_model:
                for key, value in update_data.items():
                    if hasattr(default_model, key):
                        setattr(default_model, key, value)
                await session.commit()
                await session.refresh(default_model)

            return default_model

    async def delete_default_ai_model(self, model_type: str) -> bool:
        """
        Deletes a default setting by its unique type.

        Args:
            model_type (str): The type of the setting to delete.

        Returns:
            bool: True if deleted, False if not found.
        """
        async with self.db.get_session() as session:
            stmt = select(DefaultAIModel).where(DefaultAIModel.type == model_type)
            result = await session.execute(stmt)
            default_model = result.scalars().first()

            if default_model:
                await session.delete(default_model)
                await session.commit()
                return True

            return False