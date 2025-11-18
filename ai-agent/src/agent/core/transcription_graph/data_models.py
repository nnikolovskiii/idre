from typing import Optional, TypedDict
from pydantic import BaseModel, Field

class RestructuredText(BaseModel):
    text: str = Field(..., description="Enhanced transcript text")

class GeneratedFileName(BaseModel):
    file_name: str = Field(..., description="File name suggestion")

class TranscriptionGraphState(TypedDict):
    audio_data_base64: Optional[str]
    filename: Optional[str]
    enhanced_transcript: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    file_name: Optional[str]