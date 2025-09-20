import requests
from typing import List, Dict, Any
from fastapi import APIRouter, HTTPException
import time # Import time at the top

router = APIRouter()

# Cache for model names to reduce API calls
_cached_models: List[str] = []
_cache_timestamp: float = 0
CACHE_DURATION = 3600  # 1 hour in seconds

@router.get("/", response_model=List[str])
async def get_openrouter_models():
    """
    Get available model names from OpenRouter API.
    Returns a list of model names only.
    """
    # Declare that we are using the global variables for both reading and writing
    # This line is moved from the bottom to the top of the function.
    global _cached_models, _cache_timestamp

    # Check if we have cached data that's still valid
    current_time = time.time()
    if _cached_models and (current_time - _cache_timestamp) < CACHE_DURATION:
        return _cached_models

    try:
        # Fetch models from OpenRouter
        url = "https://openrouter.ai/api/v1/models"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch models from OpenRouter: {response.text}"
            )

        data = response.json()

        # Extract model names from the response
        # OpenRouter API returns {"data": [{"id": "model-name", ...}, ...]}
        if "data" not in data:
            raise HTTPException(
                status_code=500,
                detail="Invalid response format from OpenRouter API"
            )

        model_names = [model["id"] for model in data["data"] if "id" in model]

        # Cache the results - the 'global' declaration is already at the top
        _cached_models = model_names
        _cache_timestamp = current_time

        return model_names

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error while fetching models: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing OpenRouter response: {str(e)}"
        )


@router.get("/free", response_model=List[str])
async def get_free_openrouter_models():
    """
    Get free models from OpenRouter API (pricing 0 for prompt and completion).
    Returns a list of models with id and pricing.
    """
    try:
        url = "https://openrouter.ai/api/v1/models"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"Failed to fetch models from OpenRouter: {response.text}"
            )

        data = response.json()

        if "data" not in data:
            raise HTTPException(
                status_code=500,
                detail="Invalid response format from OpenRouter API"
            )

        free_models = []
        for model in data["data"]:
            pricing = model.get("pricing", {})
            if pricing.get("prompt") == "0" and pricing.get("completion") == "0":
                free_models.append(model["id"])

        return free_models

    except requests.RequestException as e:
        raise HTTPException(
            status_code=500,
            detail=f"Network error while fetching models: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error processing OpenRouter response: {str(e)}"
        )