from typing import List, Dict
from pydantic import BaseModel, Field


class NotebookModelCreate(BaseModel):
    notebook_id: str = Field(..., description="UUID of the notebook")
    generative_model_id: str = Field(..., description="UUID of the generative model")


class NotebookModelUpdate(BaseModel):
    generative_model_name: str = Field(..., description="name of the new generative model")
    generative_model_type: str = Field(..., description="type of the new generative model")


class NotebookModelResponse(BaseModel):
    id: str
    user_id: str
    notebook_id: str
    generative_model_id: str
    model_name: str
    model_type: str


class NotebookModelListResponse(BaseModel):
    status: str = "success"
    message: str = "Notebook models retrieved successfully"
    data: Dict[str, NotebookModelResponse]
