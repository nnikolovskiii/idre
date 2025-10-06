from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies import get_notebook_model_service
from backend.models.dtos.notebook_model_dtos import NotebookModelListResponse, NotebookModelResponse, \
    NotebookModelUpdate
from backend.services.notebook_model_service import NotebookModelService

router = APIRouter()


@router.get("/{notebook_id}/models", response_model=NotebookModelListResponse)
async def get_notebook_models(
        notebook_id: str,
        notebook_model_service: NotebookModelService = Depends(get_notebook_model_service),
):
    """
    Get all models for a specific notebook.

    Returns:
        List of notebook models wrapped in a response object.
    """
    try:
        notebook_models = await notebook_model_service.get_notebook_models_by_notebook_id(notebook_id)

        # Prepare the list of individual notebook model responses

        model_responses = {
            notebook_model.model.type: NotebookModelResponse(
                id=str(notebook_model.id),
                user_id=notebook_model.user_id,
                notebook_id=str(notebook_model.notebook_id),
                generative_model_id=str(notebook_model.generative_model_id),
                model_name=notebook_model.model.name,
                model_type=notebook_model.model.type
            )
            for notebook_model in notebook_models
        }

        return NotebookModelListResponse(data=model_responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{notebook_model_id}", response_model=NotebookModelResponse)
async def update_notebook_model(
        notebook_model_id: str,
        model_data: NotebookModelUpdate,
        notebook_model_service: NotebookModelService = Depends(get_notebook_model_service),
):
    """
    Update a notebook model.

    Args:
        notebook_model_id: UUID of the notebook model to update

    Returns:
        The updated notebook model
    """
    try:
        notebook_model = await notebook_model_service.update_notebook_model_name(
            notebook_model_id=notebook_model_id,
            model_update=model_data
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
        notebook_model_service: NotebookModelService = Depends(get_notebook_model_service),
):
    """
    Delete a notebook model.

    Args:
        notebook_model_id: UUID of the notebook model to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        deleted = await notebook_model_service.delete_notebook_model(notebook_model_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notebook model not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
