from typing import List, Optional, Dict, Any
from datetime import datetime
from sqlalchemy import select, delete, and_, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from backend.models.whiteboard import Whiteboard


class WhiteboardRepository:
    """
    Handles data access logic for the Whiteboard entity.
    """

    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(
        self,
        user_id: str,
        notebook_id: str,
        title: str,
        content: Optional[Dict[str, Any]] = None,
        thumbnail_url: Optional[str] = None
    ) -> Whiteboard:
        """
        Creates a new Whiteboard object and adds it to the session.
        Does not commit the transaction.
        """
        whiteboard_record = Whiteboard(
            user_id=user_id,
            notebook_id=notebook_id,
            title=title,
            content=content or {},
            thumbnail_url=thumbnail_url
        )
        self.session.add(whiteboard_record)
        await self.session.flush()  # Send data to DB to get defaults/IDs
        return whiteboard_record

    async def list_by_user_id(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Whiteboard]:
        """
        Retrieve whiteboards for a specific user with optional filters,
        ordered by updated_at descending.
        """
        query = select(Whiteboard).where(Whiteboard.user_id == user_id)

        if notebook_id:
            query = query.where(Whiteboard.notebook_id == notebook_id)

        query = query.order_by(Whiteboard.updated_at.desc())
        query = query.limit(limit).offset(offset)

        result = await self.session.execute(query)
        return result.scalars().all()

    async def get_by_id_and_user(self, whiteboard_id: str, user_id: str) -> Optional[Whiteboard]:
        """
        Retrieve a whiteboard by ID and user ID to verify ownership.
        """
        query = select(Whiteboard).where(
            and_(Whiteboard.id == whiteboard_id, Whiteboard.user_id == user_id)
        )
        result = await self.session.execute(query)
        return result.scalars().first()

    async def update(
        self,
        whiteboard_id: str,
        updates: Dict[str, Any]
    ) -> Optional[Whiteboard]:
        """
        Update a whiteboard record with the provided updates dictionary.
        Returns the updated Whiteboard instance or None if not found.
        Does not commit the transaction.
        """
        # First, fetch the existing record
        existing_query = select(Whiteboard).where(Whiteboard.id == whiteboard_id)
        result = await self.session.execute(existing_query)
        existing_whiteboard = result.scalars().first()

        if not existing_whiteboard:
            return None

        # Apply updates
        for key, value in updates.items():
            if hasattr(existing_whiteboard, key):
                setattr(existing_whiteboard, key, value)

        await self.session.flush()  # Flush to update the object
        return existing_whiteboard

    async def delete(self, whiteboard_id: str) -> bool:
        """
        Delete a whiteboard record by ID.
        Returns True if deleted, False otherwise.
        Does not commit the transaction.
        """
        stmt = delete(Whiteboard).where(Whiteboard.id == whiteboard_id)
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def search_whiteboards(
        self,
        user_id: str,
        notebook_id: Optional[str] = None,
        query: Optional[str] = None,
        limit: int = 100,
        offset: int = 0
    ) -> List[Whiteboard]:
        """
        Search whiteboards with multiple filter criteria.
        """
        base_query = select(Whiteboard).where(Whiteboard.user_id == user_id)

        if notebook_id:
            base_query = base_query.where(Whiteboard.notebook_id == notebook_id)

        if query:
            # Text search in title
            search_term = f"%{query}%"
            base_query = base_query.where(Whiteboard.title.ilike(search_term))

        base_query = base_query.order_by(Whiteboard.updated_at.desc())
        base_query = base_query.limit(limit).offset(offset)

        result = await self.session.execute(base_query)
        return result.scalars().all()

    async def count_by_user_and_filters(
        self,
        user_id: str,
        notebook_id: Optional[str] = None
    ) -> int:
        """
        Count whiteboards for a user with optional filters.
        """
        query = select(func.count(Whiteboard.id)).where(Whiteboard.user_id == user_id)

        if notebook_id:
            query = query.where(Whiteboard.notebook_id == notebook_id)

        result = await self.session.execute(query)
        return result.scalar() or 0