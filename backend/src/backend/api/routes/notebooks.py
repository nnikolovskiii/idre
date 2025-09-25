from typing import List
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from backend.models import User
from backend.api.routes.auth import get_current_user
from backend.databases.postgres_db import get_session
from backend.services.notebook_service import NotebookService

notebook_service = NotebookService()

router = APIRouter()


# Pydantic models for request/response
class NotebookCreate(BaseModel):
    emoji: str = Field(..., min_length=1, max_length=10)
    title: str = Field(..., min_length=1, max_length=255)
    date: str = Field(..., min_length=1, max_length=50)
    bg_color: str = Field(..., min_length=1, max_length=20)
    text_color: str = Field(..., min_length=1, max_length=20)
    source_count: int = Field(default=0, ge=0)


class NotebookUpdate(BaseModel):
    emoji: str = Field(None, min_length=1, max_length=10)
    title: str = Field(None, min_length=1, max_length=255)
    date: str = Field(None, min_length=1, max_length=50)
    bg_color: str = Field(None, min_length=1, max_length=20)
    text_color: str = Field(None, min_length=1, max_length=20)
    source_count: int = Field(None, ge=0)


class NotebookResponse(BaseModel):
    id: str
    emoji: str
    title: str
    date: str
    source_count: int
    bg_color: str
    text_color: str
    created_at: str
    updated_at: str


# CHANGE 1: Define a new response model for the list endpoint.
# This model matches the `NotebooksListResponse` interface in your frontend.
class NotebooksListResponse(BaseModel):
    status: str = "success"
    message: str = "Notebooks retrieved successfully"
    data: List[NotebookResponse]


@router.post("", response_model=NotebookResponse, status_code=status.HTTP_201_CREATED)
async def create_notebook(
        notebook_data: NotebookCreate,
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Create a new notebook.

    Returns:
        The created notebook with all fields
    """
    try:
        notebook = await notebook_service.create_notebook(
            session=session,
            user_id=current_user.email,
            emoji=notebook_data.emoji,
            title=notebook_data.title,
            date=notebook_data.date,
            bg_color=notebook_data.bg_color,
            text_color=notebook_data.text_color,
            source_count=notebook_data.source_count
        )

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            source_count=notebook.source_count,
            bg_color=notebook.bg_color,
            text_color=notebook.text_color,
            created_at=notebook.created_at.isoformat() if notebook.created_at else None,
            updated_at=notebook.updated_at.isoformat() if notebook.updated_at else None
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


# CHANGE 2: Update the response_model for the `get_all_notebooks` endpoint.
@router.get("", response_model=NotebooksListResponse)
async def get_all_notebooks(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get all notebooks for the current user.

    Returns:
        List of user's notebooks wrapped in a response object.
    """
    try:
        notebooks = await notebook_service.get_notebooks_for_user(session=session, user_id=current_user.email)

        # First, prepare the list of individual notebook responses
        notebook_responses = [
            NotebookResponse(
                id=str(notebook.id),
                emoji=notebook.emoji,
                title=notebook.title,
                date=notebook.date,
                source_count=notebook.source_count,
                bg_color=notebook.bg_color,
                text_color=notebook.text_color,
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
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get a specific notebook by ID.

    Args:
        notebook_id: UUID of the notebook

    Returns:
        The notebook if found
    """
    try:
        notebook = await notebook_service.get_notebook_by_id(session=session, notebook_id=notebook_id)
        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            source_count=notebook.source_count,
            bg_color=notebook.bg_color,
            text_color=notebook.text_color,
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
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
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
            session=session,
            notebook_id=notebook_id,
            emoji=notebook_data.emoji,
            title=notebook_data.title,
            date=notebook_data.date,
            bg_color=notebook_data.bg_color,
            text_color=notebook_data.text_color,
            source_count=notebook_data.source_count
        )

        if not notebook:
            raise HTTPException(status_code=404, detail="Notebook not found")

        return NotebookResponse(
            id=str(notebook.id),
            emoji=notebook.emoji,
            title=notebook.title,
            date=notebook.date,
            source_count=notebook.source_count,
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
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Delete a notebook.

    Args:
        notebook_id: UUID of the notebook to delete

    Returns:
        Empty response with 204 status code
    """
    try:
        deleted = await notebook_service.delete_notebook(session=session, notebook_id=notebook_id)
        if not deleted:
            raise HTTPException(status_code=404, detail="Notebook not found")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")