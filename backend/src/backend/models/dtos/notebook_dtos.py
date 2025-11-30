from typing import List, Optional
from pydantic import BaseModel, Field

class NotebookCreate(BaseModel):
    emoji: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = Field(None, min_length=1, max_length=50)


class NotebookUpdate(BaseModel):
    emoji: str = Field(None, min_length=1, max_length=10)
    title: str = Field(None, min_length=1, max_length=255)
    date: str = Field(None, min_length=1, max_length=50)

class NotebookResponse(BaseModel):
    id: str
    emoji: Optional[str] = None
    title: Optional[str] = None
    date: Optional[str] = None
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