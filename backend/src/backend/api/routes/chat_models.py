from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.models import User
from backend.api.routes.auth import get_current_user
from backend.databases.postgres_db import get_session
from backend.services.chat_model_service import ChatModelService
from backend.repositories.chat_model_repository import ChatModelRepository

# Initialize service and repository
chat_model_repository = ChatModelRepository(None)  # Will be injected with session
chat_model_service = ChatModelService(None, chat_model_repository)  # Will be injected with session

router = APIRouter()


# Pydantic models for request/response
class ChatModelCreate(BaseModel):
    chat_id: str = Field(..., description="UUID of the chat")
    generative_model_id: str = Field(..., description="UUID of the generative model")


class ChatModelUpdate(BaseModel):
    generative_model_id: str = Field(..., description="UUID of the generative model")


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
    data: List[ChatModelResponse]


@router.post("", response_model=ChatModelResponse, status_code=status.HTTP_201_CREATED)
async def create_chat_model(
        model_data: ChatModelCreate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Create a new chat model.

    Returns:
        The created chat model with all fields
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        chat_model = await chat_model_service.create_ai_model(
            user_id=current_user.email,
            chat_id=model_data.chat_id,
            generative_model_id=model_data.generative_model_id
        )

        return ChatModelResponse(
            id=str(chat_model.id),
            user_id=chat_model.user_id,
            chat_id=str(chat_model.chat_id),
            generative_model_id=str(chat_model.generative_model_id),
            model_name=chat_model.model.name,
            model_type=chat_model.model.type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{chat_id}/models", response_model=ChatModelListResponse)
async def get_chat_models(
        chat_id: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get all models for a specific chat.

    Returns:
        List of chat models wrapped in a response object.
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        chat_models = await chat_model_service.get_chat_models_by_chat_id(chat_id)

        # Prepare the list of individual chat model responses
        model_responses = [
            ChatModelResponse(
                id=str(model.id),
                user_id=model.user_id,
                chat_id=str(model.chat_id),
                generative_model_id=str(model.generative_model_id),
                model_name=model.model.name,
                model_type=model.model.type
            )
            for model in chat_models
        ]

        return ChatModelListResponse(data=model_responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{chat_id}/models/{model_type}", response_model=ChatModelResponse)
async def get_chat_model_by_type(
        chat_id: str,
        model_type: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get a specific chat model by chat_id and model type.

    Args:
        chat_id: UUID of the chat
        model_type: Type of model (light or heavy)

    Returns:
        The chat model if found
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        chat_model = await chat_model_service.get_chat_model_by_chat_id_and_type(
            chat_id=chat_id,
            model_type=model_type
        )

        if not chat_model:
            raise HTTPException(status_code=404, detail="Chat model not found")

        return ChatModelResponse(
            id=str(chat_model.id),
            user_id=chat_model.user_id,
            chat_id=str(chat_model.chat_id),
            generative_model_id=str(chat_model.generative_model_id),
            model_name=chat_model.model.name,
            model_type=chat_model.model.type
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{chat_model_id}", response_model=ChatModelResponse)
async def update_chat_model(
        chat_model_id: str,
        model_data: ChatModelUpdate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Update a chat model.

    Args:
        chat_model_id: UUID of the chat model to update

    Returns:
        The updated chat model
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        chat_model = await chat_model_service.update_chat_model(
            chat_model_id=chat_model_id,
            generative_model_id=model_data.generative_model_id
        )

        if not chat_model:
            raise HTTPException(status_code=404, detail="Chat model not found")

        return ChatModelResponse(
            id=str(chat_model.id),
            user_id=chat_model.user_id,
            chat_id=str(chat_model.chat_id),
            generative_model_id=str(chat_model.generative_model_id),
            model_name=chat_model.model.name,
            model_type=chat_model.model.type
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/{chat_model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_model(
        chat_model_id: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Delete a chat model.

    Args:
        chat_model_id: UUID of the chat model to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        deleted = await chat_model_service.delete_chat_model(chat_model_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat model not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/chat/{chat_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_chat_model_by_chat_id(
        chat_id: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Delete a chat model by chat_id.

    Args:
        chat_id: UUID of the chat to delete models for

    Returns:
        Empty response with 204 status code
    """
    try:
        # Update service with session
        chat_model_service.session = session
        chat_model_service.repo.session = session

        deleted = await chat_model_service.delete_chat_model_by_chat_id(chat_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat model not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
