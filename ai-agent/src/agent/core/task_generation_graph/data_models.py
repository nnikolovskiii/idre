from typing import Optional, TypedDict, List, Dict, Any
from pydantic import BaseModel, Field
from datetime import datetime, timezone
import uuid

class TaskItem(BaseModel):
    title: str = Field(..., description="The title of the task")
    description: Optional[str] = Field(None, description="The description of the task")
    priority: str = Field("medium", description="The priority of the task: high, medium, or low")
    tags: List[str] = Field(default_factory=list, description="Tags associated with the task")

class TaskGenerationResponse(BaseModel):
    tasks: List[TaskItem] = Field(..., description="List of generated tasks")

class TaskGenerationGraphState(TypedDict):
    text_input: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    generated_tasks: Optional[List[Dict[str, Any]]]