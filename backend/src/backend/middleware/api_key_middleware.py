from typing import Callable
from fastapi import HTTPException, Request, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.services.model_api_service import ModelApiService


async def require_api_key(
    request: Request,
    call_next: Callable,
    session: AsyncSession
) -> None:
    """
    Middleware to require API key for all protected routes.

    This middleware checks if the user has an API key set up.
    If not, it raises an HTTPException.

    Usage: Apply this middleware to routes that require API keys.
    """
    # Get user ID from request (assuming it's set by auth middleware)
    user_id = getattr(request.state, 'user_id', None)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User authentication required"
        )

    # Check if user has API key
    model_api_service = ModelApiService(session, None, None)
    has_api_key = await model_api_service.has_api_key(user_id)

    if not has_api_key:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API key is required to use this application. Please set up your API key in the settings."
        )


def create_api_key_dependency(session_factory):
    """
    Creates a FastAPI dependency that requires API key.

    Usage:
    ```python
    @router.get("/protected-endpoint")
    async def protected_endpoint(
        request: Request,
        db_session: AsyncSession = Depends(get_db_session),
        _: None = Depends(create_api_key_dependency(session_factory))
    ):
        # Your endpoint logic here
        pass
    ```
    """
    async def api_key_dependency(request: Request):
        # Get user ID from request state (set by auth middleware)
        user_id = getattr(request.state, 'user_id', None)

        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User authentication required"
            )

        # Create session and check API key
        async with session_factory() as session:
            from backend.services.model_api_service import ModelApiService
            from backend.repositories.model_api_repository import ModelApiRepository
            from backend.services.fernet_service import FernetService

            repo = ModelApiRepository(session)
            fernet_service = FernetService()
            model_api_service = ModelApiService(session, repo, fernet_service)

            has_api_key = await model_api_service.has_api_key(user_id)

            if not has_api_key:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="API key is required to use this application. Please set up your API key in the settings."
                )

    return api_key_dependency