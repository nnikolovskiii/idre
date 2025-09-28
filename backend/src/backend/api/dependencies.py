from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from backend.container import container, get_db_session
from backend.repositories.ai_model_repository import AIModelRepository
from backend.repositories.chat_repository import ChatRepository
from backend.repositories.file_repository import FileRepository
from backend.repositories.model_api_repository import ModelApiRepository
from backend.repositories.notebook_repository import NotebookRepository
from backend.repositories.thread_repository import ThreadRepository
from backend.services.ai_model_service import AIModelService
from backend.services.fernet_service import FernetService
from backend.services.file_service import FileService
from backend.services.model_api_service import ModelApiService
from backend.services.chat_service import ChatService
from backend.services.notebook_service import NotebookService


def get_ai_model_repository(
    session: AsyncSession = Depends(get_db_session)
) -> AIModelRepository:
    return container.ai_model_repository(session=session)

# --- Update the Provider for AIModelService ---
def get_ai_model_service(
    session: AsyncSession = Depends(get_db_session),
    ai_model_repo: AIModelRepository = Depends(get_ai_model_repository)
) -> AIModelService:
    return container.ai_model_service(
        session=session,
        ai_model_repository=ai_model_repo
    )


# --- Provider for ModelApiService ---
def get_model_api_service(
    session: AsyncSession = Depends(get_db_session)
) -> ModelApiService:
    return container.model_api_service(session=session)


def get_chat_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ChatRepository:
    return container.chat_repository(session=session)

def get_thread_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ThreadRepository:
    return container.thread_repository(session=session)


# --- Update the Provider for ChatService ---
def get_chat_service(
    session: AsyncSession = Depends(get_db_session),
    chat_repo: ChatRepository = Depends(get_chat_repository),
    thread_repo: ThreadRepository = Depends(get_thread_repository),
    ai_model_service: AIModelService = Depends(get_ai_model_service),
    model_api_service: ModelApiService = Depends(get_model_api_service),
) -> ChatService:
    """Dependency provider for the ChatService."""
    return container.chat_service(
        session=session,
        chat_repository=chat_repo,
        thread_repository=thread_repo,
        ai_model_service=ai_model_service,
        model_api_service=model_api_service,
    )

def get_fernet_service() -> FernetService:
    """
    Dependency provider for the FernetService.

    This is a simple provider because FernetService does not depend on any
    request-scoped resources like a database session. It simply asks the
    container for an instance.
    """
    return container.fernet_service()

def get_file_repository(
    session: AsyncSession = Depends(get_db_session)
) -> FileRepository:
    return container.file_repository(session=session)


# --- Provider for FileService ---
def get_file_service(
    session: AsyncSession = Depends(get_db_session),
    file_repo: FileRepository = Depends(get_file_repository)
) -> FileService:
    return container.file_service(
        session=session,
        file_repository=file_repo
    )

def get_model_api_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ModelApiRepository:
    return container.model_api_repository(session=session)


# --- Provider for ModelApiService ---
def get_model_api_service(
    session: AsyncSession = Depends(get_db_session),
    model_api_repo: ModelApiRepository = Depends(get_model_api_repository),
    fernet_service: FernetService = Depends(get_fernet_service)
) -> ModelApiService:
    return container.model_api_service(
        session=session,
        model_api_repository=model_api_repo,
        fernet_service=fernet_service
    )

def get_notebook_repository(
    session: AsyncSession = Depends(get_db_session)
) -> NotebookRepository:
    return container.notebook_repository(session=session)

# --- Provider for ThreadRepository (if not already defined) ---
def get_thread_repository(
    session: AsyncSession = Depends(get_db_session)
) -> ThreadRepository:
    return container.thread_repository(session=session)


# --- Provider for NotebookService ---
def get_notebook_service(
    session: AsyncSession = Depends(get_db_session),
    notebook_repo: NotebookRepository = Depends(get_notebook_repository),
    thread_repo: ThreadRepository = Depends(get_thread_repository)
) -> NotebookService:
    return container.notebook_service(
        session=session,
        notebook_repository=notebook_repo,
        thread_repository=thread_repo
    )