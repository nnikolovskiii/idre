from typing import Dict

from pydantic import BaseModel, Field


class ChatModelUpdate(BaseModel):
    generative_model_name: str = Field(..., description="name of the generative model")
    generative_model_type: str = Field(..., description="type of the generative model")


class ChatModelResponse(BaseModel):
    id: str
    user_id: str
    chat_id: str
    generative_model_id: str
    model_name: str
    model_type: str


class ChatModelListResponse(BaseModel):
    status: str = "success"
    message: str = "Chat models retrieved successfully"
    data: Dict[str, ChatModelResponse]
