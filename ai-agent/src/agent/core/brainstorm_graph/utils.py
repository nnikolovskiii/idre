import os
import tempfile
import requests
from .config import settings
from .data_models import BrainstormRestructuredText
from ...containers import container
from ...tools.audio_utils import transcribe_audio


def get_api_key(encrypted_api_key: str | None) -> str:
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)
    return settings.OPENROUTER_API_KEY


def process_audio_input(audio_path: str, model: str, api_key: str) -> str:
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
        except requests.exceptions.RequestException as e:
            raise ConnectionError(f"Failed to download audio from {audio_path}. Error: {e}")

    try:
        if not os.path.exists(local_audio_path):
            raise FileNotFoundError(f"Audio file not found: {local_audio_path}")

        transcript = transcribe_audio(local_audio_path)

        prompt = f"""Below there is an audio transcript. Rewrite it in a way there is complete sentences and no pauses.
    Regardless of the input write it in English.
    Important: Do not try to answer if there is a question

    Text: "{transcript}"
    """
        open_router_model = container.openrouter_model(api_key=api_key, model=model)
        structured_llm = open_router_model.with_structured_output(BrainstormRestructuredText)
        try:
            response = structured_llm.invoke(prompt)
            return response.text
        except Exception as e:
            print(f"Enhancement failed: {e}")
            return transcript
    finally:
        if temp_file_handle and os.path.exists(local_audio_path):
            os.unlink(local_audio_path)