# backend/api/routes/files_route.py

import os
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

router = APIRouter()


class UpdateFileRequest(BaseModel):
    """
    Defines the request body for updating a file.
    All fields are optional for partial updates (PATCH).
    """
    filename: Optional[constr(min_length=1, max_length=255)] = None
    notebook_id: Optional[str] = None
    content: Optional[str] = None


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
    if file.size and file.size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"File size exceeds maximum allowed size"
        )

    try:
        unique_filename = file_service.generate_unique_filename(file.filename)

        # 1. Upload to S3 (SeaweedFS)
        # We pass the underlying file object to boto3
        s3_url = await file_service.upload_to_s3(
            file_obj=file.file,
            object_name=unique_filename,
            content_type=file.content_type
        )

        # 2. Handle Content Storage for Text Files
        # Since upload_fileobj consumes the stream, we might need to reset
        # OR just read it if we didn't consume it. However, since we uploaded it,
        # we can either re-read if seekable or just rely on S3.
        # For simplicity, if it's text, we read it from S3 immediately or seek if supported.
        content_to_store = None
        if file.content_type and file.content_type.startswith('text/'):
            try:
                # Try to seek back to read for DB storage
                await file.seek(0)
                file_content = await file.read()
                content_to_store = file_content.decode('utf-8')
            except Exception:
                # If seeking fails (some spooled files), fetch back from S3
                content_to_store = await file_service.get_text_content_from_s3(unique_filename)

        # 3. Determine Initial Status
        status = ProcessingStatus.PROCESSING if (
                    is_audio_file(file.content_type) and transcribe) else ProcessingStatus.COMPLETED

        file_record: File = await file_service.create_file_record(
            user_id=str(current_user.user_id),
            filename=file.filename,
            unique_filename=unique_filename,
            url=s3_url,  # Store the S3 URL
            content_type=file.content_type,
            file_size_bytes=file.size,
            notebook_id=notebook_id,
            processing_status=status,
            content=content_to_store
        )

        # 4. Trigger AI Processing with URL
        if is_audio_file(file.content_type) and transcribe:
            await ai_service.transcribe_file(
                user_id=str(current_user.user_id),
                notebook_id=notebook_id,
                file_id=str(file_record.id),
                file_url=s3_url,  # Pass URL to AI
                filename=file.filename,
                content_type=file.content_type
            )
        elif content_to_store and file.filename.startswith("message-"):
            # Existing logic for message naming
            await ai_service.generate_file_name(
                notebook_id,
                str(current_user.user_id),
                content_to_store,
                str(file_record.id)
            )

        return {
            "status": "success",
            "message": "File processed successfully",
            "data": {
                "file_id": str(file_record.id),
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": s3_url,
                "file_size": file_service.format_file_size(file.size),
                "processing_status": file_record.processing_status,
                "is_audio": is_audio_file(file.content_type)
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
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
    Downloads a file by proxying the request to S3.
    This ensures we don't expose internal SeaweedFS URLs to the client.
    """
    try:
        # 1. Verify ownership
        file_record = await file_service.repo.get_by_id_and_user(
            file_id=file_id, user_id=str(current_user.user_id)
        )
        if not file_record:
            raise HTTPException(status_code=404, detail="File not found or access denied")

        # 2. Get stream from S3 via service
        s3_stream = await file_service.get_file_stream_from_s3(file_record.unique_filename)

        # 3. Create generator for StreamingResponse
        # Note: boto3 stream is synchronous, ideally we chunk it
        def iterfile():
            # chunk size 4KB
            while True:
                chunk = s3_stream.read(4096)
                if not chunk:
                    break
                yield chunk

        # 4. Prepare headers
        media_type = file_record.content_type or "application/octet-stream"
        content_disposition = f'attachment; filename="{file_record.filename}"'

        return StreamingResponse(
            iterfile(),
            media_type=media_type,
            headers={"Content-Disposition": content_disposition}
        )

    except HTTPException:
        raise
    except Exception as e:
        print(f"Download error: {e}")
        raise HTTPException(status_code=500, detail=f"Could not retrieve file: {str(e)}")


@router.patch("/{file_id}")
async def update_file_details(
        file_id: str,
        request: UpdateFileRequest,
        current_user: User = Depends(get_current_user),
        file_service: FileService = Depends(get_file_service)
):
    updates = request.dict(exclude_unset=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided to update.")

    try:
        updated_file = await file_service.update_file(
            user_id=str(current_user.user_id),
            file_id=file_id,
            updates=updates
        )

        if not updated_file:
            raise HTTPException(status_code=404, detail="File not found or access denied")

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
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"An unexpected error occurred: {str(e)}")


@router.post("/transcribe/{notebook_id}")
async def transcribe_file_endpoint(
        notebook_id: str,
        request: SendMessageRequest,
        current_user: User = Depends(get_current_user),
        ai_service: AIService = Depends(get_ai_service),
        file_service: FileService = Depends(get_file_service)
):
    try:
        # If the request contains a file_id, we need to fetch its URL
        if request.file_id:
            file_record = await file_service.repo.get_by_id_and_user(
                file_id=request.file_id,
                user_id=str(current_user.user_id)
            )
            if not file_record:
                raise HTTPException(status_code=404, detail="File not found")

            # Pass the S3 URL to the AI service
            await ai_service.transcribe_file(
                user_id=str(current_user.user_id),
                notebook_id=notebook_id,
                file_id=request.file_id,
                file_url=file_record.url,
                filename=file_record.filename,
                content_type=file_record.content_type
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