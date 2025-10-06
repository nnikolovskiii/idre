import uuid
from datetime import datetime
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from backend.models.chat import Chat
from backend.models.chat_model import ChatModel


class ChatRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_thread_id(self, thread_id: str) -> Optional[Chat]:
        """Gets a specific chat by its associated thread_id."""
        try:
            thread_uuid = uuid.UUID(thread_id)
        except ValueError:
            return None
        stmt = select(Chat).options(
            selectinload(Chat.models).selectinload(ChatModel.model)
        ).where(Chat.thread_id == thread_uuid)
        result = await self.session.execute(stmt)
        return result.scalars().first()

    async def list_by_user_id(self, user_id: str, notebook_id: Optional[str] = None) -> List[Chat]:
        """Gets all chats for a user, optionally filtered by notebook."""
        stmt = select(Chat).where(Chat.user_id == user_id)
        if notebook_id:
            stmt = stmt.where(Chat.notebook_id == notebook_id)
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def create(
        self, user_id: str, thread_id: str, notebook_id: Optional[str] = None
    ) -> Chat:
        """
        Creates a new Chat object and adds it to the session.
        Note: This method does NOT commit.
        """
        new_chat = Chat(
            user_id=user_id,
            thread_id=uuid.UUID(thread_id),
            notebook_id=notebook_id,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        self.session.add(new_chat)
        await self.session.flush()
        return new_chat

    async def delete_by_id(self, chat_id: str) -> bool:
        """
        Deletes a chat by its ID. Returns True on success.
        Note: This method does NOT commit.
        """
        try:
            chat_uuid = uuid.UUID(chat_id)
        except ValueError:
            return False

        chat = await self.session.get(Chat, chat_uuid)
        if chat:
            await self.session.delete(chat)
            await self.session.flush()
            return True
        return False