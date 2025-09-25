from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.models.file import File
import uuid
import time


def format_file_size(size_bytes: int) -> str:
    """
    Format file size in bytes to human-readable format.

    Args:
        size_bytes: File size in bytes

    Returns:
        Human-readable file size string (e.g., "1.2 MB", "500 KB", "2.1 GB")
    """
    if size_bytes == 0:
        return "0 B"

    size_names = ["B", "KB", "MB", "GB", "TB"]
    size_index = 0
    size = float(size_bytes)

    while size >= 1024 and size_index < len(size_names) - 1:
        size /= 1024
        size_index += 1

    # Format to 1 decimal place, remove trailing zeros
    formatted_size = f"{size:.1f}".rstrip('0').rstrip('.')
    return f"{formatted_size} {size_names[size_index]}"


class FileService:
    def generate_unique_filename(self, original_filename: str) -> str:
        """
        Generate a unique filename for storage while preserving the file extension.

        Args:
            original_filename: The original filename provided by the user

        Returns:
            A unique filename that can be safely used in URLs and paths
        """
        # Extract the file extension if it exists
        if '.' in original_filename:
            extension = original_filename.rsplit('.', 1)[1].lower()
        else:
            extension = ""

        # Generate a unique identifier using timestamp and UUID
        unique_id = f"{int(time.time())}_{uuid.uuid4().hex}"

        # Create the unique filename with the original extension
        if extension:
            unique_filename = f"{unique_id}.{extension}"
        else:
            unique_filename = unique_id

        return unique_filename

    async def create_file_record(self, session: AsyncSession, user_id: str, filename: str,
                                unique_filename: str, url: str, content_type: str = None,
                                file_size_bytes: int = None) -> File:
        """
        Create and save a file record to the database.

        Args:
            session: Database session
            user_id: ID of the user uploading the file
            filename: Original filename
            unique_filename: Unique filename for storage
            url: File URL
            content_type: MIME type of the file
            file_size_bytes: File size in bytes

        Returns:
            The created File object
        """
        file_record = File(
            user_id=user_id,
            url=url,
            filename=filename,
            unique_filename=unique_filename,
            content_type=content_type,
            file_size_bytes=file_size_bytes
        )

        session.add(file_record)
        await session.commit()
        await session.refresh(file_record)

        return file_record

    async def get_files_for_user(self, session: AsyncSession, user_id: str) -> list[File]:
        """
        Retrieve all files for a specific user.

        Args:
            session: Database session
            user_id: ID of the user to get files for

        Returns:
            List of File objects for the user
        """
        result = await session.execute(
            select(File).where(File.user_id == user_id).order_by(File.created_at.desc())
        )
        return result.scalars().all()
