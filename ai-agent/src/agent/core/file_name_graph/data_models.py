from typing import Optional, TypedDict
from pydantic import BaseModel, Field

class FileName(BaseModel):
    file_name: str = Field(..., description="File name suggestion")

class FileNameGraphState(TypedDict):
    doc_content: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    file_name: Optional[str]  # Storing just the string