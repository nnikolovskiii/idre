from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional

from backend.api.routes.auth_route import get_current_user
from backend.api.dependencies import get_folder_service # <--- Imported dependency
from backend.models import User
from backend.services.folder_service import FolderService

router = APIRouter()

class CreateFolderRequest(BaseModel):
    notebook_id: str
    name: str
    parent_id: Optional[str] = None

@router.get("/{notebook_id}")
async def get_folders(
    notebook_id: str,
    current_user: User = Depends(get_current_user),
    folder_service: FolderService = Depends(get_folder_service) # <--- Injected
):
    folders = await folder_service.get_notebook_folders(str(current_user.user_id), notebook_id)
    return {
        "status": "success",
        "data": [
            {"id": str(f.id), "name": f.name, "parent_id": str(f.parent_id) if f.parent_id else None}
            for f in folders
        ]
    }

@router.post("/")
async def create_folder(
    req: CreateFolderRequest,
    current_user: User = Depends(get_current_user),
    folder_service: FolderService = Depends(get_folder_service) # <--- Injected
):
    folder = await folder_service.create_folder(str(current_user.user_id), req.notebook_id, req.name, req.parent_id)
    return {
        "status": "success",
        "data": {"id": str(folder.id), "name": folder.name, "parent_id": str(folder.parent_id) if folder.parent_id else None}
    }