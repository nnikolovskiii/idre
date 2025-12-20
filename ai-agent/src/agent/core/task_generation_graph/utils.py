import os

from .config import settings
from ...containers import container


# In utils.py
def get_api_key(encrypted_api_key: str | None) -> str:
    if encrypted_api_key:
        fernet_service = container.fernet_service()
        return fernet_service.decrypt_data(encrypted_api_key)

    # Fallback to Master Key so the Proxy accepts the request
    return os.getenv("LITELLM_MASTER_KEY")