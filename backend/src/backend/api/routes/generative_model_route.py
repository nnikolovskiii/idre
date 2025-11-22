import requests
from typing import List, Dict, Any

from backend.api.dependencies import get_generative_model_service
from backend.services.generative_model_service import GenerativeModelService
from backend.models.dtos.generative_model_dto import ModelListResponse
from fastapi import APIRouter, HTTPException, Depends
import time

router = APIRouter()


@router.get("/", response_model=List[str])
async def get_models(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    """Legacy endpoint - returns simple list of model names for backward compatibility"""
    model_names = await generative_model_service.get_unique_model_names()
    return model_names


@router.get("/enhanced", response_model=ModelListResponse)
async def get_models_enhanced(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    """Enhanced endpoint - returns models with recommendation metadata, sorted by recommendations"""
    models_response = await generative_model_service.get_models_with_recommendations()
    return models_response


@router.get("/enhanced/light", response_model=ModelListResponse)
async def get_light_models(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    """Enhanced endpoint - returns light models with recommendation metadata, sorted by recommendations"""
    models_response = await generative_model_service.get_models_with_recommendations_by_type("light")
    return models_response


@router.get("/enhanced/heavy", response_model=ModelListResponse)
async def get_heavy_models(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    """Enhanced endpoint - returns heavy models with recommendation metadata, sorted by recommendations"""
    models_response = await generative_model_service.get_models_with_recommendations_by_type("heavy")
    return models_response
