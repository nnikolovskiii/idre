# backend/repositories/file_repository.py

from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.file import File


class FileRepository:
    """
    Handles data access logic for the File entity.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        filename: str,
        unique_filename: str,
        url: str,
        content_type: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        notebook_id: Optional[str] = None,
    ) -> File:
        """
        Creates a new File object and adds it to the session.
        Does not commit the transaction.
        """
        file_record = File(
            user_id=user_id,
            url=url,
            filename=filename,
            unique_filename=unique_filename,
            content_type=content_type,
            file_size_bytes=file_size_bytes,
            notebook_id=notebook_id
        )
        self.session.add(file_record)
        await self.session.flush()  # Send data to DB to get defaults/IDs
        return file_record

    async def list_by_user_id(self, user_id: str, notebook_id: Optional[str] = None) -> List[File]:
        """
        Retrieve all files for a specific user, optionally filtered by notebook,
        ordered by most recent.
        """
        query = select(File).where(File.user_id == user_id)

        if notebook_id:
            query = query.where(File.notebook_id == notebook_id)

        query = query.order_by(File.created_at.desc())
        result = await self.session.execute(query)
        return result.scalars().all()