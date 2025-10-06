from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies import get_chat_model_service
from backend.models.dtos.chat_model_dtos import ChatModelListResponse, ChatModelResponse, ChatModelUpdate
from backend.services.chat_model_service import ChatModelService


router = APIRouter()


@router.get("/{chat_id}/models", response_model=ChatModelListResponse)
async def get_chat_models(
        chat_id: str,
        chat_model_service: ChatModelService = Depends(get_chat_model_service)
):
    """
    Get all models for a specific chat.

    Returns:
        List of chat models wrapped in a response object.
    """
    try:
        chat_models = await chat_model_service.get_chat_models_by_chat_id(chat_id)

        # Prepare the list of individual chat model responses
        model_responses = {
            chat_model.model.type: ChatModelResponse(
                id=str(chat_model.id),
                user_id=chat_model.user_id,
                chat_id=str(chat_model.chat_id),
                generative_model_id=str(chat_model.generative_model_id),
                model_name=chat_model.model.name,
                model_type=chat_model.model.type
            )
            for chat_model in chat_models
        }

        return ChatModelListResponse(data=model_responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{chat_model_id}", response_model=ChatModelResponse)
async def update_chat_model(
        chat_model_id: str,
        model_data: ChatModelUpdate,
        chat_model_service: ChatModelService = Depends(get_chat_model_service)
):
    """
    Update a chat model.

    Args:
        chat_model_id: UUID of the chat model to update

    Returns:
        The updated chat model
    """
    try:

        chat_model = await chat_model_service.update_chat_model_with_generative_model(
            chat_model_id=chat_model_id,
            model_update=model_data
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
        chat_model_service: ChatModelService = Depends(get_chat_model_service)
):
    """
    Delete a chat model.

    Args:
        chat_model_id: UUID of the chat model to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        deleted = await chat_model_service.delete_chat_model(chat_model_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Chat model not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")

