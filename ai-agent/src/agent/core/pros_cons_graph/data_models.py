from typing import Optional, TypedDict, Annotated
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field

from agent.core.messages_utils import manage_messages


class ProsConsPositiveAnalysis(BaseModel):
    analysis: str = Field(..., description="Positive analysis")

class ProsConsNegativeAnalysis(BaseModel):
    analysis: str = Field(..., description="Negative analysis")

class ProsConsGraphState(TypedDict):
    # Inputs
    text_input: Optional[str]
    audio_path: Optional[str]
    files_contents: Optional[str]
    web_search: Optional[bool]
    api_key: Optional[str]
    light_model: Optional[str]
    heavy_model: Optional[str]

    # Processing
    messages: Annotated[list[BaseMessage], manage_messages]
    processed_input: Optional[str]
    enhanced_transcript: Optional[str]
    context: Optional[str]

    # Results
    positive_response: Optional[str]
    negative_response: Optional[str]