import os
import base64
import tempfile
from .config import settings
from ...containers import container


def get_api_key(encrypted_api_key: str | None) -> str:
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)
    return settings.OPENROUTER_API_KEY


def decode_audio_to_temp(base64_data: str, original_filename: str) -> str:
    audio_bytes = base64.b64decode(base64_data)
    ext = os.path.splitext(original_filename)[1] or '.tmp'

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as f:
        f.write(audio_bytes)
        return f.name