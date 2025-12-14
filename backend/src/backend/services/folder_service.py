from sqlalchemy.ext.asyncio import AsyncSession
from backend.repositories.folder_repository import FolderRepository
from backend.models.folder import Folder
from typing import List, Optional


class FolderService:
    def __init__(self, session: AsyncSession, folder_repository: FolderRepository):
        self.session = session
        self.repo = folder_repository

    async def create_folder(self, user_id: str, notebook_id: str, name: str, parent_id: Optional[str] = None) -> Folder:
        folder = await self.repo.create(user_id, notebook_id, name, parent_id)
        await self.session.commit()
        await self.session.refresh(folder)
        return folder

    async def get_notebook_folders(self, user_id: str, notebook_id: str) -> List[Folder]:
        return await self.repo.list_by_notebook(user_id, notebook_id)

    async def delete_folder(self, user_id: str, folder_id: str) -> bool:
        success = await self.repo.delete(folder_id)
        if success:
            await self.session.commit()
        return success