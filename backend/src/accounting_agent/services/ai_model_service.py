from typing import List, Optional, Dict, Any
from uuid import UUID

from sqlalchemy import select
from accounting_agent.models.ai_model import AIModel
from accounting_agent.databases.postgres_db import AsyncPostgreSQLDatabase


class AIModelService:
    """
    Service layer for handling asynchronous business logic related to the AIModel.
    """

    def __init__(self, db: AsyncPostgreSQLDatabase):
        """
        Initializes the service with an async database connection manager.

        Args:
            db (AsyncPostgreSQLDatabase): The database manager instance.
        """
        self.db = db

    async def create_ai_model(self, user_id: str, chat_id: UUID, name: str, type: str) -> AIModel:
        """
        Create a new AI model record in the database.

        Args:
            user_id (str): The ID of the user.
            chat_id (UUID): The UUID of the associated chat.
            name (str): The name of the AI model (e.g., 'gpt-4-turbo').
            type (str): The type of the AI model (e.g., 'llm').

        Returns:
            AIModel: The newly created AIModel object.
        """
        async with self.db.get_session() as session:
            new_ai_model = AIModel(
                user_id=user_id,
                chat_id=chat_id,
                name=name,
                type=type
            )

            session.add(new_ai_model)
            await session.commit()
            await session.refresh(new_ai_model)

            return new_ai_model

    async def get_ai_model_by_id(self, ai_model_id: UUID) -> Optional[AIModel]:
        """
        Get a single AIModel by its unique ID.

        Args:
            ai_model_id (UUID): The UUID of the AIModel to retrieve.

        Returns:
            Optional[AIModel]: The AIModel object if found, otherwise None.
        """
        async with self.db.get_session() as session:
            stmt = select(AIModel).where(AIModel.ai_model_id == ai_model_id)
            result = await session.execute(stmt)
            return result.scalars().first()

    async def get_ai_models_by_chat_id(self, chat_id: UUID) -> List[AIModel]:
        """
        Get all AI models associated with a specific chat.

        Args:
            chat_id (UUID): The UUID of the chat.

        Returns:
            List[AIModel]: A list of AIModel objects for the given chat.
        """
        async with self.db.get_session() as session:
            stmt = select(AIModel).where(AIModel.chat_id == chat_id)
            result = await session.execute(stmt)
            return result.scalars().all()

    async def update_ai_model(self, ai_model_id: UUID, update_data: Dict[str, Any]) -> Optional[AIModel]:
        """
        Updates an existing AIModel's attributes.

        Args:
            ai_model_id (UUID): The UUID of the AIModel to update.
            update_data (Dict[str, Any]): A dictionary of fields to update.

        Returns:
            Optional[AIModel]: The updated AIModel object, or None if not found.
        """
        async with self.db.get_session() as session:
            # First, retrieve the object
            stmt = select(AIModel).where(AIModel.ai_model_id == ai_model_id)
            result = await session.execute(stmt)
            ai_model = result.scalars().first()

            if ai_model:
                # Update attributes from the dictionary
                for key, value in update_data.items():
                    if hasattr(ai_model, key):
                        setattr(ai_model, key, value)

                await session.commit()
                await session.refresh(ai_model)

            return ai_model

    async def delete_ai_model(self, ai_model_id: UUID) -> bool:
        """
        Deletes an AIModel from the database.

        Args:
            ai_model_id (UUID): The UUID of the AIModel to delete.

        Returns:
            bool: True if the model was deleted, False if it was not found.
        """
        async with self.db.get_session() as session:
            # Retrieve the object to be deleted
            stmt = select(AIModel).where(AIModel.ai_model_id == ai_model_id)
            result = await session.execute(stmt)
            ai_model = result.scalars().first()

            if ai_model:
                await session.delete(ai_model)
                await session.commit()
                return True

            return False

    # <<< NEW FUNCTION >>>
    async def get_first_ai_model_by_chat_and_type(
        self, chat_id: UUID, model_type: str
    ) -> Optional[AIModel]:
        """
        Get the first AI model for a given chat that matches a specific type.

        Args:
            chat_id (UUID): The UUID of the chat.
            model_type (str): The type of the AI model to find (e.g., 'llm', 'embedding').

        Returns:
            Optional[AIModel]: The first matching AIModel object if found, otherwise None.
        """
        async with self.db.get_session() as session:
            stmt = (
                select(AIModel)
                .where(AIModel.chat_id == chat_id)
                .where(AIModel.type == model_type)
            )
            result = await session.execute(stmt)
            # .first() efficiently fetches only the first result or None
            return result.scalars().first()