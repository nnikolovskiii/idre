import uuid

from fastapi import APIRouter, Depends, HTTPException

from backend.api.dependencies import get_ai_model_service
from backend.models.dtos.chat import AIModelResponse, UpdateAIModelsRequest
from backend.services.ai_model_service import AIModelService

router = APIRouter()


@router.get("/{chat_id}/ai-models", response_model=AIModelResponse)
async def get_chat_ai_models(
        chat_id: str,
        ai_model_service: AIModelService = Depends(get_ai_model_service)
):
    try:
        chat_uuid = uuid.UUID(chat_id)
        ai_models = await ai_model_service.get_ai_models_by_chat_id(chat_uuid)

        light_model = None
        heavy_model = None

        for model in ai_models:
            if model.type == "light":
                light_model = model.name
            elif model.type == "heavy":
                heavy_model = model.name

        if light_model is None or heavy_model is None:
            raise HTTPException(status_code=404, detail="AI models not found for this chat")

        return AIModelResponse(
            light_model=light_model,
            heavy_model=heavy_model
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving AI models: {str(e)}")


@router.put("/{ai_model_id}/ai-models")
async def update_chat_ai_models(
        ai_model_id: str,
        request: UpdateAIModelsRequest,
        ai_model_service: AIModelService = Depends(get_ai_model_service)
):
    try:
        ai_model_uuid = uuid.UUID(ai_model_id)
        await ai_model_service.update_ai_model(ai_model_uuid, {"name": request.new_model_name})

        return {"status": "success", "message": "AI models updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating AI models: {str(e)}")
