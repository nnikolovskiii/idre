import tempfile
import os
from pathlib import Path
from openai import OpenAI
from dotenv import load_dotenv
import time
import uuid
from aiohttp import ClientTimeout
import aiohttp

load_dotenv()
api_key = os.getenv("DEEPINFRA_API_KEY")

client = OpenAI(base_url="https://api.deepinfra.com/v1/openai",
                api_key=api_key)

FILE_SERVICE_URL = os.getenv("FILE_SERVICE_URL_DOCKER")



def text_to_speech(text_input: str, speech_file_path: str):
    with client.audio.speech.with_streaming_response.create(
            model="hexgrad/Kokoro-82M",
            voice="af_bella",
            input=text_input,
            response_format="mp3",
    ) as response:
        response.stream_to_file(speech_file_path)


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


class TempFile:
    """
    A class to simulate file-like object behavior for the upload function.
    This allows us to work with the existing upload_file function without modification.
    """

    def __init__(self, file_path: str, filename: str, content_type: str = "audio/mpeg"):
        self.file_path = file_path
        self.filename = filename
        self.content_type = content_type
        self._position = 0

    async def read(self):
        """Read the entire file content as bytes"""
        with open(self.file_path, 'rb') as f:
            return f.read()

    async def seek(self, position: int):
        """Reset file pointer (no-op for our use case since we read the whole file)"""
        self._position = position


async def upload_file(file):
    """
    Upload a file to the external file service and save the metadata to the database.

    Args:
        file: A file-like object with filename, content_type, read(), and seek() methods
    """
    try:
        # Generate a unique filename for storage
        unique_filename = generate_unique_filename(file.filename)
        timeout = ClientTimeout(total=300)

        async with aiohttp.ClientSession(timeout=timeout) as session:
            form = aiohttp.FormData()
            form.add_field('file',
                           await file.read(),  # Read the file content here and pass it as bytes
                           filename=unique_filename,
                           content_type=file.content_type)

            # Reset the file pointer in case you need to use it again (good practice)
            await file.seek(0)

            # Add the password header
            headers = {
                'password': os.getenv("UPLOAD_PASSWORD")
            }

            upload_url = f"{FILE_SERVICE_URL}/test/upload"
            print(f"Attempting to upload to external service: {upload_url}")  # DEBUG LOG

            async with session.post(upload_url,
                                    data=form,
                                    headers=headers) as response:
                if response.status != 200:
                    raise Exception(f"Upload failed with status {response.status}")

                result = await response.json()
                return result,unique_filename

    except Exception as e:
        raise Exception(f"Error uploading file: {str(e)}")


async def text_to_speech_upload_file(text_input: str):
    """
    Convert text to speech, upload the audio file, and clean up temporary files.

    Args:
        text_input: The text to convert to speech

    Returns:
        The result from the upload operation
    """
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix=".mp3", delete=False) as temp_file:
        temp_file_path = temp_file.name

    try:
        # Generate speech and save to temporary file
        text_to_speech(text_input, temp_file_path)

        # Create a file-like object for upload
        temp_filename = f"speech_{int(time.time())}.mp3"
        file_obj = TempFile(temp_file_path, temp_filename, "audio/mpeg")

        # Upload the file
        result,unique_filename = await upload_file(file_obj)

        return unique_filename

    finally:
        # Always clean up the temporary file, even if an error occurs
        try:
            if os.path.exists(temp_file_path):
                os.unlink(temp_file_path)
                print(f"Temporary file {temp_file_path} deleted successfully")
        except OSError as e:
            print(f"Warning: Could not delete temporary file {temp_file_path}: {e}")

# Example usage:
# async def main():
#     try:
#         result = await text_to_speech_upload_file("Hello, this is a test message.")
#         print("Upload successful:", result)
#     except Exception as e:
#         print("Error:", e)
#
# # If running in an async context:
# import asyncio
# asyncio.run(main())