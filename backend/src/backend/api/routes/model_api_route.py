from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from backend.api.dependencies import get_model_api_service
from backend.models import User
from backend.api.routes.auth_route import get_current_user
from backend.services.model_api_service import ModelApiService

router = APIRouter()


class ModelApiResponse(BaseModel):
    has_api_key: bool
    api_key: Optional[str] = None


class UpdateModelApiRequest(BaseModel):
    api_key: str


@router.get("/", response_model=ModelApiResponse)
async def get_model_api(
        current_user: User = Depends(get_current_user),
        model_api_service: ModelApiService = Depends(get_model_api_service)
):
    """
    Get the user's model API key information.
    Returns whether the user has an API key and the decrypted key if available.
    """
    try:
        model_api_obj = await model_api_service.get_api_key_by_user_id(str(current_user.user_id))

        return ModelApiResponse(
            has_api_key=model_api_obj is not None,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving model API key: {str(e)}")


@router.put("/")
async def update_model_api(
        request: UpdateModelApiRequest,
        current_user: User = Depends(get_current_user),
        model_api_service: ModelApiService = Depends(get_model_api_service)
):
    """
    Create or update the user's model API key.
    """
    try:
        result = await model_api_service.upsert_api_key(str(current_user.user_id), request.api_key)

        return {"status": "success", "message": "API key updated successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating API key: {str(e)}")


@router.delete("/")
async def delete_model_api(
        current_user: User = Depends(get_current_user),
        model_api_service: ModelApiService = Depends(get_model_api_service)
):
    """
    Delete the user's model API key.
    """
    try:
        deleted = await model_api_service.delete_api_key(str(current_user.user_id))

        if deleted:
            return {"status": "success", "message": "API key deleted successfully"}
        else:
            return {"status": "success", "message": "No API key found to delete"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting API key: {str(e)}")
