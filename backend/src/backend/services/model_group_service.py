from typing import List, Optional
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models.model_group import ModelGroup
from backend.repositories.model_group_repository import ModelGroupRepository
from backend.models.dtos.model_group_dtos import CreateModelGroupRequest, UpdateModelGroupRequest


class ModelGroupService:
    def __init__(self, session: AsyncSession, model_group_repository: ModelGroupRepository):
        self.session = session
        self.repo = model_group_repository

    async def create_group(self, user_id: str, request: CreateModelGroupRequest) -> ModelGroup:
        # 1. Prepare models list first
        models = []
        if request.model_ids:
            models = await self.repo.get_models_by_ids(request.model_ids)

        # 2. Create the group WITH the models passed to the constructor
        # This prevents the "greenlet_spawn" error caused by accessing an unloaded relationship
        group = await self.repo.create(
            user_id, 
            request.name, 
            request.description, 
            models=models
        )
        
        await self.session.commit()
        
        # 3. Re-fetch to ensure clean state and loaded relationships for Pydantic
        return await self.repo.get_by_id(str(group.id), user_id)

    async def get_user_groups(self, user_id: str) -> List[ModelGroup]:
        return await self.repo.list_by_user(user_id)

    async def get_group(self, user_id: str, group_id: str) -> Optional[ModelGroup]:
        return await self.repo.get_by_id(group_id, user_id)

    async def update_group(self, user_id: str, group_id: str, request: UpdateModelGroupRequest) -> Optional[ModelGroup]:
        # get_by_id uses selectinload, so accessing group.models here is safe
        group = await self.repo.get_by_id(group_id, user_id)
        if not group:
            return None

        if request.name is not None:
            group.name = request.name
        if request.description is not None:
            group.description = request.description
        
        if request.model_ids is not None:
            models = await self.repo.get_models_by_ids(request.model_ids)
            group.models = models 
            
        await self.session.commit()
        return await self.repo.get_by_id(group_id, user_id)

    async def add_models_to_group(self, user_id: str, group_id: str, model_ids: List[str]) -> Optional[ModelGroup]:
        group = await self.repo.get_by_id(group_id, user_id)
        if not group:
            return None

        new_models = await self.repo.get_models_by_ids(model_ids)
        
        existing_ids = {str(m.id) for m in group.models}
        for model in new_models:
            if str(model.id) not in existing_ids:
                group.models.append(model)
        
        await self.session.commit()
        return await self.repo.get_by_id(group_id, user_id)

    async def remove_model_from_group(self, user_id: str, group_id: str, model_id: str) -> Optional[ModelGroup]:
        group = await self.repo.get_by_id(group_id, user_id)
        if not group:
            return None

        group.models = [m for m in group.models if str(m.id) != model_id]
        
        await self.session.commit()
        return await self.repo.get_by_id(group_id, user_id)

    async def delete_group(self, user_id: str, group_id: str) -> bool:
        success = await self.repo.delete(group_id, user_id)
        if success:
            await self.session.commit()
        return success