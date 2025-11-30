from dotenv import load_dotenv
from pydantic_settings import BaseSettings, SettingsConfigDict

load_dotenv()

class BrainstormSettings(BaseSettings):
    model_config = SettingsConfigDict(env_file='.env', env_file_encoding='utf-8', extra='ignore')

    OPENROUTER_API_KEY: str

    DEFAULT_HEAVY_MODEL: str = "google/gemini-2.5-pro"
    DEFAULT_LIGHT_MODEL: str = "google/gemini-2.5-flash"
    ONLINE_MODEL_SUFFIX: str = ":online"

settings = BrainstormSettings()