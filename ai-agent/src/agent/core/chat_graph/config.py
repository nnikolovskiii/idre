from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()


class AppSettings(BaseSettings):
    """
    Manages application-wide settings and secrets.
    """
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    # File Service URLs
    FILE_SERVICE_URL: str
    FILE_SERVICE_URL_DOCKER: str
    UPLOAD_PASSWORD: str

    # API Keys
    OPENROUTER_API_KEY: str

    # Default Model Names
    DEFAULT_HEAVY_MODEL: str = "google/gemini-pro-1.5"
    DEFAULT_LIGHT_MODEL: str = "google/gemini-flash-1.5"
    ONLINE_MODEL_SUFFIX: str = ":online"


# Create a single, importable instance of the settings
settings = AppSettings()
