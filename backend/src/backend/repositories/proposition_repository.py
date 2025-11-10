from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
import uuid

from backend.models.proposition import Proposition


class PropositionRepository:
    """
    Handles data access logic for the Proposition entity.
    """
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_id(self, notebook_id: uuid.UUID) -> Optional[Proposition]:
        """Retrieves a proposition by its primary key (which is the notebook_id)."""
        return await self.session.get(Proposition, notebook_id)

    async def create(self, notebook_id: uuid.UUID, data: Dict[str, Any]) -> Proposition:
        """Creates a new Proposition object and adds it to the session."""
        proposition = Proposition(notebook_id=notebook_id, **data)
        self.session.add(proposition)
        await self.session.flush()
        return proposition

    async def update(self, notebook_id: uuid.UUID, data: Dict[str, Any]) -> Optional[Proposition]:
        """Updates a proposition record with the provided data."""
        proposition = await self.get_by_id(notebook_id)
        if proposition:
            for key, value in data.items():
                if hasattr(proposition, key):
                    setattr(proposition, key, value)
            await self.session.flush()
        return proposition