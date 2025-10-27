from typing import List
from pydantic import BaseModel, Field

class NotebookCreate(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=10)
    title: str = Field(..., min_length=1, max_length=255)
    date: str = Field(..., min_length=1, max_length=50)


class NotebookUpdate(BaseModel):
    emoji: str = Field(None, min_length=1, max_length=10)
    title: str = Field(None, min_length=1, max_length=255)
    date: str = Field(None, min_length=1, max_length=50)

class NotebookResponse(BaseModel):
    id: str
    emoji: str
    title: str
    date: str
    created_at: str
    updated_at: str


class NotebooksListResponse(BaseModel):
    status: str = "success"
    message: str = "Notebooks retrieved successfully"
    data: List[NotebookResponse]