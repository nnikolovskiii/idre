from datetime import datetime
from typing import Optional, Dict, Any

from pydantic import BaseModel


class ChatResponse(BaseModel):
    chat_id: Optional[str] = None
    user_id: Optional[str] = None
    thread_id: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    notebook_id: Optional[str] = None


class MessageResponse(BaseModel):
    id: str
    content: str
    type: str
    additional_kwargs: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    message: Optional[str] = None
    audio_path: Optional[str] = None
    light_model: Optional[str] = None
    heavy_model: Optional[str] = None


class CreateThreadRequest(BaseModel):
    title: str
    notebook_id: Optional[str] = None


class UpdateAIModelsRequest(BaseModel):
    new_model_name: str


class AIModelResponse(BaseModel):
    light_model: str
    heavy_model: str