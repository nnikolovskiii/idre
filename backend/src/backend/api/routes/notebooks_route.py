from fastapi import APIRouter, Depends, HTTPException, status

from backend.api.dependencies import get_notebook_service, get_chat_service
from backend.models import User
from backend.api.routes.auth_route import get_current_user
from backend.models.dtos.chat import CreateThreadRequest
from backend.models.dtos.notebook_dtos import NotebookResponse, NotebookCreate, NotebooksListResponse, NotebookUpdate
from backend.services.chat_service import ChatService
from backend.services.notebook_service import NotebookService

router = APIRouter()


@router.post("", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
async def create_notebook(
        # The request body can now be empty JSON `{}` and it will still work
        notebook_data: NotebookCreate,
        current_user: User = Depends(get_current_user),
        notebook_service: NotebookService = Depends(get_notebook_service),
        chat_service: ChatService = Depends(get_chat_service)  # Kept as it was in original code
):
    """
    Create a new notebook.

    A client can send an empty request body `{}`, and the notebook will be created
    with default values for emoji, title, and date.

    Returns:
        The created notebook with all fields.
    """
    try:
        # The logic here remains the same. Pydantic ensures `notebook_data`
        # has values for emoji, title, and date (either from the client or the defaults).
        notebook = await notebook_service.create_notebook(
            user_id=current_user.email,
            emoji=notebook_data.emoji,
            title=notebook_data.title,
            date=notebook_data.date,
        )

        # This part remains unchanged
        await notebook_service.set_notebook_models(user_id=current_user.email, notebook_id=str(notebook.id))

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            created_at=notebook.created_at.isoformat() if notebook.created_at else None,
            updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
        )
    except Exception as e:
        # It's good practice to log the exception here
        # import logging; logging.exception(e)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("", response_model=NotebooksListResponse)
async def get_all_notebooks(
        current_user: User = Depends(get_current_user),
        notebook_service: NotebookService = Depends(get_notebook_service)
):
    """
    Get all notebooks for the current user.

    Returns:
        List of user's notebooks wrapped in a response object.
    """
    try:
        notebooks = await notebook_service.get_notebooks_for_user(user_id=current_user.email)

        # First, prepare the list of individual notebook responses
        notebook_responses = [
            NotebookResponse(
                id=str(notebook.id),
                emoji=notebook.emoji,
                title=notebook.title,
                date=notebook.date,
                created_at=notebook.created_at.isoformat() if notebook.created_at else None,
                updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
            )
            for notebook in notebooks
        ]

        # CHANGE 3: Wrap the list of notebooks in the NotebooksListResponse object before returning.
        return NotebooksListResponse(data=notebook_responses)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}", response_model=NotebookResponse)
async def get_notebook(
        notebook_id: str,
        notebook_service: NotebookService = Depends(get_notebook_service)
):
    """
    Get a specific notebook by ID.

    Args:
        notebook_id: UUID of the notebook

    Returns:
        The notebook if found
    """
    try:
        notebook = await notebook_service.get_notebook_by_id(notebook_id=notebook_id)
        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            created_at=notebook.created_at.isoformat() if notebook.created_at else None,
            updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.put("/{notebook_id}", response_model=NotebookResponse)
async def update_notebook(
        notebook_id: str,
        notebook_data: NotebookUpdate,
        notebook_service: NotebookService = Depends(get_notebook_service)
):
    """
    Update a notebook.

    Args:
        notebook_id: UUID of the notebook to update

    Returns:
        The updated notebook
    """
    try:
        notebook = await notebook_service.update_notebook(
            notebook_id=notebook_id,
            update_data={
                "emoji": notebook_data.emoji,
                "title": notebook_data.title,
                "date": notebook_data.date,
            }
        )

        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            created_at=notebook.created_at.isoformat() if notebook.created_at else None,
            updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/{notebook_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notebook(
        notebook_id: str,
        notebook_service: NotebookService = Depends(get_notebook_service)
):
    """
    Delete a notebook.

    Args:
        notebook_id: UUID of the notebook to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        deleted = await notebook_service.delete_notebook(notebook_id=notebook_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notebook not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
