import uuid

from sqlalchemy import (
    Column,
    Text,
    ForeignKey,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, Mapped

from backend.databases.postgres_db import Base
from backend.models.generative_model import GenerativeModel


class ChatModel(Base):
    """
    Represents the specific generative model used for a single chat session.
    This is a historical record.
    """
    __tablename__ = 'chat_models'

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(Text, nullable=False)
    chat_id = Column(UUID(as_uuid=True), ForeignKey('chat.chat_id', ondelete="CASCADE"), nullable=False)

    generative_model_id = Column(UUID(as_uuid=True), ForeignKey('generative_models.id'), nullable=False)

    model: Mapped[GenerativeModel] = relationship("GenerativeModel")
    chat: Mapped["Chat"] = relationship("Chat", back_populates="models")

    def __repr__(self):
        return f"<ChatModel(id={self.id}, chat_id='{self.chat_id}')>"