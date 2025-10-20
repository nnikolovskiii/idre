from __future__ import annotations

import os
import tempfile
import requests
from typing import Annotated, Optional, TypedDict
from pydantic import BaseModel, Field
from dotenv import load_dotenv
from ..containers import container

from ..tools.audio_utils import transcribe_audio

load_dotenv()

class RestructuredText(BaseModel):
    text: str = Field(..., description="Enhanced transcript text")

class TranscriptionGraphState(TypedDict):
    """Represents the state of the transcription graph.

    Attributes:
        audio_path: The path or URL to the user's audio file.
        enhanced_transcript: The processed text from the audio file.
        api_key: The API key for the model.
        light_model: The model to use for enhancing transcription.
    """
    audio_path: Optional[str]
    enhanced_transcript: Optional[str]
    api_key: Optional[str]
    light_model: Optional[str]


def transcribe_and_enhance_audio_node(state: TranscriptionGraphState):
    """Transcribes and enhances audio input."""
    print("---NODE: Transcribing and Enhancing Audio---")
    fernet_service = container.fernet_service()
    audio_path = state.get("audio_path")
    light_model = state.get("light_model") or "google/gemini-2.5-flash"

    encrypt_api_key = state.get("api_key") or None

    if encrypt_api_key:
        api_key = fernet_service.decrypt_data(encrypt_api_key)
    else:
        api_key = os.getenv("OPENROUTER_API_KEY")

    if not audio_path:
        raise ValueError("Audio path must be provided.")

    if not api_key:
        raise ValueError("API key is required. Set OPENROUTER_API_KEY environment variable or pass api_key in state.")

    local_audio_path = audio_path
    temp_file_handle = None

    if audio_path.startswith(("http://", "https://")):
        print(f"   > URL detected. Downloading audio from {audio_path}...")
        try:
            response = requests.get(audio_path, stream=True)
            response.raise_for_status()
            temp_file_handle = tempfile.NamedTemporaryFile(delete=False, suffix=".ogg")
            with temp_file_handle as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            local_audio_path = temp_file_handle.name
            print(f"   > Audio downloaded to temporary file: {local_audio_path}")
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to download audio from {audio_path}. Error: {e}")

    try:
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

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
        print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")

        return {
            "enhanced_transcript": enhanced_text,
            "audio_path": None,
            "api_key": None,
            "light_model": None,
        }

    finally:
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")