from typing import List, Optional, Union
from pydantic import BaseModel, Field, field_validator
from datetime import datetime
import uuid

class ModelGroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None

class CreateModelGroupRequest(ModelGroupBase):
    model_ids: Optional[List[str]] = Field(default=[], description="List of GenerativeModel IDs to include initially")

class UpdateModelGroupRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    model_ids: Optional[List[str]] = Field(None, description="If provided, replaces the current list of models")

class AddModelsRequest(BaseModel):
    model_ids: List[str]

class GenerativeModelSimpleResponse(BaseModel):
    id: Union[str, uuid.UUID]
    name: str
    type: str

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

class ModelGroupResponse(ModelGroupBase):
    id: Union[str, uuid.UUID]
    user_id: str
    created_at: datetime
    updated_at: datetime
    models: List[GenerativeModelSimpleResponse]

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
        """Ensure output is always a string"""
        if isinstance(v, uuid.UUID):
            return str(v)
        return str(v)

    class Config:
        from_attributes = True

class ModelGroupListResponse(BaseModel):
    status: str
    message: str
    data: List[ModelGroupResponse]
