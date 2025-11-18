from __future__ import annotations

import os
import tempfile
import base64  # <-- Import base64
from typing import Optional, TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ..containers import container
from ..tools.audio_utils import transcribe_audio

load_dotenv()


class RestructuredText(BaseModel):
    text: str = Field(..., description="Enhanced transcript text")


class FileName(BaseModel):
    file_name: str = Field(..., description="File name suggestion")


class TranscriptionGraphState(TypedDict):
    """Represents the state of the transcription graph.

    This version is designed to handle in-memory audio data encoded as Base64.

    Attributes:
        audio_data_base64: The raw audio data, encoded as a Base64 string.
        filename: The original filename of the audio file.
        enhanced_transcript: The processed text from the audio file.
        api_key: The API key for the model.
        light_model: The model to use for enhancing transcription.
        file_name: The suggested filename generated from the transcript.
    """
    audio_data_base64: Optional[str]
    filename: Optional[str]
    enhanced_transcript: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]
    file_name: Optional[str]


def transcribe_and_enhance_audio_node(state: TranscriptionGraphState):
    """
    Decodes Base64 audio data, transcribes it, and enhances the transcript.
    """
    print("---NODE: Transcribing and Enhancing Audio (In-Memory)---")
    fernet_service = container.fernet_service()

    # --- Get new inputs from state ---
    audio_data_base64 = state.get("audio_data_base64")
    filename = state.get("filename")  # Filename is needed for the transcription tool
    light_model = state.get("light_model") or "google/gemini-2.5-flash"
    encrypt_api_key = state.get("api_key") or None

    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not audio_data_base64 or not filename:
        raise ValueError("audio_data_base64 and filename must be provided in the state.")

    if not api_key:
        raise ValueError("API key is required.")

    # --- Decode data and write to a temporary file ---
    temp_file_handle = None
    local_audio_path = None
    try:
        # Decode the Base64 string back to bytes
        audio_bytes = base64.b64decode(audio_data_base64)

        # Get a file extension from the original filename to help transcription tools
        file_extension = os.path.splitext(filename)[1] or '.tmp'

        # Create a temporary file to hold the audio bytes
        temp_file_handle = tempfile.NamedTemporaryFile(delete=False, suffix=file_extension)
        temp_file_handle.write(audio_bytes)
        local_audio_path = temp_file_handle.name
        temp_file_handle.close()  # Close the file handle so other processes can access it
        print(f"   > Audio data decoded to temporary file: {local_audio_path}")

        # --- Transcribe and enhance ---
        transcript = transcribe_audio(local_audio_path)
        print(f"   > Raw Transcript: '{transcript[:100]}...'")

        prompt = f"""Below is an audio transcript. Rewrite it to form complete sentences with no pauses.
        Write in English regardless of the input language.

        Important:
        Do not answer any questions in the transcript.

        Text:
        "{transcript}"
        """

        open_router_model = container.openrouter_model(api_key=api_key, model=light_model)
        structured_llm = open_router_model.with_structured_output(RestructuredText)
        response: RestructuredText = structured_llm.invoke(prompt)
        enhanced_text = response.text

        file_name_prompt = f"""Below a file content. Suggest a name for the file based on the content.

        Important:
        - Do not add extension to the file name.
        - Make the name all lowercase and instead of spaces use underscores.

        Text:
        "{enhanced_text}"
        """

        file_name_structured_llm = open_router_model.with_structured_output(FileName)
        response: FileName = file_name_structured_llm.invoke(file_name_prompt)
        file_name = response.file_name

        print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")

        return {
            "enhanced_transcript": enhanced_text,
            "file_name": file_name,
            "audio_data_base64": None,
            "filename": None,
            "api_key": None,
            "light_model": None,
        }

    finally:
        # --- Clean up the temporary file ---
        if local_audio_path and os.path.exists(local_audio_path):
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")
