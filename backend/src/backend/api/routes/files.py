# backend/api/routes/upload.py

import os
import aiohttp
from dotenv import load_dotenv
from sqlalchemy.ext.asyncio import AsyncSession
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException

from backend.models import User
from backend.api.routes.auth import get_current_user
# CORRECTED: Import the get_session dependency function, not the whole class
from backend.databases.postgres_db import get_session
from backend.services.file_service import FileService, format_file_size

file_service = FileService()

# Load environment variables
load_dotenv()
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL")
UPLOAD_PASSWORD = os.getenv("UPLOAD_PASSWORD")

router = APIRouter()


@router.post("/upload")
async def upload_file(
        file: UploadFile = FastAPIFile(...),
        current_user: User = Depends(get_current_user),
        # CORRECTED: Inject the session directly using the dependency
        session: AsyncSession = Depends(get_session)
):
    """
    Upload a file to an external service and save metadata to the database.
    This endpoint now correctly uses a dependency for session management and
    streams the file upload for better memory efficiency.
    """
    if not FILE_SERVICE_URL or not UPLOAD_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: File service URL or password not set."
        )

    unique_filename = file_service.generate_unique_filename(file.filename)
    upload_url = f"{FILE_SERVICE_URL}/test/upload"
    headers = {'password': UPLOAD_PASSWORD}

    # Use a try/except block for the network request and other logic.
    # The database transaction (commit/rollback) is handled automatically
    # by the `get_session` dependency.
    try:
        # IMPROVED: Stream the file upload instead of reading it all into memory.
        form = aiohttp.FormData()
        form.add_field(
            'file',
            file.file,  # Pass the file-like object directly
            filename=unique_filename,
            content_type=file.content_type
        )

        timeout = aiohttp.ClientTimeout(total=300)
        async with aiohttp.ClientSession(timeout=timeout) as http_session:
            async with http_session.post(upload_url, data=form, headers=headers) as response:
                if response.status != 200:
                    response_text = await response.text()
                    raise HTTPException(
                        status_code=response.status,
                        detail=f"Failed to upload file to external service: {response_text}"
                    )

        file_record = await file_service.create_file_record(
            session=session,
            user_id=current_user.email,
            filename=file.filename,
            unique_filename=unique_filename,
            url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",
            content_type=file.content_type,
            file_size_bytes=file.size
        )

        # NOTE: The session.commit() is handled by the `get_session` dependency upon successful exit.

        return {
            "status": "success",
            "message": "File uploaded successfully",
            "data": {
                "file_id": str(file_record.id),
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": file_record.url,
                "file_size": format_file_size(file_record.file_size_bytes) if file_record.file_size_bytes else "0 B",
                "processing_status": file_record.processing_status
            }
        }
    except aiohttp.ClientError as e:
        # Handle network-specific errors
        raise HTTPException(status_code=502, detail=f"Network error communicating with file service: {e}")
    except Exception as e:
        # Catch any other unexpected errors.
        # The `get_session` dependency will have already rolled back the transaction.
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/files")
async def get_user_files(
        current_user: User = Depends(get_current_user),
        session: AsyncSession = Depends(get_session)
):
    """
    Get all files for the current user.

    Returns:
        List of file records for the authenticated user
    """
    try:
        files = await file_service.get_files_for_user(
            session=session,
            user_id=current_user.email
        )

        return {
            "status": "success",
            "message": f"Retrieved {len(files)} files",
            "data": [
                {
                    "file_id": str(file.id),
                    "filename": file.filename,
                    "unique_filename": file.unique_filename,
                    "url": file.url,
                    "content_type": file.content_type,
                    "file_size": format_file_size(file.file_size_bytes) if file.file_size_bytes else "0 B",
                    "processing_status": file.processing_status,
                    "thread_id": str(file.thread_id) if file.thread_id else None,
                    "run_id": file.run_id,
                    "created_at": file.created_at.isoformat() if file.created_at else None,
                    "updated_at": file.updated_at.isoformat() if file.updated_at else None
                }
                for file in files
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
