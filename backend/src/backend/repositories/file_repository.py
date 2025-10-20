from typing import List, Optional, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from backend.models.file import File, ProcessingStatus


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
            processing_status: Optional[ProcessingStatus] = ProcessingStatus.PENDING
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
            notebook_id=notebook_id,
            processing_status=processing_status
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

    async def get_by_id_and_user(self, file_id: str, user_id: str) -> Optional[File]:
        """
        Retrieve a file by ID and user ID to verify ownership.
        """
        query = select(File).where(File.id == file_id, File.user_id == user_id)
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update(
            self,
            file_id: str,
            updates: Dict[str, Any],
            merge_processing_result: bool = False
    ) -> Optional[File]:
        """
        Update a file record with the provided updates dictionary.
        If merge_processing_result is True and 'processing_result' is in updates,
        merge it into the existing JSONB field.
        Returns the updated File instance or None if not found.
        Does not commit the transaction.
        """
        # First, fetch the existing record
        existing_query = select(File).where(File.id == file_id)
        result = await self.session.execute(existing_query)
        existing_file = result.scalars().first()

        if not existing_file:
            return None

        # Apply updates to scalar fields
        for key, value in updates.items():
            if key == 'processing_result' and merge_processing_result and isinstance(value, dict):
                # Handle JSONB merging
                if existing_file.processing_result is None:
                    existing_file.processing_result = value
                else:
                    existing_file.processing_result.update(value)
            else:
                # Direct assignment for other fields
                setattr(existing_file, key, value)

        await self.session.flush()  # Flush to update the object
        return existing_file

    async def delete(self, file_id: str) -> bool:
        """
        Delete a file record by ID.
        Returns True if deleted, False otherwise.
        Does not commit the transaction.
        """
        stmt = delete(File).where(File.id == file_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0
