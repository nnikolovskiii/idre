from __future__ import annotations
from typing import Annotated, Optional, TypedDict
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field
from agent.core.messages_utils import manage_messages


class BrainstormRestructuredText(BaseModel):
    text: str = Field(..., description="Restructured text")


class BrainstormGraphState(TypedDict):
    messages: Annotated[list[BaseMessage], manage_messages]

    # Inputs
    text_input: Optional[str]
    audio_path: Optional[str]
    files_contents: Optional[str]
    web_search: Optional[bool]

    # Config
    api_key: Optional[str]
    light_model: Optional[str]
    heavy_model: Optional[str]

    # Processing
    processed_input: Optional[str]
    enhanced_transcript: Optional[str]