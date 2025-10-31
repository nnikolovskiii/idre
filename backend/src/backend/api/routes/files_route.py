import os
import aiohttp
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, constr
from typing import Optional

from backend.api.dependencies import get_file_service, get_ai_service
from backend.models import User, File
from backend.api.routes.auth_route import get_current_user
from backend.models.dtos.chat import SendMessageRequest
from backend.models.file import ProcessingStatus
from backend.services.ai_service import AIService
from backend.services.file_service import FileService

load_dotenv()
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL")
UPLOAD_PASSWORD = os.getenv("UPLOAD_PASSWORD")
FILE_SERVICE_URL_DOCKER = os.getenv("FILE_SERVICE_URL_DOCKER")

router = APIRouter()


# --- NEW CODE START ---

class UpdateFileRequest(BaseModel):
    """
    Defines the request body for updating a file.
    All fields are optional for partial updates (PATCH).
    """
    filename: Optional[constr(min_length=1, max_length=255)] = None
    notebook_id: Optional[str] = None
    content: Optional[str] = None
    # Add other user-updatable fields here if necessary


# --- NEW CODE END ---


# Define audio MIME types
AUDIO_MIME_TYPES = {
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/wave',
    'audio/x-wav',
    'audio/ogg',
    'audio/webm',
    'audio/flac',
    'audio/aac',
    'audio/m4a',
    'audio/x-m4a',
    'audio/mp4'
}


def is_audio_file(content_type: str) -> bool:
    """Check if the file is an audio file based on content type."""
    if not content_type:
        return False
    return content_type.lower() in AUDIO_MIME_TYPES


MAX_FILE_SIZE = 100 * 1024 * 1024  # 100MB


@router.post("/upload")
async def upload_file(
        file: UploadFile = FastAPIFile(...),
        notebook_id: str = None,
        transcribe: bool = True,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service),
        ai_service: AIService = Depends(get_ai_service),
):
    if not FILE_SERVICE_URL_DOCKER or not UPLOAD_PASSWORD:
        raise HTTPException(
            status_code=500,
            detail="Server configuration error: File service URL or password not set."
        )

    # Check file size early
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size {file.size} bytes exceeds maximum allowed size of {MAX_FILE_SIZE} bytes ({MAX_FILE_SIZE / (1024 * 1024):.0f} MB)"
        )

    unique_filename = file_service.generate_unique_filename(file.filename)
    upload_url = f"{FILE_SERVICE_URL_DOCKER}/test/upload"
    headers = {'password': UPLOAD_PASSWORD}

    try:
        # Read the file content to avoid SpooledTemporaryFile serialization issues
        file_content = await file.read()

        # Reset file pointer for potential re-reads
        await file.seek(0)

        form = aiohttp.FormData()
        form.add_field(
            'file',
            file_content,
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

        docker_url = f"{FILE_SERVICE_URL_DOCKER}/test/download/{unique_filename}"

        # Only transcribe if the file is an audio file
        if is_audio_file(file.content_type) and transcribe:
            file_record: File = await file_service.create_file_record(
                user_id=str(current_user.user_id),
                filename=file.filename,
                unique_filename=unique_filename,
                url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",
                content_type=file.content_type,
                file_size_bytes=file.size,
                notebook_id=notebook_id,
                processing_status=ProcessingStatus.PROCESSING
            )

            await ai_service.transcribe_file(
                user_id=str(current_user.user_id),
                notebook_id=notebook_id,
                request=SendMessageRequest(audio_path=docker_url, file_id=str(file_record.id))
            )
        else:
            # Determine content to store: decode to text only if it's a text file
            content_to_store = None
            if file.content_type and file.content_type.startswith('text/'):
                try:
                    content_to_store = file_content.decode('utf-8')
                except UnicodeDecodeError:
                    # If decoding fails, don't store content (treat as binary)
                    content_to_store = None

            file_record: File = await file_service.create_file_record(
                user_id=str(current_user.user_id),
                filename=file.filename,
                unique_filename=unique_filename,
                url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",
                content_type=file.content_type,
                file_size_bytes=file.size,
                notebook_id=notebook_id,
                content=content_to_store
            )

        return {
            "status": "success",
            "message": "File uploaded successfully",
            "data": {
                "file_id": str(file_record.id),
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": file_record.url,
                "file_size": file_service.format_file_size(
                    file_record.file_size_bytes) if file_record.file_size_bytes else "0 B",
                "processing_status": file_record.processing_status,
                "is_audio": is_audio_file(file.content_type)
            }
        }
    except aiohttp.ClientError as e:
        raise HTTPException(status_code=502, detail=f"Network error communicating with file service: {e}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}")
async def get_user_files(
        notebook_id: str,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service)
):
    try:
        files = await file_service.get_files_for_user(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id
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
                    "file_size": file_service.format_file_size(file.file_size_bytes) if file.file_size_bytes else "0 B",
                    "processing_status": file.processing_status,
                    "thread_id": str(file.thread_id) if file.thread_id else None,
                    "run_id": file.run_id,
                    "created_at": file.created_at.isoformat() if file.created_at else None,
                    "updated_at": file.updated_at.isoformat() if file.updated_at else None,
                    "processing_result": file.processing_result if file.processing_result else None,
                    "content": file.content,
                }
                for file in files
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/download/{file_id}")
async def download_file_proxy(
        file_id: str,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service),
):
    """
    Downloads a file by proxying the request to the secure file system service.
    This ensures that the user is authenticated and authorized to access the file.
    """
    try:
        # First, verify the user owns the file by trying to retrieve it.
        # This is the authorization step. We can access the repo via the service.
        file_record = await file_service.repo.get_by_id_and_user(
            file_id=file_id, user_id=str(current_user.user_id)
        )
        if not file_record:
            raise HTTPException(
                status_code=404,
                detail="File not found or access denied"
            )

        # Check for necessary configuration
        if not FILE_SERVICE_URL_DOCKER or not UPLOAD_PASSWORD:
            raise HTTPException(
                status_code=500,
                detail="Server configuration error: File service URL or password not set."
            )

        # Construct the URL to the actual file on the file service
        download_url = f"{FILE_SERVICE_URL_DOCKER}/test/download/{file_record.unique_filename}"
        headers = {'password': UPLOAD_PASSWORD}

        http_session = aiohttp.ClientSession()
        resp = await http_session.get(download_url, headers=headers)

        if resp.status != 200:
            error_text = await resp.text()
            print(f"Error from file service for {file_record.unique_filename}: {resp.status} - {error_text}")
            await http_session.close()
            raise HTTPException(status_code=502, detail="Could not retrieve file from storage.")

        # Create an async generator to stream the content and ensure the session is closed
        async def stream_content_and_close():
            try:
                async for chunk in resp.content.iter_any():
                    yield chunk
            finally:
                await http_session.close()

        # Get the media type from the file service response
        media_type = resp.headers.get("Content-Type", "application/octet-stream")
        # Set the Content-Disposition header to suggest the original filename for download
        content_disposition = f'attachment; filename="{file_record.filename}"'

        response_headers = {
            "Content-Type": media_type,
            "Content-Disposition": content_disposition
        }

        return StreamingResponse(stream_content_and_close(), headers=response_headers)

    except aiohttp.ClientError as e:
        raise HTTPException(status_code=502, detail=f"Network error communicating with file service: {e}")
    except HTTPException:
        raise  # Re-raise our own HTTPExceptions
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


# --- NEW ENDPOINT ---
@router.patch("/{file_id}")
async def update_file_details(
        file_id: str,
        request: UpdateFileRequest,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service)
):
    """
    Update a file's details, such as its filename or notebook association.
    Only the owner of the file can perform this action.
    """
    # Create a dictionary of updates, excluding any fields that were not sent
    updates = request.dict(exclude_unset=True)

    if not updates:
        raise HTTPException(
            status_code=400,
            detail="No fields provided to update."
        )

    try:
        updated_file = await file_service.update_file(
            user_id=str(current_user.user_id),
            file_id=file_id,
            updates=updates
        )

        if not updated_file:
            raise HTTPException(
                status_code=404,
                detail="File not found or access denied"
            )

        # Return the updated file data in a consistent format
        return {
            "status": "success",
            "message": "File updated successfully",
            "data": {
                "file_id": str(updated_file.id),
                "filename": updated_file.filename,
                "unique_filename": updated_file.unique_filename,
                "url": updated_file.url,
                "content_type": updated_file.content_type,
                "file_size": file_service.format_file_size(
                    updated_file.file_size_bytes) if updated_file.file_size_bytes else "0 B",
                "processing_status": updated_file.processing_status,
                "created_at": updated_file.created_at.isoformat() if updated_file.created_at else None,
                "updated_at": updated_file.updated_at.isoformat() if updated_file.updated_at else None,
            }
        }
    except HTTPException:
        raise  # Re-raise exceptions we've already handled (like 404)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


# --- END NEW ENDPOINT ---


@router.post("/transcribe/{notebook_id}")
async def transcribe_file_endpoint(
        notebook_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user),
        ai_service: AIService = Depends(get_ai_service)
):
    try:
        await ai_service.transcribe_file(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id,
            request=request
        )
        return {"status": "success", "message": "Transcription initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.delete("/{file_id}")
async def delete_file(
        file_id: str,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service)
):
    try:
        success = await file_service.delete_file(
            user_id=str(current_user.user_id),
            file_id=file_id
        )
        if not success:
            raise HTTPException(
                status_code=404,
                detail="File not found or access denied"
            )
        return {
            "status": "success",
            "message": "File deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.get("/{notebook_id}/content")
async def get_notebook_content(
        notebook_id: str,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service)
):
    """
    Retrieve and concatenate all file contents for a notebook.
    Text files are fetched from their URLs, audio files use transcriptions.
    """
    try:
        content = await file_service.get_notebook_files_content(
            user_id=str(current_user.user_id),
            notebook_id=notebook_id
        )

        if not content:
            return {
                "status": "success",
                "message": "No files found or no content available",
                "data": {
                    "content": "",
                    "file_count": 0
                }
            }

        # Count the number of file sections in the content
        file_count = content.count("--- File:")

        return {
            "status": "success",
            "message": f"Retrieved content from {file_count} file(s)",
            "data": {
                "content": content,
                "file_count": file_count
            }
        }
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An unexpected error occurred while retrieving content: {str(e)}"
        )