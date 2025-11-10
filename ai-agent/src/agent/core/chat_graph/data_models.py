from __future__ import annotations
from pydantic import BaseModel, Field
from typing import Annotated, Optional, TypedDict
from langchain_core.messages import BaseMessage
from agent.core.messages_utils import manage_messages


class RestructuredText(BaseModel):
    """Data model for cleaned and restructured text from an audio transcript."""
    text: str = Field(..., description="Restructured text with complete sentences.")


class Conclusion(BaseModel):
    """Data model for a concise conclusion of a larger text."""
    text: str = Field(description="Conclusion text for text-to-speech generation.")


class ChatGraphState(TypedDict):
    # Chat-specific fields
    messages: Annotated[list[BaseMessage], manage_messages]
    light_model: str
    heavy_model: str

    # Inputs - at least one must be provided
    text_input: Optional[str]
    audio_path: Optional[str]
    files_contents: Optional[str]
    web_search: Optional[bool]
    mode: Optional[str]

    # Intermediate and final processed data
    enhanced_transcript: Optional[str]
    processed_input: str
    api_key: str
    light_model: str
    heavy_model: str

    # Inputs - at least one must be provided
    text_input: Optional[str]
    audio_path: Optional[str]

    # Intermediate and final processed data
    enhanced_transcript: Optional[str]
    processed_input: str
    api_key: str
