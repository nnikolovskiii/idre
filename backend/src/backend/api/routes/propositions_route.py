from fastapi import APIRouter, Depends, HTTPException, status
import uuid

from backend.api.dependencies import get_proposition_service
from backend.models.dtos.proposition_dtos import PropositionResponse, PropositionUpdateRequest
from backend.services.proposition_service import PropositionService

router = APIRouter()


@router.get("/{notebook_id}", response_model=PropositionResponse)
async def get_proposition_for_notebook(
    notebook_id: uuid.UUID,
    proposition_service: PropositionService = Depends(get_proposition_service),
):
    """
    Get the proposition for a specific notebook by its ID.
    """
    try:
        proposition = await proposition_service.get_proposition_by_notebook_id(notebook_id=notebook_id)
        if not proposition:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Proposition not found for this notebook")

        return proposition
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{notebook_id}", response_model=PropositionResponse)
async def create_or_update_proposition_for_notebook(
    notebook_id: uuid.UUID,
    proposition_data: PropositionUpdateRequest,
    proposition_service: PropositionService = Depends(get_proposition_service),
):
    """
    Create or update the proposition for a given notebook. (Upsert)
    """
    try:
        proposition = await proposition_service.create_or_update_proposition(
            notebook_id=notebook_id,
            data=proposition_data.model_dump()
        )
        return proposition
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"An unexpected error occurred: {str(e)}")