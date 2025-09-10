from typing import List
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from accounting_agent.models import User
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container

router = APIRouter()


class DefaultAIModelResponse(BaseModel):
    type: str
    name: str


class UpdateDefaultAIModelRequest(BaseModel):
    light_model: str
    heavy_model: str


class DefaultAIModelsResponse(BaseModel):
    light_model: str
    heavy_model: str


@router.get("/", response_model=DefaultAIModelsResponse)
async def get_default_ai_models(
    current_user: User = Depends(get_current_user)
):
    """
    Get the default AI models (light and heavy).
    """
    try:
        # Get default AI model service from container
        default_ai_service = container.default_ai_model_service()

        # Get default models
        light_model = await default_ai_service.get_name_by_type("light")
        heavy_model = await default_ai_service.get_name_by_type("heavy")

        # If models don't exist, return empty strings (they can be set later)
        return DefaultAIModelsResponse(
            light_model=light_model or "",
            heavy_model=heavy_model or ""
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving default AI models: {str(e)}")


@router.put("/")
async def update_default_ai_models(
    request: UpdateDefaultAIModelRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Update the default AI models (light and heavy).
    """
    try:
        # Get default AI model service from container
        default_ai_service = container.default_ai_model_service()

        # Update light model
        light_result = await default_ai_service.update_default_ai_model(
            "light", 
            {"name": request.light_model}
        )
        
        # Update heavy model
        heavy_result = await default_ai_service.update_default_ai_model(
            "heavy", 
            {"name": request.heavy_model}
        )

        # If models don't exist, create them
        if light_result is None:
            await default_ai_service.create_default_ai_model("light", request.light_model)
        
        if heavy_result is None:
            await default_ai_service.create_default_ai_model("heavy", request.heavy_model)

        return {"status": "success", "message": "Default AI models updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating default AI models: {str(e)}")


@router.get("/all", response_model=List[DefaultAIModelResponse])
async def get_all_default_ai_models(
    current_user: User = Depends(get_current_user)
):
    """
    Get all default AI model settings.
    """
    try:
        # Get default AI model service from container
        default_ai_service = container.default_ai_model_service()

        # Get all default models
        models = await default_ai_service.get_all_default_ai_models()

        return [
            DefaultAIModelResponse(type=model.type, name=model.name)
            for model in models
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving all default AI models: {str(e)}")
