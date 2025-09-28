# backend/services/file_service.py

import uuid
import time
from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.file import File
from backend.repositories.file_repository import FileRepository


class FileService:
    """
    Service for handling file-related business logic, such as filename
    generation and orchestration of file record creation.
    """
    def __init__(self, session: AsyncSession, file_repository: FileRepository):
        self.session = session
        self.repo = file_repository

    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """
        Format file size in bytes to human-readable format.
        (This is a utility function, making it a static method is good practice).
        """
        if size_bytes is None or size_bytes < 0:
             return "0 B"
        if size_bytes == 0:
            return "0 B"

        size_names = ["B", "KB", "MB", "GB", "TB"]
        size_index = 0
        size = float(size_bytes)

        while size >= 1024 and size_index < len(size_names) - 1:
            size /= 1024
            size_index += 1

        formatted_size = f"{size:.1f}".rstrip('0').rstrip('.')
        return f"{formatted_size} {size_names[size_index]}"

    def generate_unique_filename(self, original_filename: str) -> str:
        """
        (Business Logic) Generate a unique filename for storage.
        """
        extension = ""
        if '.' in original_filename:
            extension = original_filename.rsplit('.', 1)[1].lower()

        unique_id = f"{int(time.time())}_{uuid.uuid4().hex}"

        return f"{unique_id}.{extension}" if extension else unique_id

    async def create_file_record(
        self,
        user_id: str,
        filename: str,
        unique_filename: str,
        url: str,
        content_type: Optional[str] = None,
        file_size_bytes: Optional[int] = None,
        notebook_id: Optional[str] = None
    ) -> File:
        """
        (Orchestration) Create a file record using the repository and commit.
        """
        file_record = await self.repo.create(
            user_id=user_id,
            filename=filename,
            unique_filename=unique_filename,
            url=url,
            content_type=content_type,
            file_size_bytes=file_size_bytes,
            notebook_id=notebook_id
        )
        await self.session.commit()
        await self.session.refresh(file_record)

        return file_record

    async def get_files_for_user(self, user_id: str, notebook_id: Optional[str] = None) -> List[File]:
        """
        (Delegation) Retrieve all files for a user via the repository.
        """
        return await self.repo.list_by_user_id(user_id=user_id, notebook_id=notebook_id)