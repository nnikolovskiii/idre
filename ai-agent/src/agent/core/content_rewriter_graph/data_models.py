from typing import Optional, TypedDict
from pydantic import BaseModel, Field

class ContentRewriterResponse(BaseModel):
    rewritten_content: str = Field(..., description="The rewritten content in a more clear and precise way")

class ContentRewriterGraphState(TypedDict):
    original_content: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    rewritten_content: Optional[str]