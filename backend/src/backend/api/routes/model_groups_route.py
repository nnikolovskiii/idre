from fastapi import APIRouter, Depends, HTTPException, status
from backend.api.dependencies import get_model_group_service
from backend.models import User
from backend.api.routes.auth_route import get_current_user
from backend.models.dtos.model_group_dtos import (
    CreateModelGroupRequest, 
    UpdateModelGroupRequest, 
    AddModelsRequest,
    ModelGroupResponse, 
    ModelGroupListResponse
)
from backend.services.model_group_service import ModelGroupService

router = APIRouter()

@router.post("", response_model=ModelGroupResponse, status_code=status.HTTP_201_CREATED)
async def create_model_group(
    request: CreateModelGroupRequest,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Create a new group of models."""
    try:
        group = await service.create_group(str(current_user.user_id), request)
        return group
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create group: {str(e)}")

@router.get("", response_model=ModelGroupListResponse)
async def list_model_groups(
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """List all model groups for the current user."""
    groups = await service.get_user_groups(str(current_user.user_id))
    return {
        "status": "success",
        "message": f"Retrieved {len(groups)} groups",
        "data": groups
    }

@router.get("/{group_id}", response_model=ModelGroupResponse)
async def get_model_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Get details of a specific group."""
    group = await service.get_group(str(current_user.user_id), group_id)
    if not group:
        raise HTTPException(status_code=404, detail="Model group not found")
    return group

@router.patch("/{group_id}", response_model=ModelGroupResponse)
async def update_model_group(
    group_id: str,
    request: UpdateModelGroupRequest,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Update group details or replace its models."""
    group = await service.update_group(str(current_user.user_id), group_id, request)
    if not group:
        raise HTTPException(status_code=404, detail="Model group not found")
    return group

@router.post("/{group_id}/models", response_model=ModelGroupResponse)
async def add_models_to_group(
    group_id: str,
    request: AddModelsRequest,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Add specific models to an existing group."""
    group = await service.add_models_to_group(str(current_user.user_id), group_id, request.model_ids)
    if not group:
        raise HTTPException(status_code=404, detail="Model group not found")
    return group

@router.delete("/{group_id}/models/{model_id}", response_model=ModelGroupResponse)
async def remove_model_from_group(
    group_id: str,
    model_id: str,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Remove a specific model from a group."""
    group = await service.remove_model_from_group(str(current_user.user_id), group_id, model_id)
    if not group:
        raise HTTPException(status_code=404, detail="Model group not found")
    return group

@router.delete("/{group_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_model_group(
    group_id: str,
    current_user: User = Depends(get_current_user),
    service: ModelGroupService = Depends(get_model_group_service)
):
    """Delete a model group."""
    success = await service.delete_group(str(current_user.user_id), group_id)
    if not success:
        raise HTTPException(status_code=404, detail="Model group not found")