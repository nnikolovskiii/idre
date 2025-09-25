from cryptography.fernet import Fernet
from dotenv import load_dotenv

from backend.auth.services.password import PasswordService
from backend.auth.services.user import UserService
from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from backend.services.chat import ChatService
from backend.services.ai_model_service import AIModelService
from backend.services.default_ai_model_service import DefaultAIModelService
from backend.services.fernet_service import FernetService
from backend.services.model_api_service import ModelApiService
import os
from dependency_injector import containers, providers


load_dotenv()



def create_fernet():
    """Factory function to create Fernet instance with environment validation"""
    load_dotenv()
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set.")
    return Fernet(encryption_key.encode())  # Ensure proper encoding


class Container(containers.DeclarativeContainer):
    # Use the async version of the PostgreSQL database provider
    postgres_db = providers.Singleton(AsyncPostgreSQLDatabase)
    
    fernet = providers.Singleton(create_fernet)

    fernet_service = providers.Factory(
        FernetService,
        fernet=fernet
    )

    user_service = providers.Factory(
        UserService,
        postgres_db=postgres_db,
        fernet=fernet
    )

    password_service = providers.Factory(
        PasswordService,
    )
    
    chat_service = providers.Factory(
        ChatService,
        db=postgres_db
    )
    
    ai_model_service = providers.Factory(
        AIModelService,
        db=postgres_db
    )
    
    default_ai_model_service = providers.Factory(
        DefaultAIModelService,
        db=postgres_db
    )

    model_api_service = providers.Factory(
        ModelApiService,
        db=postgres_db,
        fernet_service=fernet_service
    )


container = Container()
