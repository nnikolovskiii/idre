from typing import List, Optional
from pydantic import BaseModel, Field

class NotebookCreate(BaseModel):
    emoji: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = Field(None, min_length=1, max_length=50)
    bg_color: Optional[str] = Field('#4d4dff', min_length=4, max_length=20)
    text_color: Optional[str] = Field('#ffffff', min_length=4, max_length=20)


class NotebookUpdate(BaseModel):
    emoji: Optional[str] = Field(None, min_length=1, max_length=10)
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    date: Optional[str] = Field(None, min_length=1, max_length=50)
    bg_color: Optional[str] = Field(None, min_length=4, max_length=20)
    text_color: Optional[str] = Field(None, min_length=4, max_length=20)

class NotebookResponse(BaseModel):
    id: str
    emoji: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None
    bg_color: str
    text_color: str
    created_at: Optional[str] = None
    updated_at: Optional[str] = None


class PaginationMeta(BaseModel):
    page: int
    page_size: int
    total_items: int
    total_pages: int

# Update this class
class NotebooksListResponse(BaseModel):
    status: str
    message: str
    data: List[NotebookResponse]
    meta: Optional[PaginationMeta] = None # <--- THIS IS CRITICAL