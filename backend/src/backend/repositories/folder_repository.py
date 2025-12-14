from typing import List, Optional
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.folder import Folder

class FolderRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, user_id: str, notebook_id: str, name: str, parent_id: Optional[str] = None) -> Folder:
        folder = Folder(
            user_id=user_id,
            notebook_id=notebook_id,
            name=name,
            parent_id=parent_id
        )
        self.session.add(folder)
        await self.session.flush()
        return folder

    async def list_by_notebook(self, user_id: str, notebook_id: str) -> List[Folder]:
        query = select(Folder).where(
            Folder.user_id == user_id,
            Folder.notebook_id == notebook_id
        ).order_by(Folder.name)
        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id(self, folder_id: str, user_id: str) -> Optional[Folder]:
        query = select(Folder).where(Folder.id == folder_id, Folder.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def delete(self, folder_id: str) -> bool:
        stmt = delete(Folder).where(Folder.id == folder_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0