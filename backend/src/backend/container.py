# backend/containers.py

import os
from typing import AsyncGenerator
from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import AsyncSession
from cryptography.fernet import Fernet
from dotenv import load_dotenv
import redis.asyncio as redis

from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from backend.repositories.app_settings_repository import AppSettingsRepository
from backend.repositories.assistant_repository import AssistantRepository
from backend.repositories.chat_model_repository import ChatModelRepository
from backend.repositories.chat_repository import ChatRepository
from backend.repositories.file_repository import FileRepository
from backend.repositories.generative_model_repository import GenerativeModelRepository
from backend.repositories.model_api_repository import ModelApiRepository
from backend.repositories.notebook_model_repository import NotebookModelRepository
from backend.repositories.notebook_repository import NotebookRepository
from backend.repositories.proposition_repository import PropositionRepository
from backend.repositories.thread_repository import ThreadRepository
from backend.repositories.user_repository import UserRepository
from backend.services.ai_service import AIService
from backend.services.assistant_service import AssistantService
from backend.services.chat_model_service import ChatModelService
from backend.services.chat_service import ChatService
from backend.services.app_settings_service import AppSettingsService
from backend.services.file_service import FileService
from backend.services.generative_model_service import GenerativeModelService
from backend.services.model_api_service import ModelApiService
from backend.services.fernet_service import FernetService
from backend.services.notebook_model_service import NotebookModelService
from backend.services.proposition_service import PropositionService
from backend.services.user_service import UserService
from backend.services.password import PasswordService
from backend.services.notebook_service import NotebookService

load_dotenv()


def create_fernet() -> Fernet:
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set or is empty.")
    return Fernet(encryption_key.encode())


def create_redis_client() -> redis.Redis:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    return redis.from_url(redis_url, decode_responses=True)


class Container(containers.DeclarativeContainer):
    db = providers.Singleton(AsyncPostgreSQLDatabase)

    fernet = providers.Singleton(create_fernet)
    
    redis_client = providers.Singleton(create_redis_client)

    chat_repository = providers.Factory(ChatRepository)
    thread_repository = providers.Factory(ThreadRepository)

    fernet_service = providers.Factory(
        FernetService,
        fernet=fernet
    )

    assistant_repository = providers.Factory(AssistantRepository)

    assistant_service = providers.Factory(
        AssistantService,
        assistant_repository=assistant_repository,
    )

    model_api_repository = providers.Factory(ModelApiRepository)

    model_api_service = providers.Factory(
        ModelApiService,
        fernet_service=fernet_service,
        model_api_repository=model_api_repository,
    )

    file_repository = providers.Factory(FileRepository)

    file_service = providers.Factory(
        FileService,
        file_repository=file_repository,
    )

    generative_model_repository = providers.Factory(GenerativeModelRepository)

    generative_model_service = providers.Factory(
        GenerativeModelService,
        generative_model_repository=generative_model_repository,
    )

    proposition_repository = providers.Factory(PropositionRepository)

    proposition_service = providers.Factory(
        PropositionService,
        proposition_repository=proposition_repository,
    )

    app_settings_repository = providers.Factory(AppSettingsRepository)

    app_settings_service = providers.Factory(
        AppSettingsService,
        app_settings_repository=app_settings_repository,
    )

    notebook_model_repository = providers.Factory(NotebookModelRepository)

    notebook_model_service = providers.Factory(
        NotebookModelService,
        notebook_model_repository=notebook_model_repository,
        app_settings_service=app_settings_service,
        generative_model_service=generative_model_service,
    )

    chat_model_repository = providers.Factory(ChatModelRepository)

    chat_model_service = providers.Factory(
        ChatModelService,
        chat_model_repository=chat_model_repository,
        generative_model_service=generative_model_service,
    )

    ai_service = providers.Factory(
        AIService,
        model_api_service=model_api_service,
        notebook_model_service=notebook_model_service,
        assistant_service=assistant_service,
    )

    chat_service = providers.Factory(
        ChatService,
        model_api_service=model_api_service,
        chat_repository=chat_repository,
        thread_repository=thread_repository,
        notebook_model_service=notebook_model_service,
        chat_model_service=chat_model_service,
        assistant_service=assistant_service,
        file_service=file_service,
        ai_service=ai_service,
    )

    user_repository = providers.Factory(UserRepository)

    user_service = providers.Factory(
        UserService,
        fernet=fernet,
        user_repository=user_repository,
    )

    password_service = providers.Factory(
        PasswordService,
    )

    notebook_repository = providers.Factory(NotebookRepository)

    notebook_service = providers.Factory(
        NotebookService,
        notebook_repository=notebook_repository,
        thread_repository=thread_repository,
        notebook_model_service=notebook_model_service,
    )


container = Container()


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    session_factory = container.db().get_session_factory()

    async with session_factory() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
