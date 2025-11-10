from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid

class PropositionBase(BaseModel):
    """Base model with common proposition fields."""
    service: Optional[str] = None
    audience: Optional[str] = None
    problem: Optional[str] = None
    solution: Optional[str] = None

class PropositionUpdateRequest(PropositionBase):
    """
    Schema for the request body when creating or updating a proposition.
    The notebook_id is now taken from the URL path, not the body.
    """
    pass

class PropositionResponse(PropositionBase):
    """Schema for the response when returning a proposition."""
    notebook_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True