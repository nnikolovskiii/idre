import requests
from typing import List, Dict, Any

from backend.api.dependencies import get_generative_model_service
from backend.services.generative_model_service import GenerativeModelService
from fastapi import APIRouter, HTTPException, Depends
import time

router = APIRouter()


@router.get("/", response_model=List[str])
async def get_models(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    model_names = await generative_model_service.get_unique_model_names(open_access=False)
    return model_names


@router.get("/free", response_model=List[str])
async def get_free_openrouter_models(
        generative_model_service: GenerativeModelService = Depends(get_generative_model_service)
):
    model_names = await generative_model_service.get_unique_model_names(open_access=True)
    return model_names
