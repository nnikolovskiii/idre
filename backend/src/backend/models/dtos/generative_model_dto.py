from typing import Optional
from pydantic import BaseModel


class GenerativeModelDTO(BaseModel):
    """DTO for GenerativeModel with recommendation metadata"""
    name: str
    type: str
    is_recommended: bool = False
    recommendation_order: Optional[int] = None
    recommendation_reason: Optional[str] = None

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    """Response model for the enhanced models endpoint"""
    models: list[GenerativeModelDTO]