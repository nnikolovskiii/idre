from __future__ import annotations
from typing import Optional, Annotated, TypedDict
from langchain_core.messages import BaseMessage

from agent.core.state import manage_messages


class ChatGraphState(TypedDict):
    """
    Represents the state of our graph, handling text, audio, or both.

    Attributes:
        messages: The list of messages in the conversation.
        ai_model: The AI model to use for generation.

        # Inputs can be one or both
        text_input: The user's direct text input (optional).
        audio_path: The path to the user's audio file (optional).

        # Intermediate state for clarity
        enhanced_transcript: The processed text from the audio file (optional).

        # Final consolidated input for the generator
        processed_input: The final text (from text, audio, or both) to be used
                         for generating an answer.
    """
    # Chat-specific fields
    messages: Annotated[list[BaseMessage], manage_messages]
    light_model: str
    heavy_model: str

    # Inputs - at least one must be provided
    text_input: Optional[str]
    audio_path: Optional[str]

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