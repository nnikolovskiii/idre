# backend/services/file_service.py

import os
import uuid
import time
import asyncio
from typing import List, Optional, Dict, Any, BinaryIO

from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.file import File, ProcessingStatus
from backend.repositories.file_repository import FileRepository

load_dotenv()

# Configuration
S3_ENDPOINT = os.getenv("S3_ENDPOINT_URL", "http://seaweedfs:8333")
BUCKET_NAME = os.getenv("BUCKET_NAME", "my-local-bucket")


class FileService:
    """
    Service for handling file-related business logic, including S3 storage orchestration.
    """

    def __init__(self, session: AsyncSession, file_repository: FileRepository, s3_client=None):
        self.session = session
        self.repo = file_repository
        self.s3_client = s3_client

    @staticmethod
    def format_file_size(size_bytes: int) -> str:
        """Format file size in bytes to human-readable format."""
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
        """Generate a unique filename for storage."""
        extension = ""
        if '.' in original_filename:
            extension = original_filename.rsplit('.', 1)[1].lower()

        unique_id = f"{int(time.time())}_{uuid.uuid4().hex}"
        return f"{unique_id}.{extension}" if extension else unique_id

    async def upload_to_s3(self, file_obj: BinaryIO, object_name: str, content_type: str) -> str:
        """
        Uploads a file object to S3 (SeaweedFS).
        Returns the internal URL.
        """
        if not self.s3_client:
            raise ValueError("S3 Client not configured")

        def _upload_sync():
            # 1. Ensure bucket exists (idempotent-ish)
            try:
                self.s3_client.head_bucket(Bucket=BUCKET_NAME)
            except Exception:
                try:
                    self.s3_client.create_bucket(Bucket=BUCKET_NAME)
                except Exception as e:
                    print(f"Error creating bucket (might already exist): {e}")

            # 2. Upload file
            # Note: upload_fileobj automatically handles multipart uploads for large files
            self.s3_client.upload_fileobj(
                file_obj,
                BUCKET_NAME,
                object_name,
                ExtraArgs={'ContentType': content_type}
            )

        # Run synchronous boto3 code in a separate thread to not block the async event loop
        loop = asyncio.get_running_loop()
        await loop.run_in_executor(None, _upload_sync)

        # Construct the URL (Internal Docker URL)
        # We store this URL so the AI agent (running in Docker) can reach it.
        file_url = f"{S3_ENDPOINT}/{BUCKET_NAME}/{object_name}"
        return file_url

    async def get_file_stream_from_s3(self, unique_filename: str):
        """
        Returns a stream (Body) of the file from S3.
        Useful for proxying downloads to the frontend.
        """
        if not self.s3_client:
            raise ValueError("S3 Client not configured")

        def _get_sync():
            return self.s3_client.get_object(Bucket=BUCKET_NAME, Key=unique_filename)

        loop = asyncio.get_running_loop()
        response = await loop.run_in_executor(None, _get_sync)
        return response['Body']

    async def get_text_content_from_s3(self, unique_filename: str) -> str:
        """
        Downloads a text file from S3 and returns it as a string.
        """
        if not self.s3_client:
            return ""

        def _read_sync():
            try:
                obj = self.s3_client.get_object(Bucket=BUCKET_NAME, Key=unique_filename)
                return obj['Body'].read().decode('utf-8')
            except Exception as e:
                print(f"Error reading text from S3 ({unique_filename}): {e}")
                return ""

        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, _read_sync)

    async def create_file_record(
            self,
            user_id: str,
            filename: str,
            unique_filename: str,
            url: Optional[str] = None,
            content_type: Optional[str] = None,
            file_size_bytes: Optional[int] = None,
            notebook_id: Optional[str] = None,
            processing_status: Optional[ProcessingStatus] = ProcessingStatus.PENDING,
            content: Optional[str] = None
    ) -> File:
        """Create a file record in the database."""
        file_record = await self.repo.create(
            user_id=user_id,
            filename=filename,
            unique_filename=unique_filename,
            url=url,
            content_type=content_type,
            file_size_bytes=file_size_bytes,
            notebook_id=notebook_id,
            processing_status=processing_status,
            content=content
        )
        await self.session.commit()
        await self.session.refresh(file_record)
        return file_record

    async def get_files_for_user(self, user_id: str, notebook_id: Optional[str] = None) -> List[File]:
        """Retrieve all files for a user."""
        return await self.repo.list_by_user_id(user_id=user_id, notebook_id=notebook_id)

    async def update_file(
            self,
            user_id: str,
            file_id: str,
            updates: Dict[str, Any],
            merge_processing_result: bool = False,
    ) -> Optional[File]:
        """Update a file record."""
        file_to_update = await self.repo.get_by_id_and_user(file_id=file_id, user_id=user_id)
        if not file_to_update:
            return None
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
        """Delete a file record and the S3 object."""
        file_record = await self.repo.get_by_id_and_user(file_id=file_id, user_id=user_id)
        if not file_record:
            return False

        # 1. Delete from S3 (Best effort)
        if self.s3_client and file_record.unique_filename:
            try:
                loop = asyncio.get_running_loop()
                await loop.run_in_executor(
                    None,
                    lambda: self.s3_client.delete_object(Bucket=BUCKET_NAME, Key=file_record.unique_filename)
                )
            except Exception as e:
                print(f"Warning: Failed to delete S3 object {file_record.unique_filename}: {e}")

        # 2. Delete from DB
        success = await self.repo.delete(file_id=file_id)
        if success:
            await self.session.commit()
        return success

    async def get_notebook_files_content(self, user_id: str, notebook_id: str) -> str:
        """
        Retrieve and concatenate all file contents for a given notebook.
        Fetches text directly from S3, or transcriptions from the DB.
        """
        files = await self.repo.list_by_user_id(user_id=user_id, notebook_id=notebook_id)
        if not files:
            return ""

        content_parts = []
        for file in files:
            try:
                # Text files: fetch content from S3
                if file.content_type and file.content_type.startswith('text/'):
                    text_content = await self.get_text_content_from_s3(file.unique_filename)
                    if text_content:
                        content_parts.append(f"--- File: {file.filename} ---\n{text_content}")

                # Audio files: use stored transcription
                elif file.content_type and file.content_type.startswith('audio/'):
                    if file.processing_result and isinstance(file.processing_result, dict):
                        transcription = file.processing_result.get('transcription')
                        if transcription:
                            content_parts.append(f"--- File: {file.filename} (Transcription) ---\n{transcription}")

            except Exception as e:
                print(f"Error processing file {file.filename} for notebook context: {str(e)}")
                continue

        return "\n\n".join(content_parts)