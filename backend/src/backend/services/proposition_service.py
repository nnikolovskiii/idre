from typing import Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.models.proposition import Proposition
from backend.repositories.proposition_repository import PropositionRepository


class PropositionService:
    """
    Orchestrates business logic for Propositions.
    """
    def __init__(
        self,
        session: AsyncSession,
        proposition_repository: PropositionRepository
    ):
        self.session = session
        self.repo = proposition_repository

    async def get_proposition_by_notebook_id(self, notebook_id: uuid.UUID) -> Optional[Proposition]:
        """
        Retrieves a single proposition by its associated notebook_id.
        """
        return await self.repo.get_by_id(notebook_id)

    async def create_or_update_proposition(
        self,
        notebook_id: uuid.UUID,
        data: Dict[str, Any]
    ) -> Proposition:
        """
        Creates or updates the proposition for a given notebook.
        Null values in the input data are ignored during updates.
        """
        update_data = {key: value for key, value in data.items() if value is not None}

        existing_proposition = await self.repo.get_by_id(notebook_id)

        if not existing_proposition:
            proposition = await self.repo.create(notebook_id=notebook_id, data=update_data)
        else:
            proposition = await self.repo.update(notebook_id=notebook_id, data=update_data)

        if not proposition:
            raise Exception("Failed to create or update proposition.")

        await self.session.commit()
        await self.session.refresh(proposition)
        return proposition