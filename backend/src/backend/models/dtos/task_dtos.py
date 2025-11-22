from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import datetime, date
import uuid
from enum import Enum

from backend.models.task import TaskStatus, TaskPriority


class TaskStatusEnum(str, Enum):
    TODO = "todo"
    IN_PROGRESS = "in-progress"
    REVIEW = "review"
    DONE = "done"


class TaskPriorityEnum(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class TaskBase(BaseModel):
    """Base model with common task fields."""
    title: Optional[str] = Field(None, description="Task title")
    description: Optional[str] = Field(None, description="Task description")
    status: Optional[TaskStatusEnum] = Field(TaskStatusEnum.TODO, description="Task status")
    priority: Optional[TaskPriorityEnum] = Field(TaskPriorityEnum.MEDIUM, description="Task priority")
    tags: Optional[List[str]] = Field(default_factory=list, description="Task tags")
    due_date: Optional[date] = Field(None, description="Task due date")
    position: Optional[int] = Field(0, description="Task position in column")
    archived: Optional[bool] = Field(False, description="Whether task is archived")

    @validator('tags')
    def validate_tags(cls, v):
        if v is None:
            return []
        return v

    @validator('position')
    def validate_position(cls, v):
        if v is None:
            return 0
        if v < 0:
            raise ValueError('Position must be non-negative')
        return v


class TaskCreateRequest(TaskBase):
    """
    Schema for the request body when creating a task.
    The notebook_id is taken from the URL path, not the body.
    """
    title: str = Field(..., description="Task title (required for creation)")

    @validator('title')
    def validate_title(cls, v):
        if not v or not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()


class TaskUpdateRequest(TaskBase):
    """
    Schema for the request body when updating a task.
    All fields are optional for partial updates.
    """
    pass


class TaskMoveRequest(BaseModel):
    """Schema for moving tasks between columns."""
    status: TaskStatusEnum = Field(..., description="New status/column")
    position: Optional[int] = Field(None, description="New position in column")


class TaskReorderRequest(BaseModel):
    """Schema for reordering tasks within the same column."""
    position: int = Field(..., description="New position in current column")


class TaskArchiveRequest(BaseModel):
    """Schema for archive operations (empty body)."""
    pass


class TaskResponse(TaskBase):
    """Schema for the response when returning a task."""
    id: uuid.UUID
    user_id: str
    notebook_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    status_display: Optional[str] = Field(None, description="User-friendly status display")
    priority_display: Optional[str] = Field(None, description="User-friendly priority display")
    is_overdue: Optional[bool] = Field(None, description="Whether task is overdue")

    class Config:
        orm_mode = True
        json_encoders = {
            uuid.UUID: str,
            datetime: lambda v: v.isoformat() if v else None,
            date: lambda v: v.isoformat() if v else None
        }


class TasksListResponse(BaseModel):
    """Schema for response when listing tasks."""
    tasks: List[TaskResponse]
    total_count: int
    status: str = Field("success", description="Response status")
    message: str = Field(default="Tasks retrieved successfully", description="Response message")


class TaskOperationResponse(BaseModel):
    """Schema for task operation responses (create, update, delete)."""
    status: str = Field("success", description="Operation status")
    message: str = Field(..., description="Operation message")
    task: Optional[TaskResponse] = Field(None, description="Task data for successful operations")


class TaskSearchRequest(BaseModel):
    """Schema for task search parameters."""
    query: Optional[str] = Field(None, description="Search query")
    status: Optional[TaskStatusEnum] = Field(None, description="Filter by status")
    priority: Optional[TaskPriorityEnum] = Field(None, description="Filter by priority")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    has_due_date: Optional[bool] = Field(None, description="Filter by due date presence")
    is_overdue: Optional[bool] = Field(None, description="Filter by overdue status")
    limit: int = Field(100, ge=1, le=1000, description="Maximum number of results")
    offset: int = Field(0, ge=0, description="Number of results to skip")