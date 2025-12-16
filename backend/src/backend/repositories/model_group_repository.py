from typing import List, Optional
from sqlalchemy import select, delete, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
import uuid

from backend.models.model_group import ModelGroup
from backend.models.generative_model import GenerativeModel


class ModelGroupRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    # UPDATED: Added models parameter
    async def create(self, user_id: str, name: str, description: Optional[str] = None, models: List[GenerativeModel] = None) -> ModelGroup:
        if models is None:
            models = []
            
        # Initialize the object with the models relationship set
        group = ModelGroup(
            user_id=user_id, 
            name=name, 
            description=description,
            models=models 
        )
        self.session.add(group)
        await self.session.flush()
        return group

    async def get_by_id(self, group_id: str, user_id: str) -> Optional[ModelGroup]:
        stmt = select(ModelGroup).where(
            ModelGroup.id == group_id,
            ModelGroup.user_id == user_id
        ).options(selectinload(ModelGroup.models))
        result = await self.session.execute(stmt)
        return result.scalar_one_or_none()

    async def list_by_user(self, user_id: str) -> List[ModelGroup]:
        stmt = select(ModelGroup).where(
            ModelGroup.user_id == user_id
        ).order_by(ModelGroup.created_at.desc())
        result = await self.session.execute(stmt)
        return result.scalars().all()

    async def update(self, group: ModelGroup) -> ModelGroup:
        self.session.add(group)
        await self.session.flush()
        return group

    async def delete(self, group_id: str, user_id: str) -> bool:
        stmt = delete(ModelGroup).where(
            ModelGroup.id == group_id,
            ModelGroup.user_id == user_id
        )
        result = await self.session.execute(stmt)
        return result.rowcount > 0

    async def get_models_by_ids(self, model_ids: List[str]) -> List[GenerativeModel]:
        if not model_ids:
            return []
        
        valid_uuids = []
        for mid in model_ids:
            try:
                valid_uuids.append(uuid.UUID(mid))
            except ValueError:
                print(f"Warning: Invalid UUID passed to get_models_by_ids: {mid}")
                continue

        if not valid_uuids:
            return []

        stmt = select(GenerativeModel).where(GenerativeModel.id.in_(valid_uuids))
        result = await self.session.execute(stmt)
        return result.scalars().all()