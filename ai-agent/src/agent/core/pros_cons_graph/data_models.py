from typing import Optional, TypedDict
from langchain_core.messages import BaseMessage
from pydantic import BaseModel, Field

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
    messages: list[BaseMessage]
    processed_input: Optional[str]
    enhanced_transcript: Optional[str]
    context: Optional[str]

    # Results
    positive_response: Optional[str]
    negative_response: Optional[str]