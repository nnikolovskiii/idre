from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.models import User
from backend.api.routes.auth import get_current_user
from backend.databases.postgres_db import get_session
from backend.services.notebook_model_service import NotebookModelService
from backend.repositories.notebook_model_repository import NotebookModelRepository

# Initialize service and repository
notebook_model_repository = NotebookModelRepository(None)  # Will be injected with session
notebook_model_service = NotebookModelService(None, notebook_model_repository)  # Will be injected with session

router = APIRouter()


# Pydantic models for request/response
class NotebookModelCreate(BaseModel):
    notebook_id: str = Field(..., description="UUID of the notebook")
    generative_model_id: str = Field(..., description="UUID of the generative model")


class NotebookModelUpdate(BaseModel):
    generative_model_id: str = Field(..., description="UUID of the generative model")


class NotebookModelResponse(BaseModel):
    id: str
    user_id: str
    notebook_id: str
    generative_model_id: str
    model_name: str
    model_type: str


class NotebookModelListResponse(BaseModel):
    status: str = "success"
    message: str = "Notebook models retrieved successfully"
    data: List[NotebookModelResponse]


@router.post("", response_model=NotebookModelResponse, status_code=status.HTTP_201_CREATED)
async def create_notebook_model(
        model_data: NotebookModelCreate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Create a new notebook model.

    Returns:
        The created notebook model with all fields
    """
    try:
        # Update service with session
        notebook_model_service.session = session
        notebook_model_service.repo.session = session

        notebook_model = await notebook_model_service.create_notebook_model(
            user_id=current_user.email,
            notebook_id=model_data.notebook_id,
            generative_model_id=model_data.generative_model_id
        )

        return NotebookModelResponse(
            id=str(notebook_model.id),
            user_id=notebook_model.user_id,
            notebook_id=str(notebook_model.notebook_id),
            generative_model_id=str(notebook_model.generative_model_id),
            model_name=notebook_model.model.name,
            model_type=notebook_model.model.type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/models", response_model=NotebookModelListResponse)
async def get_notebook_models(
        notebook_id: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get all models for a specific notebook.

    Returns:
        List of notebook models wrapped in a response object.
    """
    try:
        # Update service with session
        notebook_model_service.session = session
        notebook_model_service.repo.session = session

        notebook_models = await notebook_model_service.get_notebook_models_by_notebook_id(notebook_id)

        # Prepare the list of individual notebook model responses
        model_responses = [
            NotebookModelResponse(
                id=str(model.id),
                user_id=model.user_id,
                notebook_id=str(model.notebook_id),
                generative_model_id=str(model.generative_model_id),
                model_name=model.model.name,
                model_type=model.model.type
            )
            for model in notebook_models
        ]

        return NotebookModelListResponse(data=model_responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/models/{model_type}", response_model=NotebookModelResponse)
async def get_notebook_model_by_type(
        notebook_id: str,
        model_type: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get a specific notebook model by notebook_id and model type.

    Args:
        notebook_id: UUID of the notebook
        model_type: Type of model (light or heavy)

    Returns:
        The notebook model if found
    """
    try:
        # Update service with session
        notebook_model_service.session = session
        notebook_model_service.repo.session = session

        notebook_model = await notebook_model_service.get_notebook_model_by_id_and_type(
            notebook_id=notebook_id,
            model_type=model_type
        )

        if not notebook_model:
            raise HTTPException(status_code=404, detail="Notebook model not found")

        return NotebookModelResponse(
            id=str(notebook_model.id),
            user_id=notebook_model.user_id,
            notebook_id=str(notebook_model.notebook_id),
            generative_model_id=str(notebook_model.generative_model_id),
            model_name=notebook_model.model.name,
            model_type=notebook_model.model.type
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{notebook_model_id}", response_model=NotebookModelResponse)
async def update_notebook_model(
        notebook_model_id: str,
        model_data: NotebookModelUpdate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Update a notebook model.

    Args:
        notebook_model_id: UUID of the notebook model to update

    Returns:
        The updated notebook model
    """
    try:
        # Update service with session
        notebook_model_service.session = session
        notebook_model_service.repo.session = session

        notebook_model = await notebook_model_service.update_notebook_model(
            notebook_model_id=notebook_model_id,
            generative_model_id=model_data.generative_model_id
        )

        if not notebook_model:
            raise HTTPException(status_code=404, detail="Notebook model not found")

        return NotebookModelResponse(
            id=str(notebook_model.id),
            user_id=notebook_model.user_id,
            notebook_id=str(notebook_model.notebook_id),
            generative_model_id=str(notebook_model.generative_model_id),
            model_name=notebook_model.model.name,
            model_type=notebook_model.model.type
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/{notebook_model_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notebook_model(
        notebook_model_id: str,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Delete a notebook model.

    Args:
        notebook_model_id: UUID of the notebook model to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        # Update service with session
        notebook_model_service.session = session
        notebook_model_service.repo.session = session

        deleted = await notebook_model_service.delete_notebook_model(notebook_model_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notebook model not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
