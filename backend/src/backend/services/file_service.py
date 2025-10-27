# backend/services/file_service.py

import os
import uuid
import time
from typing import List, Optional, Dict, Any

import aiohttp
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.file import File, ProcessingStatus
from backend.repositories.file_repository import FileRepository

load_dotenv()
docker_files_url = os.getenv("FILE_SERVICE_URL_DOCKER")
files_url = os.getenv("FILE_SERVICE_URL")
upload_password = os.getenv("UPLOAD_PASSWORD")


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
            notebook_id: Optional[str] = None,
            processing_status: Optional[ProcessingStatus] = ProcessingStatus.PENDING
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
            notebook_id=notebook_id,
            processing_status=processing_status
        )
        await self.session.commit()
        await self.session.refresh(file_record)

        return file_record

    async def get_files_for_user(self, user_id: str, notebook_id: Optional[str] = None) -> List[File]:
        """
        (Delegation) Retrieve all files for a user via the repository.
        """
        return await self.repo.list_by_user_id(user_id=user_id, notebook_id=notebook_id)

    async def update_file(
            self,
            user_id: str,  # <-- ADDED: For security check
            file_id: str,
            updates: Dict[str, Any],
            merge_processing_result: bool = False
    ) -> Optional[File]:
        """
        (Orchestration) Update a file record for a specific user.
        First verifies ownership, then applies the updates.
        If 'processing_result' is in updates and merge_processing_result is True,
        it will be merged into the existing result.
        Commits the changes.
        """
        # --- MODIFICATION START ---
        # First, verify the user owns the file.
        file_to_update = await self.repo.get_by_id_and_user(file_id=file_id, user_id=user_id)
        if not file_to_update:
            return None  # Return None if not found or not owned by user
        # --- MODIFICATION END ---

        file_record = await self.repo.update(
            file_id=file_id,
            updates=updates,
            merge_processing_result=merge_processing_result
        )

        if file_record:
            await self.session.commit()
            await self.session.refresh(file_record)

        return file_record

    async def delete_file(self, user_id: str, file_id: str) -> bool:
        """
        (Orchestration) Delete a file record for the user.
        Returns True if successful, False if not found or unauthorized.
        """
        # Fetch the file to verify ownership
        file_record = await self.repo.get_by_id_and_user(file_id=file_id, user_id=user_id)
        if not file_record:
            return False

        # Delete from DB
        success = await self.repo.delete(file_id=file_id)
        if success:
            await self.session.commit()
        return success

    async def get_notebook_files_content(self, user_id: str, notebook_id: str) -> str:
        """
        Retrieve and concatenate all file contents for a given notebook.

        For text files: fetches content from the URL
        For audio files: extracts transcription from processing_result if available

        Args:
            user_id: The user ID to verify ownership
            notebook_id: The notebook ID to fetch files for

        Returns:
            A concatenated string of all file contents, separated by newlines
        """
        # Get all files for this notebook and user (for security)
        files = await self.repo.list_by_user_id(user_id=user_id, notebook_id=notebook_id)

        if not files:
            return ""

        content_parts = []

        # Prepare the headers for the file service request
        if not upload_password:
            print("Error: UPLOAD_PASSWORD environment variable not set. File fetching will likely fail.")
            headers = {}
        else:
            headers = {"password": upload_password}

        async with aiohttp.ClientSession() as session:
            for file in files:
                new_url = file.url.replace(files_url, docker_files_url)
                try:
                    # Determine if file is text or audio based on content_type
                    if file.content_type and file.content_type.startswith('text/'):
                        # Text file: fetch content from URL, including the auth password
                        async with session.get(new_url, headers=headers) as response:
                            if response.status == 200:
                                text_content = await response.text()
                                content_parts.append(f"--- File: {file.filename} ---\n{text_content}")
                            else:
                                print(f"Error fetching file {file.filename}: Status {response.status}")


                    elif file.content_type and file.content_type.startswith('audio/'):
                        # Audio file: get transcription from processing_result
                        if file.processing_result and isinstance(file.processing_result, dict):
                            transcription = file.processing_result.get('transcription')
                            if transcription:
                                content_parts.append(f"--- File: {file.filename} (Transcription) ---\n{transcription}")

                except Exception as e:
                    # Log error but continue processing other files
                    print(f"Error processing file {file.filename}: {str(e)}")
                    continue

        # Join all content parts with double newlines for separation
        return "\n\n".join(content_parts)