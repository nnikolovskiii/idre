import os

from cryptography.fernet import Fernet
from dotenv import load_dotenv
from dependency_injector import containers, providers
from langchain_openai import ChatOpenAI

from agent.services.fernet_service import FernetService

load_dotenv()


def create_fernet():
    """Factory function to create Fernet instance with environment validation"""
    load_dotenv()
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set.")
    return Fernet(encryption_key.encode())  # Ensure proper encoding


def create_openrouter_model(api_key: str, model: str):
    """Factory function to create OpenRouter ChatOpenAI instance"""
    if not api_key:
        raise ValueError("API key is required for OpenRouter model")
    return ChatOpenAI(
        api_key=api_key,
        base_url="https://openrouter.ai/api/v1",
        model=model
    )


def create_openai_model(api_key: str, model: str):
    """Factory function to create OpenAI ChatOpenAI instance"""
    if not api_key:
        raise ValueError("API key is required for OpenAI model")
    return ChatOpenAI(
        api_key=api_key,
        model=model
    )


class Container(containers.DeclarativeContainer):
    # Use the async version of the PostgreSQL database provider
    fernet = providers.Singleton(create_fernet)

    fernet_service = providers.Factory(
        FernetService,
        fernet=fernet
    )

    # OpenRouter ChatOpenAI provider - parameters will be passed at call time
    openrouter_model = providers.Factory(create_openrouter_model)

    # OpenAI ChatOpenAI provider - parameters will be passed at call time
    openai_model = providers.Factory(create_openai_model)

container = Container()
