import os
import aiohttp
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException

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

router = APIRouter()

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
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service),
        ai_service: AIService = Depends(get_ai_service)
):
    if not FILE_SERVICE_URL or not UPLOAD_PASSWORD:
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
    upload_url = f"{FILE_SERVICE_URL}/test/upload"
    headers = {'password': UPLOAD_PASSWORD}

    try:
        form = aiohttp.FormData()
        form.add_field(
            'file',
            file.file,
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

        # Only transcribe if the file is an audio file
        if is_audio_file(file.content_type):
            file_record: File = await file_service.create_file_record(
                user_id=current_user.email,
                filename=file.filename,
                unique_filename=unique_filename,
                url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",
                content_type=file.content_type,
                file_size_bytes=file.size,
                notebook_id=notebook_id,
                processing_status=ProcessingStatus.PROCESSING
            )

            await ai_service.transcribe_file(
                user_id=current_user.email,
                notebook_id=notebook_id,
                request=SendMessageRequest(audio_path=file_record.url, file_id=str(file_record.id))
            )
        else:
            file_record: File = await file_service.create_file_record(
                user_id=current_user.email,
                filename=file.filename,
                unique_filename=unique_filename,
                url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",
                content_type=file.content_type,
                file_size_bytes=file.size,
                notebook_id=notebook_id
            )

        return {
            "status": "success",
            "message": "File uploaded successfully",
            "data": {
                "file_id": str(file_record.id),
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": file_record.url,
                "file_size": file_service.format_file_size(file_record.file_size_bytes) if file_record.file_size_bytes else "0 B",
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
            user_id=current_user.email,
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
                    "processing_result": file.processing_result if file.processing_result else None
            }
                for file in files
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/transcribe/{notebook_id}")
async def transcribe_file_endpoint(
        notebook_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user),
        ai_service: AIService = Depends(get_ai_service)
):
    try:
        await ai_service.transcribe_file(
            user_id=current_user.email,
            notebook_id=notebook_id,
            request=request
        )
        return {"status": "success", "message": "Transcription initiated"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")
