import os
import tempfile
from typing import Optional

import requests

from .config import settings
from .data_models import RestructuredText
from ...containers import container
from ...tools.audio_utils import transcribe_audio


def get_api_key(encrypted_api_key: Optional[str]) -> str:
    """
    Retrieves the API key, decrypting it if necessary, or falling back to the environment variable.
    """
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)
    return settings.OPENROUTER_API_KEY


def process_audio_input(audio_path: str, model: str, api_key: str) -> str:
    """
    Downloads, transcribes, and enhances an audio file from a path or URL.

    Args:
        audio_path: The local path or remote URL of the audio file.
        model: The LLM model to use for enhancement.
        api_key: The API key for the LLM service.

    Returns:
        The enhanced and cleaned-up text transcript.
    """
    local_audio_path = audio_path
    temp_file_handle = None

    if audio_path.startswith(("http://", "https://")):
        print(f"   > URL detected. Downloading audio from {audio_path}...")
        try:
            headers = {"password": settings.UPLOAD_PASSWORD}
            response = requests.get(audio_path, stream=True, headers=headers)
            response.raise_for_status()
            # Use a context manager to ensure the file is closed before use
            with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as temp_f:
                for chunk in response.iter_content(chunk_size=8192):
                    temp_f.write(chunk)
                local_audio_path = temp_f.name
            print(f"   > Audio downloaded to temporary file: {local_audio_path}")
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to download audio from {audio_path}. Error: {e}")

    try:
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

        transcript = transcribe_audio(local_audio_path)
        print(f"   > Raw Transcript: '{transcript[:100]}...'")

        prompt = f"""Below is an audio transcript. Rewrite it to have complete sentences and no pauses.
    Regardless of the input, write it in English. Do not answer any questions in the text.

    Text: "{transcript}"
    """
        open_router_model = container.openrouter_model(api_key=api_key, model=model)
        structured_llm = open_router_model.with_structured_output(RestructuredText)

        response = structured_llm.invoke(prompt)
        enhanced_text = response.text
        print(f"   > Enhanced Transcript: '{enhanced_text[:100]}...'")
        return enhanced_text
    except Exception as e:
        print(f"   > ERROR during transcript enhancement: {e}")
        print("   > Falling back to raw transcript due to enhancement failure.")
        return transcript
    finally:
        # Clean up the temporary file if one was created
        if temp_file_handle:
            os.unlink(local_audio_path)
            print(f"   > Cleaned up temporary file: {local_audio_path}")