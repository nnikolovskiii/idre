from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.chat_model import ChatModel


class ChatModelRepository:
    """
    Handles data access logic for the ChatModel entity.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: str, chat_id: str, generative_model_id: str) -> ChatModel:
        """Creates a new ChatModel object and adds it to the session."""
        chat_model = ChatModel(
            user_id=user_id,
            chat_id=chat_id,
            generative_model_id=generative_model_id
        )
        self.session.add(chat_model)
        await self.session.flush()
        return chat_model

    async def get_by_id(self, chat_model_id: str) -> Optional[ChatModel]:
        """Retrieves a chat model by its ID."""
        stmt = select(ChatModel).options(
            selectinload(ChatModel.model)
        ).where(ChatModel.id == chat_model_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_chat_id(self, chat_id: str) -> Optional[ChatModel]:
        """Retrieves a chat model by chat_id."""
        stmt = select(ChatModel).options(
            selectinload(ChatModel.model)
        ).where(ChatModel.chat_id == chat_id)
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def get_by_chat_id_and_type(self, chat_id: str, model_type: str) -> Optional[ChatModel]:
        """Retrieves a chat model by chat_id and model type."""
        stmt = (
            select(ChatModel)
            .options(selectinload(ChatModel.model))
            .join(ChatModel.model)
            .where(ChatModel.chat_id == chat_id)
            .where(ChatModel.model.has(type=model_type))
        )
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_chat_id(self, chat_id: str) -> List[ChatModel]:
        """Retrieves all chat models for a specific chat."""
        stmt = select(ChatModel).options(
            selectinload(ChatModel.model)
        ).where(ChatModel.chat_id == chat_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def list_by_user_id(self, user_id: str) -> List[ChatModel]:
        """Retrieves all chat models for a specific user."""
        stmt = select(ChatModel).options(
            selectinload(ChatModel.model)
        ).where(ChatModel.user_id == user_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, chat_model_id: str, update_data: Dict[str, Any]) -> Optional[ChatModel]:
        """Updates a chat model record with the provided data."""
        chat_model = await self.get_by_id(chat_model_id)
        if chat_model:
            for key, value in update_data.items():
                if hasattr(chat_model, key) and value is not None:
                    setattr(chat_model, key, value)
            await self.session.flush()
        return chat_model

    async def delete_by_id(self, chat_model_id: str) -> bool:
        """Deletes a chat model by its ID."""
        chat_model = await self.get_by_id(chat_model_id)
        if chat_model:
            await self.session.delete(chat_model)
            await self.session.flush()
            return True
        return False

    async def delete_by_chat_id(self, chat_id: str) -> bool:
        """Deletes a chat model by chat_id."""
        chat_model = await self.get_by_chat_id(chat_id)
        if chat_model:
            await self.session.delete(chat_model)
            await self.session.flush()
            return True
        return False
