# backend/services/chat_model_service.py

from typing import List, Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.chat_model import ChatModel
from backend.models.dtos.chat_model_dtos import ChatModelUpdate
from backend.repositories.chat_model_repository import ChatModelRepository
from backend.services.generative_model_service import GenerativeModelService


class ChatModelService:
    """
    Orchestrates business logic for ChatModel entities.
    """
    def __init__(
        self,
        session: AsyncSession,
        chat_model_repository: ChatModelRepository,
        generative_model_service: GenerativeModelService
    ):
        self.session = session
        self.repo = chat_model_repository
        self.generative_model_service = generative_model_service

    async def create_ai_model(self, user_id: str, chat_id: str, generative_model_id: str) -> ChatModel:
        """Creates a chat model and commits the transaction."""
        chat_model = await self.repo.create(
            user_id=user_id,
            chat_id=chat_id,
            generative_model_id=generative_model_id
        )
        await self.session.commit()
        await self.session.refresh(chat_model)
        return chat_model

    async def update_chat_model_with_generative_model(self, chat_model_id: str, model_update: ChatModelUpdate) -> Optional[ChatModel]:
        """Updates a chat model and commits the transaction."""
        gen_model = await self.generative_model_service.get_model(model_update.generative_model_name,
                                                                  model_update.generative_model_type)
        update_data = {"generative_model_id": gen_model.id}
        chat_model = await self.repo.update(chat_model_id, update_data)
        if chat_model:
            await self.session.commit()
            await self.session.refresh(chat_model)
        return chat_model

    async def update_chat_model(self, chat_model_id: str, update_data: Dict[str, Any]) -> Optional[ChatModel]:
        """Updates a chat model and commits the transaction."""
        chat_model = await self.repo.update(chat_model_id, update_data)
        if chat_model:
            await self.session.commit()
            await self.session.refresh(chat_model)
        return chat_model

    async def delete_chat_model(self, chat_model_id: str) -> bool:
        """Deletes a chat model and commits the transaction."""
        was_deleted = await self.repo.delete_by_id(chat_model_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    async def delete_chat_model_by_chat_id(self, chat_id: str) -> bool:
        """Deletes a chat model by chat_id and commits the transaction."""
        was_deleted = await self.repo.delete_by_chat_id(chat_id)
        if was_deleted:
            await self.session.commit()
        return was_deleted

    # --- Read methods are simple pass-throughs to the repository ---

    async def get_chat_model_by_id(self, chat_model_id: str) -> Optional[ChatModel]:
        return await self.repo.get_by_id(chat_model_id)

    async def get_chat_model_by_chat_id(self, chat_id: str) -> Optional[ChatModel]:
        return await self.repo.get_by_chat_id(chat_id)

    async def get_chat_model_by_chat_id_and_type(self, chat_id: str, model_type: str) -> Optional[ChatModel]:
        """Gets a chat model by chat_id and model type (light or heavy)."""
        return await self.repo.get_by_chat_id_and_type(chat_id, model_type)

    async def get_chat_models_by_chat_id(self, chat_id: str) -> List[ChatModel]:
        return await self.repo.list_by_chat_id(chat_id)

    async def get_chat_models_by_user_id(self, user_id: str) -> List[ChatModel]:
        return await self.repo.list_by_user_id(user_id)
