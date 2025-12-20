import os
import base64
import tempfile
import requests
from .config import settings
from ...containers import container


# In utils.py
def get_api_key(encrypted_api_key: str | None) -> str:
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)

    # Fallback to Master Key so the Proxy accepts the request
    return os.getenv("LITELLM_MASTER_KEY")


def decode_audio_to_temp(base64_data: str, original_filename: str) -> str:
    """Decodes base64 audio data to a temporary file."""
    audio_bytes = base64.b64decode(base64_data)

    ext = os.path.splitext(original_filename)[1]
    if not ext:
        ext = '.webm'

    with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as f:
        f.write(audio_bytes)
        return f.name


def download_file_from_url(url: str, original_filename: str) -> str:
    """Downloads a file from a URL to a temporary file."""
    print(f"   > Downloading audio from: {url}")

    ext = os.path.splitext(original_filename)[1]
    if not ext:
        # Default fallback, though usually filename has extension
        ext = '.webm'

    try:
        # Stream the download to handle potential large files
        response = requests.get(url, stream=True)
        response.raise_for_status()

        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
            return f.name
    except Exception as e:
        raise ConnectionError(f"Failed to download audio from {url}. Error: {e}")