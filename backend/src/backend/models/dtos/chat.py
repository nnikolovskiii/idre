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
    title: Optional[str] = None
    web_search: Optional[bool] = True


class MessageResponse(BaseModel):
    id: str
    content: str
    type: str
    additional_kwargs: Optional[Dict[str, Any]] = None


class SendMessageRequest(BaseModel):
    message: Optional[str] = None
    audio_path: Optional[str] = None
    audio_base64: Optional[str] = None
    light_model: Optional[str] = None
    heavy_model: Optional[str] = None
    file_id : Optional[str] = None
    first_message: Optional[str] = False
    chat_id: Optional[str] = None
    mode: Optional[str] = None
    sub_mode: Optional[str] = None
    generation_context: Optional[Dict[str, Any]] = None


class CreateThreadRequest(BaseModel):
    title: str
    text: Optional[str] = None # Made optional
    audio_path: Optional[str] = None # Added audio_path
    notebook_id: Optional[str] = None
    web_search: Optional[bool] = True
    mode: Optional[str] = None
    sub_mode: Optional[str] = None


class UpdateAIModelsRequest(BaseModel):
    new_model_name: str


class AIModelResponse(BaseModel):
    light_model: str
    heavy_model: str

class UpdateWebSearchRequest(BaseModel):
    """Request model for updating the web search setting of a chat."""
    enabled: bool