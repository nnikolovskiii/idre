from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.assistant import Assistant


class AssistantRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def get_by_graph_id(self, graph_id: str) -> Optional[Assistant]:
        """Gets an assistant by its graph_id."""
        stmt = select(Assistant).where(Assistant.graph_id == graph_id)
        result = await self.session.execute(stmt)
        return result.scalars().first()