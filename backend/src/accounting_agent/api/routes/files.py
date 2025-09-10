import os
import aiohttp
import asyncio
import uuid
import time
from typing import Optional, List
from fastapi import APIRouter, Depends, UploadFile, File as FastAPIFile, HTTPException
from fastapi.responses import StreamingResponse

from accounting_agent.models import User
from accounting_agent.models.file import File, ProcessingStatus
from accounting_agent.api.routes.auth import get_current_user
from accounting_agent.container import container
from accounting_agent.utils.file_processor import process_file, poll_for_results
from aiohttp import ClientTimeout
from dotenv import load_dotenv
import os

router = APIRouter()

# External file service URL
load_dotenv()
FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL")


def generate_unique_filename(original_filename: str) -> str:
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


@router.post("/upload")
async def upload_file(
        file: UploadFile = FastAPIFile(...),
        current_user: User = Depends(get_current_user)
):
    """
    Upload a file to the external file service and save the metadata to the database.
    """
    try:
        # Generate a unique filename for storage
        unique_filename = generate_unique_filename(file.filename)
        timeout = ClientTimeout(total=300)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            form = aiohttp.FormData()
            form.add_field('file',
                           await file.read(),  # <--- READ the file content here and pass it as bytes
                           filename=unique_filename,
                           content_type=file.content_type)

            # Reset the file pointer in case you need to use it again (good practice)
            await file.seek(0)

            # Add the password header
            headers = {
                'password': os.getenv("UPLOAD_PASSWORD")
            }

            upload_url = f"{FILE_SERVICE_URL}/test/upload"
            print(f"Attempting to upload to external service: {upload_url}") # DEBUG LOG

            async with session.post(upload_url,
                                    data=form,
                                    headers=headers) as response:
                if response.status != 200:
                    raise HTTPException(status_code=response.status,
                                        detail="Failed to upload file to external service")

                result = await response.json()

        # Create file record in database
        file_record = File(
            user_id=current_user.email,
            url=f"{FILE_SERVICE_URL}/test/download/{unique_filename}",  # Use unique filename in URL
            filename=file.filename,  # Store original filename
            unique_filename=unique_filename,  # Store unique filename
            content_type=file.content_type
        )

        return {
            "status": "success",
            "message": "File uploaded successfully and sent for processing",
            "data": {
                "filename": file.filename,
                "unique_filename": file_record.unique_filename,
                "url": file_record.url,
                "processing_status": file_record.processing_status
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error uploading file: {str(e)}")
