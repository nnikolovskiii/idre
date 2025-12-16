from typing import Optional, Union
from pydantic import BaseModel, field_validator
import uuid


class GenerativeModelDTO(BaseModel):
    """DTO for GenerativeModel with recommendation metadata"""
    id: Union[str, uuid.UUID]
    name: str
    type: str
    is_recommended: bool = False
    recommendation_order: Optional[int] = None
    recommendation_reason: Optional[str] = None

    @field_validator('id', mode='before')
    @classmethod
    def convert_uuid_to_str(cls, v):
        """Convert UUID to string for JSON serialization"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return v

    @field_validator('id', mode='after')
    @classmethod
    def ensure_str_output(cls, v):
        """Ensure the output is always a string"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return str(v)

    class Config:
        from_attributes = True


class ModelListResponse(BaseModel):
    """Response model for the enhanced models endpoint"""
    models: list[GenerativeModelDTO]
