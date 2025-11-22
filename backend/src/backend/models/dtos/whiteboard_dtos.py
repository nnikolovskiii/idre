from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class WhiteboardBase(BaseModel):
    """Base model with common whiteboard fields."""
    title: Optional[str] = Field(None, description="Whiteboard title")
    content: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Whiteboard content as JSON")
    thumbnail_url: Optional[str] = Field(None, description="Optional thumbnail URL")

    @validator('title')
    def validate_title(cls, v):
        if v is not None:
            if not v.strip():
                raise ValueError('Title cannot be empty if provided')
            return v.strip()
        return v

    @validator('content')
    def validate_content(cls, v):
        if v is None:
            return {}
        return v


class WhiteboardCreateRequest(WhiteboardBase):
    """
    Schema for the request body when creating a whiteboard.
    The notebook_id is taken from the URL path, not the body.
    """
    title: str = Field(..., description="Whiteboard title (required for creation)")

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class WhiteboardUpdateRequest(WhiteboardBase):
    """
    Schema for the request body when updating a whiteboard.
    All fields are optional for partial updates.
    """
    pass


class WhiteboardResponse(WhiteboardBase):
    """Schema for the response when returning a whiteboard."""
    id: uuid.UUID
    user_id: str
    notebook_id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        json_encoders = {
            uuid.UUID: str,
            datetime: lambda v: v.isoformat() if v else None
        }


class WhiteboardsListResponse(BaseModel):
    """Schema for response when listing whiteboards."""
    whiteboards: list[WhiteboardResponse]
    total_count: int
    status: str = Field("success", description="Response status")
    message: str = Field(default="Whiteboards retrieved successfully", description="Response message")


class WhiteboardOperationResponse(BaseModel):
    """Schema for whiteboard operation responses (create, update, delete)."""
    status: str = Field("success", description="Operation status")
    message: str = Field(..., description="Operation message")
    whiteboard: Optional[WhiteboardResponse] = Field(None, description="Whiteboard data for successful operations")


class WhiteboardSearchRequest(BaseModel):
    """Schema for whiteboard search parameters."""
    query: Optional[str] = Field(None, description="Search query for whiteboard titles")
    limit: int = Field(100, ge=1, le=1000, description="Maximum number of results")
    offset: int = Field(0, ge=0, description="Number of results to skip")


# Hierarchy management DTOs

class NodeHierarchyUpdate(BaseModel):
    """Schema for updating node hierarchy relationships."""
    node_id: str = Field(..., description="ID of the node to update")
    parent_id: Optional[str] = Field(None, description="ID of the parent node (null for root level)")
    children_order: Optional[list[str]] = Field(None, description="Order of child nodes")


class CreateChildNodeRequest(BaseModel):
    """Schema for creating a child node."""
    node_type: str = Field(..., description="Type of node: 'ideaNode', 'topicNode', or 'noteNode'")
    parent_id: str = Field(..., description="ID of the parent node")
    position: Optional[dict[str, float]] = Field(None, description="Optional position override")
    content: Optional[dict[str, Any]] = Field(None, description="Initial node content")


class NodeHierarchyResponse(BaseModel):
    """Schema for hierarchy operation responses."""
    status: str = Field("success", description="Operation status")
    message: str = Field(..., description="Operation message")
    updated_content: Optional[Dict[str, Any]] = Field(None, description="Updated whiteboard content")
    node_id: Optional[str] = Field(None, description="ID of the affected node")


class ValidateHierarchyRequest(BaseModel):
    """Schema for validating hierarchy operations."""
    whiteboard_content: Dict[str, Any] = Field(..., description="Current whiteboard content")
    node_id: str = Field(..., description="ID of the node to validate")
    proposed_parent_id: Optional[str] = Field(None, description="Proposed parent ID")


class HierarchyValidationResponse(BaseModel):
    """Schema for hierarchy validation responses."""
    is_valid: bool = Field(..., description="Whether the hierarchy is valid")
    message: str = Field(..., description="Validation message")
    circular_reference_path: Optional[list[str]] = Field(None, description="Path showing circular reference if detected")