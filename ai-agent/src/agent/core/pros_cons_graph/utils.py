import os
import requests
import tempfile
from .config import settings
from ...containers import container
from ...tools.audio_utils import transcribe_audio

def get_api_key(encrypted_api_key: str | None) -> str:
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)
    return settings.OPENROUTER_API_KEY

def process_audio_input_pros_cons(audio_path: str, model: str, api_key: str) -> str:
    local_audio_path = audio_path
    temp_file_handle = None

    if audio_path.startswith(("http://", "https://")):
        try:
            response = requests.get(audio_path, stream=True)
            response.raise_for_status()
            with tempfile.NamedTemporaryFile(delete=False, suffix=".ogg") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            local_audio_path = f.name
            temp_file_handle = True
        except Exception as e:
            raise ConnectionError(f"Failed to download audio: {e}")

    try:
        transcript = transcribe_audio(local_audio_path)
        return transcript
    finally:
        if temp_file_handle and os.path.exists(local_audio_path):
            os.unlink(local_audio_path)