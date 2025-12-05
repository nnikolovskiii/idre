import math

from fastapi import APIRouter, Depends, HTTPException, status, Query

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
            bg_color=notebook_data.bg_color,
            text_color=notebook_data.text_color,
        )

        # This part remains unchanged
        await notebook_service.set_notebook_models(user_id=current_user.email, notebook_id=str(notebook.id))

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            bg_color=notebook.bg_color,
            text_color=notebook.text_color,
            created_at=notebook.created_at.isoformat() if notebook.created_at else None,
            updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
        )
    except Exception as e:
        # It's good practice to log the exception here
        # import logging; logging.exception(e)
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("", response_model=NotebooksListResponse)
async def get_all_notebooks(
        page: int = Query(1, ge=1, description="Page number"),
        page_size: int = Query(20, ge=1, le=100, description="Items per page"),
        current_user: User = Depends(get_current_user),
        notebook_service: NotebookService = Depends(get_notebook_service)
):
    """
    Get paginated notebooks for the current user.
    """
    try:
        # Get all notebooks (assuming service returns list)
        all_notebooks = await notebook_service.get_notebooks_for_user(user_id=current_user.email)

        # 1. Sort by updated_at desc (latest first) to ensure consistent pagination
        # We handle None values for dates just in case
        all_notebooks.sort(
            key=lambda x: x.updated_at or x.created_at,
            reverse=True
        )

        # 2. Calculate Pagination Metadata
        total_items = len(all_notebooks)
        total_pages = math.ceil(total_items / page_size)

        # Adjust page if it exceeds total_pages (unless total is 0)
        if total_items > 0 and page > total_pages:
            page = total_pages

        # 3. Slice the list
        start_index = (page - 1) * page_size
        end_index = start_index + page_size
        paginated_items = all_notebooks[start_index:end_index]

        # 4. Map to Response DTOs
        notebook_responses = [
            NotebookResponse(
                id=str(notebook.id),
                emoji=notebook.emoji,
                title=notebook.title,
                date=notebook.date,
                bg_color=notebook.bg_color,
                text_color=notebook.text_color,
                created_at=notebook.created_at.isoformat() if notebook.created_at else None,
                updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
            )
            for notebook in paginated_items
        ]

        # Return data with metadata
        # Note: We rely on NotebooksListResponse accepting extra fields or a dict for 'meta'
        # If your DTO is strict, you might need to update the DTO definition in backend/models/dtos/notebook_dtos.py
        # Here we construct the response matching the expected JSON structure.
        return NotebooksListResponse(
            data=notebook_responses,
            status="success",
            message="Notebooks retrieved successfully",
            # We inject meta here. If Pydantic is strict, ensure your DTO has a `meta` field or use a dict.
            # Assuming we can pass it via the Pydantic model constructor if added, or relies on dynamic dict if not strict.
            meta={
                "page": page,
                "page_size": page_size,
                "total_items": total_items,
                "total_pages": total_pages
            }
        )

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
                "bg_color": notebook_data.bg_color,
                "text_color": notebook_data.text_color,
            }
        )

        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            bg_color=notebook.bg_color,
            text_color=notebook.text_color,
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
