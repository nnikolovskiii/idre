# backend/containers.py

import os
from typing import AsyncGenerator
from dependency_injector import containers, providers
from sqlalchemy.ext.asyncio import AsyncSession
from cryptography.fernet import Fernet
from dotenv import load_dotenv


from backend.databases.postgres_db import AsyncPostgreSQLDatabase
from backend.repositories.ai_model_repository import AIModelRepository
from backend.repositories.chat_repository import ChatRepository
from backend.repositories.file_repository import FileRepository
from backend.repositories.model_api_repository import ModelApiRepository
from backend.repositories.notebook_repository import NotebookRepository
from backend.repositories.thread_repository import ThreadRepository
from backend.services.chat_service import ChatService
from backend.services.ai_model_service import AIModelService
from backend.services.file_service import FileService
from backend.services.model_api_service import ModelApiService
from backend.services.fernet_service import FernetService
from backend.services.user import UserService
from backend.services.password import PasswordService
from backend.services.notebook_service import NotebookService

load_dotenv()


def create_fernet() -> Fernet:
    encryption_key = os.getenv("ENCRYPTION_KEY")
    if not encryption_key:
        raise ValueError("ENCRYPTION_KEY environment variable is not set or is empty.")
    return Fernet(encryption_key.encode())


class Container(containers.DeclarativeContainer):

    db = providers.Singleton(AsyncPostgreSQLDatabase)

    fernet = providers.Singleton(create_fernet)

    chat_repository = providers.Factory(ChatRepository)
    thread_repository = providers.Factory(ThreadRepository)

    fernet_service = providers.Factory(
        FernetService,
        fernet=fernet
    )

    ai_model_repository = providers.Factory(AIModelRepository)

    # Update ai_model_service factory
    ai_model_service = providers.Factory(
        AIModelService,
        # session will be injected by the dependency provider
        ai_model_repository=ai_model_repository,
    )
    # Add factory for the new repository
    model_api_repository = providers.Factory(ModelApiRepository)

    # Update the factory for the ModelApiService
    model_api_service = providers.Factory(
        ModelApiService,
        fernet_service=fernet_service,
        model_api_repository=model_api_repository,
    )

    notebook_repository = providers.Factory(NotebookRepository)

    # Add the factory for the NotebookService
    notebook_service = providers.Factory(
        NotebookService,
        notebook_repository=notebook_repository,
        thread_repository=thread_repository,  # Inject ThreadRepository
    )

    # Add factory for the new repository
    file_repository = providers.Factory(FileRepository)

    # Add/Update the factory for the FileService
    file_service = providers.Factory(
        FileService,
        # session will be injected by the dependency provider
        file_repository=file_repository,
    )


    chat_service = providers.Factory(
        ChatService,
        ai_model_service=ai_model_service,
        model_api_service=model_api_service,
        chat_repository=chat_repository,
        thread_repository=thread_repository,
    )

    user_service = providers.Factory(
        UserService,
        fernet=fernet
    )

    password_service = providers.Factory(
        PasswordService,
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