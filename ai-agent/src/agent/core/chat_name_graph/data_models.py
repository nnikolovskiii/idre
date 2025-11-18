from typing import Optional, TypedDict
from pydantic import BaseModel, Field

class ChatTitleResponse(BaseModel):
    title: str = Field(..., description="The title of the chat")

class ChatNameGraphState(TypedDict):
    first_message: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    title: Optional[str]