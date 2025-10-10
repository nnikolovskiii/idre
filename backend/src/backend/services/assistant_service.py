from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.assistant import Assistant
from backend.repositories.assistant_repository import AssistantRepository


class AssistantService:
    """
    Orchestrates assistant-related business logic.
    """

    def __init__(
        self,
        session: AsyncSession,
        assistant_repository: AssistantRepository,
    ):
        """
        Initializes the AssistantService with its dependencies.

        Args:
            session (AsyncSession): The request-scoped SQLAlchemy session.
            assistant_repository (AssistantRepository): The repository for Assistant data access.
        """
        self.session = session
        self.assistant_repo = assistant_repository

    async def get_assistant_by_graph_id(self, graph_id: str) -> Optional[Assistant]:
        """Gets an assistant object by its graph_id."""
        return await self.assistant_repo.get_by_graph_id(graph_id)